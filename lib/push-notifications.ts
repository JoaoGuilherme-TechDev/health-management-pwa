import { createClient } from "@/lib/supabase/client"

interface NotificationPayload {
  title: string
  body?: string
  url?: string
  type?: "prescription" | "evolution" | "appointment" | "diet" | "medication" | "supplement" | "general"
  patientId: string
}

export class PushNotificationService {
  private supabase = createClient()

  // Enviar notificação para um paciente
  async sendToPatient(payload: NotificationPayload) {
    try {
      console.log("Sending push notification to patient:", payload.patientId)
      
      // Enviar via API route
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: payload.patientId,
          title: payload.title,
          body: payload.body,
          url: payload.url || "/patient",
          type: payload.type || "general",
        }),
      })

      console.log("Push API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Push API error response:", errorText)
        throw new Error(`Falha ao enviar notificação: ${response.status}`)
      }

      const result = await response.json()
      console.log("Push notification sent successfully:", result)
      return result
    } catch (error) {
      console.error("Erro ao enviar notificação push:", error)
      throw error
    }
  }

  async sendNewEvolution(patientId: string, evolutionDetails: string) {
    return this.sendToPatient({
      patientId,
      title: "📈 Novo Registro de Evolução",
      body: `${evolutionDetails}`,
      url: `/patient/evolution`,
      type: "evolution",
    })
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