// This function will run once the entire HTML document is loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {

    // Your Cloudflare Worker URL
    const WORKER_URL = 'https://twilio-token-worker.bhupinderhappy777.workers.dev'; // Replace with your worker URL

    // UI Sections
    const startupUI = document.getElementById('startup-ui');
    const dialerUI = document.getElementById('dialer-ui');

    // Buttons and Inputs
    const startupButton = document.getElementById('startup-button');
    const callButton = document.getElementById('call-button');
    const hangupButton = document.getElementById('hangup-button');
    const phoneNumberInput = document.getElementById('phone-number');
    
    // Display Elements
    const statusDiv = document.getElementById('status');
    const tokenDisplay = document.getElementById('token-display');

    let device;
    let connection;

    // --- Main Application Flow ---

    // 1. Add listener to the startup button
    startupButton.addEventListener('click', initializeDevice);

    // 2. Add listeners for call controls
    callButton.addEventListener('click', makeCall);
    hangupButton.addEventListener('click', hangUp);


    // This function is now called ONLY after the user clicks the startup button
    async function initializeDevice() {
        updateStatus('Initializing...', 'idle');
        startupButton.disabled = true; // Prevent multiple clicks

        try {
            console.log('STEP 1: Fetching token from', WORKER_URL);
            const response = await fetch(WORKER_URL);
            if (!response.ok) throw new Error('Failed to fetch token');
            const data = await response.json();
            const token = data.token;
            console.log('STEP 2: Token received.');
            tokenDisplay.textContent = token;

            console.log('STEP 3: Creating Twilio.Device object (after user click)...');
            device = new Twilio.Device(token, { logLevel: 1, debug: true });
            console.log('STEP 4: Twilio.Device object created.');

            addDeviceListeners(device);
            
        } catch (error) {
            console.error('Initialization Error:', error);
            updateStatus(`Initialization failed: ${error.message}`, 'error');
            startupButton.disabled = false;
        }
    }

    function addDeviceListeners(device) {
        device.on('ready', () => {
            console.log('EVENT: "ready" - Device is registered.');
            updateStatus('Ready to call', 'ready');
            
            // Show the main dialer UI
            startupUI.classList.add('hidden');
            dialerUI.classList.remove('hidden');
            
            toggleCallButtons(true, false);
        });

        device.on('error', (error) => {
            console.error('EVENT: "error" - A fatal error occurred.', error);
            updateStatus(`SDK Error: ${error.message}`, 'error');
            toggleCallButtons(false, false);
            startupButton.disabled = false;
        });

        device.on('connect', (conn) => {
            console.log('EVENT: "connect" - Call established.');
            connection = conn;
            updateStatus('Call connected', 'connected');
            toggleCallButtons(false, true);
        });

        device.on('disconnect', () => {
            console.log('EVENT: "disconnect" - Call ended.');
            connection = null;
            updateStatus('Call ended', 'ready');
            toggleCallButtons(true, false);
        });
    }

    async function makeCall() {
        const phoneNumber = phoneNumberInput.value;
        if (!device || !phoneNumber) return;

        updateStatus('Connecting...', 'connecting');
        toggleCallButtons(false, false);
        connection = await device.connect({ params: { To: phoneNumber } });
    }

    function hangUp() {
        if (device) {
            device.disconnectAll();
        }
    }

    // --- UI Helper Functions ---
    function updateStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.style.color = 'black';
        if (type === 'error') statusDiv.style.color = 'red';
        if (type === 'ready') statusDiv.style.color = 'green';
        if (type === 'connecting') statusDiv.style.color = 'blue';
    }

    function toggleCallButtons(canCall, canHangup) {
        callButton.disabled = !canCall;
        hangupButton.disabled = !canHangup;
    }
});