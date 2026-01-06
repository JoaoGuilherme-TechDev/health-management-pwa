"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

export function NotificationPermissionManager() {
  const [checkComplete, setCheckComplete] = useState(false)
  const searchParams = useSearchParams()

  const showAfterLogin = searchParams.get("showNotificationPrompt") === "true"

  useEffect(() => {
    const checkAndRequestPermission = async () => {
      if (!("Notification" in window)) {
        console.log("[v0] Notifications not supported in this browser")
        setCheckComplete(true)
        return
      }

      try {
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready
            console.log("[v0] Service worker is ready")
          } catch (swError) {
            console.log("[v0] Service worker not ready, proceeding anyway:", swError)
          }
        }

        const currentPermission = Notification.permission
        console.log("[v0] Current notification permission:", currentPermission)

        if (currentPermission === "default") {
          console.log("[v0] Requesting notification permission from OS...")
          const permission = await Notification.requestPermission()
          console.log("[v0] Notification permission result:", permission)

          if (permission === "granted") {
            const supabase = createClient()
            const {
              data: { user },
            } = await supabase.auth.getUser()

            if (user) {
              await supabase.from("notification_settings").upsert({
                user_id: user.id,
                enabled: true,
                medication_reminders: true,
                appointment_reminders: true,
                updated_at: new Date().toISOString(),
              })
            }

            toast.success("Notificações ativadas!")
          } else if (permission === "denied") {
            toast.error("Notificações bloqueadas. Você pode alterar nas configurações do seu dispositivo.")
          }
        } else if (currentPermission === "granted") {
          console.log("[v0] Notifications already granted")
        } else if (currentPermission === "denied") {
          console.log("[v0] Notifications denied - user must change in device settings")
        }

        setCheckComplete(true)
      } catch (error) {
        console.error("[v0] Error checking/requesting notification permission:", error)
        setCheckComplete(true)
      }
    }

    const timer = setTimeout(checkAndRequestPermission, showAfterLogin ? 500 : 3000)

    return () => clearTimeout(timer)
  }, [showAfterLogin])

  return null
}
