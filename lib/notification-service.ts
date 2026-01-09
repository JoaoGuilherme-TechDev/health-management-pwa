"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "medication" | "appointment"
  read: boolean
  created_at: string
  scheduled_at?: string
  delivered_at?: string
}

class NotificationService {
  private subscription: RealtimeChannel | null = null
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    // Subscribe to new notifications in real-time
    this.subscription = this.supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification)
        },
      )
      .subscribe()
  }

  unsubscribe() {
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription)
      this.subscription = null
    }
  }

  async getNotifications(userId: string) {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error
    return data as Notification[]
  }

  async markAsRead(notificationId: string) {
    const { error } = await this.supabase.from("notifications").update({ read: true }).eq("id", notificationId)

    if (error) throw error
  }

  async deleteNotification(notificationId: string) {
    const { error } = await this.supabase.from("notifications").delete().eq("id", notificationId)

    if (error) throw error
  }

  async createNotification(notification: Omit<Notification, "id" | "created_at">) {
    const { data, error } = await this.supabase.from("notifications").insert([notification]).select().single()

    if (error) throw error
    return data
  }
}

export const notificationService = new NotificationService()
