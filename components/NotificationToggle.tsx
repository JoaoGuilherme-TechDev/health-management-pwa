"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { usePushNotifications } from "@/hooks/usePushNotifications"

export function NotificationToggle() {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribeUser,
    unsubscribeUser,
    checkSubscription,
  } = usePushNotifications()

  const [status, setStatus] = useState<"loading" | "idle" | "error">("idle")

  useEffect(() => {
    if (isSupported) {
      checkSubscription()
    }
  }, [isSupported, checkSubscription])

  const handleToggle = async () => {
    setStatus("loading")
    try {
      if (isSubscribed) {
        await unsubscribeUser()
      } else {
        await subscribeUser()
      }
    } catch (error) {
      console.error("Erro ao alternar notificações:", error)
      setStatus("error")
    } finally {
      setStatus("idle")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  if (!isSupported) {
    return (
      <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted">
        <BellOff className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Notificações não suportadas</p>
          <p className="text-xs text-muted-foreground">
            Seu navegador não suporta notificações push
          </p>
        </div>
      </div>
    )
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center space-x-2 p-4 border rounded-lg bg-destructive/10">
        <BellOff className="h-5 w-5 text-destructive" />
        <div>
          <p className="text-sm font-medium">Permissão negada</p>
          <p className="text-xs text-muted-foreground">
            Ative as notificações nas configurações do seu navegador
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="notifications" className="text-base">
            Notificações Push
          </Label>
          <p className="text-sm text-muted-foreground">
            Receba notificações mesmo quando o aplicativo estiver fechado
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          <Switch
            id="notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
                disabled={loading || permission !== "granted"}
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Receba lembretes de consultas</p>
        <p>• Novas prescrições médicas</p>
        <p>• Atualizações de dieta e suplementos</p>
      </div>

      {status === "error" && (
        <div className="p-2 text-xs text-destructive bg-destructive/10 rounded">
          Erro ao configurar notificações. Tente novamente.
        </div>
      )}
    </div>
  )
}