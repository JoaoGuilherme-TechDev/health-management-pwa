"use client"


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
      try {
        // Load patients count
        const patientsRes = await fetch('/api/data?table=profiles&match_key=role&match_value=patient')
        let patientCount = 0
        if (patientsRes.ok) {
          const patients = await patientsRes.json()
          patientCount = Array.isArray(patients) ? patients.length : 0
        }

        // Load medications count
        const medsRes = await fetch('/api/data?table=medications')
        let medCount = 0
        if (medsRes.ok) {
          const meds = await medsRes.json()
          medCount = Array.isArray(meds) ? meds.length : 0
        }

        setStats({
          totalPatients: patientCount,
          totalMedications: medCount,
        })
      } catch (error) {
        console.error("[v0] Erro ao carregar estatísticas:", error)
      }
    }

    loadStats() // Carrega imediatamente
    const interval = setInterval(() => {
      if (!document.hidden) loadStats()
    }, 15000) // Atualiza a cada 15 segundos

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

      <div className="grid md:grid-cols-2 gap-6">
        <StatCard title="Total de Pacientes" value={stats.totalPatients} icon={Users} />
        <StatCard title="Total de Medicamentos" value={stats.totalMedications} icon={Activity} />
      </div>

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
              <Activity className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Configurações</h3>
              <p className="text-sm text-muted-foreground">Configurar preferências administrativas</p>
            </a>
          </div>
        </CardContent>
      </Card>

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
