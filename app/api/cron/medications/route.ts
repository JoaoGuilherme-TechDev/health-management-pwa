import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import webpush from "web-push"

// Configurar web-push
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Get current time in Brazil
    const now = new Date()
    const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    const currentHour = brazilTime.getHours().toString().padStart(2, "0")
    const currentMinute = brazilTime.getMinutes().toString().padStart(2, "0")
    const currentTime = `${currentHour}:${currentMinute}`
    
    // Normalize date for comparison
    const today = new Date(brazilTime.getFullYear(), brazilTime.getMonth(), brazilTime.getDate())

    console.log(`[CRON] Checking medications for ${currentTime} (Brazil Time)`)

    // 2. Find matching schedules
    const { data: schedules, error } = await supabase
      .from("medication_schedules")
      .select(`
        scheduled_time,
        medication:medications (
          id,
          name,
          user_id,
          start_date,
          end_date,
          is_active
        )
      `)
      .like("scheduled_time", `${currentTime}%`)

    if (error) {
      console.error("[CRON] Error fetching schedules:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ message: "No schedules for this time" })
    }

    const notificationsSent = []

    for (const schedule of schedules) {
      // Handle potential array return from Supabase join
      const medData = schedule.medication as any
      const med = Array.isArray(medData) ? medData[0] : medData
      
      // Check if medication is valid
      if (!med || !med.is_active) continue

      // Check dates
      const startDate = new Date(med.start_date)
      const endDate = med.end_date ? new Date(med.end_date) : null
      
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      if (today < start) continue
      
      if (endDate) {
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        if (today > end) continue
      }

      // 3. Send Notification
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", med.user_id)

      if (subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: "⏰ Hora de Tomar Seu Remédio",
          body: `Está na hora de tomar ${med.name}`,
          url: `/patient/medications?action=confirm&medicationId=${med.id}&name=${encodeURIComponent(med.name)}`,
          type: "medication_reminder",
          tag: `medication-reminder-${med.id}-${today.toISOString().split("T")[0]}-${currentTime}`
        })

        for (const sub of subs) {
          try {
            await webpush.sendNotification(sub.subscription as any, payload)
            notificationsSent.push({ med: med.name, user: med.user_id })
            
            // Log to notifications table
            await supabase.from("notifications").insert({
               user_id: med.user_id,
               title: "⏰ Hora de Tomar Seu Remédio",
               message: `Está na hora de tomar ${med.name}`,
               type: "medication_reminder",
               is_read: false,
               action_url: `/patient/medications?action=confirm&medicationId=${med.id}&name=${encodeURIComponent(med.name)}`
            })

          } catch (e) {
            console.error(`[CRON] Failed to send to ${med.user_id}`, e)
            // If 410 Gone, delete subscription could be added here
          }
        }
      }
    }

    return NextResponse.json({ success: true, sent: notificationsSent })

  } catch (error) {
    console.error("[CRON] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
