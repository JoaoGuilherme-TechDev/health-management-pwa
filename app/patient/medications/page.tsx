"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Pill } from "lucide-react"

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescribing_doctor: string
  reason: string
  start_date: string
  end_date: string | null
  is_active: boolean
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)

  const loadMedications = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setMedications(data)
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    loadMedications()
  }, [])

  if (loading) {
    return <div className="text-center py-12">Carregando medicamentos...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Medicamentos</h1>
        <p className="text-muted-foreground mt-1">Visualize seus medicamentos e dosagens prescritas pelo seu médico</p>
      </div>

      {medications.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum medicamento ainda</h3>
            <p className="text-muted-foreground">Seu médico adicionará medicamentos aqui quando prescritos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {medications.map((med) => (
            <Card key={med.id} className="hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{med.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {med.dosage} • {med.frequency}
                    </p>
                    {med.prescribing_doctor && (
                      <p className="text-sm text-muted-foreground mt-2">Prescrito por: {med.prescribing_doctor}</p>
                    )}
                    {med.reason && <p className="text-sm text-muted-foreground mt-1">Motivo: {med.reason}</p>}
                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="text-muted-foreground">
                        Início: {new Date(med.start_date).toLocaleDateString("pt-BR")}
                      </span>
                      {med.end_date && (
                        <span className="text-muted-foreground">
                          Término: {new Date(med.end_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      med.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {med.is_active ? "Ativo" : "Inativo"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
