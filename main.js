// This function will run once the entire HTML document is loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {

    const WORKER_URL = 'https://twilio-token-worker.bhupinderhappy777.workers.dev';

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

    let device;
    let connection;

    // --- Main Application Flow ---

    // 1. When the user clicks "Start", we begin the setup process.
    startupButton.addEventListener('click', initializeDevice);

    // 2. Event listeners for the call buttons.
    callButton.addEventListener('click', makeCall);
    hangupButton.addEventListener('click', hangUp);


    // This function handles the entire setup process.
    async function initializeDevice() {
        updateStatus('Requesting microphone permission...', 'idle');
        startupButton.disabled = true;

        try {
            // --- THIS IS THE KEY STEP ---
            // 1. Request microphone access from the user.
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the tracks immediately since we only needed the permission prompt.
            stream.getTracks().forEach(track => track.stop());
            console.log('Microphone permission granted.');

            // 2. Now that we have permission, fetch the token.
            updateStatus('Fetching access token...', 'idle');
            const response = await fetch(WORKER_URL);
            if (!response.ok) throw new Error('Failed to fetch token');
            const data = await response.json();
            const token = data.token;
            console.log('Token received.');

            // 3. Create the Twilio Device. This should now succeed.
            console.log('Creating Twilio.Device object...');
            device = new Twilio.Device(token, { logLevel: 1, debug: true });
            
            addDeviceListeners(device);
            
        } catch (error) {
            console.error('Initialization Failed:', error);
            updateStatus(`Error: ${error.message}`, 'error');
            // If permission was denied, the error message will reflect that.
            if (error.name === 'NotAllowedError') {
                updateStatus('Microphone permission was denied.', 'error');
            }
            startupButton.disabled = false;
        }
    }

    function addDeviceListeners(device) {
        device.on('ready', () => {
            console.log('EVENT: "ready" - Twilio.Device is now registered.');
            updateStatus('Ready to call', 'ready');
            
            // Show the main dialer UI
            startupUI.classList.add('hidden');
            dialerUI.classList.remove('hidden');
            
            toggleCallButtons(true, false);
        });

        device.on('error', (error) => {
            console.error('EVENT: "error" - A fatal SDK error occurred.', error);
            updateStatus(`SDK Error: ${error.message}`, 'error');
            toggleCallButtons(false, false);
            startupButton.disabled = false;
        });

        device.on('connect', (conn) => {
            connection = conn;
            updateStatus('Call connected', 'connected');
            toggleCallButtons(false, true);
        });

        device.on('disconnect', () => {
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