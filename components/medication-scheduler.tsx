"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { pushNotifications } from "@/lib/push-notifications"

export function MedicationScheduler() {
  const lastCheckedMinute = useRef<string | null>(null)

  useEffect(() => {
    const checkSchedules = async () => {
      // Get current minute in Brasilia time
      const now = new Date()
      const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
      const currentHour = brazilTime.getHours().toString().padStart(2, "0")
      const currentMinute = brazilTime.getMinutes().toString().padStart(2, "0")
      const currentTimeString = `${currentHour}:${currentMinute}`

      // Prevent checking multiple times in the same minute
      if (lastCheckedMinute.current === currentTimeString) {
        return
      }
      
      lastCheckedMinute.current = currentTimeString
      console.log(`Checking medication schedules for ${currentTimeString}...`)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
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

    }

    // Run immediately on mount
    checkSchedules()

    // Run every 10 seconds to ensure we catch the minute change promptly
    const intervalId = setInterval(checkSchedules, 10000)

    return () => clearInterval(intervalId)
  }, [])

  return null // This component doesn't render anything
}
