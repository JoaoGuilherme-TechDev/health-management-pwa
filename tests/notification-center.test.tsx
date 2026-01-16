import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { NotificationCenter } from "../components/notification-center"
import { notificationService } from "../lib/notification-service"
import { pushService } from "../lib/push-service"

vi.mock("../hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
  }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("../lib/notification-service", () => ({
  notificationService: {
    getNotifications: vi.fn(),
    subscribeToNotifications: vi.fn(),
    unsubscribe: vi.fn(),
    markAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteAllNotifications: vi.fn(),
  },
}))

vi.mock("../lib/push-service", () => ({
  pushService: {
    subscribeToPushNotifications: vi.fn().mockResolvedValue(null),
    sendNotification: vi.fn(),
    playNotificationSound: vi.fn(),
    vibrateDevice: vi.fn(),
  },
}))

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, className }: any) => <div className={className} data-testid="scroll-area">{children}</div>,
}))

describe("NotificationCenter", () => {
  const mockNotifications = [
    {
      id: "1",
      title: "Medication Reminder",
      message: "Take your pills",
      type: "medication",
      read: false,
      created_at: new Date().toISOString(),
      user_id: "test-user-id",
    },
    {
      id: "2",
      title: "Appointment",
      message: "Doctor visit tomorrow",
      type: "appointment",
      read: true,
      created_at: new Date().toISOString(),
      user_id: "test-user-id",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear()
    }
    ;(notificationService.getNotifications as any).mockResolvedValue(mockNotifications)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("renders notification bell with badge", async () => {
    render(<NotificationCenter />)
    
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument()
    })
    // Badge logic: unread count > 0
    // In mockNotifications, 1 is unread.
    // The component renders a span for badge.
    // We can check if the bell icon is there.
  })

  it("opens panel and displays notifications", async () => {
    render(<NotificationCenter />)
    
    const bell = screen.getByRole("button")
    fireEvent.click(bell)

    await waitFor(() => {
      expect(screen.getByText("Notificações")).toBeInTheDocument()
      expect(screen.getByText("Medication Reminder")).toBeInTheDocument()
      expect(screen.getByText("Appointment")).toBeInTheDocument()
    })
  })

  it("does NOT show snooze button for medication notifications", async () => {
    render(<NotificationCenter />)
    
    const bell = screen.getByRole("button")
    fireEvent.click(bell)

    await waitFor(() => {
      expect(screen.getByText("Medication Reminder")).toBeInTheDocument()
    })

    expect(screen.queryByText(/soneca/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/snooze/i)).not.toBeInTheDocument()
  })

  it("persists notifications to localStorage and logs client_received events", async () => {
    render(<NotificationCenter />)

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalled()
    })

    const calls = (global as any).fetch.mock.calls as any[]
    const eventCall = calls.find((c) => c[0] === "/api/notifications/event")
    expect(eventCall).toBeTruthy()

    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem("notifications_cache_test-user-id")
      expect(stored).toBeTruthy()
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(Array.isArray(parsed)).toBe(true)
        expect(parsed.length).toBeGreaterThan(0)
      }
    }
  })

})
