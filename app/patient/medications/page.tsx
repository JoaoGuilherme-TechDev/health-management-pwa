"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Pill, Clock, AlertCircle, Check, X } from "lucide-react"
import { formatBrasiliaDate } from "@/lib/timezone"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSearchParams, useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <MedicationsContent />
    </Suspense>
  )
}

function MedicationsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmData, setConfirmData] = useState<{id: string, name: string} | null>(null)

  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const action = searchParams.get("action")
    const medId = searchParams.get("medicationId")
    const medName = searchParams.get("name")

    if (action === "confirm" && medId && medName) {
      setConfirmData({ id: medId, name: medName })
      setShowConfirmDialog(true)
    }
  }, [searchParams])

  const handleConfirmTaken = async (taken: boolean) => {
    if (!confirmData) return

    if (taken) {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Record in database
          await supabase.from("medication_reminders").insert({
            medication_id: confirmData.id,
            user_id: user.id,
            reminder_time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            reminder_date: new Date().toISOString().split('T')[0],
            is_taken: true,
            taken_at: new Date().toISOString()
          })
          
          alert(`Que bom! ${confirmData.name} registrado como tomado.`)
        }
      } catch (error) {
        console.error("Error recording medication intake:", error)
      }
    }
    
    setShowConfirmDialog(false)
    setConfirmData(null)
    router.replace("/patient/medications")
  }

  const loadMedications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("Usuário não autenticado. Faça login novamente.")
        setLoading(false)
        return
      }

      console.log("Loading medications for user:", user.id)

      // First, try a simple query without the join to isolate issues
      const { data: medicationsData, error: medicationsError } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (medicationsError) {
        console.error("Error loading medications:", medicationsError)
        setError(`Erro ao carregar medicamentos: ${medicationsError.message}`)
        setLoading(false)
        return
      }

      console.log("Found medications:", medicationsData)

      // If no medications found
      if (!medicationsData || medicationsData.length === 0) {
        setMedications([])
        setLoading(false)
        return
      }

      // Try to load schedules separately to avoid join issues
      const medicationIds = medicationsData.map(med => med.id)
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("medication_schedules")
        .select("id, medication_id, scheduled_time")
        .in("medication_id", medicationIds)

      if (schedulesError) {
        console.warn("Could not load schedules, continuing without them:", schedulesError)
      }

      // Combine medications with their schedules
      const medicationsWithSchedules = medicationsData.map(med => ({
        ...med,
        medication_schedules: schedulesData?.filter(s => s.medication_id === med.id) || []
      }))

      // Filter out medications that have ended (end_date < today)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const activeMedications = medicationsWithSchedules.filter(med => {
        if (!med.end_date) return true // Keep if no end date
        const endDate = new Date(med.end_date)
        endDate.setHours(23, 59, 59, 999) // End of the day
        return endDate >= today
      })

      setMedications(activeMedications)
      
    } catch (error: any) {
      console.error("Unexpected error:", error)
      setError(`Erro inesperado: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedications()

    // Set up real-time subscription
    const setupRealtime = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      console.log("Setting up real-time for user:", user.id)

      // Subscribe to medications changes
      const medicationsChannel = supabase
        .channel(`patient-medications-${user.id}`) // Fixed channel name
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "medications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log("Medications updated, reloading...")
            loadMedications()
          }
        )
        .subscribe((status) => {
          console.log("Medications channel status:", status)
        })

      // Subscribe to medication_schedules changes
      const schedulesChannel = supabase
        .channel(`patient-medication-schedules-${user.id}`) // Fixed channel name
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "medication_schedules",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log("Medication schedules updated, reloading...")
            loadMedications()
          }
        )
        .subscribe((status) => {
          console.log("Schedules channel status:", status)
        })

      return () => {
        console.log("Cleaning up channels")
        supabase.removeChannel(medicationsChannel)
        supabase.removeChannel(schedulesChannel)
      }
    }

    const cleanup = setupRealtime()
    
    return () => {
      if (cleanup) {
        cleanup.then(cleanupFn => {
          if (cleanupFn) cleanupFn()
        })
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Carregando medicamentos...</p>
      </div>
    )
  }

  if (error) {
    return (
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
    )
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

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hora do Medicamento</DialogTitle>
            <DialogDescription>
              Você tomou o medicamento <strong>{confirmData?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-4 py-4">
            <Button 
              variant="outline" 
              className="gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-900/20"
              onClick={() => handleConfirmTaken(false)}
            >
              <X className="h-4 w-4" />
              Não
            </Button>
            <Button 
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleConfirmTaken(true)}
            >
              <Check className="h-4 w-4" />
              Sim
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
