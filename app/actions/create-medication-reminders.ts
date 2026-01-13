"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createMedicationReminders() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    },
  )

  try {
    // Get current time
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    const currentDate = now.toISOString().split("T")[0] // YYYY-MM-DD format
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Get all active medication schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("medication_schedules")
      .select(
        `
        id,
        user_id,
        medication_id,
        scheduled_time,
        days_of_week,
        is_active,
        medications (
          id,
          name,
          user_id,
          start_date,
          end_date,
          is_active
        )
      `,
      )
      .eq("is_active", true)

    if (schedulesError) {
      console.error("[v0] Error fetching schedules:", schedulesError)
      return { success: false, error: schedulesError.message }
    }

    if (!schedules || schedules.length === 0) {
      return { success: true, created: 0, message: "No active schedules found" }
    }

    let notificationsCreated = 0

    // Check each schedule
    for (const schedule of schedules) {
      const med = schedule.medications as any

      if (!med || !med.is_active) continue

      // Check if medication is within date range
      const startDate = new Date(med.start_date)
      const endDate = med.end_date ? new Date(med.end_date) : null
      const today = new Date(currentDate)

      if (startDate > today || (endDate && endDate < today)) {
        continue
      }

      // Check if today is in days_of_week
      const daysOfWeek = schedule.days_of_week as number[]
      if (!daysOfWeek.includes(dayOfWeek)) {
        continue
      }

      // Check if current time matches scheduled time (within 1-minute window)
      const scheduledTimeStr = (schedule.scheduled_time as string).slice(0, 5)
      if (scheduledTimeStr !== currentTime) {
        continue
      }

      // Check if notification already exists for today
      const { data: existingNotification } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", schedule.user_id)
        .eq("related_id", schedule.medication_id)
        .gte("created_at", `${currentDate}T00:00:00`)
        .lte("created_at", `${currentDate}T23:59:59`)
        .single()

      if (existingNotification) {
        continue // Skip if notification already created today
      }

      // Create notification
      const { error: insertError } = await supabase.from("notifications").insert({
        user_id: schedule.user_id,
        title: `💊 ${med.name}`,
        message: `Horário de tomar ${med.name}`,
        notification_type: "medication_reminder",
        related_id: schedule.medication_id,
        related_type: "medication",
        action_url: "/patient/medications",
        type: "reminder",
      })

      if (!insertError) {
        notificationsCreated++
      }
    }

    return { success: true, created: notificationsCreated }
  } catch (error) {
    console.error("[v0] Error creating medication reminders:", error)
    return { success: false, error: String(error) }
  }
}
