import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentBrasiliaTime, formatBrasiliaDate } from "@/lib/timezone"

export async function POST() {
  const supabase = await createClient()

  try {
    const now = getCurrentBrasiliaTime()

    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000)

    const { data: pendingReminders, error: fetchError } = await supabase
      .from("appointment_reminders")
      .select(`
        id,
        appointment_id,
        user_id,
        reminder_time,
        is_sent,
        appointments:appointment_id(
          id,
          title,
          scheduled_at,
          patient_id
        )
      `)
      .eq("is_sent", false)
      .gte("reminder_time", fiveMinutesAgo.toISOString())
      .lte("reminder_time", fiveMinutesLater.toISOString())

    if (fetchError) {
      console.error("[v0] Erro ao buscar lembretes:", fetchError)
      return NextResponse.json({ error: "Erro ao buscar lembretes" }, { status: 500 })
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      return NextResponse.json({ message: "Nenhum lembrete para enviar agora" })
    }

    let remindersSent = 0

    for (const reminder of pendingReminders) {
      const appointment = (reminder as any).appointments
      const timeStr = formatBrasiliaDate(appointment.scheduled_at, "time")

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: appointment.patient_id,
        title: "Lembrete de Consulta - 24h",
        message: `Lembrete: Sua consulta ${appointment.title} é amanhã às ${timeStr}`,
        notification_type: "appointment_reminder_24h",
        action_url: "/patient/appointments",
        read: false,
      })

      if (notifError) {
        console.error("[v0] Erro ao criar notificação 24h:", notifError)
        continue
      }

      const { error: updateError } = await supabase
        .from("appointment_reminders")
        .update({ is_sent: true, sent_at: now.toISOString() })
        .eq("id", reminder.id)

      if (updateError) {
        console.error("[v0] Erro ao marcar lembrete como enviado:", updateError)
      } else {
        remindersSent++
        console.log("[v0] Lembrete 24h enviado para:", appointment.title)
      }

      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/notifications/push`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: appointment.patient_id,
            title: "📅 Consulta Amanhã",
            message: `${appointment.title} às ${timeStr}`,
            notification_type: "appointment_reminder_24h",
            url: "/patient/appointments",
            requireInteraction: true,
          }),
        })
      } catch (pushError) {
        console.error("[v0] Erro ao enviar push:", pushError)
      }
    }

    return NextResponse.json({
      message: "Lembretes 24h processados",
      total: pendingReminders.length,
      sent: remindersSent,
    })
  } catch (error) {
    console.error("[v0] Erro ao processar lembretes 24h:", error)
    return NextResponse.json({ error: "Falha ao processar lembretes" }, { status: 500 })
  }
}
