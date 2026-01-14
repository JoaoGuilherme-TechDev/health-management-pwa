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

    // Get all active medication schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("medication_schedules")
      .select("id,user_id,medication_id,scheduled_time,days_of_week")

    if (schedulesError) {
      console.error("[v0] Error fetching schedules:", schedulesError)
      return { success: false, error: schedulesError.message }
    }

    if (!schedules || schedules.length === 0) {
      return { success: true, created: 0, message: "No active schedules found" }
    }

    // Get all active medications
    const { data: medications, error: medicationsError } = await supabase
      .from("medications")
      .select("id,name,user_id,start_date,end_date")

    if (medicationsError) {
      console.error("[v0] Error fetching medications:", medicationsError)
      return { success: false, error: medicationsError.message }
    }

    // Create a map for quick lookup
    const medicationMap = new Map(medications?.map((m) => [m.id, m]) ?? [])

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

      const { error: insertError } = await supabase.from("notifications").insert({
        user_id: schedule.user_id,
        title: `💊 Hora do medicamento: ${med.name}`,
        message: `Tomar ${med.name} às ${scheduledTimeStr}`,
        type: "medication_reminder",
        related_id: schedule.medication_id,
        action_url: "/patient/medications",
        read: false,
      })

      if (!insertError) {
        notificationsCreated++
        console.log(`[v0] Created medication reminder for ${med.name} at ${currentTime}`)
      } else {
        console.error(`[v0] Error creating notification for ${med.name}:`, insertError)
      }
    }

    return { success: true, created: notificationsCreated }
  } catch (error) {
    console.error("[v0] Error creating medication reminders:", error)
    return { success: false, error: String(error) }
  }
}
