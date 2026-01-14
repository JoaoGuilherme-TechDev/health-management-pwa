import { describe, it, expect } from "vitest"
import { shouldTriggerAppointmentReminder } from "../lib/appointment-reminder-utils"

describe("shouldTriggerAppointmentReminder", () => {
  it("triggers exactly 24h before within window", () => {
    const appointment = new Date("2024-03-10T12:00:00-03:00")
    const now = new Date(appointment.getTime() - 24 * 60 * 60 * 1000)

    const result = shouldTriggerAppointmentReminder(now, appointment, {
      leadMinutes: 1440,
      windowMinutes: 1,
    })

    expect(result).toBe(true)
  })

  it("does not trigger outside the window", () => {
    const appointment = new Date("2024-03-10T12:00:00-03:00")
    const now = new Date(appointment.getTime() - 24 * 60 * 60 * 1000 - 5 * 60 * 1000)

    const result = shouldTriggerAppointmentReminder(now, appointment, {
      leadMinutes: 1440,
      windowMinutes: 1,
    })

    expect(result).toBe(false)
  })

  it("handles DST jump forward correctly around boundary", () => {
    const appointment = new Date("2024-10-27T12:00:00+02:00")
    const now = new Date(appointment.getTime() - 24 * 60 * 60 * 1000)

    const result = shouldTriggerAppointmentReminder(now, appointment, {
      leadMinutes: 1440,
      windowMinutes: 2,
    })

    expect(result).toBe(true)
  })

  it("supports different configurable lead time", () => {
    const appointment = new Date("2024-03-10T12:00:00-03:00")
    const now = new Date(appointment.getTime() - 2 * 60 * 60 * 1000)

    const result = shouldTriggerAppointmentReminder(now, appointment, {
      leadMinutes: 120,
      windowMinutes: 1,
    })

    expect(result).toBe(true)
  })
})
