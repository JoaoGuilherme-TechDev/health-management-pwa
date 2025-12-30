"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/lib/notifications.ts"

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabaseClient = createClient()

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      console.error("[useNotifications] Error fetching:", err)
      setError("Erro ao carregar notificações")
    } finally {
      setLoading(false)
    }
  }, [userId, supabaseClient])

  // Mark as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      const { error } = await supabaseClient
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (!error) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
      }
    },
    [supabaseClient],
  )

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      const { error } = await supabaseClient.from("notifications").delete().eq("id", notificationId)

      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      }

      return !error
    },
    [supabaseClient],
  )

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabaseClient
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n)),
            )
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== (payload.old as { id: string }).id))
          }
        },
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [userId, supabaseClient])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  }
}
