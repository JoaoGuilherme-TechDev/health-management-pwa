import { createClient } from "@/lib/supabase/client"

interface NotificationPayload {
  title: string
  body?: string
  url?: string
  type?:
    | "prescription_created"
    | "appointment_scheduled"
    | "diet_created"
    | "medication_created"
    | "medication_reminder"
    | "supplement_created"
    | "evolution_created"
    | "info"
    | "warning"
    | "health_alert"
  patientId: string
}

export class PushNotificationService {
  private supabase = createClient()

  // Enviar notificação para um paciente
  async sendToPatient(payload: NotificationPayload) {
    try {
      console.log("🚀 [PUSH] Starting push notification for patient:", payload.patientId)

      // FIRST: Store in database for notification center
      await this.storeInDatabase(payload)
      console.log("💾 [PUSH] Stored in database for patient:", payload.patientId)

      return {
        storedInDB: true,
        message: "Notificação enviada ao paciente",
      }
    } catch (error) {
      console.error("❌ [PUSH] Error sending notification:", error)
      throw error
    }
  }


  // Store in database
  private async storeInDatabase(payload: NotificationPayload): Promise<void> {
    try {
      // Get doctor info (current user)
      const {
        data: { user: doctor },
      } = await this.supabase.auth.getUser()
      const doctorId = doctor?.id || "system"

      const { error } = await this.supabase.from("notifications").insert({
        title: payload.title,
        message: payload.body || payload.title,
        notification_type: payload.type || "general",
        user_id: payload.patientId,
        action_url: payload.url || "patient/notifications",
        is_read: false,
        is_active: true,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("❌ [PUSH] Database storage failed (insert error):", error)
        throw error
      }

      console.log("💾 [PUSH] Stored in database for patient:", payload.patientId)
    } catch (error) {
      console.error("❌ [PUSH] Database storage failed:", error)
      throw error
    }
  }

  // Helper methods
  async sendNewPrescription(patientId: string, prescriptionTitle: string) {
    return this.sendToPatient({
      patientId,
      title: "📋 Nova Receita Médica",
      body: `Você recebeu uma nova Receita: ${prescriptionTitle}`,
      url: `/patient/prescriptions`,
      type: "prescription_created",
    })
  }

  async sendNewMedicationSchedule(patientId: string, medicationName: string, medicationId: string) {
       return this.sendToPatient({
        patientId,
        title: "⏰Hora de Tomar Seu Remédio",
        body: `Está na hora de tomar ${medicationName}`,
        url: `/patient/medications?action=confirm&medicationId=${medicationId}&name=${encodeURIComponent(medicationName)}`,
        type: "medication_reminder",
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
      type: "appointment_scheduled",
    })
  }

  async sendNewMedication(patientId: string, medicationName: string) {
    return this.sendToPatient({
      patientId,
      title: "💊 Novo Medicamento Prescrito",
      body: `Você recebeu um novo medicamento: ${medicationName}`,
      url: `/patient/medications`,
      type: "medication_created",
    })
  }

  async sendNewDiet(patientId: string, dietTitle: string) {
    return this.sendToPatient({
      patientId,
      title: "🥗 Nova Receita de Dieta",
      body: `Você recebeu uma nova receita: ${dietTitle}`,
      url: `/patient/diet`,
      type: "diet_created",
    })
  }

  async sendNewSupplement(patientId: string, supplementName: string) {
    return this.sendToPatient({
      patientId,
      title: "💪 Novo Suplemento Recomendado",
      body: `Você recebeu uma recomendação: ${supplementName}`,
      url: `/patient/supplements`,
      type: "supplement_created",
    })
  }
}

// Instância global
export const pushNotifications = new PushNotificationService()
