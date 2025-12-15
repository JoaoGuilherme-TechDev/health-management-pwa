"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pill, Calendar, Bell } from "lucide-react"
import Link from "next/link"

interface Profile {
  first_name: string
  last_name: string
  email: string
  phone?: string
  allergies?: string
}

export default function PatientDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeMedications: 0,
    upcomingAppointments: 0,
    unreadNotifications: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profileData) {
          setProfile(profileData)
        }

        const { count: medCount } = await supabase
          .from("medications")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .eq("is_active", true)

        const { count: appoCount } = await supabase
          .from("appointments")
          .select("*", { count: "exact" })
          .eq("patient_id", user.id)
          .eq("status", "scheduled")
          .gte("scheduled_at", new Date().toISOString())

        const { count: notifCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .eq("is_read", false)

        setStats({
          activeMedications: medCount || 0,
          upcomingAppointments: appoCount || 0,
          unreadNotifications: notifCount || 0,
        })
      }

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return <div className="text-center py-12">Carregando seu painel...</div>
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bem-vindo(a), {profile?.first_name || "Paciente"}!</h1>
        <p className="text-muted-foreground mt-2">Visão geral do seu gerenciamento de saúde</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Medicamentos Ativos" value={stats.activeMedications} icon={Pill} href="/patient/medications" />
        <StatCard
          title="Próximas Consultas"
          value={stats.upcomingAppointments}
          icon={Calendar}
          href="/patient/appointments"
        />
        <StatCard title="Notificações" value={stats.unreadNotifications} icon={Bell} href="/patient/notifications" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral da Saúde</CardTitle>
          <CardDescription>Visualize suas informações de saúde e atualizações do seu médico</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <Button asChild variant="outline" className="justify-start bg-transparent">
              <Link href="/patient/medications">
                <Pill className="h-4 w-4 mr-2" />
                Ver Medicamentos
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start bg-transparent">
              <Link href="/patient/appointments">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Consultas
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start bg-transparent">
              <Link href="/patient/settings">Ver Meu Perfil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Saúde</CardTitle>
          <CardDescription>Suas informações de saúde</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Endereço de E-mail</p>
              <p className="font-medium text-foreground">{profile?.email}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Nome Completo</p>
              <p className="font-medium text-foreground">
                {profile?.first_name} {profile?.last_name}
              </p>
            </div>
            {profile?.phone && (
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                <p className="font-medium text-foreground">{profile.phone}</p>
              </div>
            )}
            {profile?.allergies && (
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <p className="text-sm text-muted-foreground mb-1">Alergias</p>
                <p className="font-medium text-foreground">{profile.allergies}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, href }: any) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary transition-colors cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
