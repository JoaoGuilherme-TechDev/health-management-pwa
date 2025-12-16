"use client"

import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, FileText, Activity, Calendar, Pill, Utensils } from "lucide-react"
import { PatientInfoTab } from "@/components/patient-info-tab"
import { PatientMedicationsTab } from "@/components/patient-medications-tab"
import { PatientAppointmentsTab } from "@/components/patient-appointments-tab"
import { PatientPrescriptionsTab } from "@/components/patient-prescriptions-tab"
import { PatientEvolutionTab } from "@/components/patient-evolution-tab"
import { PatientDietTab } from "@/components/patient-diet-tab"
import { PatientSupplementsTab } from "@/components/patient-supplements-tab"

export default function PatientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatient()
  }, [patientId])

  const loadPatient = async () => {
    console.log("[v0] Carregando dados do paciente:", patientId)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", patientId).single()

      if (error) {
        console.error("[v0] Erro ao carregar paciente:", error)
        console.error("[v0] Detalhes do erro:", JSON.stringify(error, null, 2))
      } else {
        console.log("[v0] Paciente carregado com sucesso:", data)
        setPatient(data)
      }
    } catch (err) {
      console.error("[v0] Exceção ao carregar paciente:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando dados do paciente...</div>
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Paciente não encontrado</p>
        <Button onClick={() => router.push("/admin/patients")}>Voltar para Pacientes</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/patients")} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate">{patient.email}</p>
        </div>
      </div>

      {/* Patient Overview Card */}
      <Card className="bg-linear-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Idade</p>
              <p className="text-sm sm:text-lg font-semibold text-foreground">
                {patient.date_of_birth
                  ? `${Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} anos`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Tipo</p>
              <p className="text-sm sm:text-lg font-semibold text-foreground">{patient.blood_type || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">CPF</p>
              <p className="text-sm sm:text-lg font-semibold text-foreground truncate">{patient.cpf || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Telefone</p>
              <p className="text-sm sm:text-lg font-semibold text-foreground truncate">{patient.phone || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="space-y-4 sm:space-y-6">
        <div className="relative">
          <div className="overflow-x-auto no-scrollbar mobile-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-7 gap-1 h-auto p-1">
              <TabsTrigger
                value="info"
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 min-w-22.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Info</span>
              </TabsTrigger>
              <TabsTrigger
                value="medications"
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 min-w-22.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Pill className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Remédios</span>
              </TabsTrigger>
              <TabsTrigger
                value="appointments"
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 min-w-22.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Consultas</span>
              </TabsTrigger>
              <TabsTrigger
                value="prescriptions"
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 min-w-22.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Receitas</span>
              </TabsTrigger>
              <TabsTrigger
                value="diet"
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 min-w-22.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Utensils className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Dieta</span>
              </TabsTrigger>
              <TabsTrigger
                value="supplements"
                className="shrink-0 items-center justify-center gap-2 px-4 py-3 min-w-22.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Pill className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Suplem.</span>
              </TabsTrigger>
              <TabsTrigger
                value="evolution"
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 min-w-22.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Activity className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Evolução</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="info">
          <PatientInfoTab patient={patient} onUpdate={loadPatient} />
        </TabsContent>

        <TabsContent value="medications">
          <PatientMedicationsTab patientId={patientId} />
        </TabsContent>

        <TabsContent value="appointments">
          <PatientAppointmentsTab patientId={patientId} />
        </TabsContent>

        <TabsContent value="prescriptions">
          <PatientPrescriptionsTab patientId={patientId} />
        </TabsContent>

        <TabsContent value="diet">
          <PatientDietTab patientId={patientId} />
        </TabsContent>

        <TabsContent value="supplements">
          <PatientSupplementsTab patientId={patientId} />
        </TabsContent>

        <TabsContent value="evolution">
          <PatientEvolutionTab patientId={patientId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
