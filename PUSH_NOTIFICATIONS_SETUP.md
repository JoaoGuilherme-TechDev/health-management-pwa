# Push Notifications Setup Guide

## Generate VAPID Keys

You need to generate VAPID (Voluntary Application Server Identification) keys to send push notifications.

### Option 1: Using npx (Easiest)

Run this command in your terminal:

\`\`\`bash
npx web-push generate-vapid-keys
\`\`\`

This will output something like:

\`\`\`
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib27SDbQjaDTbVJ...

Private Key:
bdSiGcHIxSP-usIYmNl3C1oWYJpLA4Bqp7XS...
=======================================
\`\`\`

### Option 2: Using Node.js Script

Create a temporary file `generate-vapid.js`:

\`\`\`javascript
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
\`\`\`

Run it:

\`\`\`bash
node generate-vapid.js
\`\`\`

### Option 3: Online Generator

Visit: https://vapidkeys.com/

## Add Keys to Your Project

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Navigate to Environment Variables
   - Add these two variables:
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = Your public key
     - `VAPID_PRIVATE_KEY` = Your private key

2. **For Local Development:**
   Create a `.env.local` file:
   \`\`\`
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib27SDbQjaDTbVJ...
   VAPID_PRIVATE_KEY=bdSiGcHIxSP-usIYmNl3C1oWYJpLA4Bqp7XS...
   \`\`\`

## Important Notes

- ⚠️ **Never share your private key publicly**
- The public key is safe to expose (it's used by the browser)
- Both keys must be from the same pair
- If you regenerate keys, all existing subscriptions will be invalidated

## Testing Push Notifications

After setting up:

1. As a patient, go to Settings → Enable notifications
2. Grant browser permission when prompted
3. As an admin, add a medication to a patient
4. The patient should receive a push notification on their device

## Troubleshooting

- **Not receiving notifications?** Check browser console for errors
- **"Invalid VAPID keys"?** Make sure both keys are from the same generated pair
- **Works locally but not in production?** Verify environment variables are set in Vercel
