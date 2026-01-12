"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { notificationService, type Notification } from "@/lib/notification-service"
import { pushService } from "@/lib/push-service"
import { Bell, X, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NotificationCenter() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewport, setViewport] = useState<{ w: number; h: number; dpr: number }>({
    w: typeof window !== "undefined" ? window.innerWidth : 1024,
    h: typeof window !== "undefined" ? window.innerHeight : 768,
    dpr: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  })
  const isMobile = viewport.w <= 480

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

  useEffect(() => {
    if (!user?.id) return

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
      showBrowserNotification(notification)
    }

    notificationService.subscribeToNotifications(user.id, handleNewNotification)

    return () => {
      notificationService.unsubscribe()
    }
  }, [user?.id])

  useEffect(() => {
    pushService.subscribeToPushNotifications()
  }, [])

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      })
    }
    updateViewport()
    window.addEventListener("resize", updateViewport, { passive: true })
    window.addEventListener("orientationchange", updateViewport, { passive: true })
    return () => {
      window.removeEventListener("resize", updateViewport)
      window.removeEventListener("orientationchange", updateViewport)
    }
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

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error("[v0] Failed to mark all notifications as read:", error)
    }
  }

  const handleDeleteAllNotifications = async (userId: string) => {
    try {
      await notificationService.deleteAllNotifications(userId)
      setNotifications([])
    } catch (error) {
      console.error("[v0] Failed to delete all notifications:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.action_url) {
      handleMarkAsRead(notification.id)
      router.push(notification.action_url)
      setIsOpen(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (!user) return null

  const panelWidth = Math.min(384, Math.max(280, Math.floor(viewport.w * 0.95)))
  const panelMaxHeight = Math.min(640, Math.floor(viewport.h * (isMobile ? 0.7 : 0.6)))
  const panelClasses = cn(
    isMobile ? "fixed right-2 top-[env(safe-area-inset-top)]" : "absolute right-0 top-full mt-2",
    "bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50",
  )

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-3 w-3 bg-yellow-400 rounded-full animate-pulse shadow-md shadow-yellow-400" />
        )}
      </Button>

      {isOpen && (
        <div
          className={panelClasses}
          style={{
            width: panelWidth,
            maxHeight: panelMaxHeight,
          }}
        >
          <div className="border-b border-border p-4 block bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <div className="flex items-center gap-2 justify-between mb-3">
              <h3 className="font-semibold text-foreground">✨ Notificações</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button className="w-auto" onClick={handleMarkAllAsRead} variant={"outline"}>
                Marcar como Lidas
              </Button>
              <Button className="w-auto" onClick={() => handleDeleteAllNotifications(user.id)} variant={"destructive"}>
                Deletar Todas
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: panelMaxHeight - 56 }}>
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Carregando notificações...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">Nenhuma notificação</div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all flex gap-3 cursor-pointer group",
                      !notification.read && "bg-blue-50 dark:bg-blue-950/20",
                      notification.action_url && "cursor-pointer",
                    )}
                  >
                    <div className="text-3xl shrink-0 pt-0.5 group-hover:scale-110 transition-transform">
                      {notification.title.match(/[\p{Emoji}]/u)?.[0] || "📬"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground">
                        {notification.title.replace(/[\p{Emoji}]/gu, "").trim()}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification.id)
                        }}
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
