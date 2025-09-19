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
        
        // 🔍 DEBUG: Log what we found
        console.log('🔍 DOM Elements Check:');
        console.log('  phoneNumberInput:', !!this.phoneNumberInput);
        console.log('  callButton:', !!this.callButton);
        console.log('  hangupButton:', !!this.hangupButton);
        console.log('  statusDisplay:', !!this.statusDisplay);
        
        // Validate DOM elements
        if (!this.phoneNumberInput || !this.callButton || !this.hangupButton || !this.statusDisplay) {
            console.error('❌ Required DOM elements not found');
            console.error('Missing elements:', {
                phoneNumber: !this.phoneNumberInput,
                callButton: !this.callButton,
                hangupButton: !this.hangupButton,
                statusDisplay: !this.statusDisplay
            });
            return;
        }
        
        console.log('✅ All DOM elements found successfully');
        
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
            
            console.log('🔧 About to create Twilio Device with token...');
            console.log('🔧 Token preview:', token.substring(0, 50) + '...');
            
            // Initialize device with more detailed error handling
            console.log('Initializing Twilio Device...');
            
            try {
                this.device = new Twilio.Device(token, {
                    logLevel: 1,
                    enableRingingState: true,
                    // Add more debug options
                    debug: true,
                    allowIncomingWhileBusy: true
                });
                
                console.log('✅ Twilio Device created successfully');
                
            } catch (deviceError) {
                console.error('❌ Failed to create Twilio Device:', deviceError);
                console.error('❌ Device error details:', {
                    name: deviceError.name,
                    message: deviceError.message,
                    code: deviceError.code,
                    stack: deviceError.stack
                });
                throw new Error(`Device creation failed: ${deviceError.message}`);
            }
            
            // Set up device event listeners
            this.setupDeviceEvents();
            
            // Check TwiML App configuration
            console.log('🔍 Checking TwiML App configuration...');
            setTimeout(async () => {
                const twimlStatus = await this.checkTwiMLAppStatus();
                if (!twimlStatus) {
                    console.warn('⚠️  TwiML App configuration issues detected');
                    console.warn('💡 This might be why you\'re getting AccessTokenInvalid errors');
                }
            }, 1000);
            
            console.log('TwilioDialer initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');
        }
    }
    
    setupDeviceEvents() {
        console.log('Setting up device events');
        
        this.device.on('ready', () => {
            console.log('✅ Device is ready');
            this.updateStatus('Ready to make calls', 'idle');
        });
        
        this.device.on('error', (error) => {
            console.error('❌ Device error occurred:', error);
            console.error('❌ Error details:', {
                code: error.code,
                message: error.message,
                twilioError: error.twilioError,
                causes: error.causes,
                description: error.description
            });
            
            // More specific error handling
            if (error.code === 20101) {
                console.error('🔍 AccessTokenInvalid - This could be:');
                console.error('   1. Wrong API Key or Account SID');
                console.error('   2. TwiML App SID doesn\'t exist or is wrong');
                console.error('   3. API Key doesn\'t have permission for Voice');
                console.error('   4. Token signature is invalid');
                console.error('   5. TwiML App Voice URL is not configured');
            }
            
            this.updateStatus(`Device error: ${error.message}`, 'error');
        });
        
        this.device.on('tokenWillExpire', () => {
            console.log('🔄 Token will expire, refreshing...');
            this.fetchAccessToken().then(token => {
                this.device.updateToken(token);
            }).catch(err => {
                console.error('Failed to refresh token:', err);
            });
        });
        
        this.device.on('connect', (connection) => {
            console.log('✅ Call connected');
            this.connection = connection;
            this.isConnected = true;
            this.updateStatus('Call connected', 'connected');
            this.toggleButtons(false, true);
        });
        
        this.device.on('disconnect', () => {
            console.log('📞 Call disconnected');
            this.connection = null;
            this.isConnected = false;
            this.updateStatus('Call ended', 'idle');
            this.toggleButtons(true, false);
        });
        
        this.device.on('incoming', (connection) => {
            console.log('📞 Incoming call');
            // Handle incoming calls if needed
        });
        
        console.log('Device events set up successfully');
    }
    
    async fetchAccessToken() {
        try {
            console.log('🔍 Fetching token from:', this.tokenEndpoint);
            
            // 🔍 TEST: Also try to fetch a debug endpoint
            console.log('🔍 First, let\'s check what TwiML App SID the worker is using...');
            try {
                const debugResponse = await fetch(this.tokenEndpoint + '/debug');
                const debugText = await debugResponse.text();
                console.log('🔍 Worker debug info:', debugText);
            } catch (debugError) {
                console.log('🔍 No debug endpoint available, continuing with token fetch...');
            }
            
            const response = await fetch(this.tokenEndpoint + '/token');
            
            console.log('📊 Response status:', response.status);
            console.log('📊 Response ok:', response.ok);
            
            // Get response text first to see exactly what we're getting
            const responseText = await response.text();
            console.log('📄 Raw response text:', responseText);
            console.log('📏 Response length:', responseText.length);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
            }
            
            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('✅ JSON parsed successfully:', data);
            } catch (parseError) {
                console.error('❌ JSON parse failed:', parseError);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }
            
            if (!data.token) {
                console.error('❌ No token in response. Data:', data);
                throw new Error('No token in response');
            }
            
            console.log('🎫 Token received, length:', data.token.length);
            
            // 🔍 DECODE AND VALIDATE TOKEN
            const tokenParts = data.token.split('.');
            console.log('🔍 Token has', tokenParts.length, 'parts (should be 3)');
            
            if (tokenParts.length === 3) {
                try {
                    const header = JSON.parse(atob(tokenParts[0]));
                    const payload = JSON.parse(atob(tokenParts[1]));
                    
                    console.log('🔍 Token Header:', header);
                    console.log('🔍 Token Payload:', JSON.stringify(payload, null, 2));
                    
                    // Time validation
                    const now = Date.now();
                    const expiry = payload.exp * 1000;
                    console.log('🕐 Current time:', new Date(now).toISOString());
                    console.log('🕐 Token expires:', new Date(expiry).toISOString());
                    console.log('⏰ Time until expiry:', Math.round((expiry - now) / 1000), 'seconds');
                    
                    if (expiry <= now) {
                        console.error('❌ TOKEN IS EXPIRED!');
                    }
                    
                    // Field validation
                    console.log('✅ ISS (API Key SID):', payload.iss);
                    console.log('✅ SUB (Account SID):', payload.sub);
                    console.log('✅ Identity:', payload.grants?.identity);
                    console.log('✅ TwiML App SID:', payload.grants?.voice?.outgoing?.application_sid);
                    
                    // 🔍 CHECK CREDENTIAL TYPE
                    if (payload.iss?.startsWith('AC')) {
                        console.log('🔑 USING MAIN AUTH TOKEN - Full permissions');
                    } else if (payload.iss?.startsWith('SK')) {
                        console.log('🔑 USING API KEY - Limited permissions possible');
                    } else {
                        console.log('🔑 UNKNOWN CREDENTIAL TYPE:', payload.iss);
                    }
                    
                    // 🔍 TwiML APP VERIFICATION
                    const twimlAppSid = payload.grants?.voice?.outgoing?.application_sid;
                    if (twimlAppSid) {
                        console.log('🔍 Checking if TwiML App exists...');
                        console.log('🔍 TwiML App SID to verify:', twimlAppSid);
                        console.log('🔍 Go to Twilio Console → Develop → TwiML Apps');
                        console.log('🔍 Look for an app with SID:', twimlAppSid);
                        
                        // 🔍 CHECK IF THIS IS THE OLD OR NEW SID
                        if (twimlAppSid === 'AP96fdf2fad91e02ef564d5353a7fd67a0') {
                            console.error('❌ STILL USING OLD TwiML App SID!');
                            console.error('❌ Your Cloudflare Worker was NOT updated!');
                            console.error('❌ Please update TWILIO_TWIML_APP_SID in Cloudflare Dashboard');
                            console.error('❌ Current SID in token:', twimlAppSid);
                        } else {
                            console.log('✅ Using NEW TwiML App SID:', twimlAppSid);
                            console.log('✅ Worker was updated successfully');
                        }
                        
                        console.log('🔍 If it doesn\'t exist, CREATE A NEW ONE!');
                    }
                    
                    // Check for issues
                    const issues = [];
                    if (!payload.iss || (!payload.iss.startsWith('SK') && !payload.iss.startsWith('AC'))) {
                        issues.push('ISS should be API Key SID (SK) or Account SID (AC)');
                    }
                    if (!payload.sub || !payload.sub.startsWith('AC')) {
                        issues.push('SUB should be Account SID starting with AC');
                    }
                    if (!payload.grants?.voice?.outgoing?.application_sid?.startsWith('AP')) {
                        issues.push('TwiML App SID should start with AP');
                    }
                    if (!payload.grants?.identity) {
                        issues.push('Missing identity in grants');
                    }
                    
                    if (issues.length > 0) {
                        console.error('❌ Token validation issues:', issues);
                    }
                    
                } catch (e) {
                    console.error('❌ Could not decode token:', e);
                }
            } else {
                console.error('❌ Invalid JWT format - should have 3 parts separated by dots');
            }
            
            return data.token;
            
        } catch (error) {
            console.error('❌ Token fetch error:', error);
            throw new Error(`Failed to get access token: ${error.message}`);
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

    async checkTwiMLAppStatus() {
        console.log('🔍 Checking TwiML App configuration...');
        
        try {
            const response = await fetch(`${this.cloudflareWorkerUrl}/check-twiml`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('❌ Failed to check TwiML App status:', response.status);
                return false;
            }

            const result = await response.json();
            console.log('📋 TwiML App Status:', result);

            if (result.success && result.twimlApp) {
                const app = result.twimlApp;
                console.log(`📱 TwiML App SID: ${app.sid}`);
                console.log(`📱 TwiML App Name: ${app.friendlyName || 'No name set'}`);
                console.log(`🔗 Voice URL: ${app.voiceUrl || 'NOT CONFIGURED'}`);
                console.log(`🔗 Voice Method: ${app.voiceMethod || 'NOT SET'}`);
                console.log(`📻 Status Messages URL: ${app.statusCallbackUrl || 'NOT SET'}`);

                if (!app.voiceUrl) {
                    console.error('❌ CRITICAL: TwiML App Voice URL is not configured!');
                    console.error('🛠️  Please set Voice URL to your Cloudflare Worker voice endpoint');
                    this.updateStatus('TwiML App Voice URL not configured', 'error');
                    return false;
                }

                if (app.voiceUrl && !app.voiceUrl.includes('/voice')) {
                    console.warn('⚠️  Voice URL might not point to correct endpoint');
                    console.warn(`Expected to contain '/voice', got: ${app.voiceUrl}`);
                }

                console.log('✅ TwiML App appears to be properly configured');
                return true;
            } else {
                console.error('❌ Failed to retrieve TwiML App details:', result.error);
                return false;
            }

        } catch (error) {
            console.error('❌ Error checking TwiML App status:', error);
            return false;
        }
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

console.log('main.js execution completed');
