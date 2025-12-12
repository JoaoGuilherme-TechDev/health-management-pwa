import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const now = new Date()
    const currentTime = now.toTimeString().substring(0, 5) // HH:MM format
    const currentDay = now.getDay() // 0 = Domingo, 6 = Sábado
    const today = now.toISOString().split("T")[0]

    console.log(`[v0] Processando lembretes agendados para ${currentTime} (dia ${currentDay})`)

    // Buscar medicamentos ativos com horários próximos (±5 minutos do horário atual)
    const { data: schedules, error: schedulesError } = await supabase
      .from("medication_schedules")
      .select(
        `
        *,
        medications!inner (
          id,
          name,
          dosage,
          user_id,
          start_date,
          end_date
        )
      `,
      )
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
      const medication = schedule.medications as any

      // Verificar se hoje está nos dias da semana configurados
      if (!schedule.days_of_week.includes(currentDay)) {
        continue
      }

      // Verificar se o medicamento ainda está no período de validade
      if (medication.start_date && new Date(medication.start_date) > now) {
        continue
      }
      if (medication.end_date && new Date(medication.end_date) < now) {
        continue
      }

      // Verificar se já existe lembrete para este horário hoje
      const { data: existingReminder } = await supabase
        .from("medication_reminders")
        .select("id")
        .eq("schedule_id", schedule.id)
        .eq("reminder_date", today)
        .eq("reminder_time", schedule.scheduled_time)
        .maybeSingle()

      if (existingReminder) {
        console.log(`[v0] Lembrete já existe para ${medication.name} às ${schedule.scheduled_time}`)
        continue
      }

      // Criar lembrete na tabela medication_reminders
      const { error: reminderError } = await supabase.from("medication_reminders").insert({
        medication_id: medication.id,
        user_id: medication.user_id,
        schedule_id: schedule.id,
        reminder_time: schedule.scheduled_time,
        reminder_date: today,
        is_taken: false,
      })

      if (reminderError) {
        console.error(`[v0] Erro ao criar lembrete para ${medication.name}:`, reminderError)
        continue
      }

      remindersCreated++

      // Criar notificação in-app
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: medication.user_id,
        title: "Hora do Remédio",
        message: `Está na hora do seu remédio: ${medication.name} - ${medication.dosage}`,
        notification_type: "medication_reminder",
        action_url: "/patient/medications",
      })

      if (notifError) {
        console.error(`[v0] Erro ao criar notificação para ${medication.name}:`, notifError)
      } else {
        notificationsCreated++
      }

      // Enviar push notification
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/notifications/push`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: medication.user_id,
            title: "⏰ Hora do Remédio",
            message: `Está na hora do seu remédio: ${medication.name} - ${medication.dosage}`,
            notification_type: "medication_reminder",
            url: "/patient/medications",
            requireInteraction: true, // Notificação persistente que não desaparece automaticamente
          }),
        })
      } catch (pushError) {
        console.error(`[v0] Erro ao enviar push notification:`, pushError)
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
    console.error("[v0] Erro ao processar lembretes agendados:", error)
    return NextResponse.json({ error: "Erro ao processar lembretes" }, { status: 500 })
  }
}
