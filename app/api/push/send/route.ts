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
    const supabase = createClient()
    const supabaseClient = await supabase
    const { data: userData } = await supabaseClient.auth.getUser()

    // Verificar se é admin/médico
    const { data: profile } = await (await supabase)
      .from("profiles")
      .select("role")
      .eq("id", userData.user?.id)
      .single()

    if (profile?.role !== "admin" && profile?.role !== "doctor") {
      return NextResponse.json({ error: "Apenas médicos podem enviar notificações" }, { status: 403 })
    }

    const { patientId, title, body, url, type } = await request.json()

    if (!patientId || !title) {
      return NextResponse.json({ error: "patientId e title são obrigatórios" }, { status: 400 })
    }

    // Buscar subscriptions do paciente
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", patientId)

    if (subscriptionsError) {
      console.error("Erro ao buscar subscriptions:", subscriptionsError)
      return NextResponse.json({ error: "Erro ao buscar subscriptions" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: "Paciente não tem subscriptions ativas" }, { status: 200 })
    }

    // Enviar notificação para cada subscription
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        }

        const payload = JSON.stringify({
          title,
          body: body || "Nova atualização do seu médico",
          url: url || "/patient",
          icon: "/icon-light-32x32.png",
          tag: `healthcare-${type || "notification"}-${Date.now()}`,
          timestamp: Date.now(),
          type: type || "general",
        })

        await webpush.sendNotification(pushSubscription, payload)
        console.log(`Notificação enviada para ${sub.endpoint}`)
      } catch (error: any) {
        console.error(`Erro ao enviar para ${sub.endpoint}:`, error)

        // Se subscription expirou, remover do banco
        if (error.statusCode === 410) {
          await (await supabaseClient).from("push_subscriptions").delete().eq("id", sub.id)
        }
      }
    })

    await Promise.all(sendPromises)

    return NextResponse.json({
      success: true,
      message: `Notificações enviadas para ${subscriptions.length} dispositivo(s)`,
    })
  } catch (error) {
    console.error("Erro na API de send:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}