"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Pill, Clock } from "lucide-react"
import { formatBrasiliaDate } from "@/lib/timezone"

interface MedicationSchedule {
  id: string
  scheduled_time: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescribing_doctor: string
  doctor_name: string | null
  doctor_crm: string | null
  reason: string
  start_date: string
  end_date: string | null
  medication_schedules?: MedicationSchedule[]
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
        .select(`
          *,
          medication_schedules (
            id,
            scheduled_time
          )
        `)
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

    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const medicationsChannel = supabase
          .channel(`medications-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "medications",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              console.log("[v0] Medicamento atualizado, recarregando...")
              loadMedications()
            },
          )
          .subscribe()

        const schedulesChannel = supabase
          .channel(`medication-schedules-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "medication_schedules",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              console.log("[v0] Horários atualizados, recarregando...")
              loadMedications()
            },
          )
          .subscribe()

        return () => {
          supabase.removeChannel(medicationsChannel)
          supabase.removeChannel(schedulesChannel)
        }
      }
    })
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
                    {(med.doctor_name || med.prescribing_doctor) && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        <span>Dr(a). {med.doctor_name || med.prescribing_doctor}</span>
                        {med.doctor_crm && <span>• CRM {med.doctor_crm}</span>}
                      </div>
                    )}
                    {med.reason && <p className="text-sm text-muted-foreground mt-1">Motivo: {med.reason}</p>}

                    {med.medication_schedules && med.medication_schedules.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Horários para tomar:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {med.medication_schedules
                            .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
                            .map((schedule) => (
                              <span
                                key={schedule.id}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium"
                              >
                                {schedule.scheduled_time.substring(0, 5)}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="text-muted-foreground">
                        Início: {formatBrasiliaDate(med.start_date, "date")}
                      </span>
                      {med.end_date && (
                        <span className="text-muted-foreground">
                          Término: {formatBrasiliaDate(med.end_date, "date")}
                        </span>
                      )}
                    </div>
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
