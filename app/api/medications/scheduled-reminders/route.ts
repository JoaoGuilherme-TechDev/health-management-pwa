import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentBrasiliaTime } from "@/lib/timezone"

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const now = getCurrentBrasiliaTime()
    const currentTime = now.toTimeString().substring(0, 5)
    const currentDay = now.getDay()
    const today = now.toISOString().split("T")[0]

    console.log(`[v0] Processando lembretes agendados para ${currentTime} (dia ${currentDay}) - Horário de Brasília`)

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

      if (!schedule.days_of_week.includes(currentDay)) {
        continue
      }

      if (medication.start_date && new Date(medication.start_date) > now) {
        continue
      }
      if (medication.end_date && new Date(medication.end_date) < now) {
        continue
      }

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

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: medication.user_id,
        title: "Hora do Remédio",
        message: `Está na hora do seu remédio: ${medication.name} - ${medication.dosage}`,
        notification_type: "lembrete_medicamento",
        action_url: "/patient/medications",
      })

      if (notifError) {
        console.error(`[v0] Erro ao criar notificação para ${medication.name}:`, notifError)
      } else {
        notificationsCreated++
      }

      try {
        const pushResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/notifications/push`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: medication.user_id,
              title: "⏰ Hora do Remédio",
              message: `Está na hora do seu remédio: ${medication.name} - ${medication.dosage}`,
              notification_type: "lembrete_medicamento",
              url: "/patient/medications",
              requireInteraction: true,
            }),
          },
        )

        if (!pushResponse.ok) {
          console.error(`[v0] Erro ao enviar push notification: ${pushResponse.status}`)
        } else {
          console.log(`[v0] Push notification enviada com sucesso para ${medication.name}`)
        }
      } catch (pushError) {
        console.error(`[v0] Erro ao enviar push notification:`, pushError)
      }

      try {
        const { data: profile } = await supabase.from("profiles").select("phone").eq("id", medication.user_id).single()

        if (profile?.phone) {
          const zapiResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/notifications/zapi`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: medication.user_id,
                message: `⏰ *Hora do Remédio*\n\n${medication.name} - ${medication.dosage}\n\nNão esqueça de tomar seu medicamento!`,
                phoneNumber: profile.phone,
              }),
            },
          )

          if (zapiResponse.ok) {
            console.log(`[v0] WhatsApp enviado com sucesso via Z-API para ${medication.name}`)
          } else {
            console.error(`[v0] Erro ao enviar WhatsApp via Z-API: ${zapiResponse.status}`)
          }
        }
      } catch (zapiError) {
        console.error(`[v0] Erro ao enviar WhatsApp via Z-API:`, zapiError)
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
