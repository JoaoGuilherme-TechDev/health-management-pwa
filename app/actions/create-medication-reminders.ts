"use server"

import { pool } from "@/lib/db"

interface MedicationRow {
  id: string
  name: string
  user_id: string
  start_date: string
  end_date: string | null
}

export async function createMedicationReminders() {
  try {
    const now = new Date()
    const pauloTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))

    const currentTime = pauloTime.toTimeString().slice(0, 5) // HH:MM format in São Paulo time
    const currentDate = pauloTime.toISOString().split("T")[0] // YYYY-MM-DD format
    const dayOfWeek = pauloTime.getDay() // 0 = Sunday, 1 = Monday, etc.

    console.log(
      "[v0] Checking medication reminders - São Paulo time:",
      currentTime,
      "Date:",
      currentDate,
      "Day:",
      dayOfWeek,
    )

    const schedulesRes = await pool.query(
      "SELECT id, user_id, medication_id, scheduled_time, days_of_week FROM medication_schedules"
    )
    const schedules = schedulesRes.rows

    if (!schedules || schedules.length === 0) {
      return { success: true, created: 0, message: "No active schedules found" }
    }

    const medicationsRes = await pool.query(
      "SELECT id, name, user_id, start_date, end_date FROM medications"
    )
    const medications = medicationsRes.rows as MedicationRow[]

    const medicationMap = new Map<string, MedicationRow>((medications ?? []).map((m) => [m.id, m]))

    let notificationsCreated = 0

    // Check each schedule
    for (const schedule of schedules) {
      const med = medicationMap.get(schedule.medication_id)

      if (!med) continue

      // Check if medication is within date range
      const startDate = new Date(med.start_date)
      const endDate = med.end_date ? new Date(med.end_date) : null
      const today = new Date(currentDate)

      if (startDate > today || (endDate && endDate < today)) {
        continue
      }

      // Check if today is in days_of_week
      const daysOfWeek = (schedule.days_of_week as number[]) || []
      if (daysOfWeek.length > 0 && !daysOfWeek.includes(dayOfWeek)) {
        continue
      }

      // This allows notifications to trigger even if the cron job misses the exact minute
      const scheduledTimeStr = (schedule.scheduled_time as string).slice(0, 5)
      const scheduledMinutes =
        Number.parseInt(scheduledTimeStr.split(":")[0]) * 60 + Number.parseInt(scheduledTimeStr.split(":")[1])
      const currentMinutes =
        Number.parseInt(currentTime.split(":")[0]) * 60 + Number.parseInt(currentTime.split(":")[1])
      const timeDifference = Math.abs(currentMinutes - scheduledMinutes)

      // Allow notification if within 2 minutes of scheduled time
      if (timeDifference > 2 && timeDifference < 1438) {
        // 1438 = 24*60 - 2 (handles day wrap)
        continue
      }

      // Check if notification already created today
      const existingNotificationRes = await pool.query(
        `SELECT id FROM notifications 
         WHERE user_id = $1 
         AND related_id = $2 
         AND created_at >= $3 
         AND created_at <= $4`,
        [schedule.user_id, schedule.medication_id, `${currentDate}T00:00:00`, `${currentDate}T23:59:59`]
      )

      if (existingNotificationRes.rows.length > 0) {
        continue // Skip if notification already created today
      }

      try {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, related_id, action_url, read)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            schedule.user_id,
            `💊 Hora do medicamento: ${med.name}`,
            `Tomar ${med.name} às ${scheduledTimeStr}`,
            "medication_reminder",
            schedule.medication_id,
            "/patient/medications",
            false,
          ]
        )

        notificationsCreated++
        console.log(`[v0] Created medication reminder for ${med.name} at ${currentTime}`)
      } catch (insertError) {
        console.error(`[v0] Error creating notification for ${med.name}:`, insertError)
      }
    }

    return { success: true, created: notificationsCreated }
  } catch (error) {
    console.error("[v0] Error creating medication reminders:", error)
    return { success: false, error: String(error) }
  }
}
