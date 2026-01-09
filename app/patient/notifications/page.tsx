"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationsCenter } from "@/components/notifications-center"
import type { Notification } from "@/lib/notifications"

export default function NotificationsPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      setLoading(false)
    }
    getUser()
  }, [supabase.auth])

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
      )
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
  }

  const handleDeleteAll = async () => {
    const { error } = await supabase.from("notifications").delete().eq("user_id", userId)

    if (!error) {
      setNotifications([])
    }
  }

  return (
    <div className="p-4">
      <NotificationsCenter
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteAll={handleDeleteAll}
        loading={loading}
        onNotificationsChange={setNotifications}
        autoRefresh={true}
      />
    </div>
  )
}
