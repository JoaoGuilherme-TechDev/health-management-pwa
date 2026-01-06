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
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const payload = await request.json()
    const { patientId, title, body, url, type } = payload

    // Validar payload
    if (!patientId || !title) {
      return NextResponse.json({ error: "Dados incompletos (patientId, title são obrigatórios)" }, { status: 400 })
    }

    console.log(`[PUSH API] Preparing to send to patient: ${patientId}`)

    const { data: subscriptionsData, error: dbError } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", patientId)

    if (dbError || !subscriptionsData || subscriptionsData.length === 0) {
      console.log(`[PUSH API] No subscription found for patient ${patientId}`)
      return NextResponse.json(
        { success: false, message: "Paciente não possui push notifications ativado" },
        { status: 200 },
      )
    }

    const notificationPayload = JSON.stringify({
      title,
      body,
      url,
      type,
      timestamp: Date.now(),
    })

    let successCount = 0
    let failureCount = 0

    for (const subscriptionRecord of subscriptionsData) {
      const pushSubscription = subscriptionRecord.subscription

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload)
        console.log(`[PUSH API] Notification sent successfully to device: ${pushSubscription.endpoint}`)
        successCount++
      } catch (pushError: any) {
        console.error("[PUSH API] Error sending via web-push:", pushError)

        // If error 410 (Gone), remove the invalid subscription
        if (pushError.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("subscription", pushSubscription)
          console.log(`[PUSH API] Removed invalid subscription: ${pushSubscription.endpoint}`)
        }
        failureCount++
      }
    }

    console.log(`[PUSH API] Send results - Success: ${successCount}, Failures: ${failureCount}`)
    return NextResponse.json({
      success: successCount > 0,
      message: `Notificação enviada para ${successCount} dispositivo(s)`,
    })
  } catch (error) {
    console.error("[PUSH API] Internal server error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
