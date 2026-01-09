import { createClient } from "@/lib/supabase/client"

interface NotificationPayload {
  title: string
  body?: string
  url?: string
  type?:
    | "prescription_created"
    | "appointment_reminder"
    | "appointment_scheduled"
    | "diet_created"
    | "medication_created"
    | "medication_reminder"
    | "supplement_created"
    | "evolution_created"
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

      // SECOND: Send real push notification via API
      let apiSuccess = false
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || ''
        const response = await fetch(`${baseUrl}/api/push/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId: payload.patientId,
            title: payload.title,
            body: payload.body,
            url: payload.url,
            type: payload.type,
          }),
        })

        const result = await response.json()
        apiSuccess = result.success
        console.log("📡 [PUSH] API Response:", result)
      } catch (apiError) {
        console.error("❌ [PUSH] API call failed:", apiError)
      }

      return {
        storedInDB: true,
        apiSuccess,
        message: apiSuccess ? "Notificação enviada com sucesso" : "Notificação salva, mas falha ao enviar push",
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
    try {
      // 1. Get current date and time in Brasilia timezone
      const now = new Date()
      const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
      const currentHour = brazilTime.getHours().toString().padStart(2, "0")
      const currentMinute = brazilTime.getMinutes().toString().padStart(2, "0")
      const currentTime = `${currentHour}:${currentMinute}`

      // 2. Fetch medication details to check date range
      const { data: medication, error: medError } = await this.supabase
        .from("medications")
        .select("start_date, end_date")
        .eq("id", medicationId)
        .single()

      if (medError || !medication) {
        console.error("Error fetching medication details:", medError)
        return { storedInDB: false, apiSuccess: false, localSuccess: false, message: "Medication not found" }
      }

      // 3. Check date range
      const startDate = new Date(medication.start_date)
      const endDate = medication.end_date ? new Date(medication.end_date) : null

      // Normalize dates for comparison (remove time component)
      const today = new Date(brazilTime.getFullYear(), brazilTime.getMonth(), brazilTime.getDate())
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())

      if (today < start) {
        console.log(`Medication ${medicationName} hasn't started yet. Start date: ${medication.start_date}`)
        return { storedInDB: false, apiSuccess: false, localSuccess: false, message: "Medication not started" }
      }

      if (endDate) {
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        if (today > end) {
          console.log(`Medication ${medicationName} has ended. End date: ${medication.end_date}`)
          return { storedInDB: false, apiSuccess: false, localSuccess: false, message: "Medication ended" }
        }
      }

      // 4. Fetch schedules
      const { data: schedules, error: schedError } = await this.supabase
        .from("medication_schedules")
        .select("scheduled_time")
        .eq("medication_id", medicationId)

      if (schedError || !schedules || schedules.length === 0) {
        console.log(`No schedules found for medication ${medicationName}`)
        return { storedInDB: false, apiSuccess: false, localSuccess: false, message: "No schedules" }
      }

      // 5. Check if current time matches any schedule
      const isTimeToTake = schedules.some((schedule) => schedule.scheduled_time.startsWith(currentTime))

      if (!isTimeToTake) {
        console.log(
          `Not time to take ${medicationName}. Current: ${currentTime}, Schedules: ${schedules.map((s) => s.scheduled_time).join(", ")}`,
        )
        return { storedInDB: false, apiSuccess: false, localSuccess: false, message: "Not scheduled time" }
      }

      console.log(`It's time to take ${medicationName}! Sending notification...`)

 

      return this.sendToPatient({
        patientId,
        title: "⏰Hora de Tomar Seu Remédio",
        body: `Está na hora de tomar ${medicationName}`,
        url: `/patient/medications?action=confirm&medicationId=${medicationId}&name=${encodeURIComponent(medicationName)}`,
        type: "medication_reminder",
      })
    } catch (error) {
      console.error("Error in sendNewMedicationSchedule:", error)
      throw error
    }
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
