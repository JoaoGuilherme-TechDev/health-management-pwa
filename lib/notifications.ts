import { createClient } from "@/lib/supabase/server"
import { formatBrasiliaDate, getCurrentBrasiliaTime } from "@/lib/timezone"

// Notification types
export type NotificationType =
  | "medication_created"
  | "appointment_created"
  | "diet_created"
  | "prescription_created"
  | "supplement_created"
  | "evolution_created"

// Notification data for creating a notification
export interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
}

// Notification returned from database
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

// Create a notification in the database
export async function createNotification(data: CreateNotificationData): Promise<Notification | null> {
  const supabase = await createClient()
  const now = getCurrentBrasiliaTime()

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id: data.userId,
      title: data.title,
      message: data.message,
      notification_type: data.type,
      action_url: data.actionUrl || null,
      is_read: false,
      created_at: now.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[Notifications] Error creating notification:", error)
    return null
  }

  return notification
}

// Get all notifications for a user
export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Notifications] Error fetching notifications:", error)
    return []
  }

  return data || []
}

// Get notifications for a user with optional filters
export async function getNotificationsWithFilters(
  userId: string,
  filters?: {
    isRead?: boolean
    types?: NotificationType[]
    startDate?: string
    endDate?: string
  }
): Promise<Notification[]> {
  const supabase = await createClient()

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (filters) {
    if (typeof filters.isRead === "boolean") {
      query = query.eq("is_read", filters.isRead)
    }
    if (filters.types && filters.types.length > 0) {
      query = query.in("notification_type", filters.types)
    }
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error("[Notifications] Error fetching notifications with filters:", error)
    return []
  }

  return data || []
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient()
  const now = getCurrentBrasiliaTime()

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: now.toISOString(),
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
  const supabase = await createClient()

  const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

  if (error) {
    console.error("[Notifications] Error deleting notification:", error)
    return false
  }

  return true
}

// Helper functions to create notifications for each type
export async function notifyMedicationCreated(
  userId: string,
  medicationName: string,
  dosage: string,
): Promise<Notification | null> {
  return createNotification({
    userId,
    type: "medication_created",
    title: "Novo Medicamento Adicionado",
    message: `${medicationName} - ${dosage}`,
    actionUrl: "/patient/medications",
  })
}

export async function notifyAppointmentCreated(
  userId: string,
  appointmentTitle: string,
  scheduledAt: string,
  location?: string,
): Promise<Notification | null> {
  const formattedDate = formatBrasiliaDate(scheduledAt, "full")
  const locationStr = location ? ` - ${location}` : ""

  return createNotification({
    userId,
    type: "appointment_created",
    title: "Nova Consulta Agendada",
    message: `${appointmentTitle} - ${formattedDate}${locationStr}`,
    actionUrl: "/patient/appointments",
  })
}

export async function notifyDietCreated(
  userId: string,
  dietTitle: string,
  mealType?: string,
): Promise<Notification | null> {
  const mealStr = mealType ? ` (${mealType})` : ""

  return createNotification({
    userId,
    type: "diet_created",
    title: "Nova Dieta Adicionada",
    message: `${dietTitle}${mealStr}`,
    actionUrl: "/patient/diet",
  })
}

export async function notifyPrescriptionCreated(
  userId: string,
  prescriptionTitle: string,
  doctorName?: string,
): Promise<Notification | null> {
  const doctorStr = doctorName ? ` - Dr(a). ${doctorName}` : ""

  return createNotification({
    userId,
    type: "prescription_created",
    title: "Nova Receita Adicionada",
    message: `${prescriptionTitle}${doctorStr}`,
    actionUrl: "/patient/prescriptions",
  })
}

export async function notifySupplementCreated(
  userId: string,
  supplementName: string,
  dosage?: string,
): Promise<Notification | null> {
  const dosageStr = dosage ? ` - ${dosage}` : ""

  return createNotification({
    userId,
    type: "supplement_created",
    title: "Novo Suplemento Adicionado",
    message: `${supplementName}${dosageStr}`,
    actionUrl: "/patient/supplements",
  })
}

export async function notifyEvolutionCreated(
  userId: string,
  weight?: number,
  measuredAt?: string,
): Promise<Notification | null> {
  const dateStr = measuredAt
    ? formatBrasiliaDate(measuredAt, "date")
    : formatBrasiliaDate(new Date().toISOString(), "date")
  const weightStr = weight ? `Peso: ${weight}kg - ` : ""

  return createNotification({
    userId,
    type: "evolution_created",
    title: "Nova Evolução Registrada",
    message: `${weightStr}Medição em ${dateStr}`,
    actionUrl: "/patient/evolution",
  })
}

// Centralized notification dispatcher to verify types at runtime
export async function dispatchNotification(
  type: NotificationType,
  userId: string,
  payload: Record<string, any>
): Promise<Notification | null> {
  switch (type) {
    case "medication_created":
      return notifyMedicationCreated(userId, payload.medicationName, payload.dosage)
    case "appointment_created":
      return notifyAppointmentCreated(userId, payload.appointmentTitle, payload.scheduledAt, payload.location)
    case "diet_created":
      return notifyDietCreated(userId, payload.dietTitle, payload.mealType)
    case "prescription_created":
      return notifyPrescriptionCreated(userId, payload.prescriptionTitle, payload.doctorName)
    case "supplement_created":
      return notifySupplementCreated(userId, payload.supplementName, payload.dosage)
    case "evolution_created":
      return notifyEvolutionCreated(userId, payload.weight, payload.measuredAt)
    default:
      console.error(`[Notifications] Unknown notification type: ${type}`)
      return null
  }
}
