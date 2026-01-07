"use client"

import { useState, useCallback } from "react"
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
  medication_reminder: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "Lembrete de Medicamento",
  },
  appointment_scheduled: {
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
  diet_created: {
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
          <h4 className="font-medium text-sm truncate flex-1">{notification.title}</h4>
          {!notification.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 break-words">{notification.message}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{createdAt}</span>
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

  const supabase = createClient()

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
      // If showing all and we have a handler for marking all as read (server-side), use it
      if (filter === "all" && onMarkAllAsRead) {
        await onMarkAllAsRead()
        toast.success("Todas as notificações foram marcadas como lidas")
        
        // Optimistic update
        if (onNotificationsChange) {
           onNotificationsChange(notifications.map(n => ({ ...n, is_read: true })))
        }
        
        setIsProcessing(false)
        return
      }

      const unreadFilteredIds = filteredNotifications.filter((n) => !n.is_read).map((n) => n.id)

      if (unreadFilteredIds.length === 0) {
        toast.info("Todas as notificações visíveis já foram lidas")
        setIsProcessing(false)
        return
      }

      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadFilteredIds)

      if (error) {
        toast.error("Erro ao marcar notificações como lidas")
        throw error
      }

      // Optimistic update if onNotificationsChange is provided
      if (onNotificationsChange) {
        const updatedNotifications = notifications.map((n) =>
          unreadFilteredIds.includes(n.id) ? { ...n, is_read: true } : n,
        )
        onNotificationsChange(updatedNotifications)
      }
      
      toast.success(`${unreadFilteredIds.length} notificação(ões) marcada(s) como lida(s)`)
    } catch (error) {
      console.error("[v0] Error marking all as read:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [filteredNotifications, notifications, supabase, isProcessing, onNotificationsChange, onMarkAllAsRead, filter])

  const handleDeleteAll = useCallback(async () => {
    if (filteredNotifications.length === 0 || isProcessing) return

    const filterText = filter === "all" ? "" : notificationConfig[filter]?.label || ""
    
    // If we are in "all" mode and have the onDeleteAll handler, we might be deleting more than visible
    // So we should adjust the message
    let message = ""
    if (filter === "all" && onDeleteAll) {
       message = "Tem certeza que deseja excluir TODAS as suas notificações? Esta ação não pode ser desfeita."
    } else {
       message = filter === "all"
        ? `Tem certeza que deseja excluir todas as ${filteredNotifications.length} notificações visíveis?`
        : `Tem certeza que deseja excluir todas as ${filteredNotifications.length} notificações do tipo "${filterText}"?`
    }

    const confirmDelete = window.confirm(message)

    if (!confirmDelete) return

    setIsProcessing(true)

    try {
      // Use parent handler if available and we are deleting everything
      if (filter === "all" && onDeleteAll) {
        await onDeleteAll()
        toast.success("Todas as notificações foram excluídas")
        
        // Optimistic update - clear all
        if (onNotificationsChange) {
          onNotificationsChange([])
        }
        
        setIsProcessing(false)
        return
      }

      const filteredIds = filteredNotifications.map((n) => n.id)

      const { error } = await supabase.from("notifications").delete().in("id", filteredIds)

      if (error) {
        toast.error("Erro ao excluir notificações")
        throw error
      }

      // Optimistic update
      if (onNotificationsChange) {
         const updatedNotifications = notifications.filter(n => !filteredIds.includes(n.id))
         onNotificationsChange(updatedNotifications)
      }

      toast.success(`${filteredIds.length} notificação(ões) excluída(s)`)
    } catch (error) {
      console.error("[v0] Error deleting all notifications:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [filteredNotifications, filter, supabase, isProcessing, onDeleteAll, onNotificationsChange, notifications])

  const isAnyLoading = loading

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
