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

    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId é obrigatório" }, { status: 400 })
    }

    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single()

    if (notificationError || !notification) {
      return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 })
    }

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", notification.user_id)

    if (subscriptionsError) {
      console.error("[v0] Erro ao buscar subscriptions:", subscriptionsError)
      return NextResponse.json({ error: "Erro ao buscar subscriptions" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: "Usuário não tem subscriptions ativas" }, { status: 200 })
    }

    const payload = {
      title: notification.title,
      body: notification.message,
      icon: "/icon-light-32x32.png",
      badge: "/badge-72x72.png",
      tag: `${notification.notification_type}-${notification.id}`,
      data: {
        url: notification.action_url || "/patient",
        notificationId: notification.id,
      },
      timestamp: Date.now(),
    }

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.subscription.endpoint,
          keys: {
            p256dh: sub.subscription.keys.p256dh,
            auth: sub.subscription.keys.auth,
          },
        }

        await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
        console.log(`[v0] Push instantâneo enviado para ${sub.endpoint}`)
        return { success: true }
      } catch (error: any) {
        console.error(`[v0] Erro ao enviar push instantâneo:`, error.message)

        if (error.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id)
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
      message: `Notificação instantânea enviada para ${successCount}/${subscriptions.length} dispositivo(s)`,
    })
  } catch (error) {
    console.error("[v0] Erro na API de instant:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
