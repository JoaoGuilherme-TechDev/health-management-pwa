"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Users, Plus, Trash2 } from "lucide-react"
import { CreatePatientDialog } from "@/components/create-patient-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  created_at: string
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadPatients = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "patient")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Erro ao carregar pacientes:", error)
        setPatients([])
      } else {
        setPatients(data || [])
      }
    } catch (err) {
      console.error("[v0] Exceção ao carregar pacientes:", err)
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()

    const supabase = createClient()
    const channel = supabase
      .channel("profiles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: "role=eq.patient" }, () => {
        loadPatients()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleDeletePatient = async () => {
    if (!patientToDelete) return

    setDeleting(true)
    const supabase = createClient()

    const { error } = await supabase.rpc("delete_patient_cascade", { patient_id: patientToDelete.id })

    if (error) {
      alert(`Erro ao deletar paciente: ${error.message}`)
    } else {
      alert("Paciente deletado com sucesso!")
      setPatientToDelete(null)
      loadPatients()
    }

    setDeleting(false)
  }

  const filteredPatients = patients.filter(
    (p) =>
      p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <div className="text-center py-12">Carregando pacientes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os pacientes registrados</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Criar Paciente
        </Button>
      </div>

      <CreatePatientDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onPatientCreated={loadPatients} />

      <div className="flex gap-4">
        <Input
          placeholder="Buscar pacientes por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente registrado"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente um termo de busca diferente" : "Pacientes aparecerão aqui após o cadastro"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{patient.email}</p>
                    {patient.phone && <p className="text-sm text-muted-foreground">{patient.phone}</p>}
                    <p className="text-xs text-muted-foreground mt-3">
                      Cadastrado em: {new Date(patient.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/admin/patients/${patient.id}`}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Ver Detalhes
                    </a>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setPatientToDelete(patient)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!patientToDelete} onOpenChange={() => setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o paciente{" "}
              <strong>
                {patientToDelete?.first_name} {patientToDelete?.last_name}
              </strong>{" "}
              e TODOS os seus dados (medicamentos, consultas, dieta, evolução física, etc).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} disabled={deleting} className="bg-destructive">
              {deleting ? "Deletando..." : "Sim, deletar paciente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
