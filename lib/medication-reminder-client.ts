"use client"

import { createMedicationReminders } from "@/app/actions/create-medication-reminders"

let reminderInterval: NodeJS.Timeout | null = null

export function startMedicationReminderCheck() {
  if (reminderInterval) {
    clearInterval(reminderInterval)
  }

  // Check every minute
  reminderInterval = setInterval(async () => {
    try {
      await createMedicationReminders()
    } catch (error) {
      console.error("[v0] Medication reminder check failed:", error)
    }
  }, 60000) // 60 seconds

  // Also run immediately
  createMedicationReminders().catch((error) => {
    console.error("[v0] Initial medication reminder check failed:", error)
  })
}

export function stopMedicationReminderCheck() {
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = null
  }
}
