const midi = require('@julusian/midi');
const readline = require('readline');

const input = new midi.Input();
const output = new midi.Output();

let currentInputDeviceIndex = null;
let currentOutputDeviceIndex = null;

// MIDIデバイスのリストを取得
function listInputDevices() {
    const deviceList = [];
    for (let i = 0; i < input.getPortCount(); i++) {
        deviceList.push(input.getPortName(i));
    }
    return deviceList;
}

function listOutputDevices() {
    const deviceList = [];
    for (let i = 0; i < output.getPortCount(); i++) {
        deviceList.push(output.getPortName(i));
    }
    return deviceList;
}

// 入力デバイスからMIDIメッセージをリッスン
function startListeningToInput() {
    if (currentInputDeviceIndex !== null) {
        input.on('message', (deltaTime, message) => {
            const [status, note, velocity] = message;
            // Note On/Offメッセージの判定
            if (status >= 0x90 && status < 0xA0) { // Note On
                console.log(`Note On: ${note}, Velocity: ${velocity}`);
                output.sendMessage(message);
            } else if (status >= 0x80 && status < 0x90) { // Note Off
                console.log(`Note Off: ${note}`);
                output.sendMessage(message);
            }
        });
        console.log("MIDI listening started.");
    } else {
        console.log("Error: Input device is not selected.");
    }
}

// 入力デバイスに接続
function connectInputDevice(index) {
    if (currentInputDeviceIndex !== null) {
        input.closePort();
    }
    currentInputDeviceIndex = index;
    input.openPort(index);
    console.log(`Connected to Input device: ${listInputDevices()[index]}`);
}

// 出力デバイスに接続
function connectOutputDevice(index) {
    if (currentOutputDeviceIndex !== null) {
        output.closePort();
    }
    currentOutputDeviceIndex = index;
    output.openPort(index);
    console.log(`Connected to Output device: ${listOutputDevices()[index]}`);
    startListeningToInput();  // 出力デバイス接続後にリスニングを開始
}

// CLIインターフェース設定
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function promptUserForInputDevice() {
    console.log("\nAvailable MIDI Input Devices:");
    const devices = listInputDevices();
    devices.forEach((device, index) => console.log(`${index}: ${device}`));

    rl.question("Select an Input device by number: ", (answer) => {
        if (!isNaN(answer) && answer >= 0 && answer < devices.length) {
            connectInputDevice(parseInt(answer));
            promptUserForOutputDevice(); // 次に出力デバイスの選択に進む
        } else {
            console.log("Invalid input. Try again.");
            promptUserForInputDevice();
        }
    });
}

function promptUserForOutputDevice() {
    console.log("\nAvailable MIDI Output Devices:");
    const devices = listOutputDevices();
    devices.forEach((device, index) => console.log(`${index}: ${device}`));

    rl.question("Select an Output device by number: ", (answer) => {
        if (!isNaN(answer) && answer >= 0 && answer < devices.length) {
            connectOutputDevice(parseInt(answer));
            console.log("Ready to receive and filter MIDI Note messages.");
        } else {
            console.log("Invalid input. Try again.");
            promptUserForOutputDevice();
        }
    });
}

promptUserForInputDevice();
