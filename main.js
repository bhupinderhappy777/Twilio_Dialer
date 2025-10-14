// Import the Device class directly from the Twilio SDK using ES modules
import { Device } from 'https://unpkg.com/@twilio/voice-sdk@2.15.0/dist/js/twilio.min.js?module';

// Log that the module was loaded
console.log('ES module loaded successfully');

// Get the SDK version (different from the global version)
console.log(`Using Twilio Voice SDK`);

// Define the worker URL
const WORKER_URL = 'https://twilio-token-worker.bhupinderhappy777.workers.dev';

// Global variables
let device;
let currentCall;

// DOM elements
const callButton = document.getElementById('call-button');
const hangupButton = document.getElementById('hangup-button');
const phoneNumberInput = document.getElementById('phone-number');
const statusElement = document.getElementById('status');

// Update status message
function updateStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.style.backgroundColor = isError ? '#ffebee' : '#f0f0f0';
  statusElement.style.color = isError ? '#c62828' : '#000';
  console.log(`Status: ${message}`);
}

// Fetch access token from Cloudflare Worker
async function fetchAccessToken() {
  try {
    updateStatus('Fetching access token...');
    const response = await fetch(WORKER_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.token) {
      throw new Error('No token in response');
    }
    
    console.log('Access token fetched successfully');
    return data.token;
  } catch (error) {
    console.error('Error fetching access token:', error);
    updateStatus(`Failed to fetch access token: ${error.message}`, true);
    throw error;
  }
}

// Initialize Twilio Device
async function initializeDevice() {
  try {
    const token = await fetchAccessToken();
    
    updateStatus('Initializing device...');
    device = new Device(token, {
      logLevel: 1, // Debug level logging
      codecPreferences: ['opus', 'pcmu']
    });
    
    // Device event listeners
    device.on('registered', () => {
      console.log('Device registered');
      updateStatus('Device ready - Enter a phone number and click Call');
      callButton.disabled = false;
    });
    
    device.on('error', (error) => {
      console.error('Device error:', error);
      updateStatus(`Device error: ${error.message}`, true);
    });
    
    device.on('incoming', (call) => {
      console.log('Incoming call from:', call.parameters.From);
      updateStatus(`Incoming call from ${call.parameters.From}`);
    });
    
    // Register the device
    await device.register();
    
  } catch (error) {
    console.error('Failed to initialize device:', error);
    updateStatus(`Initialization failed: ${error.message}`, true);
  }
}

// Make a call
async function makeCall() {
  const phoneNumber = phoneNumberInput.value.trim();
  
  // Validate phone number
  if (!phoneNumber) {
    updateStatus('Please enter a phone number', true);
    return;
  }
  
  // Basic phone number validation (E.164 format)
  if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
    updateStatus('Please enter a valid phone number in E.164 format (e.g., +15551234567)', true);
    return;
  }
  
  try {
    updateStatus(`Calling ${phoneNumber}...`);
    
    // Make the call
    const params = {
      To: phoneNumber
    };
    
    currentCall = await device.connect({ params });
    
    // Call event listeners
    currentCall.on('accept', (call) => {
      console.log('Call accepted');
      updateStatus(`Connected to ${phoneNumber}`);
      callButton.disabled = true;
      hangupButton.disabled = false;
    });
    
    currentCall.on('disconnect', (call) => {
      console.log('Call disconnected');
      updateStatus('Call ended');
      callButton.disabled = false;
      hangupButton.disabled = true;
      currentCall = null;
    });
    
    currentCall.on('cancel', () => {
      console.log('Call cancelled');
      updateStatus('Call cancelled');
      callButton.disabled = false;
      hangupButton.disabled = true;
      currentCall = null;
    });
    
    currentCall.on('reject', () => {
      console.log('Call rejected');
      updateStatus('Call rejected', true);
      callButton.disabled = false;
      hangupButton.disabled = true;
      currentCall = null;
    });
    
    currentCall.on('error', (error) => {
      console.error('Call error:', error);
      updateStatus(`Call error: ${error.message}`, true);
      callButton.disabled = false;
      hangupButton.disabled = true;
      currentCall = null;
    });
    
  } catch (error) {
    console.error('Failed to make call:', error);
    updateStatus(`Failed to make call: ${error.message}`, true);
    callButton.disabled = false;
    hangupButton.disabled = true;
  }
}

// Hang up the call
function hangupCall() {
  if (currentCall) {
    console.log('Hanging up call');
    currentCall.disconnect();
    updateStatus('Hanging up...');
  }
}

// Event listeners
callButton.addEventListener('click', makeCall);
hangupButton.addEventListener('click', hangupCall);

// Allow Enter key to make call
phoneNumberInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter' && !callButton.disabled) {
    makeCall();
  }
});

// Initialize on page load
updateStatus('Loading...');
initializeDevice();

console.log('Twilio dialer script initialization complete');
