"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pill, Clock, AlertCircle } from "lucide-react"
import { formatBrasiliaDate } from "@/lib/timezone"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [error, setError] = useState<string | null>(null)

  const loadMedications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        setError("Usuário não autenticado. Faça login novamente.")
        setLoading(false)
        return
      }
      const { user } = await authRes.json()

      if (!user) {
        setError("Usuário não autenticado. Faça login novamente.")
        setLoading(false)
        return
      }

      console.log("Loading medications for user:", user.id)

      // Fetch medications
      const medRes = await fetch(`/api/data?table=medications&match_key=user_id&match_value=${user.id}`)
      if (!medRes.ok) throw new Error("Failed to fetch medications")
      let medicationsData = await medRes.json()
      
      if (!Array.isArray(medicationsData)) medicationsData = [medicationsData]
      
      // Sort manually since API might not support order param yet
      medicationsData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log("Found medications:", medicationsData)

      // If no medications found
      if (!medicationsData || medicationsData.length === 0) {
        setMedications([])
        setLoading(false)
        return
      }

      // Fetch schedules
      // Since we can't do "in" query easily with simple api/data, we might fetch all schedules for user
      // Assuming schedules have user_id or we have to fetch per medication (which is bad N+1)
      // Wait, medication_schedules table usually has medication_id. 
      // If we can't filter by multiple IDs, we might have to fetch all schedules for the user if they have a user_id column?
      // Let's check if medication_schedules has user_id. The previous code filtered by user_id in realtime subscription!
      // `filter: user_id=eq.${user.id}` in realtime subscription suggests it DOES have user_id.
      
      let schedulesData: any[] = []
      try {
        const schedRes = await fetch(`/api/data?table=medication_schedules&match_key=user_id&match_value=${user.id}`)
        if (schedRes.ok) {
           const data = await schedRes.json()
           schedulesData = Array.isArray(data) ? data : [data]
        }
      } catch (e) {
        console.warn("Could not load schedules", e)
      }

      // Combine medications with their schedules
      const medicationsWithSchedules = medicationsData.map((med: any) => ({
        ...med,
        medication_schedules: schedulesData.filter((s: any) => s.medication_id === med.id) || []
      }))

      setMedications(medicationsWithSchedules)
      
    } catch (error: any) {
      console.error("Unexpected error:", error)
      setError(`Erro inesperado: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedications()

    // Set up polling
    const intervalId = setInterval(() => {
        if (!document.hidden) loadMedications()
    }, 15000)
    
    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Carregando medicamentos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Medicamentos</h1>
            <p className="text-muted-foreground mt-1">Visualize seus medicamentos e dosagens prescritas pelo seu médico</p>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadMedications} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
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
  </div>
  )
}
