"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Calendar, Trash2, Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatBrasiliaDateAppointment } from "@/lib/timezone"
import { useAuth } from "@/hooks/use-auth"

export function PatientAppointmentsTab({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null)
  const [doctorInfo, setDoctorInfo] = useState({ name: "", crm: "" })
  const [formData, setFormData] = useState({
    title: "",
    appointment_type: "",
    description: "",
    scheduled_at: "",
    location: "",
    notes: "",
  })

  const { user } = useAuth()

  useEffect(() => {
    loadAppointments()
    loadDoctorInfo()

    const handleRefresh = async () => {
      await loadAppointments()
    }

    const interval = setInterval(() => {
      if (!document.hidden) loadAppointments()
    }, 15000)

    window.addEventListener("pull-to-refresh", handleRefresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener("pull-to-refresh", handleRefresh)
    }
  }, [patientId])

  const loadAppointments = async () => {
    try {
      const res = await fetch(`/api/data?table=appointments&match_key=patient_id&match_value=${patientId}`)
      
      if (res.ok) {
        const data = await res.json()
        setAppointments(data || [])
        setError(null)
      } else {
        const err = await res.json()
        setError(err.error || "Falha ao carregar consultas")
      }
    } catch (err: any) {
      setError(err.message || "Falha ao carregar consultas")
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const loadDoctorInfo = async () => {
    if (user) {
      try {
        const res = await fetch(`/api/data?table=profiles&match_key=id&match_value=${user.id}`)
        if (res.ok) {
            const data = await res.json()
            const profile = data[0]
            if (profile) {
                const doctorName = profile.doctor_full_name || `${profile.first_name} ${profile.last_name}`
                setDoctorInfo({
                  name: doctorName,
                  crm: profile.doctor_crm || "",
                })
            }
        }
      } catch (e) {
        console.error("Error loading doctor info", e)
      }
    }
  }

  const handleAdd = async () => {
    if (!user) {
        alert("Erro: Usuário não autenticado")
        return
    }

    if (!formData.title || !formData.appointment_type || !formData.scheduled_at) {
      alert("Por favor, preencha todos os campos obrigatórios")
      return
    }

    const scheduledAtIso = new Date(formData.scheduled_at).toISOString()

    try {
        if (editingAppointment) {
          const res = await fetch(`/api/data?table=appointments&match_key=id&match_value=${editingAppointment.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: formData.title,
              appointment_type: formData.appointment_type,
              description: formData.description,
              scheduled_at: scheduledAtIso,
              location: formData.location,
              notes: formData.notes,
              doctor_name: doctorInfo.name,
              doctor_crm: doctorInfo.crm,
            })
          })

          if (!res.ok) {
            const error = await res.json()
            alert(`Erro ao atualizar consulta: ${error.error}`)
            return
          }

          alert("Consulta atualizada com sucesso!")
        } else {
          const dataToInsert = {
            patient_id: patientId,
            status: "scheduled",
            doctor_name: doctorInfo.name,
            doctor_crm: doctorInfo.crm,
            title: formData.title,
            appointment_type: formData.appointment_type,
            description: formData.description,
            scheduled_at: scheduledAtIso,
            location: formData.location,
            notes: formData.notes,
          }

          const res = await fetch(`/api/data?table=appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToInsert)
          })

          if (!res.ok) {
            const error = await res.json()
            alert(`Erro ao agendar consulta: ${error.error}`)
            return
          }

          alert("Consulta agendada com sucesso!")
        }

        setShowDialog(false)
        setEditingAppointment(null)
        setFormData({
          title: "",
          appointment_type: "",
          description: "",
          scheduled_at: "",
          location: "",
          notes: "",
        })
        loadAppointments()
    } catch (e: any) {
        console.error("Error saving appointment", e)
        alert("Erro ao salvar consulta")
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
        const res = await fetch(`/api/data?table=appointments&match_key=id&match_value=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })

        if (!res.ok) {
            throw new Error("Erro ao atualizar status")
        }

        await loadAppointments()
    } catch (error) {
      alert("Erro ao atualizar status da consulta")
    }
  }

  const isToday = (dateString: string) => {
    if (!dateString) return false
    const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    const aptDate = formatBrasiliaDateAppointment(dateString, "date")
    return today === aptDate
  }

  const handleEdit = (apt: any) => {
    setFormData({
      title: apt.title || "",
      appointment_type: apt.appointment_type || "",
      description: apt.description || "",
      scheduled_at: apt.scheduled_at ? apt.scheduled_at.slice(0, 16) : "",
      location: apt.location || "",
      notes: apt.notes || "",
    })
    setEditingAppointment(apt)
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta consulta? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const res = await fetch(`/api/data?table=appointments&match_key=id&match_value=${id}`, {
          method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error("Erro ao remover consulta")
      }

      alert("Consulta removida com sucesso!")
      // Trigger reload after delete
      await loadAppointments()
    } catch (error) {
      console.error("Erro ao remover consulta:", error)
      alert("Erro ao remover consulta")
    }
  }

  if (loading) return <div>Carregando consultas...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Consultas Agendadas</CardTitle>
            <Button
              onClick={() => {
                setEditingAppointment(null)
                setFormData({
                  title: "",
                  appointment_type: "",
                  description: "",
                  scheduled_at: "",
                  location: "",
                  notes: "",
                })
                setShowDialog(true)
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Agendar Consulta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 mb-4">
              <p className="text-sm text-red-700 dark:text-red-200">Erro ao carregar consultas: {error}</p>
            </div>
          )}
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
                                : apt.status === "no_show"
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {apt.status === "scheduled"
                            ? "Agendada"
                            : apt.status === "completed"
                              ? "Concluída"
                              : apt.status === "no_show"
                                ? "Não presente"
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

                      {apt.status === "scheduled" && isToday(apt.scheduled_at) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleStatusChange(apt.id, "completed")}
                          >
                            Consulta realizada
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200"
                            onClick={() => handleStatusChange(apt.id, "no_show")}
                          >
                            Paciente Não Presente
                          </Button>
                        </div>
                      )}

                      {apt.status === "no_show" && (
                        <p className="mt-3 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/30 p-3 rounded-md border border-orange-200 dark:border-orange-800">
                          Paciente não compareceu. Favor reagendar via WhatsApp.
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(apt)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "Editar Consulta" : "Agendar Consulta"}</DialogTitle>
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
