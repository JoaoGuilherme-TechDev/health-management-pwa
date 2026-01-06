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

      // SECOND: Try to send via API (for real push notifications)
      const apiResult = await this.sendViaAPI(payload)

      // THIRD: Only show local notification if current user IS the patient
      const localResult = await this.sendLocalNotificationIfPatient(payload)

      return {
        storedInDB: true,
        apiSuccess: apiResult,
        localSuccess: localResult,
        message: "Notificação enviada ao paciente",
      }
    } catch (error) {
      console.error("❌ [PUSH] Error sending notification:", error)
      throw error
    }
  }

  // Send via API (for push to patient's other devices)
  private async sendViaAPI(payload: NotificationPayload): Promise<boolean> {
    try {
      console.log("📤 [PUSH] Trying API for patient:", payload.patientId)

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
          type: payload.type || "info",
        }),
      })

      if (!response.ok) {
        console.log("⚠️ [PUSH] API not configured or patient has no push subscription")
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

  // ONLY show local notification if current user IS the patient
  private async sendLocalNotificationIfPatient(payload: NotificationPayload): Promise<boolean> {
    try {
      // Check if we're in browser
      if (typeof window === "undefined") return false

      // Check if current user is the patient
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user || user.id !== payload.patientId) {
        console.log("👨‍⚕️ Current user is doctor, not showing local notification")
        return false
      }

      // Only proceed if current user IS the patient
      console.log("👤 Current user IS the patient, showing local notification")

      if (!("Notification" in window) || Notification.permission !== "granted") {
        console.log("🔕 Patient hasn't granted notification permission")
        return false
      }

      if (!("serviceWorker" in navigator)) {
        console.log("🔕 Service worker not supported")
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const uniqueTag = `patient-local-${Date.now()}`

      await registration.showNotification(payload.title, {
        body: payload.body || payload.title,
        icon: "/icon-light-32x32.png",
        badge: "/icon-light-32x32.png",
        tag: uniqueTag,
        requireInteraction: true,
        data: {
          type: payload.type || "general",
          url: payload.url || "/notifications",
          patientId: payload.patientId,
          source: "patient-local",
        },
      })

      console.log("✅ [PUSH] Local notification shown to PATIENT")
      return true
    } catch (error) {
      console.error("❌ [PUSH] Local notification failed:", error)
      return false
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
        action_url: payload.url || "/notifications",
        is_read: false,
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
      title: "📋 Nova Prescrição Médica",
      body: `Você recebeu uma nova prescrição: ${prescriptionTitle}`,
      url: `/patient/prescriptions`,
      type: "prescription_created",
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

  async sendNewMedicationReminder(patientId: string, medicationName: string) {
    return this.sendToPatient({
      patientId,
      title: "⏰ Lembrete de Medicamento",
      body: `Lembrete: tome ${medicationName}`,
      url: `/patient/medications`,
      type: "medication_reminder",
    })
  }

  async sendScheduledMedicationReminder(patientId: string, medicationName: string, scheduledTime: string) {
    return this.sendToPatient({
      patientId,
      title: `⏰ Horário de tomar ${medicationName}`,
      body: `Às ${scheduledTime} - ${medicationName}`,
      url: `/patient/medications`,
      type: "medication_reminder",
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
      url: `/patient`,
      type: "supplement_created",
    })
  }
}

// Instância global
export const pushNotifications = new PushNotificationService()
