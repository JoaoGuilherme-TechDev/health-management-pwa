// components/PatientNotificationListener.tsx
"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function PatientNotificationListener() {
  useEffect(() => {
    const supabase = createClient()
    
    // Check if we're the patient
    const checkAndListen = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Subscribe to new notifications for this user
      const channel = supabase
        .channel(`patient-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log("📬 Patient received new notification:", payload.new)
            
            // Show notification
            await showNotification(payload.new)
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    }
    
    const setupLocalScheduler = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: meds } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
      const today = new Date()
      const brToday = new Date(today.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
      const activeMeds = (meds || []).filter((m: any) => {
        const start = new Date(m.start_date)
        const end = m.end_date ? new Date(m.end_date) : null
        start.setHours(0, 0, 0, 0)
        if (end) end.setHours(23, 59, 59, 999)
        const inRange = brToday >= start && (!end || brToday <= end)
        return inRange && m.is_active
      })
      if (activeMeds.length === 0) return
      const medIds = activeMeds.map((m: any) => m.id)
      const { data: schedules } = await supabase
        .from("medication_schedules")
        .select("*")
        .in("medication_id", medIds)
        .eq("is_active", true)
      const medsById: Record<string, any> = {}
      activeMeds.forEach((m: any) => { medsById[m.id] = m })
      const lastFired = new Set<string>()
      const tick = async () => {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
        const hhmm = now
          .toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false })
        const dow = now.getDay()
        for (const s of schedules || []) {
          if (Array.isArray(s.days_of_week) && !s.days_of_week.includes(dow)) continue
          const st = (s.scheduled_time || "").toString().substring(0, 5)
          if (st === hhmm) {
            const key = `${s.id}-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`
            if (lastFired.has(key)) continue
            lastFired.add(key)
            const med = medsById[s.medication_id]
            const medName = med?.name || "Medicamento"
            const body = `Às ${hhmm} - ${medName}`
            toast(`⏰ Horário de tomar ${medName}`, { description: body, duration: 60000 })
            if (Notification.permission === "granted" && 'serviceWorker' in navigator && document.hidden) {
              const registration = await navigator.serviceWorker.ready
              await registration.showNotification(`⏰ Horário de tomar ${medName}`, {
                body,
                icon: "/icon-light-32x32.png",
                badge: "/badge-72x72.png",
                tag: `medication-local-${Date.now()}`,
                requireInteraction: true,
                data: { type: "medication_reminder", url: "/patient/medications" }
              })
            }
          }
        }
      }
      tick()
      const interval = setInterval(tick, 15000)
      return () => clearInterval(interval)
    }
    
    const cleanupPromises: Promise<any>[] = []
    cleanupPromises.push(checkAndListen())
    cleanupPromises.push(setupLocalScheduler())
    
    return () => {
      cleanupPromises.forEach(async (p) => {
        const cleanup = await p
        if (typeof cleanup === "function") cleanup()
      })
    }
  }, [])
  
  return null
}

async function showNotification(notification: any) {
  try {
    if (Notification.permission !== "granted") return
    if (!('serviceWorker' in navigator)) return
    
    const registration = await navigator.serviceWorker.ready
    
    await registration.showNotification(notification.title, {
      body: notification.message || notification.title,
      icon: "/icon-light-32x32.png",
      badge: "/badge-72x72.png",
      tag: `patient-realtime-${Date.now()}`,
      requireInteraction: true,
      data: {
        type: notification.notification_type || notification.type,
        url: notification.data?.url || "/notifications",
        notificationId: notification.id
      }
    })
  } catch (error) {
    console.error("Error showing patient notification:", error)
  }
}
