// Run this script to generate VAPID keys for push notifications
// Usage: npx tsx scripts/generate-vapid-keys.ts

const webpush = require("web-push")

console.log("\n🔑 Generating VAPID Keys for Push Notifications...\n")

const vapidKeys = webpush.generateVAPIDKeys()

console.log("=======================================")
console.log("✅ VAPID Keys Generated Successfully!")
console.log("=======================================\n")

console.log("📋 Copy these to your environment variables:\n")

console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=")
console.log(vapidKeys.publicKey)
console.log("\nVAPID_PRIVATE_KEY=")
console.log(vapidKeys.privateKey)

console.log("\n=======================================")
console.log("⚠️  IMPORTANT:")
console.log("- Add both keys to Vercel Environment Variables")
console.log("- Keep the private key SECRET")
console.log("- The public key is safe to expose")
console.log("=======================================\n")
