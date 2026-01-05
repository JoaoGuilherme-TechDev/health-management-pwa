"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function useMedicationReminders() {
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    // Initialize AudioContext
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContext) {
      audioContextRef.current = new AudioContext()
    }

    const setupListener = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Subscribe to NEW notifications
      const channel = supabase
        .channel('medication-reminders-alerts')
        .on(
          'postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            const newNotification = payload.new as any
            
            // Check if it's a medication reminder
            if (newNotification.notification_type === 'medication_reminder') {
              triggerAlert(newNotification.title, newNotification.message)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanupPromise = setupListener()

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup())
    }
  }, [])

  const playAlarm = () => {
    if (!audioContextRef.current) return

    try {
      const ctx = audioContextRef.current
      
      // Resume context if suspended (browser policy)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Could not resume audio context:", e))
      }

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      // Alarm sound: High-Low-High beep sequence
      osc.type = 'square'
      
      const now = ctx.currentTime
      
      // First beep
      osc.frequency.setValueAtTime(880, now) // A5
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.linearRampToValueAtTime(0.1, now + 0.2)
      gain.gain.linearRampToValueAtTime(0, now + 0.25)
      
      // Second beep
      osc.frequency.setValueAtTime(880, now + 0.4) // A5
      gain.gain.setValueAtTime(0, now + 0.4)
      gain.gain.linearRampToValueAtTime(0.1, now + 0.45)
      gain.gain.linearRampToValueAtTime(0, now + 0.65)
      
      // Third beep
      osc.frequency.setValueAtTime(880, now + 0.8) // A5
      gain.gain.setValueAtTime(0, now + 0.8)
      gain.gain.linearRampToValueAtTime(0.1, now + 0.85)
      gain.gain.linearRampToValueAtTime(0, now + 1.05)

      osc.start(now)
      osc.stop(now + 1.2)
    } catch (e) {
      console.error("Error playing alarm:", e)
    }
  }

  const triggerAlert = (title: string, body: string) => {
    // Play sound
    playAlarm()

    // Show visual toast
    toast(title, {
      description: body,
      action: {
        label: "Confirmar",
        onClick: () => console.log("Confirmado"), 
      },
      duration: Infinity, 
    })

    // Show system notification if in background
    if (Notification.permission === "granted" && document.hidden) {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
              body: body,
              icon: "/icon-light-32x32.png",
              badge: "/placeholder-logo.png",
              requireInteraction: true,
              tag: `medication-${Date.now()}`,
              vibrate: [200, 100, 200, 100, 200, 100, 200],
            } as any)
          })
        } else {
          new Notification(title, {
            body: body,
            requireInteraction: true,
            icon: "/icon-light-32x32.png",
          })
        }
      } catch (e) {
        console.error("Error showing system notification:", e)
      }
    }
  }
}
