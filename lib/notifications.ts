// lib/notifications.ts
"use client"

import { createClient } from "@/lib/supabase/client"

// Notification types
export type NotificationType = 
  | 'medication_created'
  | 'appointment_created'
  | 'appointment_reminder'
  | 'diet_recipe_created'
  | 'prescription_created'
  | 'supplement_created'
  | 'evolution_created';

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
): Promise<Notification | null> {
  console.log("notifyPrescriptionCreated called with:", { userId, prescriptionTitle, doctorName })
  
  const doctorStr = doctorName ? ` - Dr(a). ${doctorName}` : ""

  const result = await createNotification({
    userId,
    type: "prescription_created",
    title: "Nova Receita Adicionada",
    message: `${prescriptionTitle}${doctorStr}`,
    actionUrl: "/patient/prescriptions",
  })

  console.log("notifyPrescriptionCreated result:", result)
  return result
}