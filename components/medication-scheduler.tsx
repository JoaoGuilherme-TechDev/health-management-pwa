"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { pushNotifications } from "@/lib/push-notifications"

export function MedicationScheduler() {
  const lastCheckedMinute = useRef<string | null>(null)
  const sentNotificationsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const checkSchedules = async () => {
      // Get current minute in Brasilia time
      const now = new Date()
      const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
      const currentHour = brazilTime.getHours().toString().padStart(2, "0")
      const currentMinute = brazilTime.getMinutes().toString().padStart(2, "0")
      const currentTimeString = `${currentHour}:${currentMinute}`

      if (lastCheckedMinute.current !== currentTimeString) {
        lastCheckedMinute.current = currentTimeString
        sentNotificationsRef.current.clear()
      }

      console.log(`Checking medication schedules for ${currentTimeString}...`)

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

      await Promise.allSettled(
        medications.map(async (med) => {
          const key = `${med.id}-${currentTimeString}`

          // Skip if we already sent notification for this medication this minute
          if (sentNotificationsRef.current.has(key)) {
            console.log(`Skipping duplicate for ${med.name} at ${currentTimeString}`)
            return
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
        }),
      )
    }

    // Run immediately on mount
    checkSchedules()

    // Run every 10 seconds to ensure we catch the minute change promptly
    const intervalId = setInterval(checkSchedules, 70000)

    return () => clearInterval(intervalId)
  }, [])

  return null // This component doesn't render anything
}
