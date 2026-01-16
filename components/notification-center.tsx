"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { notificationService, type Notification } from "@/lib/notification-service"
import { pushService } from "@/lib/push-service"
import { Bell, X, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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

    const interval = setInterval(async () => {
      try {
        const data = await notificationService.getNotifications(user.id)
        setNotifications((prev) => {
          const map = new Map<string, Notification>()
          for (const n of prev) {
            map.set(n.id, n)
          }
          for (const n of data) {
            map.set(n.id, n)
          }
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )
        })
      } catch (error) {
        console.error("[v0] Failed to refresh notifications:", error)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    console.log("[v0] Setting up real-time notification listener for user:", user.id)

    const handleNewNotification = (notification: Notification) => {
      console.log("[v0] New notification in UI:", notification)
      setNotifications((prev) => {
        // Avoid duplicate notifications
        if (prev.some((n) => n.id === notification.id)) {
          return prev
        }
        return [notification, ...prev]
      })
      showBrowserNotification(notification)
    }

    notificationService.subscribeToNotifications(user.id, handleNewNotification)

    return () => {
      notificationService.unsubscribe()
    }
  }, [user?.id]) // Removed showBrowserNotification from deps to avoid loop, though it is stable via useCallback if deps are correct.

  useEffect(() => {
    if (!user?.id) return

    pushService.subscribeToPushNotifications(user.id).catch((error) => {
      console.warn("[v0] Push notifications not available:", error)
    })
  }, [user?.id])

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

  const getNotificationEmoji = (notification: Notification) => {
    if (notification.type === "medication") return "💊"
    if (notification.type === "appointment") return "📅"
    if (notification.type === "prescription") return "📋"
    if (notification.type === "diet") return "🥗"
    if (notification.type === "supplement") return "💪"
    if (notification.type === "evolution") return "📊"
    return "🔔"
  }

  const getNotificationTypeLabel = (notification: Notification) => {
    if (notification.type === "medication") return "Remédio"
    if (notification.type === "appointment") return "Consulta"
    if (notification.type === "prescription") return "Receita"
    if (notification.type === "diet") return "Dieta"
    if (notification.type === "supplement") return "Suplemento"
    if (notification.type === "evolution") return "Evolução"
    return "Atualização"
  }

  const getNotificationTypePillClass = (notification: Notification) => {
    if (notification.type === "medication") return "bg-sky-500/10 text-sky-700 dark:text-sky-200"
    if (notification.type === "appointment") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
    if (notification.type === "prescription") return "bg-violet-500/10 text-violet-700 dark:text-violet-200"
    if (notification.type === "diet") return "bg-lime-500/10 text-lime-700 dark:text-lime-200"
    if (notification.type === "supplement") return "bg-amber-500/10 text-amber-700 dark:text-amber-200"
    if (notification.type === "evolution") return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-200"
    return "bg-slate-500/10 text-slate-700 dark:text-slate-200"
  }

  const showBrowserNotification = useCallback((notification: Notification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      pushService.sendNotification(notification.title, {
        body: notification.message,
        tag: notification.type,
      })
      pushService.playNotificationSound()
      pushService.vibrateDevice()
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          pushService.sendNotification(notification.title, {
            body: notification.message,
            tag: notification.type,
          })
          pushService.playNotificationSound()
          pushService.vibrateDevice()
        }
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

  const handleDismiss = async (id: string) => {
    // Dismiss effectively deletes or marks as read/handled
    handleDelete(id)
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
    isMobile ? "fixed right-2 top-full" : "absolute right-0 top-full mt-2",
    "bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50",
  )

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative rounded-full hover:bg-muted/50 transition-colors">
        <Bell className={cn("h-5 w-5", unreadCount > 0 && "text-primary animate-tada")} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
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
          <div className="border-b border-border p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                ✨ Notificações
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                size="sm" 
                onClick={handleMarkAllAsRead} 
                variant="outline"
                className="text-xs h-7 rounded-full"
              >
                Lidas
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleDeleteAllNotifications(user.id)} 
                variant="destructive"
                className="text-xs h-7 rounded-full"
              >
                Limpar
              </Button>
            </div>
          </div>

          <ScrollArea 
            className="w-full" 
            style={{ height: Math.min(400, panelMaxHeight - 130) }}
          >
            {loading ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <p className="text-sm">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Bell className="h-8 w-8 opacity-20" />
                <p className="text-sm">Nenhuma notificação por enquanto!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-2 sm:p-2.5 transition-all flex flex-col gap-1 cursor-pointer group relative overflow-hidden rounded-lg border shadow-sm bg-background/95 dark:bg-slate-950/80 backdrop-blur",
                      !notification.read
                        ? "border-primary/40 hover:border-primary/60 hover:shadow-md"
                        : "border-border/70 hover:bg-muted/60",
                    )}
                  >
                    {!notification.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/80" />
                    )}

                    <div className="flex-1 w-full pl-2 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm">
                            <span aria-hidden="true">{getNotificationEmoji(notification)}</span>
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4
                                className={cn(
                                  "font-semibold text-[13px] sm:text-sm break-words min-w-0",
                                  !notification.read ? "text-primary" : "text-foreground",
                                )}
                              >
                                {notification.title.replace(/[\p{Emoji}\uFE0F]/gu, "").trim()}
                              </h4>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                  "bg-background/80 shadow-sm border border-border/60 dark:border-slate-800",
                                  getNotificationTypePillClass(notification),
                                )}
                              >
                                {getNotificationTypeLabel(notification)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-[13px] text-muted-foreground mt-0.5 break-words whitespace-normal leading-snug">
                        {notification.message}
                      </p>
                    </div>

                    <div className="flex gap-1 justify-end items-center mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                          className="h-5 w-5 text-primary hover:text-primary hover:bg-primary/10 rounded-full"
                          title="Marcar como lida"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDismiss(notification.id)
                        }}
                        className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
