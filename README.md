# Twilio Dialer

A modern, intuitive web-based phone dialer built with the Twilio Voice SDK and Cloudflare Workers. This application allows users to make outbound calls directly from their web browser with a beautiful, responsive interface.

## Features

- **Modern Interface**: Beautiful gradient design with smooth animations and transitions
- **Intuitive Controls**: Large, easy-to-use call and hang up buttons with visual feedback
- **Real-time Status**: Live status updates showing connection state and call progress
- **Error Handling**: Comprehensive error handling with clear user feedback
- **Phone Validation**: Automatic E.164 format validation for phone numbers
- **Keyboard Support**: Press Enter to quickly initiate calls
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices

## Prerequisites

Before using the Twilio Dialer, you'll need:

1. **Twilio Account**: Sign up at [https://www.twilio.com](https://www.twilio.com)
2. **Twilio Phone Number**: Purchase a Twilio phone number for outbound calls
3. **Cloudflare Worker**: The token generation worker is already deployed at `https://twilio-token-worker.bhupinderhappy777.workers.dev`
4. **Web Server**: A local or remote web server to serve the HTML/JS files (see usage below)

## Quick Start

The Twilio Dialer is ready to use! The Cloudflare Worker for token generation is already deployed and configured.

### 1. Serve the Files

Use a local web server to serve the HTML files:

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js:**
```bash
npm install -g live-server
live-server
```

**Using PHP:**
```bash
php -S localhost:8000
```

### 2. Open the Dialer

Navigate to `http://localhost:8000` in your web browser. The dialer will automatically:
- Fetch an access token from the Cloudflare Worker
- Initialize the Twilio Device
- Display "Device ready" when ready to make calls

### 3. Make a Call

1. Enter a phone number in E.164 format (e.g., `+15551234567`)
2. Click the "📞 Call" button or press Enter
3. Wait for the call to connect
4. Click "🔴 Hang Up" to end the call

## How It Works

### Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────┐
│   Web Browser   │─────▶│  Cloudflare Worker   │─────▶│   Twilio    │
│  (index.html)   │◀─────│  (Token Generator)   │◀─────│   API       │
└─────────────────┘      └──────────────────────┘      └─────────────┘
         │
         │ Twilio Voice SDK
         ▼
┌─────────────────┐
│  Twilio Voice   │
│    Network      │
└─────────────────┘
```

1. **Token Generation**: The web page fetches an access token from the Cloudflare Worker
2. **Device Initialization**: The Twilio Device is initialized with the token
3. **Call Setup**: When you click "Call", the device connects to Twilio's voice network
4. **Voice Routing**: Twilio routes the call through the TwiML application to the destination number

### Components

- **index.html**: The user interface with modern styling and responsive design
- **main.js**: JavaScript logic for Twilio Device management and call handling
- **Cloudflare Worker**: Serverless function that generates secure Twilio access tokens
- **Twilio Voice SDK**: Client-side library for WebRTC voice communications

## Troubleshooting

### Common Issues

1. **"Failed to fetch access token"**:
   - Check that the Cloudflare Worker is accessible at `https://twilio-token-worker.bhupinderhappy777.workers.dev`
   - Check browser console for CORS errors
   - Verify your internet connection

2. **"Device not ready"** or initialization errors:
   - Ensure the Cloudflare Worker environment variables are correctly set
   - Check that the TwiML Application SID is correct
   - Verify API keys have the necessary permissions in Twilio Console

3. **Call fails to connect**:
   - Ensure you have a verified phone number (required for trial accounts)
   - Check that your Twilio account has sufficient balance
   - Verify the phone number format is E.164 (e.g., +15551234567)
   - Check the browser console for detailed error messages

4. **No audio during call**:
   - Grant microphone permissions when prompted by the browser
   - Check your computer's audio settings
   - Try using headphones to avoid echo cancellation issues

### Browser Compatibility

The Twilio Voice SDK requires a modern browser with WebRTC support:

- ✅ Chrome 57+
- ✅ Firefox 52+
- ✅ Safari 11+
- ✅ Edge 79+

**Important**: HTTPS is required for microphone access in production environments. During local development, `localhost` is treated as a secure context.

## Security Considerations

- Never expose Twilio credentials in client-side code
- Use HTTPS in production
- Implement proper authentication and authorization
- Consider rate limiting on your token endpoint
- Regularly rotate API keys and tokens

## License

This project is open source and available under the [MIT License](LICENSE).
