console.log('main.js loaded');

class TwilioDialer {
    constructor() {
        console.log('TwilioDialer constructor started');
        
        // Basic properties
        this.device = null;
        this.connection = null;
        this.isConnected = false;
        
        // Get DOM elements
        this.phoneNumberInput = document.getElementById('phoneNumber');
        this.callButton = document.getElementById('callButton');
        this.hangupButton = document.getElementById('hangupButton');
        this.statusDisplay = document.getElementById('statusDisplay');
        
        // Validate DOM elements
        if (!this.phoneNumberInput || !this.callButton || !this.hangupButton || !this.statusDisplay) {
            console.error('Required DOM elements not found');
            return;
        }
        
        console.log('DOM elements found successfully');
        
        // Configuration
        this.tokenEndpoint = 'https://twilio-token-worker.bhupinderhappy777.workers.dev';
        
        // Set up event listeners first
        this.setupEventListeners();
        
        // Initialize
        this.init();
        
        console.log('TwilioDialer constructor completed');
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners');
        
        this.callButton.addEventListener('click', () => {
            console.log('Call button clicked');
            this.makeCall();
        });
        
        this.hangupButton.addEventListener('click', () => {
            console.log('Hangup button clicked');
            this.hangUp();
        });
        
        this.phoneNumberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isConnected) {
                console.log('Enter key pressed, making call');
                this.makeCall();
            }
        });
        
        console.log('Event listeners set up successfully');
    }
    
    async init() {
        console.log('Initializing TwilioDialer');
        
        try {
            this.updateStatus('Getting ready...', 'connecting');
            
            // Check if Twilio SDK is available
            if (typeof Twilio === 'undefined' || !Twilio.Device) {
                throw new Error('Twilio SDK not available');
            }
            
            console.log('Twilio SDK is available');
            
            // Get access token
            console.log('Fetching access token...');
            const token = await this.fetchAccessToken();
            
            // Initialize device
            console.log('Initializing Twilio Device...');
            this.device = new Twilio.Device(token, {
                logLevel: 1,
                enableRingingState: true
            });
            
            // Set up device event listeners
            this.setupDeviceEvents();
            
            console.log('TwilioDialer initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');
        }
    }
    
    setupDeviceEvents() {
        console.log('Setting up device events');
        
        this.device.on('ready', () => {
            console.log('Device is ready');
            this.updateStatus('Ready to make calls', 'idle');
        });
        
        this.device.on('error', (error) => {
            console.error('Device error:', error);
            this.updateStatus(`Device error: ${error.message}`, 'error');
        });
        
        this.device.on('connect', (connection) => {
            console.log('Call connected');
            this.connection = connection;
            this.isConnected = true;
            this.updateStatus('Call connected', 'connected');
            this.toggleButtons(false, true);
        });
        
        this.device.on('disconnect', () => {
            console.log('Call disconnected');
            this.connection = null;
            this.isConnected = false;
            this.updateStatus('Call ended', 'idle');
            this.toggleButtons(true, false);
        });
        
        console.log('Device events set up successfully');
    }
    
    async fetchAccessToken() {
        try {
            console.log('🔍 Fetching token from:', this.tokenEndpoint);
            
            const response = await fetch(this.tokenEndpoint);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.token) {
                throw new Error('No token in response');
            }
            
            // 🔍 DECODE AND VALIDATE TOKEN
            const tokenParts = data.token.split('.');
            if (tokenParts.length === 3) {
                try {
                    const header = JSON.parse(atob(tokenParts[0]));
                    const payload = JSON.parse(atob(tokenParts[1]));
                    
                    console.log('🔍 Token Header:', header);
                    console.log('🔍 Token Payload:', payload);
                    console.log('🕐 Token expires:', new Date(payload.exp * 1000));
                    console.log('🕐 Current time:', new Date());
                    console.log('⏰ Time until expiry:', Math.round((payload.exp * 1000 - Date.now()) / 1000), 'seconds');
                    
                    // Validate required fields
                    console.log('✅ ISS (API Key SID):', payload.iss);
                    console.log('✅ SUB (Account SID):', payload.sub);
                    console.log('✅ Identity:', payload.grants?.identity);
                    console.log('✅ TwiML App SID:', payload.grants?.voice?.outgoing?.application_sid);
                    
                    // Check for common issues
                    if (!payload.iss || !payload.iss.startsWith('SK')) {
                        console.error('❌ ISS field should be API Key SID starting with SK');
                    }
                    if (!payload.sub || !payload.sub.startsWith('AC')) {
                        console.error('❌ SUB field should be Account SID starting with AC');
                    }
                    if (!payload.grants?.voice?.outgoing?.application_sid?.startsWith('AP')) {
                        console.error('❌ TwiML App SID should start with AP');
                    }
                    
                } catch (e) {
                    console.error('❌ Could not decode token:', e);
                }
            }
            
            return data.token;
            
        } catch (error) {
            console.error('❌ Token fetch error:', error);
            throw error;
        }
    }
    
    async makeCall() {
        const phoneNumber = this.phoneNumberInput.value.trim();
        
        console.log('Making call to:', phoneNumber);
        
        if (!phoneNumber) {
            this.updateStatus('Please enter a phone number', 'error');
            return;
        }
        
        if (!this.isValidPhoneNumber(phoneNumber)) {
            this.updateStatus('Please enter a valid phone number', 'error');
            return;
        }
        
        if (!this.device) {
            this.updateStatus('Device not ready', 'error');
            return;
        }
        
        try {
            this.updateStatus('Connecting...', 'connecting');
            this.toggleButtons(false, false);
            
            this.connection = this.device.connect({ To: phoneNumber });
            
        } catch (error) {
            console.error('Call failed:', error);
            this.updateStatus(`Call failed: ${error.message}`, 'error');
            this.toggleButtons(true, false);
        }
    }
    
    hangUp() {
        console.log('Hanging up call');
        
        if (this.connection) {
            this.connection.disconnect();
        }
    }
    
    isValidPhoneNumber(phoneNumber) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }
    
    updateStatus(message, type) {
        console.log('Status update:', message, type);
        
        this.statusDisplay.textContent = message;
        this.statusDisplay.className = `status-display status-${type}`;
    }
    
    toggleButtons(callEnabled, hangupEnabled) {
        this.callButton.disabled = !callEnabled;
        this.hangupButton.disabled = !hangupEnabled;
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

console.log('main.js execution completed');
