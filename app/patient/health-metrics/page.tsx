"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export default function HealthMetricsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Métricas de Saúde</h1>
        <p className="text-muted-foreground mt-1">Acompanhe seus sinais vitais e medições de saúde</p>
      </div>

      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma métrica registrada ainda</h3>
          <p className="text-muted-foreground">Seu médico registrará suas métricas de saúde aqui</p>
        </CardContent>
      </Card>
    </div>
  )
}
