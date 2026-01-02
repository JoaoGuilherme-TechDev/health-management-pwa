"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Bell,
  Pill,
  Calendar,
  FileText,
  Dumbbell,
  Activity,
  Check,
  Trash2,
  Filter,
  Clock,
  ChefHat,
  CheckCircle,
  Trash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { formatBrasiliaDate } from "@/lib/timezone"
import type { Notification, NotificationType } from "@/lib/notifications"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface NotificationsCenterProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDeleteAll?: () => void
  loading?: boolean
  onNotificationsChange?: (notifications: Notification[]) => void
  autoRefresh?: boolean
}

const notificationConfig: Record<
  NotificationType,
  { icon: typeof Pill; color: string; bgColor: string; label: string }
> = {
  medication_created: {
    icon: Pill,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Medicamento",
  },
  appointment_created: {
    icon: Calendar,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Consulta",
  },
  appointment_reminder: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "Lembrete",
  },
  diet_recipe_created: {
    icon: ChefHat,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Receita de Dieta",
  },
  prescription_created: {
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Receita",
  },
  supplement_created: {
    icon: Dumbbell,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    label: "Suplemento",
  },
  evolution_created: {
    icon: Activity,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    label: "Evolução",
  },
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const config = notificationConfig[notification.notification_type] || {
    icon: Bell,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Notificação",
  }

  const Icon = config.icon
  const createdAt = `${formatBrasiliaDate(notification.created_at, "date")} às ${formatBrasiliaDate(notification.created_at, "time")}`

  return (
    <div
      className={`flex items-start gap-3 p-4 border-b last:border-b-0 transition-colors ${
        notification.is_read ? "bg-background" : "bg-muted/50"
      }`}
    >
      {/* Icon */}
      <div className={`p-2 rounded-full ${config.bgColor}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{notification.title}</h4>
          {!notification.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{createdAt}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {!notification.is_read && onMarkAsRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMarkAsRead(notification.id)}
            title="Marcar como lida"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(notification.id)}
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function NotificationsCenter({
  notifications,
  onMarkAsRead,
  onDelete,
  onMarkAllAsRead,
  onDeleteAll,
  loading,
  onNotificationsChange,
  autoRefresh = true,
}: NotificationsCenterProps) {
  const [filter, setFilter] = useState<NotificationType | "all">("all")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [internalLoading, setInternalLoading] = useState(false)

  const supabase = createClient()
const fetchNotifications = useCallback(async () => {
  if (!autoRefresh) return

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setInternalLoading(true)

    // Fetch notifications for the current user
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching notifications:", error)
      return
    }

    if (data) {
      // Transform the data to match your Notification type
      const transformedNotifications = data.map(notification => {
        // Handle missing columns by checking if they exist
        const hasReadAt = notification.hasOwnProperty('read_at')
        const hasActionUrl = notification.hasOwnProperty('action_url')
        
        return {
          id: notification.id,
          title: notification.title,
          message: notification.message || notification.body || "",
          notification_type: (notification.notification_type || notification.type || "general") as NotificationType,
          user_id: notification.user_id,
          data: notification.data || {},
          is_read: notification.is_read || false,
          created_at: notification.created_at,
          updated_at: notification.updated_at || notification.created_at,
          // Only include if column exists in database
          ...(hasReadAt && { read_at: notification.read_at }),
          ...(hasActionUrl && { action_url: notification.action_url })
        } as Notification
      })
      
      onNotificationsChange?.(transformedNotifications)
    }
  } catch (error) {
    console.error("[v0] Error in fetchNotifications:", error)
  } finally {
    setInternalLoading(false)
  }
}, [supabase, onNotificationsChange, autoRefresh])

  useEffect(() => {
    if (!autoRefresh) return

    let isMounted = true
    const channels: any[] = []

    const setupSubscription = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        const subscription = supabase
          .channel(`notifications-user-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("[v0] Notification change detected:", payload.eventType)
              if (isMounted) {
                fetchNotifications()
              }
            },
          )
          .subscribe((status) => {
            console.log("[v0] Notifications subscription status:", status)
          })

        channels.push(subscription)
      } catch (error) {
        console.error("[v0] Error setting up subscription:", error)
      }
    }

    setupSubscription()

    return () => {
      isMounted = false
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [supabase, autoRefresh, fetchNotifications])

  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter((n) => n.notification_type === filter)

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const unreadFilteredCount = filteredNotifications.filter((n) => !n.is_read).length
  const hasUnread = unreadCount > 0
  const hasFilteredUnread = unreadFilteredCount > 0
  const hasNotifications = notifications.length > 0
  const hasFilteredNotifications = filteredNotifications.length > 0

  const handleReadAll = useCallback(async () => {
    if (filteredNotifications.length === 0 || isProcessing) return

    setIsProcessing(true)

    try {
      const unreadFilteredIds = filteredNotifications.filter((n) => !n.is_read).map((n) => n.id)

      if (unreadFilteredIds.length === 0) {
        toast.info("Todas as notificações visíveis já foram lidas")
        return
      }

      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadFilteredIds)

      if (error) {
        toast.error("Erro ao marcar notificações como lidas")
        throw error
      }

      const updatedNotifications = notifications.map((n) =>
        unreadFilteredIds.includes(n.id) ? { ...n, is_read: true } : n,
      )

      onNotificationsChange?.(updatedNotifications)
      onMarkAllAsRead?.()
      toast.success(`${unreadFilteredIds.length} notificação(ões) marcada(s) como lida(s)`)
    } catch (error) {
      console.error("[v0] Error marking all as read:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [filteredNotifications, notifications, supabase, isProcessing, onNotificationsChange, onMarkAllAsRead])

  const handleDeleteAll = useCallback(async () => {
    if (filteredNotifications.length === 0 || isProcessing) return

    const filterText = filter === "all" ? "" : notificationConfig[filter]?.label || ""
    const message =
      filter === "all"
        ? `Tem certeza que deseja excluir todas as ${filteredNotifications.length} notificações?`
        : `Tem certeza que deseja excluir todas as ${filteredNotifications.length} notificações do tipo "${filterText}"?`

    const confirmDelete = window.confirm(message)

    if (!confirmDelete) return

    setIsProcessing(true)

    try {
      const filteredIds = filteredNotifications.map((n) => n.id)

      const { error } = await supabase.from("notifications").delete().in("id", filteredIds)

      if (error) {
        toast.error("Erro ao excluir notificações")
        throw error
      }

      await fetchNotifications()
      onDeleteAll?.()
      toast.success(`${filteredIds.length} notificação(ões) excluída(s)`)
    } catch (error) {
      console.error("[v0] Error deleting all notifications:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [filteredNotifications, filter, supabase, isProcessing, fetchNotifications, onDeleteAll])

  const isAnyLoading = loading || internalLoading

  if (isAnyLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold">Notificações</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
                </Badge>
              )}
              {autoRefresh && (
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Atualizando em tempo real" />
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="md:hidden bg-transparent"
              onClick={() => setFiltersOpen(!filtersOpen)}
              disabled={isProcessing}
            >
              <Filter className="h-4 w-4 mr-2" />
              {filtersOpen ? "Ocultar" : "Filtrar"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReadAll}
                disabled={!hasFilteredUnread || isProcessing}
                className="flex-1 sm:flex-none gap-2 bg-transparent"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Ler todas visíveis</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAll}
                disabled={!hasFilteredNotifications || isProcessing}
                className="flex-1 sm:flex-none gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
                <span>Excluir todas visíveis</span>
              </Button>
            </div>

            <div className="hidden md:flex flex-wrap gap-2 ml-auto">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                disabled={isProcessing}
              >
                Todas
              </Button>
              {Object.entries(notificationConfig).map(([type, config]) => (
                <Button
                  key={type}
                  variant={filter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(type as NotificationType)}
                  className="gap-1"
                  disabled={isProcessing}
                >
                  <config.icon className="h-3 w-3" />
                  {config.label}
                </Button>
              ))}
            </div>
          </div>

          <Collapsible open={filtersOpen} className="md:hidden">
            <CollapsibleContent className="mt-2">
              <div className="flex flex-col gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="w-full justify-start"
                  disabled={isProcessing}
                >
                  Todas
                </Button>
                {Object.entries(notificationConfig).map(([type, config]) => (
                  <Button
                    key={type}
                    variant={filter === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(type as NotificationType)}
                    className="w-full justify-start gap-2"
                    disabled={isProcessing}
                  >
                    <config.icon className="h-3 w-3" />
                    {config.label}
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {filter !== "all" && (
            <div className="text-sm text-muted-foreground">
              <p>
                Filtrado por: <span className="font-medium">{notificationConfig[filter]?.label}</span>
              </p>
              <p>
                Mostrando {filteredNotifications.length} de {notifications.length} notificações
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-100 md:h-125">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">Nenhuma notificação encontrada</p>
            {filter !== "all" && (
              <Button variant="link" size="sm" onClick={() => setFilter("all")} className="mt-2">
                Ver todas as notificações
              </Button>
            )}
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        )}
      </ScrollArea>
    </div>
  )
}
