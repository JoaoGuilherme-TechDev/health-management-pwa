// hooks/use-notifications.ts
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/lib/notifications"

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    
    // Initial load
    loadNotifications()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Notification change detected:", payload)
          loadNotifications()
        }
      )
      .subscribe()

    async function loadNotifications() {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50)

        if (fetchError) {
          setError(fetchError.message)
          console.error("Error loading notifications:", fetchError)
        } else {
          setNotifications(data || [])
          setError(null)
        }
      } catch (err) {
        setError("Erro ao carregar notificações")
        console.error("Error in loadNotifications:", err)
      } finally {
        setLoading(false)
      }
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq("id", notificationId)

    if (error) {
      console.error("Error marking notification as read:", error)
      return false
    }

    // Update local state
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, is_read: true, read_at: new Date().toISOString() }
          : notification
      )
    )
    return true
  }

  const deleteNotification = async (notificationId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)

    if (error) {
      console.error("Error deleting notification:", error)
      return false
    }

    // Update local state
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
    return true
  }

  const markAllAsRead = async () => {
    if (!userId) return false

    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking all as read:", error)
      return false
    }

    // Update local state
    setNotifications(prev =>
      prev.map(notification => ({
        ...notification,
        is_read: true,
        read_at: notification.read_at || new Date().toISOString()
      }))
    )
    return true
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return {
    notifications,
    loading,
    error,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    unreadCount,
    refresh: async () => {
      if (!userId) return
      
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
        
      if (!error && data) {
        setNotifications(data)
      }
      setLoading(false)
    }
  }
}