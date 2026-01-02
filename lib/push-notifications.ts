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
      console.log("🚀 Starting push notification for patient:", payload.patientId)
      console.log("📦 Payload:", payload)
      
      // Also send a local notification if we're on the patient's device
      this.sendLocalNotification(payload)
      
      // Enviar via API route for cross-device
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

      console.log("📡 API Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Push API error response:", errorText)
        throw new Error(`Falha ao enviar notificação: ${response.status}`)
      }

      const result = await response.json()
      console.log("✅ Push notification sent successfully:", result)
      return result
    } catch (error) {
      console.error("❌ Erro ao enviar notificação push:", error)
      throw error
    }
  }

  // Send local notification (like the test button)
  private async sendLocalNotification(payload: NotificationPayload) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return false
      }

      if (!('serviceWorker' in navigator)) {
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const uniqueTag = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      await registration.showNotification(payload.title, {
        body: payload.body || payload.title,
        icon: "/icon-light-32x32.png",
        badge: "/badge-72x72.png",
        tag: uniqueTag,
        requireInteraction: true,
        data: {
          type: payload.type || "general",
          url: payload.url || "/notifications",
          patientId: payload.patientId,
          notificationId: uniqueTag,
          source: "local-push"
        }
      })

      console.log("✅ Local notification shown")
      return true
    } catch (error) {
      console.error("Error sending local notification:", error)
      return false
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

  // Enviar notificação de nova consulta
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

  // Enviar notificação de novo medicamento
  async sendNewMedication(patientId: string, medicationName: string) {
    return this.sendToPatient({
      patientId,
      title: "💊 Novo Medicamento Prescrito",
      body: `Você recebeu um novo medicamento: ${medicationName}`,
      url: `/patient/medications`,
      type: "medication",
    })
  }

  // Enviar notificação de nova dieta
  async sendNewDiet(patientId: string, dietTitle: string) {
    return this.sendToPatient({
      patientId,
      title: "🥗 Nova Receita de Dieta",
      body: `Você recebeu uma nova receita: ${dietTitle}`,
      url: `/patient/diet`,
      type: "diet",
    })
  }

  // Enviar notificação de novo suplemento
  async sendNewSupplement(patientId: string, supplementName: string) {
    return this.sendToPatient({
      patientId,
      title: "💪 Novo Suplemento Recomendado",
      body: `Você recebeu uma recomendação: ${supplementName}`,
      url: `/patient`,
      type: "supplement",
    })
  }

  // Enviar notificação de evolução
  async sendNewEvolution(patientId: string, evolutionTitle: string) {
    return this.sendToPatient({
      patientId,
      title: "📈 Nova Evolução Registrada",
      body: `Sua evolução foi atualizada: ${evolutionTitle}`,
      url: `/patient/evolutions`,
      type: "evolution",
    })
  }
}

// Instância global
export const pushNotifications = new PushNotificationService()