import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { PushNotificationService } from "@/lib/push-notifications"

export const dynamic = 'force-dynamic' // Ensure it's not cached

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const pushService = new PushNotificationService(supabase)
    
    // 1. Setup time variables (Brasilia)
    const now = new Date()
    const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    const currentHour = brazilTime.getHours().toString().padStart(2, "0")
    const currentMinute = brazilTime.getMinutes().toString().padStart(2, "0")
    const currentTime = `${currentHour}:${currentMinute}`
    
    console.log(`[CRON] Checking reminders for ${currentTime}`)

    // ==========================================
    // 2. Medication Reminders
    // ==========================================
    const { data: schedules, error: schedError } = await supabase
        .from("medication_schedules")
        .select(`
            id, 
            scheduled_time, 
            medication_id, 
            user_id,
            medications (
                name, 
                start_date, 
                end_date
            )
        `)
        .eq("is_active", true)

    if (schedError) {
        console.error("[CRON] Error fetching schedules:", schedError)
    }

    if (schedules) {
        for (const schedule of schedules) {
            // Check time match (simple string match HH:MM)
            // scheduled_time is usually "HH:MM:SS"
            if (schedule.scheduled_time.startsWith(currentTime)) {
                // Check dates
                const med = schedule.medications as any
                if (!med) continue

                const startDate = new Date(med.start_date)
                const endDate = med.end_date ? new Date(med.end_date) : null
                
                const today = new Date(brazilTime.getFullYear(), brazilTime.getMonth(), brazilTime.getDate())
                const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                
                if (today < start) continue
                if (endDate) {
                    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
                    if (today > end) continue
                }

                // CHECK FOR DUPLICATES (avoid sending if already sent in last 15 mins)
                const expectedUrl = `/patient/medications?action=confirm&medicationId=${schedule.medication_id}&name=${encodeURIComponent(med.name)}`
                const { data: existing } = await supabase
                    .from("notifications")
                    .select("id")
                    .eq("user_id", schedule.user_id)
                    .eq("notification_type", "medication_reminder")
                    .eq("action_url", expectedUrl)
                    .gte("created_at", new Date(now.getTime() - 15 * 60 * 1000).toISOString())

                if (existing && existing.length > 0) {
                    console.log(`[CRON] Notification already sent for ${med.name} (skipping)`)
                    continue
                }

                // Send Notification
                console.log(`[CRON] Sending medication reminder for ${med.name} to ${schedule.user_id}`)
                await pushService.sendToPatient({
                    patientId: schedule.user_id,
                    title: "Hora de Tomar seu Remédio",
                    body: `Está na hora de tomar ${med.name}`,
                    url: `/patient/medications?action=confirm&medicationId=${schedule.medication_id}&name=${encodeURIComponent(med.name)}`,
                    type: "medication_reminder"
                })
            }
        }
    }

    // ==========================================
    // 3. Appointment Reminders
    // ==========================================
    // We want to notify 24h before and 1h before
    // We'll query appointments in a range
    
    // 1 Hour Lookahead
    const oneHourFromNow = new Date(brazilTime.getTime() + 60 * 60 * 1000)
    const oneHourStart = new Date(oneHourFromNow)
    oneHourStart.setSeconds(0, 0)
    const oneHourEnd = new Date(oneHourFromNow)
    oneHourEnd.setSeconds(59, 999)

    // 24 Hour Lookahead
    const oneDayFromNow = new Date(brazilTime.getTime() + 24 * 60 * 60 * 1000)
    const oneDayStart = new Date(oneDayFromNow)
    oneDayStart.setSeconds(0, 0)
    const oneDayEnd = new Date(oneDayFromNow)
    oneDayEnd.setSeconds(59, 999)

    const { data: appointments, error: appError } = await supabase
        .from("appointments")
        .select("*")
        .in("status", ["scheduled"])
        .or(`scheduled_at.gte.${oneHourStart.toISOString()},scheduled_at.gte.${oneDayStart.toISOString()}`) 
        // Note: The OR logic above with GTE is tricky, better to fetch potential candidates and filter in JS or use specific ranges
        // Let's just fetch all scheduled appointments and filter in JS for simplicity unless dataset is huge
    
    // Better approach: Fetch appointments scheduled for today/tomorrow
    const { data: activeAppointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("status", "scheduled")
        .gte("scheduled_at", new Date().toISOString()) // Future only

    if (activeAppointments) {
        for (const app of activeAppointments) {
            const appDate = new Date(app.scheduled_at)
            const diffMs = appDate.getTime() - brazilTime.getTime()
            const diffHours = diffMs / (1000 * 60 * 60)
            
            // Check for ~1 hour (allow 10 minute window to be safe)
            if (diffHours >= 0.9 && diffHours <= 1.1) {
                 const actionUrl = `/patient/appointments?highlight=${app.id}&type=1h`
                 
                 // Check duplicates
                 const { data: existing } = await supabase
                    .from("notifications")
                    .select("id")
                    .eq("user_id", app.patient_id)
                    .eq("notification_type", "appointment_reminder")
                    .eq("action_url", actionUrl)
                
                 if (!existing || existing.length === 0) {
                     console.log(`[CRON] Sending 1h appointment reminder for ${app.title} to ${app.patient_id}`)
                     await pushService.sendToPatient({
                        patientId: app.patient_id,
                        title: "Lembrete de Consulta",
                        body: `Sua consulta "${app.title}" é em 1 hora.`,
                        url: actionUrl,
                        type: "appointment_reminder"
                    })
                 }
            }

            // Check for ~24 hours
            if (diffHours >= 23.9 && diffHours <= 24.1) {
                 const actionUrl = `/patient/appointments?highlight=${app.id}&type=24h`

                 // Check duplicates
                 const { data: existing } = await supabase
                    .from("notifications")
                    .select("id")
                    .eq("user_id", app.patient_id)
                    .eq("notification_type", "appointment_reminder")
                    .eq("action_url", actionUrl)

                 if (!existing || existing.length === 0) {
                     console.log(`[CRON] Sending 24h appointment reminder for ${app.title} to ${app.patient_id}`)
                     await pushService.sendToPatient({
                        patientId: app.patient_id,
                        title: "Lembrete de Consulta",
                        body: `Você tem uma consulta "${app.title}" amanhã neste horário.`,
                        url: actionUrl,
                        type: "appointment_reminder"
                    })
                 }
            }
        }
    }

    return NextResponse.json({ success: true, time: currentTime })
  } catch (error) {
    console.error("Cron error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
