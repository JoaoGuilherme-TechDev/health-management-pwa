import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentBrasiliaTime, formatBrasiliaDate } from "@/lib/timezone"

export async function POST() {
  const supabase = await createClient()

  try {
    const now = getCurrentBrasiliaTime()
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "scheduled")
      .gte("scheduled_at", in2Hours.toISOString())
      .lte("scheduled_at", in24Hours.toISOString())

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: "Nenhuma consulta próxima nas próximas 2-24 horas" })
    }

    console.log("[v0] Processando lembretes para", appointments.length, "consultas - Horário de Brasília")

    let remindersCreated = 0

    for (const appointment of appointments) {
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const { data: existingNotif } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", appointment.patient_id)
        .eq("notification_type", "lembrete_consulta")
        .gte("created_at", last24Hours.toISOString())
        .ilike("message", `%${appointment.title}%`)
        .maybeSingle()

      if (!existingNotif) {
        const appointmentDate = new Date(appointment.scheduled_at)
        const hoursUntil = Math.round((appointmentDate.getTime() - now.getTime()) / (60 * 60 * 1000))

        const timeStr = formatBrasiliaDate(appointment.scheduled_at, "time")

        await supabase.from("notifications").insert({
          user_id: appointment.patient_id,
          title: "Lembrete de Consulta",
          message: `Você tem uma consulta em ${hoursUntil} horas: ${appointment.title} às ${timeStr}`,
          notification_type: "lembrete_consulta",
          action_url: "/patient/appointments",
        })

        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/notifications/push`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: appointment.patient_id,
              title: "📅 Lembrete de Consulta",
              message: `Você tem uma consulta em ${hoursUntil} horas: ${appointment.title}`,
              notification_type: "lembrete_consulta",
              url: "/patient/appointments",
              requireInteraction: true,
            }),
          })
        } catch (pushError) {
          console.error("[v0] Erro ao enviar push:", pushError)
        }

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", appointment.patient_id)
            .single()

          if (profile?.phone) {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/notifications/twilio`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: appointment.patient_id,
                message: `📅 Lembrete: Consulta em ${hoursUntil} horas - ${appointment.title} às ${timeStr}`,
                phoneNumber: profile.phone,
                type: "sms",
              }),
            })
            console.log(`[v0] SMS enviado para consulta: ${appointment.title}`)
          }
        } catch (twilioError) {
          console.error("[v0] Erro ao enviar SMS via Twilio:", twilioError)
        }

        remindersCreated++
        console.log("[v0] Lembrete criado para consulta:", appointment.title, "- Paciente:", appointment.patient_id)
      } else {
        console.log("[v0] Lembrete já existe para consulta:", appointment.title)
      }
    }

    return NextResponse.json({
      message: "Lembretes de consulta processados",
      total: appointments.length,
      created: remindersCreated,
    })
  } catch (error) {
    console.error("[v0] Erro ao criar lembretes de consulta:", error)
    return NextResponse.json({ error: "Falha ao criar lembretes de consulta" }, { status: 500 })
  }
}
