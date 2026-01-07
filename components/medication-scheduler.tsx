"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { pushNotifications } from "@/lib/push-notifications"

export function MedicationScheduler() {
  const lastCheckedMinute = useRef<string | null>(null)
  const sentNotificationsRef = useRef<Set<string>>(new Set())
  const isProcessingRef = useRef<boolean>(false) // Lock to prevent concurrent processing

  useEffect(() => {
    const checkSchedules = async () => {
      // Prevent concurrent execution
      if (isProcessingRef.current) {
        console.log("Already processing, skipping...")
        return
      }

      // Get current minute in Brasilia time
      const now = new Date()
      const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
      const currentHour = brazilTime.getHours().toString().padStart(2, "0")
      const currentMinute = brazilTime.getMinutes().toString().padStart(2, "0")
      const currentTimeString = `${currentHour}:${currentMinute}`

      // Only clear on actual minute change
      if (lastCheckedMinute.current !== currentTimeString) {
        console.log(`Minute changed: ${lastCheckedMinute.current} -> ${currentTimeString}`)
        lastCheckedMinute.current = currentTimeString
        // Do NOT clear here - wait until all processing is done
      }

      console.log(`Checking medication schedules for ${currentTimeString}...`)
      isProcessingRef.current = true

      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Fetch all active medications for the user
        const { data: medications, error } = await supabase
          .from("medications")
          .select("id, name")
          .eq("user_id", user.id)
          .eq("is_active", true)

        if (error || !medications) {
          console.error("Error fetching medications for scheduler:", error)
          return
        }

        // Process sequentially to prevent race conditions
        for (const med of medications) {
          const key = `${med.id}-${currentTimeString}`

          // Skip if we already sent notification for this medication this minute
          if (sentNotificationsRef.current.has(key)) {
            console.log(`Skipping duplicate for ${med.name} at ${currentTimeString}`)
            continue
          }

          // Send notification and mark as sent
          try {
            const result = await pushNotifications.sendNewMedicationSchedule(user.id, med.name, med.id)
            if (result.storedInDB) {
              sentNotificationsRef.current.add(key)
              console.log(`Marked as sent: ${key}`)
            }
          } catch (error) {
            console.error(`Error sending notification for ${med.name}:`, error)
          }
        }
      } finally {
        // Clear old notifications only for PREVIOUS minutes
        const currentMinuteOnly = currentTimeString
        const keysToDelete: string[] = []
        
        sentNotificationsRef.current.forEach(key => {
          const [, timePart] = key.split('-')
          if (timePart && timePart !== currentMinuteOnly) {
            keysToDelete.push(key)
          }
        })
        
        keysToDelete.forEach(key => {
          sentNotificationsRef.current.delete(key)
        })
        
        isProcessingRef.current = false
      }
    }

    // Run immediately on mount
    checkSchedules()

    // CORRECTED: Run every 60 seconds to check once per minute
    const intervalId = setInterval(checkSchedules, 60000)

    return () => clearInterval(intervalId)
  }, [])

  return null
}