import { describe, it, expect, beforeEach } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import React from "react"
import { NotificationCenter } from "@/components/notification-center"

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}))

vi.mock("@/lib/notification-service", () => ({
  notificationService: {
    getNotifications: async () => [],
    subscribeToNotifications: () => ({ status: "SUBSCRIBED" }),
    unsubscribe: () => {},
    markAllAsRead: async () => {},
    deleteAllNotifications: async () => {},
    markAsRead: async () => {},
    deleteNotification: async () => {},
  },
}))

vi.mock("@/lib/push-service", () => ({
  pushService: {
    subscribeToPushNotifications: () => {},
    sendNotification: () => {},
  },
}))

describe("NotificationCenter responsive behavior", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }))
  })

  it("renders panel within viewport bounds on small screens", () => {
    ;(window as any).innerWidth = 360
    ;(window as any).innerHeight = 640
    const { getByRole, container } = render(<NotificationCenter />)
    const button = getByRole("button")
    fireEvent.click(button)
    const panel = container.querySelector("div.z-50")
    expect(panel).toBeTruthy()
    const style = (panel as HTMLElement).style
    expect(parseInt(style.width)).toBeLessThanOrEqual(360)
    expect(parseInt(style.maxHeight)).toBeLessThanOrEqual(640)
  })

  it("renders panel with constrained width on larger screens", () => {
    ;(window as any).innerWidth = 1024
    ;(window as any).innerHeight = 800
    const { getByRole, container } = render(<NotificationCenter />)
    const button = getByRole("button")
    fireEvent.click(button)
    const panel = container.querySelector("div.z-50")
    const style = (panel as HTMLElement).style
    expect(parseInt(style.width)).toBeLessThanOrEqual(384)
    expect(parseInt(style.maxHeight)).toBeLessThanOrEqual(800)
  })
})
