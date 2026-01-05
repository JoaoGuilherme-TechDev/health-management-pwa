"use client"

import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalMedications: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      const supabase = createClient()

      try {
        const { count: patientCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "patient")

        const { count: medCount } = await supabase.from("medications").select("*", { count: "exact", head: true })

        setStats({
          totalPatients: patientCount || 0,
          totalMedications: medCount || 0,
        })
      } catch (error) {
        console.error("[v0] Erro ao carregar estatísticas:", error)
      }
    }

    loadStats() // Carrega imediatamente
    const interval = setInterval(loadStats, 5000) // Atualiza a cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-2">Monitore a atividade do sistema e gerencie operações de saúde</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Pacientes" 
          value={stats.totalPatients} 
          icon={Users} 
          actionLink="/admin/patients"
          actionLabel="Gerenciar Pacientes"
        />
        <StatCard title="Total de Medicamentos" value={stats.totalMedications} icon={Activity} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
            <CardDescription>Ferramentas administrativas</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <Button asChild className="w-full justify-start h-12 text-lg" variant="outline">
              <a href="/admin/patients">
                <Users className="mr-3 h-5 w-5 text-primary" />
                Gerenciar Pacientes
              </a>
            </Button>
            <Button asChild className="w-full justify-start h-12 text-lg" variant="outline">
              <a href="/admin/settings">
                <Activity className="mr-3 h-5 w-5 text-primary" />
                Configurações do Sistema
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Métricas do Sistema</CardTitle>
            <CardDescription>Indicadores de desempenho</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Média de Medicamentos</p>
                  <p className="text-sm text-muted-foreground">Por paciente ativo</p>
                </div>
                <div className="font-bold text-2xl">
                  {stats.totalPatients > 0 ? (stats.totalMedications / stats.totalPatients).toFixed(1) : 0}
                </div>
             </div>
             <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Status do Servidor</p>
                  <p className="text-sm text-muted-foreground">Conectividade com banco de dados</p>
                </div>
                <div className="flex items-center text-green-600 font-medium">
                  <Activity className="mr-2 h-4 w-4" />
                  Online
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, actionLink, actionLabel }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
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

