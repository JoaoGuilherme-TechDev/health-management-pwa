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

  async subscribeToNotifications(patientId: string, callback: (notification: Notification) => void) {
    // Subscribe to new notifications in real-time
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
        (payload) => {
          const raw: any = payload.new
          const mapped: Notification = {
            ...raw,
            type: raw.notification_type?.includes("appointment")
              ? "appointment"
              : raw.notification_type?.includes("medication")
                ? "medication"
                : (raw.notification_type ?? "info"),
          }
          callback(mapped)
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

  async getNotifications(patientId: string) {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", patientId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error
    return (data || []).map((raw: any) => {
      const mapped: Notification = {
        ...raw,
        type: raw.notification_type?.includes("appointment")
          ? "appointment"
          : raw.notification_type?.includes("medication")
            ? "medication"
            : (raw.notification_type ?? "info"),
      }
      return mapped
    })
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

  async createNotification(notification: Omit<Notification, "id" | "created_at">) {
    const { data, error } = await this.supabase.from("notifications").insert([notification]).select().single()

    if (error) throw error
    return data
  }

  async snoozeMedication(userId: string, medicationId: string, minutes = 15) {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString()
    const { error } = await this.supabase
      .from("medication_reminders")
      .update({ snoozed_until: until })
      .eq("user_id", userId)
      .eq("medication_id", medicationId)
    if (error) throw error

    await this.createNotification({
      user_id: userId,
      title: "Lembrete Adiado",
      description: `Medicamento adiad por ${minutes} minutos`,
      type: "medication",
      read: false,
    })
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

    await this.createNotification({
      user_id: userId,
      title: "Medicamento Confirmado",
      description: "Sua medicação foi registrada com sucesso",
      type: "success",
      read: false,
    })
  }
}

export const notificationService = new NotificationService()
