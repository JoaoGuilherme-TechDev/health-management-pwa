"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Activity } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface HealthMetric {
  id: string
  metric_type: string
  value: string
  unit: string | null
  notes: string | null
  recorded_at: string
}

export default function HealthMetricsPage() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      console.log("[v0] Carregando métricas de saúde do paciente:", user.id)

      const { data, error } = await supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })

      console.log("[v0] Métricas carregadas:", { data, error })

      if (!error && data) {
        setMetrics(data)
      }
    }

    setLoading(false)
  }

  const getMetricIcon = (type: string) => {
    return Activity
  }

  if (loading) {
    return <div className="text-center py-12">Carregando métricas...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Métricas de Saúde</h1>
        <p className="text-muted-foreground mt-1">Acompanhe seus sinais vitais e medições de saúde</p>
      </div>

      {metrics.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma métrica registrada ainda</h3>
            <p className="text-muted-foreground">Seu médico registrará suas métricas de saúde aqui</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {metrics.map((metric) => {
            const Icon = getMetricIcon(metric.metric_type)
            return (
              <Card key={metric.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{metric.metric_type}</CardTitle>
                        <CardDescription>
                          {format(new Date(metric.recorded_at), "PPP 'às' HH:mm", { locale: ptBR })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {metric.value}
                        {metric.unit && <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                {metric.notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{metric.notes}</p>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
