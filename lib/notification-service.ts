"use client"

export interface Notification {
  id: string
  user_id: string
  title: string
  description?: string
  message?: string
  notes?: string
  meal_type?: string
  type:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "medication"
    | "appointment"
    | "prescription"
    | "diet"
    | "supplement"
    | "evolution"
  read: boolean
  created_at: string
  scheduled_at?: string
  delivered_at?: string
  notification_type?: string
  action_url?: string
  related_id?: string
}

class NotificationService {
  
  async subscribeToNotifications(patientId: string, callback: (notification: Notification) => void) {
    // Polling is now handled by components (e.g. NotificationCenter)
    // This method is kept for API compatibility but does nothing active.
    console.log("[v0] subscribeToNotifications called - polling should be handled by component")
  }

  private mapNotificationType(notificationType: string): Notification["type"] {
    if (notificationType?.includes("appointment")) return "appointment"
    if (notificationType?.includes("medication")) return "medication"
    if (notificationType?.includes("prescription")) return "prescription"
    if (notificationType?.includes("diet")) return "diet"
    if (notificationType?.includes("supplement")) return "supplement"
    if (notificationType?.includes("evolution")) return "evolution"
    return "info"
  }

  unsubscribe() {
    // No-op
  }

  async getNotifications(patientId: string) {
    try {
      const res = await fetch(`/api/data?table=notifications&match_key=user_id&match_value=${patientId}&limit=50`)
      if (!res.ok) throw new Error("Failed to fetch notifications")
      
      const data = await res.json()
      // Sort manually (in case API fallback didn't sort)
      const sortedData = Array.isArray(data) 
        ? data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : []
        
      return sortedData.map((raw: any) => ({
        ...raw,
        read: raw.is_read, // Map database column is_read to frontend property read
        type: this.mapNotificationType(raw.type || raw.notification_type),
      }))
    } catch (error) {
      console.error("Error getting notifications:", error)
      return []
    }
  }

  async markAsRead(notificationId: string) {
    try {
      const res = await fetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId })
      })
      if (!res.ok) throw new Error("Failed to mark as read")
    } catch (error) {
       console.error("Error marking as read:", error)
       throw error
    }
  }

  async markAllAsRead(patientId: string) {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: patientId })
      })
      if (!res.ok) throw new Error("Failed to mark all as read")
    } catch (error) {
       console.error("Error marking all as read:", error)
       throw error
    }
  }

  async deleteNotification(notificationId: string) {
    try {
      const res = await fetch(`/api/data?table=notifications&match_key=id&match_value=${notificationId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error("Failed to delete notification")
    } catch (error) {
      console.error("Error deleting notification:", error)
      throw error
    }
  }

  async deleteAllNotifications(patientId: string) {
    try {
      const res = await fetch('/api/notifications/delete-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: patientId })
      })
      if (!res.ok) throw new Error("Failed to delete all notifications")
    } catch (error) {
       console.error("Error deleting all notifications:", error)
       throw error
    }
  }

  async getNotificationSettings(patientId: string) {
    try {
        const res = await fetch(`/api/data?table=notification_settings&match_key=user_id&match_value=${patientId}`)
        if (!res.ok) throw new Error("Failed to fetch settings")
        const data = await res.json()
        return Array.isArray(data) ? data : []
    } catch (error) {
        console.error("Error getting settings:", error)
        throw error
    }
  }

  async updateNotificationSetting(
    patientId: string,
    notificationType: string,
    enabled: boolean,
    soundEnabled?: boolean,
    vibrationEnabled?: boolean,
    ledEnabled?: boolean,
  ) {
    // Check if exists
    try {
        const res = await fetch(`/api/data?table=notification_settings&match_key=user_id&match_value=${patientId}`)
        let settings = []
        if (res.ok) {
            settings = await res.json()
        }
        
        const existing = settings.find((s: any) => s.notification_type === notificationType)
        
        const payload = {
          user_id: patientId,
          notification_type: notificationType,
          enabled,
          sound_enabled: soundEnabled ?? true,
          vibration_enabled: vibrationEnabled ?? true,
          led_enabled: ledEnabled ?? true,
        }

        if (existing) {
            // Update
             await fetch(`/api/data?table=notification_settings&match_key=id&match_value=${existing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
             })
        } else {
            // Insert
             await fetch(`/api/data?table=notification_settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
             })
        }
    } catch (error) {
        console.error("Error updating setting:", error)
        throw error
    }
  }

  async confirmMedicationTaken(userId: string, medicationId: string) {
    try {
        await fetch(`/api/data?table=medication_adherence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                medication_id: medicationId,
                taken_at: new Date().toISOString(),
                status: "completed",
            })
        })
    } catch (error) {
        console.error("Error confirming medication:", error)
        throw error
    }
  }

  async fetchUserNotifications(userId: string) {
    // This seems similar to getNotifications but only unread?
    // The original code filtered read=false
    try {
      const res = await fetch(`/api/data?table=notifications&match_key=user_id&match_value=${userId}`)
      if (!res.ok) return { data: [], error: "Failed" }
      
      const data = await res.json()
      const unread = Array.isArray(data) 
        ? data.filter((n: any) => !n.read).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : []
        
      return { data: unread, error: null }
    } catch (error) {
        return { data: [], error }
    }
  }

  async markNotificationAsRead(notificationId: string) {
    // Alias for markAsRead but returns { error }
    try {
        await this.markAsRead(notificationId)
        return { error: null }
    } catch (error) {
        return { error }
    }
  }
}

export const notificationService = new NotificationService()
