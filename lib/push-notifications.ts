import { createClient } from "@/lib/supabase/client"

interface NotificationPayload {
  title: string
  body?: string
  url?: string
  type?: "prescription" | "appointment" | "diet" | "general"
  patientId: string
}

export class PushNotificationService {
  private supabase = createClient()

  // Enviar notificação para um paciente
  async sendToPatient(payload: NotificationPayload) {
    try {
      // Verificar se é admin/médico
      const { data: userData } = await this.supabase.auth.getUser()
      const { data: profile } = await this.supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user?.id)
        .single()

      if (profile?.role !== "admin" && profile?.role !== "doctor") {
        throw new Error("Apenas médicos podem enviar notificações")
      }

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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao enviar notificação")
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao enviar notificação push:", error)
      throw error
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
  async sendNewAppointment(patientId: string, appointmentDate: Date) {
    const formattedDate = appointmentDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    })

    return this.sendToPatient({
      patientId,
      title: "📅 Nova Consulta Agendada",
      body: `Você tem uma consulta marcada para ${formattedDate}`,
      url: `/patient/appointments`,
      type: "appointment",
    })
  }

  // Enviar notificação de nova dieta
  async sendNewDiet(patientId: string, dietTitle: string) {
    return this.sendToPatient({
      patientId,
      title: "🥗 Nova Recomendação de Dieta",
      body: `Você recebeu uma nova dieta: ${dietTitle}`,
      url: `/patient/diet`,
      type: "diet",
    })
  }
}

// Instância global
export const pushNotifications = new PushNotificationService()
