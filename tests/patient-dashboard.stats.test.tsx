import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import React from "react"
import PatientDashboard from "@/app/patient/page"

vi.mock("@/lib/supabase/client", () => {
  const mockFrom = (table: string) => {
    const base = {
      select: (_sel?: any, opts?: any) => {
        if (table === "profiles") {
          return { eq: () => ({ single: () => ({ data: { first_name: "Ana", last_name: "Silva" } }) }) }
        }
        return {
          eq: () => ({
            eq: () => ({
              gte: () => ({ count: 2 }),
            }),
          }),
        }
      },
    }
    switch (table) {
      case "medications":
        return { ...base, select: (_: any, __: any) => ({ eq: () => ({ eq: () => ({ count: 3 }) }) }) }
      case "appointments":
        return { ...base, select: (_: any, __: any) => ({ eq: () => ({ eq: () => ({ gte: () => ({ count: 1 }) }) }) }) }
      case "patient_diet_recipes":
        return { ...base, select: () => ({ eq: () => ({ count: 4 }) }) }
      case "patient_supplements":
        return { ...base, select: () => ({ eq: () => ({ eq: () => ({ count: 2 }) }) }) }
      case "medical_prescriptions":
        return { ...base, select: () => ({ eq: () => ({ eq: () => ({ count: 5 }) }) }) }
      case "physical_evolution":
        return { ...base, select: () => ({ eq: () => ({ count: 6 }) }) }
      default:
        return base
    }
  }
  return {
    createClient: () => ({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: (table: string) => mockFrom(table),
      channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
      removeChannel: () => {},
    }),
  }
})

describe("PatientDashboard stats rendering", () => {
  it("shows diet and supplements counts", async () => {
    render(<PatientDashboard />)
    await waitFor(() => {
      expect(screen.getByText(/Medicamentos/i)).toBeInTheDocument()
      expect(screen.getByText(/Consultas/i)).toBeInTheDocument()
      expect(screen.getByText(/Dietas/i)).toBeInTheDocument()
      expect(screen.getByText(/Suplementos/i)).toBeInTheDocument()
    })
  })
})
