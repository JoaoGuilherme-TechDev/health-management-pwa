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
                    title: "⏰Hora de Tomar Seu Remédio",
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
    
    // Fetch appointments scheduled for the future
    const { data: activeAppointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("status", "scheduled")
        .gte("scheduled_at", new Date().toISOString()) 

    if (activeAppointments) {
        for (const app of activeAppointments) {
            const appDate = new Date(app.scheduled_at)
            // Use UTC comparison
            const diffMs = appDate.getTime() - now.getTime()
            const diffHours = diffMs / (1000 * 60 * 60)
            
            // Check for ~1 hour (allow 10 minute window: 0.83h to 1.17h)
            if (diffHours >= 0.83 && diffHours <= 1.17) {
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
                        body: `Sua consulta "${app.title}" é em aproximadamente 1 hora.`,
                        url: actionUrl,
                        type: "appointment_reminder"
                    })
                 }
            }

            // Check for ~24 hours (allow 10 minute window: 23.83h to 24.17h)
            if (diffHours >= 23.83 && diffHours <= 24.17) {
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
