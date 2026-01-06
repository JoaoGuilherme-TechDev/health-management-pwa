"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

export function NotificationPermissionManager() {
  const [open, setOpen] = useState(false)
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const searchParams = useSearchParams()

  const showAfterLogin = searchParams.get("showNotificationPrompt") === "true"

  const checkNotificationPermission = async () => {
    if (!("Notification" in window)) {
      return
    }

    const currentPermission = Notification.permission
    console.log("[v0] Notification permission:", currentPermission)

    // Check if service worker is active (required for push notifications)
    const hasServiceWorker = "serviceWorker" in navigator && navigator.serviceWorker.controller

    // Try to send a test notification to verify system permissions work
    if (currentPermission === "granted" && hasServiceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready
        // This will fail silently on most systems if OS-level notifications are disabled
        await registration.showNotification("Test", {
          tag: "permission-test",
          silent: true,
        })
        console.log("[v0] System notifications working")
        // Close the test notification immediately
        const notifications = await registration.getNotifications({
          tag: "permission-test",
        })
        notifications.forEach((n) => n.close())
      } catch (error) {
        console.log("[v0] System notifications appear to be disabled:", error)
        // System notifications are disabled, request permission again to trigger system popup
        setShowSystemPrompt(true)
        return
      }
    } else if (currentPermission === "default") {
      setOpen(true)
    } else if (currentPermission === "denied") {
      setOpen(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(
      () => {
        checkNotificationPermission()
      },
      showAfterLogin ? 500 : 2000,
    )

    return () => clearTimeout(timer)
  }, [showAfterLogin])

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission()
      console.log("[v0] Notification permission result:", permission)

      if (permission === "granted") {
        // Permission granted at API level, but check if system popup appears
        setShowSystemPrompt(true)
        toast.success("Notificações ativadas! Verifique se foi habilitado no seu sistema.")

        // Update database setting
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

        setTimeout(() => setShowSystemPrompt(false), 1000)
      } else if (permission === "denied") {
        toast.error(
          "Notificações foram bloqueadas. Você pode alterar isso nas configurações do seu dispositivo/navegador.",
        )
      }

      setOpen(false)
    } catch (error) {
      console.error("[v0] Error requesting notification permission:", error)
      setOpen(false)
    }
  }

  const handleDismiss = () => {
    setOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center">Ativar Notificações?</DialogTitle>
            <DialogDescription className="text-center">
              Para que o aplicativo funcione corretamente e lembre você de seus medicamentos e consultas, precisamos da
              sua permissão para enviar notificações.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto bg-transparent">
              Agora não
            </Button>
            <Button onClick={handleEnable} className="w-full sm:w-auto">
              Ativar Notificações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSystemPrompt} onOpenChange={setShowSystemPrompt}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <div className="mx-auto bg-yellow-100/50 p-4 rounded-full mb-4">
              <Bell className="h-8 w-8 text-yellow-600" />
            </div>
            <DialogTitle className="text-center">Habilitar Notificações do Sistema</DialogTitle>
            <DialogDescription className="text-center">
              Verifique se uma janela de permissão do sistema apareceu. Se não aparecer, você pode habilitar as
              notificações manualmente nas configurações do seu dispositivo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSystemPrompt(false)}
              className="w-full sm:w-auto bg-transparent"
            >
              OK
            </Button>
            <Button
              onClick={async () => {
                const permission = await Notification.requestPermission()
                if (permission === "granted") {
                  toast.success("Notificações do sistema habilitadas!")
                }
                setShowSystemPrompt(false)
              }}
              className="w-full sm:w-auto"
            >
              Tentar Novamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
