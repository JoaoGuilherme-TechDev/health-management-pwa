export interface AppointmentReminderConfig {
  leadMinutes: number
  windowMinutes: number
}

export function shouldTriggerAppointmentReminder(
  nowLocal: Date,
  appointmentAtLocal: Date,
  config: AppointmentReminderConfig = { leadMinutes: 1440, windowMinutes: 1 },
): boolean {
  const leadMs = config.leadMinutes * 60 * 1000
  const halfWindowMs = config.windowMinutes * 60 * 1000

  const triggerAt = new Date(appointmentAtLocal.getTime() - leadMs)
  const diffMs = nowLocal.getTime() - triggerAt.getTime()

  return Math.abs(diffMs) <= halfWindowMs
}

