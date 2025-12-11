import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()

  try {
    // Get all scheduled appointments in the next 24 hours
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", tomorrow.toISOString())

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: "No upcoming appointments" })
    }

    console.log("[v0] Creating reminders for", appointments.length, "appointments")

    for (const appointment of appointments) {
      // Check if notification already exists for this appointment
      const { data: existingNotif } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", appointment.patient_id)
        .eq("notification_type", "appointment_reminder")
        .eq("action_url", `/patient/appointments`)
        .gte("created_at", now.toISOString())
        .single()

      if (!existingNotif) {
        // Create notification
        const appointmentDate = new Date(appointment.scheduled_at)
        await supabase.from("notifications").insert({
          user_id: appointment.patient_id,
          title: "Lembrete de Consulta",
          message: `Você tem uma consulta agendada para amanhã: ${appointment.title} às ${appointmentDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
          notification_type: "appointment_reminder",
          action_url: "/patient/appointments",
        })

        console.log("[v0] Created appointment reminder for patient", appointment.patient_id)
      }
    }

    return NextResponse.json({ message: "Appointment reminders created successfully", count: appointments.length })
  } catch (error) {
    console.error("[v0] Error creating appointment reminders:", error)
    return NextResponse.json({ error: "Failed to create appointment reminders" }, { status: 500 })
  }
}
