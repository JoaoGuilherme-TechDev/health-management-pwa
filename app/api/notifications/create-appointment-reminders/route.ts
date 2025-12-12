import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()

  try {
    const now = new Date()
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

    console.log("[v0] Criando lembretes para", appointments.length, "consultas")

    for (const appointment of appointments) {
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const { data: existingNotif } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", appointment.patient_id)
        .eq("notification_type", "appointment_reminder")
        .gte("created_at", last24Hours.toISOString())
        .ilike("message", `%${appointment.title}%`)
        .maybeSingle()

      if (!existingNotif) {
        const appointmentDate = new Date(appointment.scheduled_at)
        const hoursUntil = Math.round((appointmentDate.getTime() - now.getTime()) / (60 * 60 * 1000))

        await supabase.from("notifications").insert({
          user_id: appointment.patient_id,
          title: "Lembrete de Consulta",
          message: `Você tem uma consulta em ${hoursUntil} horas: ${appointment.title} às ${appointmentDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
          notification_type: "appointment_reminder",
          action_url: "/patient/appointments",
        })

        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/notifications/push`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: appointment.patient_id,
              title: "Lembrete de Consulta",
              message: `Você tem uma consulta em ${hoursUntil} horas: ${appointment.title}`,
              notification_type: "appointment_reminder",
              url: "/patient/appointments",
            }),
          })
        } catch (pushError) {
          console.error("[v0] Erro ao enviar push:", pushError)
        }

        console.log("[v0] Lembrete de consulta criado para paciente", appointment.patient_id)
      } else {
        console.log("[v0] Lembrete já existe para", appointment.title)
      }
    }

    return NextResponse.json({ message: "Lembretes de consulta processados", count: appointments.length })
  } catch (error) {
    console.error("[v0] Erro ao criar lembretes de consulta:", error)
    return NextResponse.json({ error: "Falha ao criar lembretes de consulta" }, { status: 500 })
  }
}
