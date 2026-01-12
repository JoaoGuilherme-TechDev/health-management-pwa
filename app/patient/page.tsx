"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pill, Calendar, Heart, Activity, Utensils, AlertCircle, FileText, ChartLine } from "lucide-react"
import Link from "next/link"

interface Profile {
  first_name: string
  last_name: string
  email: string
  phone?: string
  allergies?: string
}

interface HealthStats {
  activePrescriptions: number
  activeMedications: number
  upcomingAppointments: number
  activeDiets: number
  supplements: number
  evolution: number
}

interface DietRecipe {
  id: string
  title: string
  image_url?: string
  // ... existing fields ...
}

interface Supplement {
  id: string
  supplement_name: string
  image_url?: string
  // ... existing fields ...
}

export default function PatientDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<HealthStats>({
    activePrescriptions: 0,
    activeMedications: 0,
    upcomingAppointments: 0,
    activeDiets: 0,
    supplements: 0,
    evolution: 0,
  })

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true
    const channels: any[] = []

    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        // Load profile
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (isMounted && profileData) {
          setProfile(profileData)
        }

        // Load stats
        const [medRes, appoRes, dietRes, suppRes, presRes, evolRes] = await Promise.all([
          supabase.from("medications").select("*", { count: "exact" }).eq("user_id", user.id).eq("is_active", true),
          supabase
            .from("appointments")
            .select("*", { count: "exact" })
            .eq("patient_id", user.id)
            .eq("status", "scheduled")
            .gte("scheduled_at", new Date().toISOString()),
          supabase.from("patient_diet_recipes").select("*", { count: "exact" }).eq("patient_id", user.id),
          supabase.from("patient_supplements").select("*", { count: "exact" }).eq("patient_id", user.id).eq("is_active", true),
          supabase.from("medical_prescriptions").select("*", { count: "exact" }).eq("patient_id", user.id).eq("is_active", true),
          supabase.from("physical_evolution").select("*", { count: "exact" }).eq("user_id", user.id),
        ])

        if (isMounted) {
          setStats({  
            activeMedications: medRes.count || 0,
            upcomingAppointments: appoRes.count || 0,
            activeDiets: dietRes.count || 0,
            supplements: suppRes.count || 0,
            activePrescriptions: presRes.count || 0,
            evolution: evolRes.count || 0,
          })
        }
      } catch (error) {
        console.error("[v0] Error loading dashboard:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    // Subscribe to real-time updates for all tables
    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !isMounted) return

      const subscriptions: any[] = []

      // Medications channel
      const medicationsChannel = supabase
        .channel(`dashboard-medications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "medications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log("[v0] Medications updated")
            if (isMounted) loadData()
          },
        )
        .subscribe((status) => {
          console.log("[v0] Medications subscription status:", status)
        })
      subscriptions.push(medicationsChannel)

      const evolutionChannel = supabase
        .channel(`dashboard-evolution-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "physical_evolution",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log("[v0] Evolution updated")
            if (isMounted) loadData()
          },
        )
      // Appointments channel
      const appointmentsChannel = supabase
        .channel(`dashboard-appointments-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointments",
            filter: `patient_id=eq.${user.id}`,
          },
          () => {
            console.log("[v0] Appointments updated")
            if (isMounted) loadData()
          },
        )
        .subscribe((status) => {
          console.log("[v0] Appointments subscription status:", status)
        })
      subscriptions.push(appointmentsChannel)

      const dietsChannel = supabase
        .channel(`dashboard-diets-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "patient_diet_recipes",
            filter: `patient_id=eq.${user.id}`,
          },
          () => {
            console.log("[v0] Diets updated")
            if (isMounted) loadData()
          },
        )
        .subscribe((status) => {
          console.log("[v0] Diets subscription status:", status)
        })
      subscriptions.push(dietsChannel)

      const supplementsChannel = supabase
        .channel(`dashboard-supplements-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "patient_supplements",
            filter: `patient_id=eq.${user.id}`,
          },
          () => {
            console.log("[v0] Supplements updated")
            if (isMounted) loadData()
          },
        )
        .subscribe((status) => {
          console.log("[v0] Supplements subscription status:", status)
        })
      subscriptions.push(supplementsChannel)

      const recipesChannel = supabase
        .channel(`dashboard-recipes-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "patient_diet_recipes",
            filter: `patient_id=eq.${user.id}`,
          },
          () => {
            console.log("[v0] Recipes updated")
            if (isMounted) loadData()
          },
        )
        .subscribe((status) => {
          console.log("[v0] Recipes subscription status:", status)
        })
      subscriptions.push(recipesChannel)

      channels.push(...subscriptions)
    }

    setupRealtime()

    return () => {
      isMounted = false
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-muted-foreground">Carregando seu painel...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bem-vindo(a), {profile?.first_name || "Paciente"}!</h1>
        <p className="text-muted-foreground mt-2">Visão geral do seu gerenciamento de saúde</p>
      </div>

      {/* Health Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <StatCard
          title="Medicamentos"
          value={stats.activeMedications}
          icon={Pill}
          href="/patient/medications"
          color="blue"
        />
        <StatCard
          title="Consultas"
          value={stats.upcomingAppointments}
          icon={Calendar}
          href="/patient/appointments"
          color="green"
        />
        <StatCard title="Receitas Médicas" value={stats.activePrescriptions} icon={FileText} href="/patient/prescriptions" color="red" />
        <StatCard title="Dietas" value={stats.activeDiets} icon={Utensils} href="/patient/diet" color="orange" />
        <StatCard
          title="Suplementos"
          value={stats.supplements}
          icon={Activity}
          href="/patient/supplements"
          color="purple"
        />
        <StatCard title="Evolução Médica" value={stats.evolution} icon={ChartLine} href="/patient/evolution" color="teal" />
        
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: "blue" | "green" | "orange" | "purple" | "red" | "teal"
}

function StatCard({ title, value, icon: Icon, href, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
    purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    red: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
    teal: "bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400",
  }

  return (
    <Link href={href}>
      <Card className="hover:border-primary transition-colors cursor-pointer h-full">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{value}</p>
            </div>
            <div className={`p-2 md:p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
