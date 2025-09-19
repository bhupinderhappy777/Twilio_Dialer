// This function will run once the entire HTML document is loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {

    const WORKER_URL = 'https://twilio-token-worker.bhupinderhappy777.workers.dev';

    // UI Elements
    const callButton = document.getElementById('call-button');
    const hangupButton = document.getElementById('hangup-button');
    const phoneNumberInput = document.getElementById('phone-number');
    const statusDiv = document.getElementById('status');
    
    // Hide the dialer UI initially
    const dialerUI = document.getElementById('dialer-ui');
    dialerUI.classList.add('hidden');

    // Use a single startup button
    const startupButton = document.getElementById('startup-button');
    startupButton.addEventListener('click', showDialer);

    let call; // We will store the active call object here

    function showDialer() {
        startupButton.parentElement.classList.add('hidden');
        dialerUI.classList.remove('hidden');
        callButton.disabled = false;
        updateStatus('Ready to call');
    }

    // --- Main Application Flow ---

    callButton.addEventListener('click', makeCall);
    hangupButton.addEventListener('click', hangUp);

    async function makeCall() {
        const phoneNumber = phoneNumberInput.value;
        if (!phoneNumber) {
            updateStatus('Please enter a phone number', 'error');
            return;
        }

        updateStatus('Requesting token and connecting...', 'connecting');
        toggleCallButtons(false, false);

        try {
            // 1. Fetch a new token for this call
            const response = await fetch(WORKER_URL);
            if (!response.ok) throw new Error('Failed to fetch token');
            const data = await response.json();
            const token = data.token;

            // 2. Use the static Twilio.Call.connect() method
            console.log('Attempting to connect call directly with Twilio.Call.connect()');
            call = await Twilio.Call.connect({ token: token, params: { To: phoneNumber } });
            
            // 3. Add listeners to the new call object
            addCallListeners(call);
            
            updateStatus('Call is ringing...', 'connecting');
            toggleCallButtons(false, true); // Enable hangup

        } catch (error) {
            console.error('Call failed to connect:', error);
            updateStatus(`Call failed: ${error.message}`, 'error');
            toggleCallButtons(true, false); // Re-enable call button
        }
    }

    function addCallListeners(call) {
        call.on('accept', () => {
            updateStatus('Call connected', 'connected');
        });

        call.on('disconnect', () => {
            updateStatus('Call ended', 'ready');
            toggleCallButtons(true, false);
            call = null;
        });

        call.on('error', (error) => {
            console.error('Call Error:', error);
            updateStatus(`Call Error: ${error.message}`, 'error');
            toggleCallButtons(true, false);
            call = null;
        });
    }

    function hangUp() {
        if (call) {
            call.disconnect();
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