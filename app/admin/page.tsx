"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalMedications: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()

    const supabase = createClient()
    const profilesChannel = supabase
      .channel("admin-dashboard-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        console.log("[v0] Perfis atualizados, recarregando stats...")
        loadStats()
      })
      .subscribe()

    const medsChannel = supabase
      .channel("admin-dashboard-medications")
      .on("postgres_changes", { event: "*", schema: "public", table: "medications" }, () => {
        console.log("[v0] Medicamentos atualizados, recarregando stats...")
        loadStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(profilesChannel)
      supabase.removeChannel(medsChannel)
    }
  }, [])

  const loadStats = async () => {
    console.log("[v0] Iniciando carregamento de estatísticas...")
    const supabase = createClient()

    try {
      console.log("[v0] Buscando contagem de pacientes...")
      const { count: patientCount, error: patientError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "patient")

      if (patientError) {
        console.error("[v0] Erro ao buscar pacientes:", patientError)
      } else {
        console.log("[v0] Pacientes encontrados:", patientCount)
      }

      console.log("[v0] Buscando contagem de medicamentos...")
      const { count: medCount, error: medError } = await supabase
        .from("medications")
        .select("*", { count: "exact", head: true })

      if (medError) {
        console.error("[v0] Erro ao buscar medicamentos:", medError)
      } else {
        console.log("[v0] Medicamentos encontrados:", medCount)
      }

      setStats({
        totalPatients: patientCount || 0,
        totalMedications: medCount || 0,
      })

      console.log("[v0] Estatísticas carregadas com sucesso:", { patientCount, medCount })
    } catch (error) {
      console.error("[v0] Exceção ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando painel...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-2">Monitore a atividade do sistema e gerencie operações de saúde</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <StatCard title="Total de Pacientes" value={stats.totalPatients} icon={Users} />
        <StatCard title="Total de Medicamentos" value={stats.totalMedications} icon={Activity} />
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral do Sistema</CardTitle>
          <CardDescription>Métricas principais e status do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Atividade Recente</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Últimas 24 horas</span>
                  <span className="font-semibold text-foreground">Ativo</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Status de sincronização</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">Sincronizado</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Estatísticas Rápidas</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Total de Pacientes</span>
                  <span className="font-semibold text-foreground">{stats.totalPatients}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Medicamentos por paciente</span>
                  <span className="font-semibold text-foreground">
                    {stats.totalPatients > 0 ? (stats.totalMedications / stats.totalPatients).toFixed(1) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações de Gerenciamento</CardTitle>
          <CardDescription>Acesso rápido às funções administrativas comuns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="/admin/patients"
              className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <Users className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Gerenciar Pacientes</h3>
              <p className="text-sm text-muted-foreground">Visualizar e gerenciar todas as contas de pacientes</p>
            </a>
            <a
              href="/admin/settings"
              className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <Users className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Configurações do Sistema</h3>
              <p className="text-sm text-muted-foreground">Configurar preferências administrativas</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
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
  )
}
