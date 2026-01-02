// app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server'

// lib/notification-service.ts
export class NotificationService {
  static async sendPrescriptionNotification(
    userId: string,
    prescriptionTitle: string,
    doctorName?: string,
    sendPush: boolean = true
  ) {
    try {
      console.log("NotificationService: Sending prescription notification...")
      const { notifyPrescriptionCreated } = await import('@/lib/notifications')
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
  ) {
    try {
      const { notifyAppointmentCreated } = await import('@/lib/notifications')
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
  ) {
    try {
      const { notifyMedicationCreated } = await import('@/lib/notifications')
      const notification = await notifyMedicationCreated(userId, medicationName, sendPush)
      console.log("NotificationService: Medication notification sent:", notification)
      return notification
    } catch (error) {
      console.error("Error sending medication notification:", error)
      return null
    }
  }

  static async sendDietNotification(
    userId: string,
    dietTitle: string,
    sendPush: boolean = true
  ) {
    try {
      const { notifyDietCreated } = await import('@/lib/notifications')
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
  ) {
    try {
      const { notifySuplementCreated } = await import('@/lib/notifications')
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
  ) {
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

// Next.js API Route Handlers - MUST EXPORT THESE
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, data, sendPush = true } = body

    let notification
    
    switch (type) {
      case 'prescription':
        notification = await NotificationService.sendPrescriptionNotification(
          userId,
          data.prescriptionTitle,
          data.doctorName,
          sendPush
        )
        break
      case 'appointment':
        notification = await NotificationService.sendAppointmentNotification(
          userId,
          data.appointmentTitle,
          data.appointmentDate,
          sendPush
        )
        break
      case 'medication':
        notification = await NotificationService.sendMedicationNotification(
          userId,
          data.medicationName,
          sendPush
        )
        break
      case 'diet':
        notification = await NotificationService.sendDietNotification(
          userId,
          data.dietTitle,
          sendPush
        )
        break
      case 'supplement':
        notification = await NotificationService.sendSupplementNotification(
          userId,
          data.supplementName,
          sendPush
        )
        break
      case 'test':
        const success = await NotificationService.testPushNotification(
          userId,
          data.title,
          data.body
        )
        return NextResponse.json({ 
          success: true, 
          message: "Test notification sent",
          testResult: success 
        })
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Notification sent successfully",
      notification 
    })
  } catch (error) {
    console.error('Error in push notification API:', error)
    return NextResponse.json(
      { error: 'Failed to send notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Return API information
  return NextResponse.json({
    success: true,
    message: 'Push notification API is running',
    endpoint: '/api/push/send',
    availableTypes: [
      { type: 'prescription', requiredFields: ['userId', 'data.prescriptionTitle'] },
      { type: 'appointment', requiredFields: ['userId', 'data.appointmentTitle', 'data.appointmentDate'] },
      { type: 'medication', requiredFields: ['userId', 'data.medicationName'] },
      { type: 'diet', requiredFields: ['userId', 'data.dietTitle'] },
      { type: 'supplement', requiredFields: ['userId', 'data.supplementName'] },
      { type: 'test', requiredFields: ['userId'] }
    ],
    usage: 'Send POST request with { userId, type, data, sendPush? }'
  })
}