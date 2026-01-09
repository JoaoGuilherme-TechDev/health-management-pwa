"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { notificationService, type Notification } from "@/lib/notification-service"
import { pushService } from "@/lib/push-service"
import { Bell, X, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NotificationCenter() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch initial notifications
  useEffect(() => {
    if (!user?.id) return

    const loadNotifications = async () => {
      try {
        const data = await notificationService.getNotifications(user.id)
        setNotifications(data)
      } catch (error) {
        console.error("[v0] Failed to load notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [user?.id])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      // Show browser notification
      showBrowserNotification(notification)
    }

    notificationService.subscribeToNotifications(user.id, handleNewNotification)

    return () => {
      notificationService.unsubscribe()
    }
  }, [user?.id])

  // Setup push notifications
  useEffect(() => {
    pushService.subscribeToPushNotifications()
  }, [])

  const showBrowserNotification = useCallback((notification: Notification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      pushService.sendNotification(notification.title, {
        body: notification.message,
        tag: notification.type,
      })
    }
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("[v0] Failed to mark notification as read:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error("[v0] Failed to delete notification:", error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (!user) return null

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="border-b border-border p-4 flex items-center justify-between bg-muted/50">
            <h3 className="font-semibold text-foreground">Notificações</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-y-auto max-h-[calc(100%-3.5rem)]">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Carregando notificações...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">Nenhuma notificação</div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors flex gap-3",
                      !notification.read && "bg-primary/5",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
