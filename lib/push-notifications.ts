import { createClient } from "@/lib/supabase/client"

interface NotificationPayload {
  title: string
  body?: string
  url?: string
  type?: string
  patientId: string
}

export class PushNotificationService {
  private supabase = createClient()

  // SIMPLE: Just store in database and let the client handle notifications
  async sendToPatient(payload: NotificationPayload) {
    console.log("🚀 [SIMPLE PUSH] Sending to patient:", payload.patientId)
    
    try {
      // 1. Store in database (ALWAYS)
      await this.storeInDatabase(payload)
      console.log("💾 Stored in database")
      
      // 2. Done! The patient will see it in their notification center
      //    If patient is online, they'll get it immediately via real-time
      
      return {
        success: true,
        message: "Notificação enviada ao paciente"
      }
      
    } catch (error: any) {
      console.error("❌ Error:", error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Store in database
  private async storeInDatabase(payload: NotificationPayload) {
    const { data: { user } } = await this.supabase.auth.getUser()
    const doctorId = user?.id || "system"
    
    await this.supabase.from("notifications").insert({
      title: payload.title,
      message: payload.body || payload.title,
      notification_type: payload.type || "general",
      user_id: payload.patientId,
      data: {
        type: payload.type || "general",
        patientId: payload.patientId,
        doctorId: doctorId,
        url: payload.url || "/notifications",
        timestamp: new Date().toISOString()
      },
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  // Helper methods - KEEP THEM SIMPLE
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
}

export const pushNotifications = new PushNotificationService()