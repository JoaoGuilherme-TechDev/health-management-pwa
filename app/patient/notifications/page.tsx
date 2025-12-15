"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Trash2, CheckCircle } from "lucide-react"
import { formatBrasiliaDate } from "@/lib/timezone"

interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
}

const translateNotificationType = (type: string): string => {
  const translations: Record<string, string> = {
    lembrete_medicamento: "lembrete de medicamento",
    lembrete_consulta: "lembrete de consulta",
    medication_reminder: "lembrete de medicamento",
    appointment_reminder: "lembrete de consulta",
    medication_added: "medicamento adicionado",
    health_alert: "alerta de saúde",
    appointment_scheduled: "consulta agendada",
    diet_updated: "dieta atualizada",
    supplement_added: "suplemento adicionado",
  }
  return translations[type] || type
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

    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const channel = supabase
          .channel(`notifications-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              console.log("[v0] Notificação atualizada, recarregando...")
              loadNotifications()
            },
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    })
  }, [])

  const handleMarkAsRead = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("[v0] Erro ao marcar como lida:", error)
    }
    loadNotifications()
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Falha ao deletar notificação")
      }

      console.log("[v0] Notificação deletada com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao deletar notificação:", error)
      alert("Erro ao deletar notificação. Tente novamente.")
    }
    loadNotifications()
  }

  const handleMarkAllAsRead = async () => {
    const supabase = createClient()
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)

    if (unreadIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds)
      loadNotifications()
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{notif.title}</h3>
                      {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                          notif.notification_type === "lembrete_medicamento" ||
                          notif.notification_type === "medication_reminder" ||
                          notif.notification_type === "medication_added"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : notif.notification_type === "lembrete_consulta" ||
                                notif.notification_type === "appointment_reminder" ||
                                notif.notification_type === "appointment_scheduled"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : notif.notification_type === "health_alert"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {translateNotificationType(notif.notification_type)}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatBrasiliaDate(notif.created_at, "date")} às {formatBrasiliaDate(notif.created_at, "time")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Marcar como lida"
                        className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(notif.id)}
                      title="Excluir notificação"
                      className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
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
