"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Calendar, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatBrasiliaDateAppointment } from "@/lib/timezone"

export function PatientAppointmentsTab({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [doctorInfo, setDoctorInfo] = useState({ name: "", crm: "" })
  const [formData, setFormData] = useState({
    title: "",
    appointment_type: "",
    description: "",
    scheduled_at: "",
    location: "",
    notes: "",
  })

  useEffect(() => {
    loadAppointments()
    loadDoctorInfo()

    const supabase = createClient()
    const channel = supabase
      .channel(`appointments-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          // Force fresh load on any change
          loadAppointments()
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime channel subscribed:", `appointments-${patientId}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [patientId])

  const loadAppointments = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .order("scheduled_at", { ascending: false })

    if (error) {
      console.error("Error loading appointments:", error)
    }

    setAppointments(data || [])
    setLoading(false)
  }

  const loadDoctorInfo = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("doctor_crm, doctor_full_name, first_name, last_name")
        .eq("id", user.id)
        .single()

      if (profile) {
        const doctorName = profile.doctor_full_name || `${profile.first_name} ${profile.last_name}`
        setDoctorInfo({
          name: doctorName,
          crm: profile.doctor_crm || "",
        })
      }
    }
  }

  const handleAdd = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const dataToInsert = {
      patient_id: patientId,
      status: "scheduled",
      doctor_name: doctorInfo.name,
      doctor_crm: doctorInfo.crm,
      ...formData,
    }

    const { data, error } = await supabase.from("appointments").insert(dataToInsert).select()

    if (error) {
      alert(`Erro ao agendar consulta: ${error.message}`)
      return
    }

    if (!data || data.length === 0) {
      alert("Erro: Nenhuma consulta foi agendada. Verifique as permissões.")
      return
    }

    alert("Consulta agendada com sucesso!")

    setShowDialog(false)
    setFormData({
      title: "",
      appointment_type: "",
      description: "",
      scheduled_at: "",
      location: "",
      notes: "",
    })
    // Trigger reload after insert
    loadAppointments()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta consulta? Esta ação não pode ser desfeita.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("appointments").delete().eq("id", id)

    if (error) {
      alert("Erro ao remover consulta")
      return
    }

    alert("Consulta removida com sucesso!")
    // Trigger reload after delete
    await loadAppointments()
  }

  if (loading) return <div>Carregando consultas...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Consultas Agendadas</CardTitle>
            <Button onClick={() => setShowDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Agendar Consulta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma consulta agendada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt.id} className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            apt.status === "scheduled"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              : apt.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {apt.status === "scheduled"
                            ? "Agendada"
                            : apt.status === "completed"
                              ? "Concluída"
                              : "Cancelada"}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground text-lg">{apt.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{apt.appointment_type}</p>
                      {apt.description && <p className="text-sm text-muted-foreground mt-2">{apt.description}</p>}
                      <p className="text-sm text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {formatBrasiliaDateAppointment(apt.scheduled_at, "date")} às{" "}
                        {formatBrasiliaDateAppointment(apt.scheduled_at, "time")}
                      </p>
                      {apt.location && <p className="text-sm text-muted-foreground">Local: {apt.location}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(apt.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agendar Consulta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {doctorInfo.crm && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  <span className="font-medium">Médico Responsável:</span> {doctorInfo.name}
                  <br />
                  <span className="font-medium">CRM:</span> {doctorInfo.crm}
                </p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Consulta de rotina"
                />
              </div>
              <div>
                <Label>Tipo de Consulta *</Label>
                <Input
                  value={formData.appointment_type}
                  onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                  placeholder="Ex: Avaliação física"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Data e Hora *</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Local</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Endereço da consulta"
                />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!formData.title || !formData.appointment_type || !formData.scheduled_at}
              >
                Agendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
