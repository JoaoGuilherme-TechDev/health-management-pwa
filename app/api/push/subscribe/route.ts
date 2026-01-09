import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import webpush from "web-push"

// Configurar web-push
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const subscription = await request.json()

    // Validar subscription
    if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return NextResponse.json({ error: "Subscription inválida" }, { status: 400 })
    }

    // Salvar no banco de dados
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: userData.user.id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      expiration_time: subscription.expirationTime || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Erro ao salvar subscription:", error)
      return NextResponse.json({ error: "Erro ao salvar subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Subscription salva com sucesso" })
  } catch (error) {
    console.error("Erro na API de subscribe:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
