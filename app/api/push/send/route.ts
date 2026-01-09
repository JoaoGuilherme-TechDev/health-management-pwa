import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

// Configurar web-push
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

// Cliente Supabase com Service Role para ignorar RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function POST(request: NextRequest) {
  try {
    // Verificar se é um webhook do Supabase (opcional: adicionar uma chave secreta)
    const payload = await request.json()
    
    // O Supabase envia o novo registro no campo 'record' ou 'new' dependendo da configuração
    // Também aceitamos chamadas diretas com patientId
    const notification = payload.record || payload.new || {
      user_id: payload.patientId,
      title: payload.title,
      message: payload.body,
      action_url: payload.url,
      notification_type: payload.type
    }
    
    if (!notification || !notification.user_id) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    console.log(`[PUSH WEBHOOK] Processando notificação para usuário: ${notification.user_id}`)

    // Buscar as inscrições de push do usuário
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", notification.user_id)

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log(`[PUSH WEBHOOK] Nenhuma inscrição encontrada para o usuário ${notification.user_id}`)
      return NextResponse.json({ success: true, message: "Sem inscrições" })
    }

    const pushPayload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      url: notification.action_url || "/patient/notifications",
      type: notification.notification_type,
      timestamp: Date.now(),
    })

    let successCount = 0
    let failCount = 0
    
    for (const subRecord of subscriptions) {
      try {
        await webpush.sendNotification(subRecord.subscription, pushPayload)
        successCount++
      } catch (error: any) {
        console.error(`[PUSH WEBHOOK] Erro ao enviar push para subscription ${subRecord.id}:`, error)
        failCount++
        
        // Se a subscrição não existe mais ou expirou (410 Gone ou 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[PUSH WEBHOOK] Removendo subscrição inválida/expirada: ${subRecord.id}`)
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("id", subRecord.id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent_to: successCount,
      failed: failCount
    })
  } catch (error) {
    console.error("[PUSH WEBHOOK] Erro interno:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
