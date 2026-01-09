// components/PatientNotificationListener.tsx
"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

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
            
            // Play alarm if medication reminder
            if (payload.new.notification_type === 'medication_reminder') {
              playAlarm()
            }
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    }
    
    checkAndListen()
  }, [])
  
  return null
}

// Function to play alarm sound (Beep)
const playAlarm = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = "square"
    osc.frequency.value = 880 // A5

    // Beep beep beep pattern
    const now = ctx.currentTime
    gain.gain.setValueAtTime(0.5, now)
    gain.gain.setValueAtTime(0, now + 0.2)
    gain.gain.setValueAtTime(0.5, now + 0.4)
    gain.gain.setValueAtTime(0, now + 0.6)
    gain.gain.setValueAtTime(0.5, now + 0.8)
    gain.gain.setValueAtTime(0, now + 1.0)

    osc.start(now)
    osc.stop(now + 1.2)
  } catch (e) {
    console.error("Failed to play alarm sound", e)
  }
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
      vibrate: notification.notification_type === 'medication_reminder' ? [500, 200, 500, 200, 500] : [200, 100, 200],
      data: {
        type: notification.notification_type || notification.type,
        url: notification.data?.url || "patient/notifications",
        notificationId: notification.id
      }
    } as any)
  } catch (error) {
    console.error("Error showing patient notification:", error)
  }
}
