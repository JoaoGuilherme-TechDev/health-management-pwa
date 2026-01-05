"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function useMedicationReminders() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastCheckedMinuteRef = useRef<string>("")

  useEffect(() => {
    // Initialize AudioContext
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContext) {
      audioContextRef.current = new AudioContext()
    }

    const init = async () => {
      await loadSettings()
      await loadSchedules()
    }

    init()

    // Set up polling
    const intervalId = setInterval(checkSchedules, 30000) // Check every 30 seconds

    // Subscribe to changes
    const supabase = createClient()
    const channel = supabase
      .channel('medication-reminders-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medication_schedules' }, () => loadSchedules())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medications' }, () => loadSchedules())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_settings' }, () => loadSettings())
      .subscribe()

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(channel)
    }
  }, [])

  const loadSettings = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error("Error loading notification settings:", error)
    }
  }

  const loadSchedules = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch active medications and their schedules
      const { data, error } = await supabase
        .from('medication_schedules')
        .select(`
          *,
          medication:medications (
            id,
            name,
            start_date,
            end_date,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      if (data) {
        setSchedules(data)
      }
    } catch (error) {
      console.error("Error loading medication schedules for reminders:", error)
    }
  }

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

  const checkSchedules = () => {
    // Check if notifications are enabled in settings
    if (settings && (settings.enabled === false || settings.medication_reminders === false)) {
      return
    }

    const now = new Date()
    const currentMinute = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const currentDay = now.getDay() // 0-6
    
    // Avoid double checking in the same minute
    if (lastCheckedMinuteRef.current === currentMinute) return
    lastCheckedMinuteRef.current = currentMinute

    schedules.forEach(schedule => {
      const med = schedule.medication
      if (!med || !med.is_active) return

      // Check date range
      const startDate = new Date(med.start_date)
      // Reset time part of start date to 00:00 for correct comparison
      startDate.setHours(0,0,0,0)
      
      const endDate = med.end_date ? new Date(med.end_date) : null
      if (endDate) endDate.setHours(23,59,59,999)

      // Check if today is within range
      const today = new Date()
      today.setHours(0,0,0,0)

      if (today < startDate) return
      if (endDate && today > endDate) return

      // Check day of week
      if (schedule.days_of_week && !schedule.days_of_week.includes(currentDay)) return

      // Check time
      const scheduleTime = schedule.scheduled_time.substring(0, 5)
      
      if (scheduleTime === currentMinute) {
        triggerNotification(med.name, scheduleTime)
      }
    })
  }

  const triggerNotification = (medName: string, time: string) => {
    const title = "Hora do Medicamento!"
    const body = `Está na hora de tomar: ${medName} (${time})`

    // Play sound
    playAlarm()

    // Show visual toast
    toast(title, {
      description: body,
      action: {
        label: "Confirmar",
        onClick: () => console.log("Tomado"), // Future: Log to DB
      },
      duration: Infinity, 
    })

    // Show system notification
    if (Notification.permission === "granted") {
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
