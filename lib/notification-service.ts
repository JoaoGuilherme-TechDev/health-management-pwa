"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface Notification {
  id: string
  user_id: string
  title: string
  description?: string
  message?: string
  notes?: string
  meal_type?: string
  actionUrl?: string
  type:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "medication"
    | "appointment"
    | "prescription"
    | "diet"
    | "supplement"
    | "evolution"
  read: boolean
  created_at: string
  scheduled_at?: string
  delivered_at?: string
  notification_type?: string
}

class NotificationService {
  private subscription: RealtimeChannel | null = null
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  private getNotificationEmoji(notificationType: string): string {
    if (notificationType?.includes("medication")) return "💊"
    if (notificationType?.includes("appointment")) return "📅"
    if (notificationType?.includes("prescription")) return "📋"
    if (notificationType?.includes("diet")) return "🥗"
    if (notificationType?.includes("supplement")) return "💪"
    if (notificationType?.includes("evolution")) return "📊"
    if (notificationType?.includes("health")) return "❤️"
    return "🔔"
  }

  async subscribeToNotifications(patientId: string, callback: (notification: Notification) => void) {
    this.subscription = this.supabase
      .channel(`notifications:${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${patientId}`,
        },
        async (payload) => {
          const raw: any = payload.new
          const mapped: Notification = {
            ...raw,
            type: this.mapNotificationType(raw.notification_type),
          }
          callback(mapped)
        },
      )
      .subscribe()
  }

  private mapNotificationType(notificationType: string): Notification["type"] {
    if (notificationType?.includes("appointment")) return "appointment"
    if (notificationType?.includes("medication")) return "medication"
    if (notificationType?.includes("prescription")) return "prescription"
    if (notificationType?.includes("diet")) return "diet"
    if (notificationType?.includes("supplement")) return "supplement"
    if (notificationType?.includes("evolution")) return "evolution"
    return "info"
  }

  unsubscribe() {
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription)
      this.subscription = null
    }
  }

  async getNotifications(patientId: string) {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", patientId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error
    return (data || []).map((raw: any) => ({
      ...raw,
      type: this.mapNotificationType(raw.notification_type),
    }))
  }

  async markAsRead(notificationId: string) {
    const { error } = await this.supabase.from("notifications").update({ read: true }).eq("id", notificationId)
    if (error) throw error
  }

  async markAllAsRead(patientId: string) {
    const { error } = await this.supabase.from("notifications").update({ read: true }).eq("user_id", patientId)
    if (error) throw error
  }

  async deleteNotification(notificationId: string) {
    const { error } = await this.supabase.from("notifications").delete().eq("id", notificationId)
    if (error) throw error
  }

  async deleteAllNotifications(patientId: string) {
    const { error } = await this.supabase.from("notifications").delete().eq("user_id", patientId)
    if (error) throw error
  }

  async getNotificationSettings(patientId: string) {
    const { data, error } = await this.supabase.from("notification_settings").select("*").eq("user_id", patientId)

    if (error) throw error
    return data || []
  }

  async updateNotificationSetting(
    patientId: string,
    notificationType: string,
    enabled: boolean,
    soundEnabled?: boolean,
    vibrationEnabled?: boolean,
    ledEnabled?: boolean,
  ) {
    const { error } = await this.supabase.from("notification_settings").upsert({
      user_id: patientId,
      notification_type: notificationType,
      enabled,
      sound_enabled: soundEnabled ?? true,
      vibration_enabled: vibrationEnabled ?? true,
      led_enabled: ledEnabled ?? true,
    })

    if (error) throw error
  }

  async snoozeMedication(userId: string, medicationId: string, minutes = 15) {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString()
    const { error } = await this.supabase
      .from("medication_reminders")
      .update({ snoozed_until: until })
      .eq("user_id", userId)
      .eq("medication_id", medicationId)
    if (error) throw error
  }

  async confirmMedicationTaken(userId: string, medicationId: string) {
    const { error } = await this.supabase.from("medication_adherence").insert([
      {
        user_id: userId,
        medication_id: medicationId,
        taken_at: new Date().toISOString(),
        status: "completed",
      },
    ])
    if (error) throw error
  }
}

export const notificationService = new NotificationService()
