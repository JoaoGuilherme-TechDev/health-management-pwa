"use client"

import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, FileText, Activity, Calendar, TrendingUp, Pill, Utensils } from "lucide-react"
import { PatientInfoTab } from "@/components/patient-info-tab"
import { PatientMedicationsTab } from "@/components/patient-medications-tab"
import { PatientAppointmentsTab } from "@/components/patient-appointments-tab"
import { PatientPrescriptionsTab } from "@/components/patient-prescriptions-tab"
import { PatientEvolutionTab } from "@/components/patient-evolution-tab"
import { PatientMetricsTab } from "@/components/patient-metrics-tab"
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
    const supabase = createClient()
    const { data, error } = await supabase.from("profiles").select("*").eq("id", patientId).single()

    if (error) {
      console.error("[v0] Erro ao carregar paciente:", error)
    } else {
      setPatient(data)
    }
    setLoading(false)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/patients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-muted-foreground mt-1">{patient.email}</p>
        </div>
      </div>

      {/* Patient Overview Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Idade</p>
              <p className="text-lg font-semibold text-foreground">
                {patient.date_of_birth
                  ? `${Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} anos`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tipo Sanguíneo</p>
              <p className="text-lg font-semibold text-foreground">{patient.blood_type || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">CPF</p>
              <p className="text-lg font-semibold text-foreground">{patient.cpf || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Telefone</p>
              <p className="text-lg font-semibold text-foreground">{patient.phone || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8">
          <TabsTrigger value="info" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Informações</span>
          </TabsTrigger>
          <TabsTrigger value="medications" className="gap-2">
            <Pill className="h-4 w-4" />
            <span className="hidden sm:inline">Medicamentos</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Consultas</span>
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Receitas</span>
          </TabsTrigger>
          <TabsTrigger value="diet" className="gap-2">
            <Utensils className="h-4 w-4" />
            <span className="hidden sm:inline">Dieta</span>
          </TabsTrigger>
          <TabsTrigger value="supplements" className="gap-2">
            <Pill className="h-4 w-4" />
            <span className="hidden sm:inline">Suplementos</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="evolution" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Evolução</span>
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="metrics">
          <PatientMetricsTab patientId={patientId} />
        </TabsContent>

        <TabsContent value="evolution">
          <PatientEvolutionTab patientId={patientId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
