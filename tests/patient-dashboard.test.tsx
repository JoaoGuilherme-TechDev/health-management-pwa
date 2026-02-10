import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import PatientDashboard from "../app/patient/page"

// Mock hooks
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
    loading: false,
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("PatientDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementation
    mockFetch.mockImplementation((url: string) => {
      // Auth check
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: "test-user-id" } }),
        })
      }

      // Profile
      if (url.includes('table=profiles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ first_name: "John" }]),
        })
      }

      // Count queries (stats)
      if (url.includes('/api/data')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(Array(10).fill({})), // Return 10 items to match count check
        })
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("renders dashboard with stats", async () => {
    render(<PatientDashboard />)

    await waitFor(() => {
      expect(screen.getByText("Bem-vindo(a), John!")).toBeInTheDocument()
    })

    // Check for stats
    expect(screen.getByText("Medicamentos")).toBeInTheDocument()
    
    // We expect 10 because our mock returns 10 items for list queries
    const counts = screen.getAllByText("10")
    expect(counts.length).toBeGreaterThan(0)
  })

  it("polls for updates", async () => {
    vi.useFakeTimers()
    render(<PatientDashboard />)

    // Initial load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // Advance time by 15 seconds (polling interval)
    vi.advanceTimersByTime(15000)

    // Check if fetch was called again
    // We expect multiple calls (profile + 5 stats queries) per cycle
    // Initial: 6 calls. +1 cycle: +6 calls. Total > 6.
    expect(mockFetch.mock.calls.length).toBeGreaterThan(6)

    vi.useRealTimers()
  })
})
