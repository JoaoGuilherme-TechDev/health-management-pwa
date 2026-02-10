"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale } from "lucide-react"
import { formatBrasiliaDate } from "@/lib/timezone"

export default function PatientEvolutionPage() {
  const router = useRouter()
  const [evolution, setEvolution] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadEvolution = async () => {
    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        router.push("/login")
        return
      }
      const { user } = await authRes.json()

      if (user) {
        const res = await fetch(`/api/data?table=physical_evolution&match_key=user_id&match_value=${user.id}`)
        if (res.ok) {
          let data = await res.json()
          if (!Array.isArray(data)) data = [data]
          // Sort manually since API might not support order param yet
          data.sort((a: any, b: any) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
          setEvolution(data)
        }
      }
    } catch (error) {
      console.error("Error loading evolution:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvolution()

    // Polling every 15 seconds
    const interval = setInterval(() => {
      if (!document.hidden) loadEvolution()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">Carregando sua evolução...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minha Evolução Física</h1>
        <p className="text-muted-foreground mt-2">Acompanhe suas medições de bioimpedância</p>
      </div>

          {evolution.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma medição registrada</h3>
            <p className="text-muted-foreground">Seu médico ainda não registrou medições de bioimpedância</p>
          </CardContent>
        </Card>
          ) : (
        <div className="space-y-4">
          {evolution.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <CardTitle className="text-lg">Medição de {formatBrasiliaDate(record.measured_at, "date")}</CardTitle>
                {record.doctor_name && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <span>Dr(a). {record.doctor_name}</span>
                    {record.doctor_crm && <span>• CRM {record.doctor_crm}</span>}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {record.weight && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Peso</p>
                      <p className="text-lg font-semibold text-foreground">{record.weight} kg</p>
                    </div>
                  )}
                  {record.height && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Altura</p>
                      <p className="text-lg font-semibold text-foreground">{record.height} cm</p>
                    </div>
                  )}
                  {record.muscle_mass && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Massa Muscular</p>
                      <p className="text-lg font-semibold text-foreground">{record.muscle_mass} kg</p>
                    </div>
                  )}
                  {record.body_fat_percentage && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Gordura Corporal</p>
                      <p className="text-lg font-semibold text-foreground">{record.body_fat_percentage}%</p>
                    </div>
                  )}
                  {record.visceral_fat && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Gordura Visceral</p>
                      <p className="text-lg font-semibold text-foreground">{record.visceral_fat}</p>
                    </div>
                  )}
                  {record.body_water_percentage && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Água Corporal</p>
                      <p className="text-lg font-semibold text-foreground">{record.body_water_percentage}%</p>
                    </div>
                  )}
                  {record.bone_mass && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Massa Óssea</p>
                      <p className="text-lg font-semibold text-foreground">{record.bone_mass} kg</p>
                    </div>
                  )}
                  {record.metabolic_age && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Idade Metabólica</p>
                      <p className="text-lg font-semibold text-foreground">{record.metabolic_age} anos</p>
                    </div>
                  )}
                  {record.bmr && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">TMB</p>
                      <p className="text-lg font-semibold text-foreground">{record.bmr} kcal</p>
                    </div>
                  )}
                </div>
                {record.notes && (
                  <p className="text-sm text-muted-foreground italic mt-4">Observações: {record.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  </div>
  )
}
