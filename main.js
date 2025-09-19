// This function will run once the entire HTML document is loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {

    // Your Cloudflare Worker URL
    const WORKER_URL = 'https://twilio-token-worker.bhupinderhappy777.workers.dev'; // Replace with your worker URL

    // DOM Elements - Now safely accessed after the DOM is ready
    const callButton = document.getElementById('call-button');
    const hangupButton = document.getElementById('hangup-button');
    const phoneNumberInput = document.getElementById('phone-number');
    const statusDiv = document.getElementById('status');
    const tokenDisplay = document.getElementById('token-display');

    let device;
    let connection;

    // Update UI
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
            
            tokenDisplay.textContent = token;
            console.log('✅ Full token is now visible on the web page.');

            console.log('STEP 4: Attempting to create Twilio.Device object...');
            
            try {
                // We are creating the device with the most verbose logging enabled.
                device = new Twilio.Device(token, {
                    logLevel: 1,
                    // Using the 'debug' property to get even more internal state logs
                    debug: true 
                });
                console.log('STEP 5: Twilio.Device object created successfully.');

            } catch (e) {
                console.error('CRITICAL: The Twilio.Device constructor threw an error.', e);
                updateStatus('SDK constructor failed', 'error');
                // Stop execution if the constructor fails
                return; 
            }


            console.log('STEP 6: Adding event listeners (.on("ready"), .on("error"), etc.)...');
            device.on('ready', () => {
                console.log('EVENT: "ready" - Device is registered and ready to make calls.');
                updateStatus('Ready to call', 'ready');
                toggleCallButtons(true, false);
            });

            device.on('error', (error) => {
                console.error('EVENT: "error" - A fatal error occurred in the SDK.', error);
                updateStatus(`Error: ${error.message}`, 'error');
                toggleCallButtons(true, false);
            });

            device.on('connect', (conn) => {
                console.log('EVENT: "connect" - Call has been established.');
                connection = conn;
                updateStatus('Call connected', 'connected');
                toggleCallButtons(false, true);
            });

            device.on('disconnect', () => {
                console.log('EVENT: "disconnect" - Call has ended.');
                updateStatus('Call ended', 'ready');
                toggleCallButtons(true, false);
                connection = null;
            });
            console.log('STEP 7: Event listeners attached.');

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
    initializeDevice();
});