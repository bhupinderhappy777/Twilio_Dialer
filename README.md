# Twilio Dialer

A simple web-based phone dialer built with the Twilio Voice SDK and Cloudflare Workers. This application allows users to make outbound calls directly from their web browser.

## Features

- **Simple Interface**: Clean, responsive dialer interface with phone number input
- **Call Controls**: Call and hang up buttons with real-time status updates
- **Status Display**: Visual feedback showing connection status and call progress
- **Error Handling**: Comprehensive error handling and user feedback
- **Mobile Friendly**: Responsive design that works on desktop and mobile devices

## Prerequisites

Before setting up the Twilio Dialer, you'll need:

1. **Twilio Account**: Sign up at [https://www.twilio.com](https://www.twilio.com)
2. **Twilio Phone Number**: Purchase a Twilio phone number for outbound calls
3. **Cloudflare Account**: Sign up at [https://cloudflare.com](https://cloudflare.com) for Workers
4. **Web Server**: A local or remote web server to serve the HTML/JS files

## Setup Instructions

### 1. Twilio Configuration

1. **Get Twilio Credentials**:
   - Log in to your Twilio Console
   - Note your Account SID and Auth Token from the dashboard
   - Purchase a Twilio phone number if you haven't already

2. **Create a TwiML Application**:
   - Go to Console → Develop → Voice → TwiML → Apps
   - Create a new TwiML App
   - Note the Application SID for later use

### 2. Cloudflare Worker Setup

Create a Cloudflare Worker to generate access tokens:

1. **Create a new Worker**:
   ```bash
   npm create cloudflare@latest twilio-token-worker
   cd twilio-token-worker
   ```

2. **Install Twilio SDK**:
   ```bash
   npm install twilio
   ```

3. **Update `src/index.js`**:
   ```javascript
   import Twilio from 'twilio';

   export default {
     async fetch(request, env, ctx) {
       // Handle CORS preflight requests
       if (request.method === 'OPTIONS') {
         return new Response(null, {
           headers: {
             'Access-Control-Allow-Origin': '*',
             'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
             'Access-Control-Allow-Headers': 'Content-Type',
           },
         });
       }

       try {
         // Initialize Twilio client
         const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
         
         // Generate access token
         const AccessToken = Twilio.jwt.AccessToken;
         const VoiceGrant = AccessToken.VoiceGrant;
         
         const token = new AccessToken(
           env.TWILIO_ACCOUNT_SID,
           env.TWILIO_API_KEY,
           env.TWILIO_API_SECRET,
           { identity: 'user' }
         );
         
         const voiceGrant = new VoiceGrant({
           outgoingApplicationSid: env.TWILIO_TWIML_APP_SID,
           incomingAllow: true,
         });
         
         token.addGrant(voiceGrant);
         
         return new Response(JSON.stringify({ token: token.toJwt() }), {
           headers: {
             'Content-Type': 'application/json',
             'Access-Control-Allow-Origin': '*',
           },
         });
       } catch (error) {
         return new Response(JSON.stringify({ error: error.message }), {
           status: 500,
           headers: {
             'Content-Type': 'application/json',
             'Access-Control-Allow-Origin': '*',
           },
         });
       }
     },
   };
   ```

4. **Set Environment Variables**:
   ```bash
   # Set your Twilio credentials as Worker secrets
   npx wrangler secret put TWILIO_ACCOUNT_SID
   npx wrangler secret put TWILIO_AUTH_TOKEN
   npx wrangler secret put TWILIO_API_KEY
   npx wrangler secret put TWILIO_API_SECRET
   npx wrangler secret put TWILIO_TWIML_APP_SID
   ```

5. **Deploy the Worker**:
   ```bash
   npx wrangler deploy
   ```

### 3. Configure the Dialer

1. **Update Token Endpoint**:
   - Open `main.js`
   - Replace `https://your-worker.your-subdomain.workers.dev/token` with your actual Cloudflare Worker URL

2. **Serve the Files**:
   - Use a local web server to serve the HTML files
   - For development, you can use Python's built-in server:
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Python 2
     python -m SimpleHTTPServer 8000
     ```
   - Or use Node.js with `live-server`:
     ```bash
     npm install -g live-server
     live-server
     ```

## Usage

1. **Open the Dialer**:
   - Navigate to `http://localhost:8000` (or your server URL)
   - The dialer interface should load with "Device ready" status

2. **Make a Call**:
   - Enter a phone number in E.164 format (e.g., +1234567890)
   - Click the "Call" button
   - The status will show "Connecting..." then "Call connected"

3. **End a Call**:
   - Click the "Hang Up" button to disconnect the call

## File Structure

```
Twilio_Dialer/
├── index.html          # Main dialer interface
├── main.js            # JavaScript logic and Twilio integration
└── README.md          # This documentation file
```

## Troubleshooting

### Common Issues

1. **"Failed to fetch access token"**:
   - Check that your Cloudflare Worker is deployed and accessible
   - Verify the token endpoint URL in `main.js`
   - Check browser console for CORS errors

2. **"Device not ready"**:
   - Ensure your Twilio credentials are correctly set in the Worker
   - Check that the TwiML Application SID is correct
   - Verify API keys have the necessary permissions

3. **Call fails to connect**:
   - Ensure you have a verified phone number (for trial accounts)
   - Check that your Twilio account has sufficient balance
   - Verify the phone number format (E.164)

### Browser Compatibility

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 79+

**Note**: HTTPS is required for microphone access in production environments.

## Security Considerations

- Never expose Twilio credentials in client-side code
- Use HTTPS in production
- Implement proper authentication and authorization
- Consider rate limiting on your token endpoint
- Regularly rotate API keys and tokens

## License

This project is open source and available under the [MIT License](LICENSE).
