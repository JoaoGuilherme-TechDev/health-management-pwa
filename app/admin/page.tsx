"use client"

import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, Clock, AlertCircle, TrendingUp, Pill } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalMedications: 0,
    totalAppointments: 0,
    totalPrescriptions: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    const loadStats = async () => {
      const supabase = createClient()

      try {
        const { count: patientCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "patient")

        const { count: medCount } = await supabase.from("medications").select("*", { count: "exact", head: true })

        const { count: appointmentCount } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })

        const { count: prescriptionCount } = await supabase
          .from("medical_prescriptions")
          .select("*", { count: "exact", head: true })

        const { data: recentMeds } = await supabase
          .from("medications")
          .select("id, name, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(5)

        setStats({
          totalPatients: patientCount || 0,
          totalMedications: medCount || 0,
          totalAppointments: appointmentCount || 0,
          totalPrescriptions: prescriptionCount || 0,
        })

        setRecentActivity(recentMeds || [])
      } catch (error) {
        console.error("[v0] Erro ao carregar estatísticas:", error)
      }
    }

    loadStats()
    const interval = setInterval(loadStats, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-2">Monitore a atividade do sistema e gerencie operações de saúde</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Pacientes"
          value={stats.totalPatients}
          icon={Users}
          actionLink="/admin/patients"
          actionLabel="Gerenciar"
          color="blue"
        />
        <StatCard title="Medicamentos" value={stats.totalMedications} icon={Pill} color="green" />
        <StatCard title="Consultas" value={stats.totalAppointments} icon={Clock} color="purple" />
        <StatCard title="Prescrições" value={stats.totalPrescriptions} icon={AlertCircle} color="orange" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Quick Access Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Acesso Rápido</CardTitle>
            <CardDescription>Ferramentas administrativas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start h-10 bg-transparent" variant="outline">
              <a href="/admin/patients">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Pacientes
              </a>
            </Button>
            <Button asChild className="w-full justify-start h-10 bg-transparent" variant="outline">
              <a href="/admin/settings">
                <Activity className="mr-2 h-4 w-4" />
                Configurações
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* System Metrics */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Métricas do Sistema</CardTitle>
            <CardDescription>Indicadores de desempenho</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <p className="text-sm font-medium">Média de Medicamentos</p>
                <p className="text-xs text-muted-foreground">Por paciente ativo</p>
              </div>
              <p className="text-2xl font-bold text-primary">
                {stats.totalPatients > 0 ? (stats.totalMedications / stats.totalPatients).toFixed(1) : 0}
              </p>
            </div>
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <p className="text-sm font-medium">Taxa de Atividade</p>
                <p className="text-xs text-muted-foreground">Operações por paciente</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">
                  Alta
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status do Servidor</p>
                <p className="text-xs text-muted-foreground">Conectividade BD</p>
              </div>
              <div className="flex items-center text-green-600 font-medium">
                <div className="h-2 w-2 rounded-full bg-green-600 mr-2" />
                Online
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimos medicamentos adicionados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Pill className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Medicamento</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, actionLink, actionLabel, color = "blue" }: any) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-4xl font-bold text-foreground mt-3">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorMap[color as keyof typeof colorMap]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {actionLink && (
          <Button asChild variant="secondary" className="w-full text-xs h-8">
            <a href={actionLink}>{actionLabel || "Ver Detalhes"}</a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
