// lib/notifications.ts
"use client"

import { createClient } from "@/lib/supabase/client"
import { pushNotifications } from "@/lib/push-notifications"

// Notification types
export type NotificationType =
  | "medication_created"
  | "medication_added"
  | "appointment_scheduled"
  | "appointment_reminder"
  | "diet_recipe_created"
  | "diet_added"
  | "prescription_created"
  | "prescription_added"
  | "supplement_created"
  | "supplement_added"
  | "evolution_created"
  | "evolution_added"
  | "metric_added"
  | "health_alert"
  | "info"
  | "warning"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  notification_type: NotificationType
  is_read: boolean
  read_at: string | null
  action_url: string | null
  created_at: string
}

export interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  sendPush?: boolean
}

// Create a notification in the database
export async function createNotification(data: CreateNotificationData): Promise<Notification | null> {
  const supabase = createClient()

  console.log("Creating notification with data:", data)

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id: data.userId,
      title: data.title,
      message: data.message,
      notification_type: data.type,
      action_url: data.actionUrl || null,
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[Notifications] Error creating notification:", error)
    return null
  }

  console.log("[Notifications] Notification created successfully:", notification)
  return notification
}

// Get all notifications for a user
export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Notifications] Error fetching notifications:", error)
    return []
  }

  console.log(`[Notifications] Found ${data?.length || 0} notifications for user ${userId}`)
  return data || []
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)

  if (error) {
    console.error("[Notifications] Error marking as read:", error)
    return false
  }

  return true
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

  if (error) {
    console.error("[Notifications] Error deleting notification:", error)
    return false
  }

  return true
}

// Helper function for prescription notifications
export async function notifyPrescriptionCreated(
  userId: string,
  prescriptionTitle: string,
  doctorName?: string,
  sendPush = true,
): Promise<Notification | null> {
  console.log("notifyPrescriptionCreated called with:", { userId, prescriptionTitle, doctorName, sendPush })

  const doctorStr = doctorName ? ` - Dr(a). ${doctorName}` : ""

  if (sendPush) {
    try {
      console.log("Sending push notification for prescription...")
      await pushNotifications.sendToPatient({
        patientId: userId,
        title: "📋 Nova Prescrição Médica",
        body: `Você recebeu uma nova prescrição: ${prescriptionTitle}`,
        url: "/patient/prescriptions",
        type: "prescription_added",
      })
      console.log("Push notification sent successfully")
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  console.log("notifyPrescriptionCreated completed")
  return null
}

export async function notifyAppointmentCreated(
  userId: string,
  appointmentTitle: string,
  appointmentDate: string,
  sendPush = true,
): Promise<Notification | null> {
  if (sendPush) {
    try {
      const formattedDate = new Date(appointmentDate).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
      await pushNotifications.sendToPatient({
        patientId: userId,
        title: "📅 Nova Consulta Agendada",
        body: `${appointmentTitle} • ${formattedDate}`,
        url: "/patient/appointments",
        type: "appointment_scheduled",
      })
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  return null
}

export async function notifyMedicationCreated(
  userId: string,
  medicationName: string,
  sendPush = true,
): Promise<Notification | null> {
  if (sendPush) {
    try {
      await pushNotifications.sendToPatient({
        patientId: userId,
        title: "💊 Novo Medicamento Prescrito",
        body: `Você recebeu um novo medicamento: ${medicationName}`,
        url: "/patient/medications",
        type: "medication_added",
      })
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  return null
}

export async function notifyDietCreated(
  userId: string,
  dietTitle: string,
  sendPush = true,
): Promise<Notification | null> {
  if (sendPush) {
    try {
      await pushNotifications.sendToPatient({
        patientId: userId,
        title: "🥗 Nova Receita de Dieta",
        body: `Você recebeu uma nova receita: ${dietTitle}`,
        url: "/patient/diet",
        type: "diet_added",
      })
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  return null
}

export async function notifySuplementCreated(
  userId: string,
  supplementName: string,
  sendPush = true,
): Promise<Notification | null> {
  if (sendPush) {
    try {
      await pushNotifications.sendToPatient({
        patientId: userId,
        title: "💪 Novo Suplemento Recomendado",
        body: `Você recebeu uma recomendação: ${supplementName}`,
        url: "/patient",
        type: "supplement_added",
      })
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  return null
}

export async function notifyEvolutionCreated(
  userId: string,
  measurementDetails: string,
  sendPush = true,
): Promise<Notification | null> {
  console.log("notifyEvolutionCreated called with:", { userId, measurementDetails, sendPush })

  if (sendPush) {
    try {
      console.log("Sending push notification for evolution...")
      await pushNotifications.sendToPatient({
        patientId: userId,
        title: "📊 Nova Evolução Física",
        body: measurementDetails,
        url: "/patient/evolution",
        type: "evolution_added",
      })
      console.log("Push notification sent successfully")
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  console.log("notifyEvolutionCreated result:")
  return null
}
