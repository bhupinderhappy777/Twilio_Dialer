# Cloudflare Worker Deployment Guide

This guide provides step-by-step instructions for deploying the Twilio Dialer application with a Cloudflare Worker backend.

## Prerequisites

Before deploying, ensure you have:

1. ✅ **Twilio Account**
   - Account SID
   - Auth Token
   - API Key and Secret
   - TwiML Application SID
   - Purchased phone number

2. ✅ **Cloudflare Account**
   - Active account (free tier works)
   - Wrangler CLI installed

3. ✅ **Development Tools**
   - Node.js 16+ installed
   - npm or yarn package manager

## Step 1: Prepare Twilio Credentials

### 1.1 Get Your Twilio Account Credentials

1. Log in to [Twilio Console](https://console.twilio.com)
2. From the dashboard, copy:
   - **Account SID**
   - **Auth Token**

### 1.2 Create API Key and Secret

1. Go to Console → Account → API Keys & Tokens
2. Click "Create API Key"
3. Give it a descriptive name (e.g., "Twilio Dialer Worker")
4. Select "Standard" key type
5. Copy the **SID** (API Key) and **Secret** immediately (you won't see the secret again)

### 1.3 Create TwiML Application

1. Go to Console → Develop → Voice → TwiML → Apps
2. Click "Create new TwiML App"
3. Set a friendly name (e.g., "Dialer App")
4. For Voice Configuration, set:
   - **Request URL**: `http://demo.twilio.com/docs/voice.xml` (temporary, can be customized later)
   - **HTTP Method**: POST
5. Click "Save"
6. Copy the **Application SID**

## Step 2: Set Up Cloudflare Worker

### 2.1 Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2.2 Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate.

### 2.3 Create New Worker Project

```bash
# Create a new worker project
npm create cloudflare@latest twilio-token-worker

# Follow the prompts:
# - Type of application: "Hello World" Worker
# - TypeScript: No (or Yes if you prefer)
# - Git repository: Yes
# - Deploy: No (we'll configure first)

cd twilio-token-worker
```

### 2.4 Install Twilio SDK

```bash
npm install twilio
```

### 2.5 Update Worker Code

Replace the contents of `src/index.js` (or `src/index.ts`) with:

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

### 2.6 Configure Environment Variables

Set your Twilio credentials as Worker secrets:

```bash
# Set each credential as a secret
npx wrangler secret put TWILIO_ACCOUNT_SID
# Paste your Account SID when prompted

npx wrangler secret put TWILIO_AUTH_TOKEN
# Paste your Auth Token when prompted

npx wrangler secret put TWILIO_API_KEY
# Paste your API Key when prompted

npx wrangler secret put TWILIO_API_SECRET
# Paste your API Secret when prompted

npx wrangler secret put TWILIO_TWIML_APP_SID
# Paste your TwiML App SID when prompted
```

### 2.7 Deploy the Worker

```bash
npx wrangler deploy
```

After deployment, you'll see output like:

```
Published twilio-token-worker
  https://twilio-token-worker.your-subdomain.workers.dev
```

Copy this URL - you'll need it for the next step.

## Step 3: Configure the Client Application

### 3.1 Update Worker URL in main.js

Open `main.js` in your Twilio Dialer repository and update the `WORKER_URL` constant:

```javascript
const WORKER_URL = 'https://twilio-token-worker.your-subdomain.workers.dev';
```

Replace `your-subdomain` with your actual Cloudflare Workers subdomain.

### 3.2 Deploy the Client Application

You have several options for deploying the client application:

#### Option A: Cloudflare Pages (Recommended)

1. Create a new Cloudflare Pages project
2. Connect your GitHub repository
3. Set build settings:
   - Build command: (none needed)
   - Build output directory: `/`
4. Deploy

#### Option B: GitHub Pages

1. Go to repository Settings → Pages
2. Select branch (e.g., `main`)
3. Set folder to `/` (root)
4. Save

#### Option C: Any Static Hosting

Upload `index.html`, `main.js`, and any other assets to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Azure Static Web Apps
- Any web server with HTTPS support

**Important**: HTTPS is required for microphone access in production.

## Step 4: Test the Deployment

### 4.1 Verify Worker is Running

Test the worker endpoint directly:

```bash
curl https://twilio-token-worker.your-subdomain.workers.dev
```

You should receive a JSON response with a token:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4.2 Test the Client Application

1. Open your deployed client application URL
2. Open browser DevTools (F12) and check the Console
3. You should see:
   - "ES module loaded successfully"
   - "Using Twilio Voice SDK v2.15.0"
   - "Fetching access token..."
   - "Access token received"
   - "Device ready - You can make calls"

4. Enter a phone number in E.164 format (e.g., +15551234567)
5. Click "Call"
6. Verify the call connects

### 4.3 Troubleshooting Deployment

If you encounter issues:

1. **"Failed to fetch access token"**
   - Verify worker URL in `main.js` is correct
   - Check worker is deployed: `wrangler tail`
   - Verify CORS headers are set correctly

2. **"Device not ready"**
   - Check worker secrets are set: `wrangler secret list`
   - Verify Twilio credentials are correct
   - Check worker logs: `wrangler tail`

3. **Call fails to connect**
   - For trial accounts, verify the destination number
   - Check Twilio account balance
   - Verify TwiML App SID is correct

## Step 5: Production Considerations

### 5.1 Security Enhancements

1. **Implement Authentication**
   - Add user authentication to your client app
   - Pass user identity to the worker
   - Validate user before generating tokens

2. **Rate Limiting**
   - Add rate limiting to prevent abuse
   - Use Cloudflare's Rate Limiting rules

3. **CORS Restrictions**
   - In production, replace `'*'` with your specific domain:
     ```javascript
     'Access-Control-Allow-Origin': 'https://yourdomain.com'
     ```

### 5.2 Monitoring

1. **Set up Worker Analytics**
   - Monitor in Cloudflare dashboard
   - Track request counts and errors

2. **Twilio Monitoring**
   - Monitor calls in Twilio Console
   - Set up usage alerts

### 5.3 Cost Optimization

1. **Token Caching**
   - Consider caching tokens (they're valid for 1 hour)
   - Implement client-side token refresh logic

2. **Worker Optimization**
   - Workers have 100,000 free requests/day
   - Beyond that, it's $0.50 per million requests

## Deployment Checklist

Before going live, verify:

- [ ] Worker deployed successfully
- [ ] All environment variables/secrets configured
- [ ] Client application deployed with correct worker URL
- [ ] HTTPS enabled on client application
- [ ] Test call completes successfully
- [ ] Error handling works correctly
- [ ] Browser console shows no errors
- [ ] CORS configured appropriately for production
- [ ] Rate limiting implemented (if needed)
- [ ] Monitoring set up
- [ ] Documentation updated with production URLs

## Support

For issues or questions:

- **Twilio Documentation**: https://www.twilio.com/docs
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers
- **Twilio Voice SDK**: https://www.twilio.com/docs/voice/sdks/javascript

## License

This deployment guide is part of the Twilio Dialer project, available under the MIT License.
