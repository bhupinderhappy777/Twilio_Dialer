/**
 * Twilio Dialer - Client-side Application
 * 
 * This script provides a complete web-based phone dialer interface using the Twilio Voice SDK.
 * It connects to a Cloudflare Worker to fetch access tokens and enables outbound calling
 * directly from the browser.
 * 
 * Prerequisites:
 * - Cloudflare Worker deployed and accessible (for token generation)
 * - Twilio account with proper credentials configured in the Worker
 * - HTTPS connection (required for microphone access in production)
 * 
 * @version 1.0.0
 */

// Import the Device class directly from the Twilio SDK using ES modules
import { Device } from 'https://unpkg.com/@twilio/voice-sdk@2.15.0/dist/js/twilio.min.js?module';

// Configuration
const WORKER_URL = 'https://twilio-token-worker.bhupinderhappy777.workers.dev';

// Global variables
let device = null;
let activeCall = null;

// DOM elements
const callButton = document.getElementById('call-button');
const hangupButton = document.getElementById('hangup-button');
const phoneNumberInput = document.getElementById('phone-number');
const statusDiv = document.getElementById('status');

/**
 * Updates the status display with a message and optional styling
 * @param {string} message - The message to display
 * @param {string} type - The type of message (info, success, error, warning)
 */
function updateStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.style.backgroundColor = {
    'info': '#f0f0f0',
    'success': '#d4edda',
    'error': '#f8d7da',
    'warning': '#fff3cd'
  }[type] || '#f0f0f0';
  
  console.log(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Fetches an access token from the Cloudflare Worker
 * @returns {Promise<string>} The JWT access token
 * @throws {Error} If token fetch fails
 */
async function getAccessToken() {
  updateStatus('Fetching access token...', 'info');
  
  try {
    const response = await fetch(WORKER_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.token) {
      throw new Error('No token in response');
    }
    
    updateStatus('Access token received', 'success');
    return data.token;
  } catch (error) {
    const errorMessage = `Failed to fetch access token: ${error.message}`;
    updateStatus(errorMessage, 'error');
    throw new Error(errorMessage);
  }
}

/**
 * Initializes the Twilio Device with an access token
 * Sets up event handlers for device state changes
 * @returns {Promise<void>}
 */
async function initializeDevice() {
  try {
    updateStatus('Initializing device...', 'info');
    
    // Get access token from Worker
    const token = await getAccessToken();
    
    // Create and configure the Device
    device = new Device(token, {
      logLevel: 1, // 0=trace, 1=debug, 2=info, 3=warn, 4=error, 5=silent
      codecPreferences: [Device.Codec.Opus, Device.Codec.PCMU],
    });
    
    // Device event handlers
    device.on('registered', () => {
      updateStatus('Device ready - You can make calls', 'success');
      callButton.disabled = false;
    });
    
    device.on('error', (error) => {
      updateStatus(`Device error: ${error.message}`, 'error');
      console.error('Twilio Device Error:', error);
    });
    
    device.on('incoming', (call) => {
      updateStatus('Incoming call (not handled in this demo)', 'warning');
      console.log('Incoming call from:', call.parameters.From);
    });
    
    device.on('tokenWillExpire', async () => {
      updateStatus('Token expiring, refreshing...', 'warning');
      try {
        const newToken = await getAccessToken();
        device.updateToken(newToken);
        updateStatus('Token refreshed successfully', 'success');
      } catch (error) {
        updateStatus(`Failed to refresh token: ${error.message}`, 'error');
      }
    });
    
    // Register the device
    await device.register();
    
  } catch (error) {
    updateStatus(`Initialization failed: ${error.message}`, 'error');
    console.error('Device initialization error:', error);
  }
}

/**
 * Makes an outbound call to the specified phone number
 * @param {string} phoneNumber - The phone number to call in E.164 format
 */
async function makeCall(phoneNumber) {
  if (!device) {
    updateStatus('Device not initialized', 'error');
    return;
  }
  
  if (!phoneNumber) {
    updateStatus('Please enter a phone number', 'warning');
    return;
  }
  
  try {
    updateStatus(`Calling ${phoneNumber}...`, 'info');
    
    // Initiate the call
    const call = await device.connect({
      params: {
        To: phoneNumber
      }
    });
    
    activeCall = call;
    
    // Call event handlers
    call.on('accept', () => {
      updateStatus('Call connected', 'success');
      callButton.disabled = true;
      hangupButton.disabled = false;
      phoneNumberInput.disabled = true;
    });
    
    call.on('disconnect', () => {
      updateStatus('Call ended', 'info');
      callButton.disabled = false;
      hangupButton.disabled = true;
      phoneNumberInput.disabled = false;
      activeCall = null;
    });
    
    call.on('cancel', () => {
      updateStatus('Call cancelled', 'info');
      callButton.disabled = false;
      hangupButton.disabled = true;
      phoneNumberInput.disabled = false;
      activeCall = null;
    });
    
    call.on('reject', () => {
      updateStatus('Call rejected', 'warning');
      callButton.disabled = false;
      hangupButton.disabled = true;
      phoneNumberInput.disabled = false;
      activeCall = null;
    });
    
    call.on('error', (error) => {
      updateStatus(`Call error: ${error.message}`, 'error');
      console.error('Call error:', error);
      callButton.disabled = false;
      hangupButton.disabled = true;
      phoneNumberInput.disabled = false;
      activeCall = null;
    });
    
  } catch (error) {
    updateStatus(`Failed to make call: ${error.message}`, 'error');
    console.error('Call error:', error);
  }
}

/**
 * Hangs up the active call
 */
function hangUp() {
  if (activeCall) {
    updateStatus('Hanging up...', 'info');
    activeCall.disconnect();
  } else {
    updateStatus('No active call', 'warning');
  }
}

/**
 * Initialize the application when the DOM is ready
 */
async function init() {
  console.log('Twilio Dialer - Initializing...');
  
  // Set up event listeners
  callButton.addEventListener('click', () => {
    const phoneNumber = phoneNumberInput.value.trim();
    makeCall(phoneNumber);
  });
  
  hangupButton.addEventListener('click', hangUp);
  
  // Allow Enter key to initiate call
  phoneNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !callButton.disabled) {
      const phoneNumber = phoneNumberInput.value.trim();
      makeCall(phoneNumber);
    }
  });
  
  // Initialize the Twilio Device
  await initializeDevice();
}

// Start the application when the page loads
console.log('ES module loaded successfully');
console.log('Using Twilio Voice SDK v2.15.0');

// Wait for DOM to be ready, then initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

