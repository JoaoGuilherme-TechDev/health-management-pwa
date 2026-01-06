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
  const searchParams = useSearchParams()

  const showAfterLogin = searchParams.get("showNotificationPrompt") === "true"

  useEffect(() => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      return
    }

    if (Notification.permission === "default") {
      // Delay slightly to not overwhelm user immediately
      const timer = setTimeout(
        () => {
          setOpen(true)
        },
        showAfterLogin ? 500 : 2000,
      )

      return () => clearTimeout(timer)
    }
  }, [showAfterLogin])

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission()

      if (permission === "granted") {
        toast.success("Notificações ativadas com sucesso!")

        // Update database setting
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await supabase.from("notification_settings").upsert({
            user_id: user.id,
            enabled: true,
            medication_reminders: true, // Default to true
            appointment_reminders: true, // Default to true
            updated_at: new Date().toISOString(),
          })
        }
      } else if (permission === "denied") {
        toast.info("Notificações foram bloqueadas. Você pode alterar isso nas configurações do navegador.")
      }

      setOpen(false)
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      setOpen(false)
    }
  }

  const handleDismiss = () => {
    setOpen(false)
  }

  return (
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
  )
}
