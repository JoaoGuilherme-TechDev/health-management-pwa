import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentBrasiliaTime, formatBrasiliaDate } from "@/lib/timezone"

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { appointment } = await request.json()

    if (!appointment) {
      return NextResponse.json({ error: "Missing appointment data" }, { status: 400 })
    }

    const now = getCurrentBrasiliaTime()
    const appointmentDate = new Date(appointment.scheduled_at)
    const timeStr = formatBrasiliaDate(appointment.scheduled_at, "time")
    const dateStr = formatBrasiliaDate(appointment.scheduled_at, "date")

    const { error: creationNotifError } = await supabase.from("notifications").insert({
      user_id: appointment.patient_id,
      title: "Consulta Agendada",
      message: `Sua consulta foi agendada: ${appointment.title} em ${dateStr} às ${timeStr}`,
      notification_type: "appointment_created",
      action_url: "/patient/appointments",
      read: false,
    })

    if (creationNotifError) {
      console.error("[v0] Erro ao criar notificação de criação:", creationNotifError)
    } else {
      console.log("[v0] Notificação de criação enviada para consulta:", appointment.title)
    }

    const reminderTime = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000)

    if (reminderTime > now) {
      const { error: reminderError } = await supabase.from("appointment_reminders").insert({
        appointment_id: appointment.id,
        user_id: appointment.patient_id,
        reminder_time: reminderTime.toISOString(),
        is_sent: false,
      })

      if (reminderError) {
        console.error("[v0] Erro ao agendar lembrete 24h:", reminderError)
      } else {
        console.log("[v0] Lembrete 24h agendado para:", appointment.title)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notificações processadas com sucesso",
    })
  } catch (error) {
    console.error("[v0] Erro ao processar notificação de consulta:", error)
    return NextResponse.json({ error: "Falha ao processar notificação" }, { status: 500 })
  }
}
