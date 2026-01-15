import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import PatientDashboard from "../app/patient/page"

// Mock hooks
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
  }),
}))

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
  },
  from: vi.fn(),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}))

describe("PatientDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset specific mocks
    mockSupabase.from.mockImplementation((table: string) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }
      
      if (table === "profiles") {
        builder.single.mockResolvedValue({ data: { first_name: "John" } })
      } else {
        // Return count for stats - using Promise-like then for await
        builder.then = (callback: any) => callback({ count: 10, data: [] })
      }
      return builder
    })
  })

  it("renders dashboard with stats", async () => {
    render(<PatientDashboard />)

    await waitFor(() => {
      expect(screen.getByText("Bem-vindo(a), John!")).toBeInTheDocument()
    })

    // Check for stats
    // The component renders "Medicamentos" and the count "10"
    expect(screen.getByText("Medicamentos")).toBeInTheDocument()
    // We expect 10 because our mock returns count: 10 for all list queries
    // There are multiple "10"s on the screen probably (one for each card), so getAllByText might be needed or just getByText if it collapses.
    const counts = screen.getAllByText("10")
    expect(counts.length).toBeGreaterThan(0)
  })

  it("subscribes to real-time channels with correct names", async () => {
    render(<PatientDashboard />)

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith("dashboard-medications-test-user-id")
      // Check for the FIXED channel name
      expect(mockSupabase.channel).toHaveBeenCalledWith("dashboard-prescriptions-test-user-id")
      // Check for unique channels
      expect(mockSupabase.channel).toHaveBeenCalledWith("dashboard-appointments-test-user-id")
    })
  })
})
