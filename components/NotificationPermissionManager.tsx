"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotificationPermissionManager() {
  const [showModal, setShowModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const searchParams = useSearchParams()
  const showAfterLogin = searchParams.get("showNotificationPrompt") === "true"

  useEffect(() => {
    const checkPermission = async () => {
      // Only show for patients after login
      if (!showAfterLogin) return

      if (!("Notification" in window)) {
        console.log("[v0] Notifications not supported in this browser")
        return
      }

      const currentPermission = Notification.permission
      console.log("[v0] Current notification permission:", currentPermission)

      // Only show modal if permission is "default" (not yet decided)
      if (currentPermission === "default") {
        // Small delay for better UX
        setTimeout(() => {
          setShowModal(true)
        }, 500)
      }
    }

    checkPermission()
  }, [showAfterLogin])

  const handleAllow = async () => {
    setIsProcessing(true)

    try {
      if (!("Notification" in window)) {
        setShowModal(false)
        setIsProcessing(false)
        return
      }

      const permission = await Notification.requestPermission()
      console.log("[v0] Notification permission result:", permission)

      if (permission === "granted") {
        // Save preference to database
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
          console.log("[v0] Notification settings saved")
        }
      }

      setShowModal(false)
    } catch (error) {
      console.error("[v0] Error requesting notification permission:", error)
      setShowModal(false)
    }

    setIsProcessing(false)
  }

  const handleDontAllow = () => {
    setShowModal(false)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("notification_settings").upsert({
          user_id: user.id,
          enabled: false,
          updated_at: new Date().toISOString(),
        })
      }
    })
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 flex flex-col items-center text-center">
        {/* Bell Icon */}
        <div className="mb-6 flex items-center justify-center">
          <div className="bg-blue-100 rounded-full p-4">
            <Bell className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Allow <span className="font-bold">HealthCare+</span>
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-8">to send you notifications?</p>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <Button
            onClick={handleAllow}
            disabled={isProcessing}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2"
            size="lg"
          >
            {isProcessing ? "Processando..." : "Allow"}
          </Button>
          <Button
            onClick={handleDontAllow}
            disabled={isProcessing}
            variant="outline"
            className="w-full text-gray-600 font-medium py-2 border-gray-300 hover:bg-gray-50 bg-transparent"
            size="lg"
          >
            Don't allow
          </Button>
        </div>
      </div>
    </div>
  )
}
