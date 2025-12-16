import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentBrasiliaTime } from "@/lib/timezone"

export async function POST() {
  const supabase = await createClient()

  try {
    const now = getCurrentBrasiliaTime()
    const currentTime = now.toTimeString().substring(0, 5)
    const currentDay = now.getDay()
    const today = now.toISOString().split("T")[0]

    console.log(`[v0] Processando lembretes agendados para ${currentTime} (dia ${currentDay}) - Horário de Brasília`)

    const { data: schedules, error: schedulesError } = await supabase
      .from("medication_schedules")
      .select(`
        id,
        scheduled_time,
        days_of_week,
        is_active,
        medications!inner(
          id,
          name,
          dosage,
          user_id,
          start_date,
          end_date
        )
      `)
      .eq("is_active", true)
      .gte("scheduled_time", `${currentTime}:00`)
      .lte("scheduled_time", `${currentTime}:59`)

    if (schedulesError) {
      console.error("[v0] Erro ao buscar horários:", schedulesError)
      return NextResponse.json({ error: "Erro ao buscar horários" }, { status: 500 })
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ message: "Nenhum lembrete para este horário", time: currentTime })
    }

    let remindersCreated = 0
    let notificationsCreated = 0

    for (const schedule of schedules) {
      const medication = (schedule as any).medications

      if (!schedule.days_of_week.includes(currentDay)) {
        continue
      }

      if (medication.start_date && new Date(medication.start_date) > now) {
        continue
      }
      if (medication.end_date && new Date(medication.end_date) < now) {
        continue
      }

      const { data: existingReminder, error: checkError } = await supabase
        .from("medication_reminders")
        .select("id")
        .eq("schedule_id", schedule.id)
        .eq("reminder_date", today)
        .eq("reminder_time", schedule.scheduled_time)
        .maybeSingle()

      if (checkError) {
        console.error("[v0] Erro ao verificar lembrete:", checkError)
        continue
      }

      if (existingReminder) {
        continue
      }

      const { error: reminderError } = await supabase.from("medication_reminders").insert({
        medication_id: medication.id,
        user_id: medication.user_id,
        schedule_id: schedule.id,
        reminder_time: schedule.scheduled_time,
        reminder_date: today,
        is_taken: false,
      })

      if (reminderError) {
        console.error(`[v0] Erro ao criar lembrete:`, reminderError)
        continue
      }

      remindersCreated++

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: medication.user_id,
        title: "Hora do Remédio",
        message: `Está na hora do seu remédio: ${medication.name} - ${medication.dosage}`,
        notification_type: "lembrete_medicamento",
        action_url: "/patient/medications",
        read: false,
      })

      if (!notifError) {
        notificationsCreated++
      }
    }

    return NextResponse.json({
      message: "Lembretes processados com sucesso",
      time: currentTime,
      day: currentDay,
      schedulesFound: schedules.length,
      remindersCreated,
      notificationsCreated,
    })
  } catch (error) {
    console.error("[v0] Erro ao processar lembretes:", error)
    return NextResponse.json({ error: "Erro ao processar lembretes" }, { status: 500 })
  }
}
