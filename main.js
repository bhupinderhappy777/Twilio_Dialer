// Import the Device class directly from the Twilio SDK using ES modules
import { Device } from 'https://unpkg.com/@twilio/voice-sdk@2.15.0/dist/js/twilio.min.js?module';

// Log that the module was loaded
console.log('ES module loaded successfully');

// Get the SDK version (different from the global version)
console.log(`Using Twilio Voice SDK`);

// Define the worker URL for future use
const WORKER_URL = 'https://twilio-token-worker.bhupinderhappy777.workers.dev';

// Log that script completed
console.log('Twilio dialer script initialization complete');

