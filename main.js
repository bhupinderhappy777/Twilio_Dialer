class TwilioDialer {
    constructor() {
        console.log('TwilioDialer constructor called');
        console.log('Twilio object available:', typeof window.Twilio);
        console.log('Device class available:', window.Twilio && typeof window.Twilio.Device);
        
        this.device = null;
        this.connection = null;
        this.isConnected = false;
        
        // DOM elements
        this.phoneNumberInput = document.getElementById('phoneNumber');
        this.callButton = document.getElementById('callButton');
        this.hangupButton = document.getElementById('hangupButton');
        this.statusDisplay = document.getElementById('statusDisplay');
        
        console.log('DOM elements found:', {
            phoneInput: !!this.phoneNumberInput,
            callButton: !!this.callButton,
            hangupButton: !!this.hangupButton,
            statusDisplay: !!this.statusDisplay
        });
        
        // Configuration - Replace with your Cloudflare Worker URL
        this.tokenEndpoint = 'https://twilio-token-worker.bhupinderhappy777.workers.dev';
        
        console.log('Starting initialization...');
        this.init();
    }
    
    async init() {
        console.log('init() method called');
        try {
            console.log('About to call setupDevice()');
            await this.setupDevice();
            console.log('setupDevice() completed successfully');
            
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            
            console.log('Updating status to ready...');
            this.updateStatus('Ready to make a call', 'idle');
            console.log('Initialization completed successfully');
        } catch (error) {
            console.error('Failed to initialize dialer:', error);
            this.updateStatus('Failed to initialize. Check console for details.', 'error');
        }
    }
    
    async setupDevice() {
        try {
            // Fetch access token from Cloudflare Worker
            const token = await this.fetchAccessToken();
            
            // Initialize Twilio Device
            this.device = new Twilio.Device(token, {
                logLevel: 1, // Set to 0 for production
                enableRingingState: true
            });
            
            // Device event listeners
            this.device.on('ready', () => {
                console.log('Twilio Device is ready');
                this.updateStatus('Device ready', 'idle');
            });
            
            this.device.on('error', (error) => {
                console.error('Twilio Device error:', error);
                this.updateStatus(`Device error: ${error.message}`, 'error');
            });
            
            this.device.on('connect', (connection) => {
                console.log('Call connected');
                this.connection = connection;
                this.isConnected = true;
                this.updateStatus('Call connected', 'connected');
                this.toggleButtons(false, true);
            });
            
            this.device.on('disconnect', (connection) => {
                console.log('Call disconnected');
                this.connection = null;
                this.isConnected = false;
                this.updateStatus('Call ended', 'idle');
                this.toggleButtons(true, false);
            });
            
            this.device.on('incoming', (connection) => {
                console.log('Incoming call from ' + connection.parameters.From);
                this.updateStatus(`Incoming call from ${connection.parameters.From}`, 'connecting');
                
                // Auto-accept incoming calls (optional)
                if (confirm(`Incoming call from ${connection.parameters.From}. Accept?`)) {
                    connection.accept();
                } else {
                    connection.reject();
                }
            });
            
        } catch (error) {
            throw new Error(`Failed to setup device: ${error.message}`);
        }
    }
    
    async fetchAccessToken() {
        try {
            console.log('Fetching token from:', this.tokenEndpoint);
            
            const response = await fetch(this.tokenEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Get response as text first to debug
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response was:', responseText);
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
            }
            
            if (!data.token) {
                throw new Error('No token received from server');
            }
            
            console.log('Token received successfully');
            return data.token;
        } catch (error) {
            console.error('Error fetching access token:', error);
            
            // If this is a mock environment, return a dummy token
            if (window.Twilio && window.Twilio.Device && window.Twilio.Device.toString().includes('Mock')) {
                console.log('Using mock token for testing');
                return 'mock_token_for_testing';
            }
            
            throw new Error(`Failed to fetch access token: ${error.message}. Please ensure your Cloudflare Worker is configured correctly.`);
        }
    }
    
    setupEventListeners() {
        this.callButton.addEventListener('click', () => this.makeCall());
        this.hangupButton.addEventListener('click', () => this.hangUp());
        
        // Allow Enter key to initiate call
        this.phoneNumberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isConnected) {
                this.makeCall();
            }
        });
    }
    
    async makeCall() {
        const phoneNumber = this.phoneNumberInput.value.trim();
        
        if (!phoneNumber) {
            this.updateStatus('Please enter a phone number', 'error');
            return;
        }
        
        if (!this.isValidPhoneNumber(phoneNumber)) {
            this.updateStatus('Please enter a valid phone number (e.g., +1234567890)', 'error');
            return;
        }
        
        if (!this.device) {
            this.updateStatus('Device not ready. Please refresh the page.', 'error');
            return;
        }
        
        try {
            this.updateStatus('Connecting...', 'connecting');
            this.toggleButtons(false, false);
            
            // Make the call
            const params = {
                To: phoneNumber
            };
            
            this.connection = this.device.connect(params);
            
        } catch (error) {
            console.error('Error making call:', error);
            this.updateStatus(`Call failed: ${error.message}`, 'error');
            this.toggleButtons(true, false);
        }
    }
    
    hangUp() {
        if (this.connection) {
            this.connection.disconnect();
        }
    }
    
    isValidPhoneNumber(phoneNumber) {
        // Basic phone number validation (E.164 format)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }
    
    updateStatus(message, type) {
        this.statusDisplay.textContent = message;
        this.statusDisplay.className = `status-display status-${type}`;
        
        // Add loading spinner for connecting state
        if (type === 'connecting') {
            const spinner = document.createElement('span');
            spinner.className = 'loading';
            this.statusDisplay.insertBefore(spinner, this.statusDisplay.firstChild);
        }
    }
    
    toggleButtons(callEnabled, hangupEnabled) {
        this.callButton.disabled = !callEnabled;
        this.hangupButton.disabled = !hangupEnabled;
    }
}

// Initialize the dialer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired, creating TwilioDialer...');
    try {
        const dialer = new TwilioDialer();
        console.log('TwilioDialer instance created successfully:', dialer);
    } catch (error) {
        console.error('Error creating TwilioDialer:', error);
        console.error('Error stack:', error.stack);
        
        // Update status display with error
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) {
            statusDisplay.textContent = `Initialization failed: ${error.message}`;
            statusDisplay.className = 'status-display status-error';
        }
    }
});

// Also try immediate execution in case DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('DOM already ready, creating TwilioDialer immediately...');
    try {
        const dialer = new TwilioDialer();
        console.log('TwilioDialer instance created successfully (immediate):', dialer);
    } catch (error) {
        console.error('Error creating TwilioDialer (immediate):', error);
    }
}

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});