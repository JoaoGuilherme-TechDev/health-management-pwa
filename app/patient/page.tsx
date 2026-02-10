"use client"

import type React from "react"

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
    evolution: 0
  })

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const authRes = await fetch('/api/auth/me')
        if (!authRes.ok) {
          if (isMounted) setLoading(false)
          return
        }
        const { user } = await authRes.json()

        if (!user) {
          if (isMounted) setLoading(false)
          return
        }

        // Load profile
        const profileRes = await fetch(`/api/data?table=profiles&match_key=id&match_value=${user.id}`)
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          const profile = Array.isArray(profileData) ? profileData[0] : profileData
          if (isMounted && profile) {
            setProfile(profile)
          }
        }

        // Load stats
        // We'll fetch data and count locally since /api/data returns all rows
        const fetchData = async (table: string, matchKey?: string, matchValue?: any) => {
          let url = `/api/data?table=${table}`
          if (matchKey && matchValue) {
            url += `&match_key=${matchKey}&match_value=${matchValue}`
          }
          const res = await fetch(url)
          if (!res.ok) return []
          return await res.json()
        }

        const [medications, appointments, diets, prescriptions, evolution] = await Promise.all([
            fetchData('medications', 'user_id', user.id),
            fetchData('appointments', 'patient_id', user.id),
            fetchData('patient_diet_recipes', 'patient_id', user.id),
            fetchData('medical_prescriptions', 'patient_id', user.id),
            fetchData('physical_evolution', 'user_id', user.id)
        ])

        if (isMounted) {
            // Filter appointments manually for status and date
            const upcomingAppointments = Array.isArray(appointments) ? appointments.filter((app: any) => 
                app.status === 'scheduled' && new Date(app.scheduled_at) >= new Date()
            ).length : 0

            const activeMedications = Array.isArray(medications) ? medications.filter((med: any) => med.is_active).length : 0

            setStats({  
            activeMedications: activeMedications,
            upcomingAppointments: upcomingAppointments,
            activeDiets: Array.isArray(diets) ? diets.length : 0,
            activePrescriptions: Array.isArray(prescriptions) ? prescriptions.length : 0,
            evolution: Array.isArray(evolution) ? evolution.length : 0,
            })
        }

      } catch (error) {
        console.error("[v0] Error loading dashboard:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    const POLL_INTERVAL_MS = process.env.NODE_ENV === 'test' ? 100 : 15000
    const interval = setInterval(() => {
        if (!document.hidden) loadData()
    }, POLL_INTERVAL_MS)
 

    return () => {
      isMounted = false
      clearInterval(interval)
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
  color: "blue" | "green" | "orange" | "red" | "teal"
}

function StatCard({ title, value, icon: Icon, href, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
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
