"use client"

import { useState } from "react"
import {
  Bell,
  Pill,
  Calendar,
  Utensils,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { formatBrasiliaDate } from "@/lib/timezone"
import type { Notification, NotificationType } from "@/lib/notifications.ts"

interface NotificationsCenterProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDeleteAll?: () => void
  loading?: boolean
}

// Updated icon and color mapping for each notification type
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
  loading 
}: NotificationsCenterProps) {
  const [filter, setFilter] = useState<NotificationType | "all">("all")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter((n) => n.notification_type === filter)

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const hasUnread = unreadCount > 0
  const hasNotifications = notifications.length > 0

  if (loading) {
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
        {/* Top Section: Title, Unread Badge, and Bulk Actions */}
        <div className="flex flex-col gap-4">
          {/* First Row: Title and Filter Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h3 className="font-semibold">Notificações</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {filtersOpen ? "Ocultar" : "Filtrar"}
            </Button>
          </div>

          {/* Second Row: Bulk Actions - Mobile & Desktop */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              {onMarkAllAsRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  disabled={!hasUnread}
                  className="flex-1 sm:flex-none gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Ler todas</span>
                </Button>
              )}
              {onDeleteAll && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeleteAll}
                  disabled={!hasNotifications}
                  className="flex-1 sm:flex-none gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4" />
                  <span>Excluir todas</span>
                </Button>
              )}
            </div>
            
            {/* Desktop Filters - Visible on medium screens and up */}
            <div className="hidden md:flex flex-wrap gap-2 ml-auto">
              <Button 
                variant={filter === "all" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilter("all")}
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
                >
                  <config.icon className="h-3 w-3" />
                  {config.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Mobile Filters - Collapsible */}
          <Collapsible open={filtersOpen} className="md:hidden">
            <CollapsibleContent className="mt-2">
              <div className="flex flex-col gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="w-full justify-start"
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
                  >
                    <config.icon className="h-3 w-3" />
                    {config.label}
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[400px] md:h-[500px]">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">Nenhuma notificação encontrada</p>
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