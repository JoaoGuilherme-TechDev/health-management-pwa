"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Consultas</h1>
        <p className="text-muted-foreground mt-1">Visualize e gerencie suas consultas médicas</p>
      </div>

      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma consulta agendada</h3>
          <p className="text-muted-foreground">Seu médico agendará consultas para você</p>
        </CardContent>
      </Card>
    </div>
  )
}
