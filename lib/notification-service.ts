// lib/notification-service.ts
"use client"

import { 
  notifyPrescriptionCreated, 
  notifyAppointmentCreated,
  notifyMedicationCreated,
  notifyDietCreated,
  notifySuplementCreated,
  Notification,
  notifyEvolutionCreated
} from "@/lib/notifications"

export class NotificationService {
  // Use this instead of calling individual functions directly
  static async sendPrescriptionNotification(
    userId: string,
    prescriptionTitle: string,
    doctorName?: string,
    sendPush: boolean = true
  ): Promise<Notification | null> {
    try {
      console.log("NotificationService: Sending prescription notification...")
      const notification = await notifyPrescriptionCreated(userId, prescriptionTitle, doctorName, sendPush)
      console.log("NotificationService: Notification sent:", notification)
      return notification
    } catch (error) {
      console.error("Error sending prescription notification:", error)
      return null
    }
  }

  static async sendAppointmentNotification(
    userId: string,
    appointmentTitle: string,
    appointmentDate: string,
    sendPush: boolean = true
  ): Promise<Notification | null> {
    try {
      const notification = await notifyAppointmentCreated(userId, appointmentTitle, appointmentDate, sendPush)
      console.log("NotificationService: Appointment notification sent:", notification)
      return notification
    } catch (error) {
      console.error("Error sending appointment notification:", error)
      return null
    }
  }

  static async sendMedicationNotification(
    userId: string,
    medicationName: string,
    sendPush: boolean = true
  ): Promise<Notification | null> {
    try {
      const notification = await notifyMedicationCreated(userId, medicationName, sendPush)
      console.log("NotificationService: Medication notification sent:", notification)
      return notification
    } catch (error) {
      console.error("Error sending medication notification:", error)
      return null
    }
  }

  // Add this method to the NotificationService class in lib/notification-service.ts
static async sendEvolutionNotification(
  userId: string,
  measurementDetails: string,
  sendPush: boolean = true
): Promise<Notification | null> {
  try {
    const notification = await notifyEvolutionCreated(userId, measurementDetails, sendPush)
    console.log("NotificationService: Evolution notification sent:", notification)
    return notification
  } catch (error) {
    console.error("Error sending evolution notification:", error)
    return null
  }
}

  static async sendDietNotification(
    userId: string,
    dietTitle: string,
    sendPush: boolean = true
  ): Promise<Notification | null> {
    try {
      const notification = await notifyDietCreated(userId, dietTitle, sendPush)
      console.log("NotificationService: Diet notification sent:", notification)
      return notification
    } catch (error) {
      console.error("Error sending diet notification:", error)
      return null
    }
  }

  static async sendSupplementNotification(
    userId: string,
    supplementName: string,
    sendPush: boolean = true
  ): Promise<Notification | null> {
    try {
      const notification = await notifySuplementCreated(userId, supplementName, sendPush)
      console.log("NotificationService: Supplement notification sent:", notification)
      return notification
    } catch (error) {
      console.error("Error sending supplement notification:", error)
      return null
    }
  }

  // Test method to verify push notifications are working
  static async testPushNotification(
    userId: string,
    title: string = "Test Notification",
    body: string = "This is a test notification"
  ): Promise<boolean> {
    try {
      const { pushNotifications } = await import("@/lib/push-notifications")
      await pushNotifications.sendToPatient({
        patientId: userId,
        title,
        body,
        url: "/patient",
        type: "general"
      })
      return true
    } catch (error) {
      console.error("Test push notification failed:", error)
      return false
    }
  }
}