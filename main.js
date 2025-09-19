// Your Cloudflare Worker URL
const WORKER_URL = 'https://twilio-token-worker.bhupinderhappy777.workers.dev'; // Replace with your worker URL

// DOM Elements
const callButton = document.getElementById('call-button'); // Corrected ID
const hangupButton = document.getElementById('hangup-button'); // Corrected ID
const phoneNumberInput = document.getElementById('phone-number'); // Corrected ID
const statusDiv = document.getElementById('status');
const tokenDisplay = document.getElementById('token-display'); // New element for token

let device;
let connection;

// Update UI
function updateStatus(message, type) {
    statusDiv.textContent = message;
    // Simple styling based on type
    statusDiv.style.color = 'black';
    if (type === 'error') statusDiv.style.color = 'red';
    if (type === 'ready') statusDiv.style.color = 'green';
    if (type === 'connecting') statusDiv.style.color = 'blue';
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
        console.log('STEP 1: Fetching token from', WORKER_URL);
        const response = await fetch(WORKER_URL);
        console.log('STEP 2: Received response from worker');

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token fetch failed. Status:', response.status, 'Response:', errorText);
            throw new Error(`Failed to fetch token: ${response.statusText}`);
        }

        const data = await response.json();
        const token = data.token;
        console.log('STEP 3: Token successfully extracted from JSON response.');
        
        // --- THIS IS THE NEW PART ---
        // Display the full token directly on the page to avoid console truncation
        tokenDisplay.textContent = token;
        console.log('✅ Full token is now visible on the web page.');
        // --- END OF NEW PART ---

        console.log('STEP 4: Initializing Twilio.Device with the token...');
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