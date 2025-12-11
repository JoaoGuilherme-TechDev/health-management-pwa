"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Trash2, CheckCircle } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setNotifications(data)
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id)
    await loadNotifications()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("notifications").delete().eq("id", id)
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const handleMarkAllAsRead = async () => {
    const supabase = createClient()
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)

    if (unreadIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds)

      await loadNotifications()
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando notificações...</div>
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground mt-1">Fique informado sobre sua saúde</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Sem notificações</h3>
            <p className="text-muted-foreground">
              Você está em dia! Verá lembretes de medicamentos, alertas de consultas e atualizações de saúde aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card key={notif.id} className={`transition-colors ${notif.is_read ? "opacity-60" : "border-primary"}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{notif.title}</h3>
                      {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          notif.notification_type === "medication_reminder"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : notif.notification_type === "appointment_reminder"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : notif.notification_type === "health_alert"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {notif.notification_type.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notif.created_at).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(notif.created_at).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Marcar como lida"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notif.id)}
                      title="Excluir notificação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
