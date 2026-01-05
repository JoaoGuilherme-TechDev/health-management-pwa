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

    // Buscar subscription do paciente no banco
    const { data: subscriptionData, error: dbError } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", patientId)
      .single()

    if (dbError || !subscriptionData || !subscriptionData.subscription) {
      console.log(`[PUSH API] No subscription found for patient ${patientId}`)
      // Não é um erro 500, apenas o paciente não tem push ativado
      return NextResponse.json({ success: false, message: "Paciente não possui push notifications ativado" }, { status: 200 })
    }

    const pushSubscription = subscriptionData.subscription

    // Payload para o service worker
    const notificationPayload = JSON.stringify({
      title,
      body,
      url,
      type,
      timestamp: Date.now(),
    })

    try {
      await webpush.sendNotification(pushSubscription, notificationPayload)
      console.log(`[PUSH API] Notification sent successfully to ${patientId}`)
      return NextResponse.json({ success: true, message: "Notificação enviada com sucesso" })
    } catch (pushError: any) {
      console.error("[PUSH API] Error sending via web-push:", pushError)

      // Se der erro 410 (Gone), a subscription não existe mais e deve ser removida
      if (pushError.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("user_id", patientId)
        console.log(`[PUSH API] Removed invalid subscription for patient ${patientId}`)
      }

      return NextResponse.json({ error: "Erro ao enviar notificação push" }, { status: 500 })
    }

  } catch (error) {
    console.error("[PUSH API] Internal server error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
