// lib/notifications.ts
"use client"

import { createClient } from "@/lib/supabase/client"
import { pushNotifications } from "@/lib/push-notifications"

// Notification types
export type NotificationType =
  | "medication_created"
  | "appointment_created"
  | "appointment_reminder"
  | "diet_recipe_created"
  | "prescription_created"
  | "supplement_created"
  | "evolution_created"

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
  sendPush: boolean = true
): Promise<Notification | null> {
  console.log("notifyPrescriptionCreated called with:", { userId, prescriptionTitle, doctorName, sendPush })

  const doctorStr = doctorName ? ` - Dr(a). ${doctorName}` : ""

  // Create in-app notification
  const result = await createNotification({
    userId,
    type: "prescription_created",
    title: "Nova Receita Adicionada",
    message: `${prescriptionTitle}${doctorStr}`,
    actionUrl: "/patient/prescriptions",
    sendPush: true,
  })

  // Send push notification
  if (sendPush && result) {
    try {
      console.log("Sending push notification for prescription...")
      await pushNotifications.sendNewPrescription(userId, prescriptionTitle)
      console.log("Push notification sent successfully")
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  console.log("notifyPrescriptionCreated result:", result)
  return result
}

export async function notifyAppointmentCreated(
  userId: string,
  appointmentTitle: string,
  appointmentDate: string,
  sendPush: boolean = true
): Promise<Notification | null> {
  // Create in-app notification
  const result = await createNotification({
    userId,
    type: "appointment_created",
    title: "Nova Consulta Agendada",
    message: `${appointmentTitle} - ${new Date(appointmentDate).toLocaleDateString("pt-BR")}`,
    actionUrl: "/patient/appointments",
    sendPush: true,
  })

  // Send push notification
  if (sendPush && result) {
    try {
      await pushNotifications.sendNewAppointment(userId, appointmentTitle, appointmentDate)
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  return result
}

export async function notifyMedicationCreated(
  userId: string,
  medicationName: string,
  sendPush: boolean = true
): Promise<Notification | null> {
  const result = await createNotification({
    userId,
    type: "medication_created",
    title: "Novo Medicamento Prescrito",
    message: `${medicationName}`,
    actionUrl: "/patient/medications",
    sendPush: true,
  })

  if (sendPush && result) {
    try {
      await pushNotifications.sendNewMedication(userId, medicationName)
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  return result
}

export async function notifyDietCreated(
  userId: string,
  dietTitle: string,
  sendPush: boolean = true
): Promise<Notification | null> {
  const result = await createNotification({
    userId,
    type: "diet_recipe_created",
    title: "Nova Receita de Dieta",
    message: `${dietTitle}`,
    actionUrl: "/patient/diet",
    sendPush: true,
  })

  if (sendPush && result) {
    try {
      await pushNotifications.sendNewDiet(userId, dietTitle)
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  return result
}

export async function notifySuplementCreated(
  userId: string,
  supplementName: string,
  sendPush: boolean = true
): Promise<Notification | null> {
  const result = await createNotification({
    userId,
    type: "supplement_created",
    title: "Novo Suplemento Recomendado",
    message: `${supplementName}`,
    actionUrl: "/patient",
    sendPush: true,
  })

  if (sendPush && result) {
    try {
      await pushNotifications.sendNewSupplement(userId, supplementName)
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  return result
}

export async function notifyEvolutionCreated(
  userId: string,
  measurementDetails: string,
  sendPush: boolean = true
): Promise<Notification | null> {
  console.log("notifyEvolutionCreated called with:", { userId, measurementDetails, sendPush })

  // Create in-app notification
  const result = await createNotification({
    userId,
    type: "evolution_created",
    title: "📊 Nova Evolução Física",
    message: measurementDetails,
    actionUrl: "/patient/evolution",
    sendPush: true,
  })

  // Send push notification
  if (sendPush && result) {
    try {
      console.log("Sending push notification for evolution...")
      await pushNotifications.sendToPatient({
        patientId: userId,
        title: "📊 Nova Evolução Física",
        body: measurementDetails,
        url: "/patient/evolution",
        type: "general",
      })
      console.log("Push notification sent successfully")
    } catch (error) {
      console.error("Failed to send push notification:", error)
    }
  }

  console.log("notifyEvolutionCreated result:", result)
  return result
}