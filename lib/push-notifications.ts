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

  // Check if current user is a doctor
  private async isDoctor(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return false
      
      const { data: profile } = await this.supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      
      return profile?.role === "doctor" || profile?.role === "admin"
    } catch (error) {
      console.error("Error checking user role:", error)
      return false
    }
  }

  // Enviar notificação para um paciente (DOCTORS ONLY)
  async sendToPatient(payload: NotificationPayload) {
    try {
      console.log("🚀 [PUSH] Doctor sending push notification to patient:", payload.patientId)
      
      // Check if current user is a doctor
      const isDoctor = await this.isDoctor()
      if (!isDoctor) {
        console.error("❌ [PUSH] Only doctors can send push notifications")
        throw new Error("Apenas médicos podem enviar notificações para pacientes")
      }

      // Get doctor info
      const { data: { user: doctor } } = await this.supabase.auth.getUser()
      if (!doctor) {
        throw new Error("Médico não autenticado")
      }

      // Get patient info
      const { data: patient } = await this.supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", payload.patientId)
        .single()

      if (!patient) {
        throw new Error("Paciente não encontrado")
      }

      console.log(`👨‍⚕️ Doctor ${doctor.id} → Patient ${payload.patientId} (${patient.first_name} ${patient.last_name})`)

      // Store notification in database (for patient's notification center)
      await this.storeInDatabase(payload, doctor.id)
      
      // Send push notification via API
      const apiResult = await this.sendViaAPI(payload)
      
      console.log("✅ [PUSH] Notification sent successfully")
      
      return {
        success: true,
        patient: `${patient.first_name} ${patient.last_name}`,
        apiSuccess: apiResult,
        message: "Notificação enviada ao paciente"
      }
    } catch (error: any) {
      console.error("❌ [PUSH] Error sending notification:", error)
      throw error
    }
  }

  // Send via API (for push to patient's devices)
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
          // Add doctor info if needed
          doctorId: (await this.supabase.auth.getUser()).data.user?.id
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

  // Store in database for patient's notification center
  private async storeInDatabase(payload: NotificationPayload, doctorId: string): Promise<void> {
    try {
      const notificationType = payload.type || "general"
      
      await this.supabase.from("notifications").insert({
        title: payload.title,
        message: payload.body || payload.title,
        notification_type: notificationType,
        user_id: payload.patientId, // Store with PATIENT'S ID
        data: {
          type: notificationType,
          patientId: payload.patientId,
          doctorId: doctorId,
          url: payload.url || "/notifications",
          timestamp: new Date().toISOString(),
          fromDoctor: true
        },
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      console.log("✅ [PUSH] Stored in patient's notification database")
    } catch (error) {
      console.error("❌ [PUSH] Database storage failed:", error)
      throw error
    }
  }

  // Enviar notificação de nova prescrição (DOCTOR ONLY)
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