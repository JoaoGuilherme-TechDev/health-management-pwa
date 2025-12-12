// Script para gerar chaves VAPID para notificações push
const webpush = require("web-push")

console.log("\n🔐 Gerando chaves VAPID para notificações push...\n")

const vapidKeys = webpush.generateVAPIDKeys()

console.log("✅ Chaves geradas com sucesso!\n")
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
console.log("\n📋 Cole estas variáveis na Vercel:\n")
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY")
console.log(vapidKeys.publicKey)
console.log("\nVAPID_PRIVATE_KEY")
console.log(vapidKeys.privateKey)
console.log("\nNEXT_PUBLIC_SITE_URL")
console.log("https://seu-app.vercel.app")

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

console.log("📝 Próximos passos:\n")
console.log("1. Copie as chaves acima")
console.log("2. Vá para Vercel → Settings → Environment Variables")
console.log("3. Adicione as 3 variáveis (incluindo o NEXT_PUBLIC_SITE_URL)")
console.log("4. Aplique para Production, Preview e Development")
console.log("5. Faça um novo deploy\n")
