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
      const { data: profile } = await this.supabase.from("profiles").select("role").eq("id", userData.user?.id).single()

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

  // Gerar lembretes de medicação quando a medicação é criada
  async generateMedicationReminders(medicationId: string, startDate: Date, endDate: Date) {
    try {
      const { error } = await this.supabase.rpc("generate_medication_reminders", {
        p_medication_id: medicationId,
        p_start_date: startDate.toISOString().split("T")[0],
        p_end_date: endDate.toISOString().split("T")[0],
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error("Erro ao gerar lembretes de medicação:", error)
      throw error
    }
  }

  // Gerar lembrete de consulta quando a consulta é criada
  async generateAppointmentReminder(appointmentId: string) {
    try {
      const { error } = await this.supabase.rpc("generate_appointment_reminder", {
        p_appointment_id: appointmentId,
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error("Erro ao gerar lembrete de consulta:", error)
      throw error
    }
  }

  // Enviar notificação instantânea para novos itens
  async sendInstantNotification(
    patientId: string,
    title: string,
    message: string,
    type:
      | "medication_created"
      | "appointment_created"
      | "prescription_created"
      | "diet_created"
      | "supplement_created"
      | "evolution_created",
    actionUrl: string,
  ) {
    try {
      const { data: notification, error } = await this.supabase
        .from("notifications")
        .insert({
          user_id: patientId,
          title,
          message,
          notification_type: type,
          reminder_type: "instant",
          action_url: actionUrl,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      // Acionar notificação push instantânea
      await fetch("/api/push/send-instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      })

      return notification
    } catch (error) {
      console.error("Erro ao enviar notificação instantânea:", error)
      throw error
    }
  }
}

// Instância global
export const pushNotifications = new PushNotificationService()
