// Your Cloudflare Worker URL
const WORKER_URL = 'https://twilio-token-worker.bhupinderhappy777.workers.dev'; // Replace with your worker URL

// DOM Elements
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const phoneNumberInput = document.getElementById('phoneNumber');
const statusDiv = document.getElementById('status');

let device;
let connection;

// Update UI
function updateStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status-${type}`;
}

function toggleCallButtons(canCall, canHangup) {
    callButton.disabled = !canCall;
    hangupButton.disabled = !canHangup;
}

// Fetch Access Token and Initialize Device
async function initializeDevice() {
    updateStatus('Initializing...', 'idle');
    toggleCallButtons(false, false);

    try {
        const response = await fetch(WORKER_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.statusText}`);
        }
        const data = await response.json();
        const token = data.token;

        device = new Twilio.Device(token, {
            logLevel: 1,
            edge: ['ashburn', 'frankfurt'],
        });

        device.on('ready', () => {
            updateStatus('Ready to call', 'ready');
            toggleCallButtons(true, false);
        });

        device.on('error', (error) => {
            console.error('Twilio.Device Error:', error);
            updateStatus(`Error: ${error.message}`, 'error');
            toggleCallButtons(true, false);
        });

        device.on('connect', (conn) => {
            connection = conn;
            updateStatus('Call connected', 'connected');
            toggleCallButtons(false, true);
        });

        device.on('disconnect', () => {
            updateStatus('Call ended', 'ready');
            toggleCallButtons(true, false);
            connection = null;
        });

    } catch (error) {
        console.error('Initialization Error:', error);
        updateStatus('Initialization failed', 'error');
    }
}

// Make a call
async function makeCall() {
    const phoneNumber = phoneNumberInput.value;
    if (!phoneNumber) {
        updateStatus('Enter a phone number', 'error');
        return;
    }

    updateStatus('Connecting...', 'connecting');
    toggleCallButtons(false, false);

    try {
        connection = await device.connect({ params: { To: phoneNumber } });
    } catch (error) {
        console.error('Call failed:', error);
        updateStatus('Call failed', 'error');
        toggleCallButtons(true, false);
    }
}

// Hang up a call
function hangUp() {
    if (connection) {
        connection.disconnect();
    }
}

// Event Listeners
callButton.addEventListener('click', makeCall);
hangupButton.addEventListener('click', hangUp);

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeDevice);