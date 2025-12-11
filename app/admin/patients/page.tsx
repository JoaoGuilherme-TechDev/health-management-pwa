"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import { CreatePatientDialog } from "@/components/create-patient-dialog"

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

  const loadPatients = async () => {
    try {
      console.log("[v0] Carregando pacientes...")
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
        console.log("[v0] Pacientes carregados:", data?.length || 0)
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
  }, [])

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
                  <a
                    href={`/admin/patients/${patient.id}`}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Ver Detalhes
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
