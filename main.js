// This function will run once the entire HTML document is loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {

    // --- NEW: Log the loaded SDK version to the console ---
    console.log(`Twilio Voice SDK version: ${Twilio.Device.version}`);

    const WORKER_URL = 'https://twilio-token-worker.bhupinderhappy777.workers.dev';

    // UI Elements
    const startupUI = document.getElementById('startup-ui');
    const dialerUI = document.getElementById('dialer-ui');
    const startupButton = document.getElementById('startup-button');
    const callButton = document.getElementById('call-button');
    const hangupButton = document.getElementById('hangup-button');
    const phoneNumberInput = document.getElementById('phone-number');
    const statusDiv = document.getElementById('status');

    let device;
    let connection;

    // --- Main Application Flow ---
    startupButton.addEventListener('click', initializeDevice);
    callButton.addEventListener('click', makeCall);
    hangupButton.addEventListener('click', hangUp);

    // This function handles the entire setup process.
    async function initializeDevice() {
        updateStatus('Requesting microphone permission...', 'idle');
        startupButton.disabled = true;

        try {
            // 1. Request microphone access.
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            console.log('Microphone permission granted.');

            // 2. Fetch the token.
            updateStatus('Fetching access token...', 'idle');
            const response = await fetch(WORKER_URL);
            if (!response.ok) throw new Error('Failed to fetch token');
            const data = await response.json();
            const token = data.token;
            console.log('Token received.');

            // 3. Create the Twilio Device.
            console.log('Creating Twilio.Device object...');
            device = new Twilio.Device(token, { logLevel: 1, debug: true });
            
            // --- THIS IS THE NEW FIX ---
            // 4. Manually set the audio output device to un-stick the SDK.
            console.log('Attempting to manually set audio output device...');
            await setAudioOutputDevice(device);
            // --- END OF FIX ---

            addDeviceListeners(device);
            
        } catch (error) {
            console.error('Initialization Failed:', error);
            updateStatus(`Error: ${error.message}`, 'error');
            if (error.name === 'NotAllowedError') {
                updateStatus('Microphone permission was denied.', 'error');
            }
            startupButton.disabled = false;
        }
    }

    async function setAudioOutputDevice(device) {
        // The 'ready' event isn't firing, so we can't wait for it.
        // We'll poll for the audio devices to be available.
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const interval = setInterval(async () => {
                // Check the availableOutputDevices collection on the audio helper
                if (device.audio && device.audio.availableOutputDevices.size > 0) {
                    clearInterval(interval);
                    try {
                        const defaultDevice = Array.from(device.audio.availableOutputDevices.values())[0];
                        console.log(`Found audio device: ${defaultDevice.label}. Setting it as output.`);

                        // --- THIS IS THE CORRECT API CALL ---
                        // Use the .set() method on the speakerDevices collection.
                        await device.audio.speakerDevices.set(defaultDevice.deviceId);
                        
                        console.log('Audio output device has been set successfully.');
                        resolve();
                    } catch (err) {
                        console.error('Failed to set audio device.', err);
                        reject(err);
                    }
                } else {
                    attempts++;
                    if (attempts > 10) { // Wait for max 5 seconds
                        clearInterval(interval);
                        console.error('Could not find any available audio output devices.');
                        reject(new Error('No audio output devices found.'));
                    }
                }
            }, 500);
        });
    }

    function addDeviceListeners(device) {
        device.on('ready', () => {
            console.log('EVENT: "ready" - Twilio.Device is now registered.');
            updateStatus('Ready to call', 'ready');
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