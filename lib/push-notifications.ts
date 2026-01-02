import { createClient } from "@/lib/supabase/client"

interface NotificationPayload {
  title: string
  body?: string
  url?: string
  type?: "prescription" | "appointment" | "diet" | "medication" | "supplement" | "general" | "evolution"
  patientId: string
}

export class PushNotificationService {
  private supabase = createClient()

  // Enviar notificação para um paciente
  async sendToPatient(payload: NotificationPayload) {
    try {
      console.log("🚀 [PUSH] Starting push notification for patient:", payload.patientId)
      
      // FIRST: Send via API for cross-device push
      const apiResult = await this.sendViaAPI(payload)
      
      // SECOND: Send local notification for immediate feedback (like test button)
      const localResult = await this.sendLocalNotification(payload)
      
      // THIRD: Store in database for notification center
      await this.storeInDatabase(payload)
      
      return {
        apiSuccess: apiResult,
        localSuccess: localResult,
        message: "Notificação enviada"
      }
    } catch (error) {
      console.error("❌ [PUSH] Error sending notification:", error)
      throw error
    }
  }

  // Send via API (for push to other devices)
  private async sendViaAPI(payload: NotificationPayload): Promise<boolean> {
    try {
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: payload.patientId,
          title: payload.title,
          body: payload.body,
          url: payload.url || "/notifications",
          type: payload.type || "general",
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ [PUSH] API error:", response.status, errorText)
        return false
      }

      const result = await response.json()
      console.log("✅ [PUSH] API success:", result)
      return true
    } catch (error) {
      console.error("❌ [PUSH] API failed:", error)
      return false
    }
  }

  // Send local notification (like test button)
  private async sendLocalNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      // Check if we can send local notifications
      if (typeof window === 'undefined') return false
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return false
      }

      if (!('serviceWorker' in navigator)) {
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const uniqueTag = `local-${Date.now()}`

      await registration.showNotification(payload.title, {
        body: payload.body || payload.title,
        icon: "/icon-light-32x32.png",
        badge: "/badge-72x72.png",
        tag: uniqueTag,
        requireInteraction: true,
        timestamp: Date.now(),
        data: {
          type: payload.type || "general",
          url: payload.url || "/notifications",
          patientId: payload.patientId,
          source: "local"
        }
      })

      console.log("✅ [PUSH] Local notification shown")
      return true
    } catch (error) {
      console.error("❌ [PUSH] Local notification failed:", error)
      return false
    }
  }

  // Store in database
  private async storeInDatabase(payload: NotificationPayload): Promise<void> {
    try {
      const notificationType = payload.type || "general"
      
      await this.supabase.from("notifications").insert({
        title: payload.title,
        message: payload.body || payload.title,
        notification_type: notificationType,
        user_id: payload.patientId,
        data: {
          type: notificationType,
          patientId: payload.patientId,
          url: payload.url || "/notifications",
          timestamp: new Date().toISOString()
        },
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      console.log("✅ [PUSH] Stored in database")
    } catch (error) {
      console.error("❌ [PUSH] Database storage failed:", error)
    }
  }

  // Enviar notificação de nova prescrição
  async sendNewPrescription(patientId: string, prescriptionTitle: string) {
    return this.sendToPatient({
      patientId,
      title: "📋 Nova Prescrição Médica",
      body: `Você recebeu uma nova prescrição: ${prescriptionTitle}`,
      url: `/patient/prescriptions`,
      type: "prescription",
    })
  }

  async sendNewAppointment(patientId: string, appointmentTitle: string, appointmentDate: string) {
    const formattedDate = new Date(appointmentDate).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    })

    return this.sendToPatient({
      patientId,
      title: "📅 Nova Consulta Agendada",
      body: `${appointmentTitle} • ${formattedDate}`,
      url: `/patient/appointments`,
      type: "appointment",
    })
  }

  async sendNewMedication(patientId: string, medicationName: string) {
    return this.sendToPatient({
      patientId,
      title: "💊 Novo Medicamento Prescrito",
      body: `Você recebeu um novo medicamento: ${medicationName}`,
      url: `/patient/medications`,
      type: "medication",
    })
  }

  async sendNewDiet(patientId: string, dietTitle: string) {
    return this.sendToPatient({
      patientId,
      title: "🥗 Nova Receita de Dieta",
      body: `Você recebeu uma nova receita: ${dietTitle}`,
      url: `/patient/diet`,
      type: "diet",
    })
  }

  async sendNewSupplement(patientId: string, supplementName: string) {
    return this.sendToPatient({
      patientId,
      title: "💪 Novo Suplemento Recomendado",
      body: `Você recebeu uma recomendação: ${supplementName}`,
      url: `/patient`,
      type: "supplement",
    })
  }
}

// Instância global
export const pushNotifications = new PushNotificationService()