import { type NextRequest, NextResponse } from "next/server"
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

    const { subscriptions, payload } = await request.json()

    if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
      return NextResponse.json({ error: "subscriptions array é obrigatório" }, { status: 400 })
    }

    if (!payload) {
      return NextResponse.json({ error: "payload é obrigatório" }, { status: 400 })
    }

    // Enviar notificação para cada subscription
    const sendPromises = subscriptions.map(async (subscription: any) => {
      try {
        if (!subscription.endpoint || !subscription.keys) {
          return { success: false, error: "Invalid subscription format" }
        }

        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        }

        await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
        return { success: true }
      } catch (error: any) {
        console.error("[v0] Erro ao enviar push:", error.message)

        // Se foi 410 (Gone), remover a subscription
        if (error.statusCode === 410) {
          try {
            await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint)
          } catch (dbError) {
            console.error("[v0] Erro ao remover subscription:", dbError)
          }
        }

        return { success: false, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      success: true,
      sent: successCount,
      total: subscriptions.length,
      message: `${successCount}/${subscriptions.length} notificações enviadas`,
    })
  } catch (error) {
    console.error("[v0] Erro na API batch:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
