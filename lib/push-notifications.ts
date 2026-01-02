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

  // SIMPLE: Send notification
  async sendToPatient(payload: NotificationPayload) {
    try {
      console.log("🚀 [PUSH] Sending:", payload)
      
      // 1. Store in database (always)
      await this.storeInDatabase(payload)
      
      // 2. Try to send push notification
      const pushResult = await this.trySendPush(payload)
      
      return {
        success: true,
        stored: true,
        pushSent: pushResult.success,
        message: pushResult.message || "Notificação armazenada"
      }
    } catch (error: any) {
      console.error("❌ [PUSH] Error:", error)
      return {
        success: false,
        error: error.message,
        message: "Erro ao processar notificação"
      }
    }
  }

  // Try to send push notification
  private async trySendPush(payload: NotificationPayload) {
    try {
      console.log("📤 [PUSH] Trying push API...")
      
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: payload.patientId,
          title: payload.title,
          body: payload.body || payload.title,
          url: payload.url || "/notifications",
          type: payload.type || "general"
        }),
      })

      const result = await response.json()
      console.log("📡 [PUSH] API response:", result)
      
      if (!response.ok) {
        return { success: false, message: result.error || "API error" }
      }
      
      return { success: true, message: result.message }
      
    } catch (error) {
      console.error("📡 [PUSH] API failed:", error)
      return { 
        success: false, 
        message: "API call failed - patient may not have push enabled" 
      }
    }
  }

  // Store in database (always works)
  private async storeInDatabase(payload: NotificationPayload) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      const doctorId = user?.id || "system"
      
      await this.supabase.from("notifications").insert({
        title: payload.title,
        message: payload.body || payload.title,
        notification_type: payload.type || "general",
        user_id: payload.patientId, // Store for PATIENT
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
      
      console.log("💾 [PUSH] Stored in database for patient:", payload.patientId)
      return true
    } catch (error) {
      console.error("💾 [PUSH] Database error:", error)
      // Don't throw - we still want to try push even if DB fails
      return false
    }
  }

  // Helper methods (unchanged)
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
}

// Instância global
export const pushNotifications = new PushNotificationService()