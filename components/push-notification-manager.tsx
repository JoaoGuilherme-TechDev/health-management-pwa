"use client"

import { useEffect } from "react"
import { registerServiceWorker, subscribeToPushNotifications } from "@/lib/push-notifications-client"
import { createClient } from "@/lib/supabase/client"

export function PushNotificationManager() {
  useEffect(() => {
    const setupPushNotifications = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.id) return

      try {
        await registerServiceWorker()
        await subscribeToPushNotifications(user.id)
      } catch (error) {
        console.error("[v0] Error setting up push notifications:", error)
      }
    }

    setupPushNotifications()
  }, [])

  return null
}
