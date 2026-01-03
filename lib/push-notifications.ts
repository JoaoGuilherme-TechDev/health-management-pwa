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

  private async sendWebPush(subscription: any, payload: any): Promise<boolean> {
    try {
      console.log("🔔 [WEB-PUSH] Sending via webhook...")

      const response = await fetch("/api/push/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          title: payload.title,
          body: payload.body,
          data: payload.data,
        }),
      })

      const result = await response.json()
      console.log("📡 [WEB-PUSH] Webhook response:", result)

      return result.success === true
    } catch (error) {
      console.error("❌ [WEB-PUSH] Webhook failed:", error)
      return false
    }
  }

  // Enviar notificação para um paciente
  async sendToPatient(payload: NotificationPayload) {
    try {
      console.log("🚀 [PUSH] Starting push notification for patient:", payload.patientId)
      console.log("📦 Payload:", payload)

      // STEP 1: Store in database (for notification center)
      const stored = await this.storeInDatabase(payload)
      console.log("💾 Database storage:", stored ? "✅" : "❌")

      // STEP 2: Send via web-push API (for actual push notifications)
      const apiResult = await this.sendViaWebPush(payload)
      console.log("📡 Web-push API:", apiResult.success ? "✅" : "❌")

      // STEP 3: If web-push fails, try local notification as fallback
      if (!apiResult.success) {
        console.log("🔄 Trying local notification fallback...")
        const localResult = await this.sendLocalNotification(payload)
        console.log("📱 Local notification:", localResult ? "✅" : "❌")
      }

      return {
        success: true,
        storedInDatabase: stored,
        webPushSent: apiResult.success,
        message: stored ? "Notificação armazenada" : "Erro ao armazenar",
      }
    } catch (error: any) {
      console.error("❌ [PUSH] Error sending notification:", error)
      throw error
    }
  }

  // Send via web-push API (the real push notification)
  private async sendViaWebPush(payload: NotificationPayload) {
    try {
      console.log("📤 [WEB-PUSH] Calling API...")

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

      console.log("📡 [WEB-PUSH] API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ [WEB-PUSH] API error:", response.status, errorText)
        return { success: false, error: errorText }
      }

      const result = await response.json()
      console.log("✅ [WEB-PUSH] API success:", result)
      return { success: true, result }
    } catch (error: any) {
      console.error("❌ [WEB-PUSH] API failed:", error)
      return { success: false, error: error.message }
    }
  }

  // Local notification (like test button - works when you're the patient)
  private async sendLocalNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      if (typeof window === "undefined") return false
      if (!("Notification" in window)) {
        return false
      }

      // Request permission if needed
      if (Notification.permission === "denied") {
        console.log("❌ [LOCAL] Notification permission denied")
        return false
      }

      if (Notification.permission !== "granted") {
        console.log("🔔 [LOCAL] Requesting notification permission...")
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          console.log("❌ [LOCAL] Permission not granted")
          return false
        }
      }

      // Create direct notification without service worker
      const notification = new Notification(payload.title, {
        body: payload.body || payload.title,
        icon: "/icon-light-32x32.png",
        badge: "/badge-72x72.png",
        requireInteraction: true,
        silent: false,
        tag: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })

      notification.addEventListener("click", () => {
        window.location.href = payload.url || "/notifications"
        notification.close()
      })

      console.log("✅ [LOCAL] Direct notification shown")
      return true
    } catch (error) {
      console.error("❌ [LOCAL] Direct notification failed:", error)
      return false
    }
  }

  // Store in database (always works)
  private async storeInDatabase(payload: NotificationPayload): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
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
          timestamp: new Date().toISOString(),
        },
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      console.log("💾 [DB] Stored in database for patient:", payload.patientId)
      return true
    } catch (error) {
      console.error("❌ [DB] Database storage failed:", error)
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
