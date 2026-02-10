"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pill, Trash2, Clock, X, AlertCircle, Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatBrasiliaDate } from "@/lib/timezone"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function PatientMedicationsTab({ patientId }: { patientId: string }) {
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingMedication, setEditingMedication] = useState<any | null>(null)
  const [doctorInfo, setDoctorInfo] = useState({ name: "", crm: "" })
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    start_date: "",
    end_date: "",
    reason: "",
    side_effects: "",
  })
  const [schedules, setSchedules] = useState<string[]>(["08:00"])
  const [newScheduleTime, setNewScheduleTime] = useState("08:00")

  useEffect(() => {
    if (!patientId) {
      setError("ID do paciente não encontrado")
      setLoading(false)
      return
    }

    loadMedications()
    loadDoctorInfo()

    const interval = setInterval(() => {
      if (!document.hidden) loadMedications(true)
    }, 15000)

    return () => clearInterval(interval)
  }, [patientId])

  const loadMedications = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      
      // Load basic medications
      const res = await fetch(`/api/data?table=medications&match_key=user_id&match_value=${patientId}`)
      if (!res.ok) throw new Error("Erro ao carregar medicamentos")
      const basicData = await res.json()

      // Load schedules if basic data exists
      if (basicData && basicData.length > 0) {
        // We need to fetch all schedules for this user/patient as we don't have "IN" query in simple API
        // Optimized: fetch all schedules for this user (since we filter by patientId usually)
        // Or we can just fetch all schedules for this user_id (patientId)
        
        // Note: The original code selected schedules where medication_id IN (basicData ids)
        // Here we can fetch all schedules for this user (patientId) because schedules also have user_id
        const resSchedules = await fetch(`/api/data?table=medication_schedules&match_key=user_id&match_value=${patientId}`)
        let schedulesData: any[] = []
        if (resSchedules.ok) {
            schedulesData = await resSchedules.json()
        }

        // Combine data
        const combinedData = basicData.map((med: any) => ({
          ...med,
          medication_schedules: schedulesData?.filter((s: any) => s.medication_id === med.id) || []
        }))

        setMedications(combinedData)
      } else {
        setMedications(basicData || [])
      }
      
    } catch (error: any) {
      console.error("Erro ao carregar medicamentos:", error)
      if (!silent) setError(`Erro ao carregar medicamentos: ${error.message}`)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const loadDoctorInfo = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (!res.ok) return
      const { user } = await res.json()
      
      if (user) {
        const resProfile = await fetch(`/api/data?table=profiles&match_key=id&match_value=${user.id}`)
        if (!resProfile.ok) return
        const profiles = await resProfile.json()
        const profile = profiles[0]

        if (profile) {
          const doctorName = profile.doctor_full_name || `${profile.first_name} ${profile.last_name}`
          setDoctorInfo({
            name: doctorName,
            crm: profile.doctor_crm || "",
          })
        }
      }
    } catch (error) {
      console.error("Erro ao carregar informações do médico:", error)
    }
  }

  const addSchedule = () => {
    if (newScheduleTime && !schedules.includes(newScheduleTime)) {
      setSchedules([...schedules, newScheduleTime].sort())
      setNewScheduleTime("08:00")
    }
  }

  const removeSchedule = (time: string) => {
    setSchedules(schedules.filter((s) => s !== time))
  }

  const handleAdd = async () => {
    if (schedules.length === 0) {
      alert("Adicione pelo menos um horário para o medicamento!")
      return
    }

    try {
      const baseData = {
        user_id: patientId,
        doctor_crm: doctorInfo.crm,
        doctor_name: doctorInfo.name,
        frequency: "Horários personalizados",
        name: formData.name,
        dosage: formData.dosage,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        reason: formData.reason,
        side_effects: formData.side_effects,
      }

      if (editingMedication) {
        // UPDATE
        const resUpdate = await fetch(`/api/data?table=medications&match_key=id&match_value=${editingMedication.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baseData),
        })

        if (!resUpdate.ok) {
          const err = await resUpdate.json()
          throw new Error(err.error || "Erro ao atualizar medicamento")
        }

        // Delete existing schedules
        await fetch(`/api/data?table=medication_schedules&match_key=medication_id&match_value=${editingMedication.id}`, {
            method: "DELETE"
        })

        // Insert new schedules
        const schedulesToInsert = schedules.map((time) => ({
            medication_id: editingMedication.id,
            user_id: patientId,
            scheduled_time: time,
            days_of_week: [0, 1, 2, 3, 4, 5, 6],
        }))
        
        for (const schedule of schedulesToInsert) {
             await fetch(`/api/data?table=medication_schedules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(schedule),
            })
        }

        alert("Medicamento atualizado com sucesso!")
      } else {
        // INSERT
        const resInsert = await fetch(`/api/data?table=medications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(baseData),
        })

        if (!resInsert.ok) {
            const err = await resInsert.json()
            throw new Error(err.error || "Erro ao adicionar medicamento")
        }
        
        const newMedication = (await resInsert.json())[0]

        if (newMedication) {
            const schedulesToInsert = schedules.map((time) => ({
                medication_id: newMedication.id,
                user_id: patientId,
                scheduled_time: time,
                days_of_week: [0, 1, 2, 3, 4, 5, 6],
            }))

            for (const schedule of schedulesToInsert) {
                await fetch(`/api/data?table=medication_schedules`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(schedule),
                })
            }
        }

        alert("Medicamento e horários adicionados com sucesso!")
      }
      setShowDialog(false)
      setEditingMedication(null)
      setFormData({
        name: "",
        dosage: "",
        start_date: "",
        end_date: "",
        reason: "",
        side_effects: "",
      })
      setSchedules(["08:00"])
      loadMedications()
      
    } catch (error: any) {
      console.error("Erro inesperado:", error)
      alert(`Erro: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este medicamento? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const res = await fetch(`/api/data?table=medications&match_key=id&match_value=${id}`, {
          method: "DELETE"
      })

      if (!res.ok) {
        throw new Error("Erro ao remover medicamento")
      }

      alert("Medicamento removido com sucesso!")
      loadMedications()
    } catch (error: any) {
      console.error("Erro inesperado ao deletar:", error)
      alert(`Erro: ${error.message}`)
    }
  }

  const handleEdit = (med: any) => {
    setFormData({
      name: med.name || "",
      dosage: med.dosage || "",
      start_date: med.start_date || "",
      end_date: med.end_date || "",
      reason: med.reason || "",
      side_effects: med.side_effects || "",
    })
    const activeSchedules =
      med.medication_schedules
        ?.filter((s: any) => s.is_active)
        .map((s: any) => s.scheduled_time.substring(0, 5)) || []
    setSchedules(activeSchedules.length > 0 ? activeSchedules : ["08:00"])
    setNewScheduleTime("08:00")
    setEditingMedication(med)
    setShowDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-2">Carregando medicamentos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Medicamentos Prescritos</CardTitle>
            <Button
              onClick={() => {
                setEditingMedication(null)
                setFormData({
                  name: "",
                  dosage: "",
                  start_date: "",
                  end_date: "",
                  reason: "",
                  side_effects: "",
                })
                setSchedules(["08:00"])
                setNewScheduleTime("08:00")
                setShowDialog(true)
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Medicamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum medicamento prescrito ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {medications.map((med) => (
                <div key={med.id} className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-lg">{med.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">Dosagem: {med.dosage}</p>
                      {med.medication_schedules && med.medication_schedules.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-sm font-medium text-muted-foreground">Horários:</span>
                          {med.medication_schedules
                            .filter((s: any) => s.is_active)
                            .sort((a: any, b: any) => a.scheduled_time.localeCompare(b.scheduled_time))
                            .map((schedule: any) => (
                              <Badge key={schedule.id} variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {schedule.scheduled_time.substring(0, 5)}
                              </Badge>
                            ))}
                        </div>
                      )}
                      {med.reason && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Motivo:</span> {med.reason}
                        </p>
                      )}
                      {(med.doctor_name || med.doctor_crm) && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Prescrito por:</span> {med.doctor_name}
                          {med.doctor_crm && ` • ${med.doctor_crm}`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Início: {formatBrasiliaDate(med.start_date, "date")}
                        {med.end_date && ` • Fim: ${formatBrasiliaDate(med.end_date, "date")}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(med)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(med.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMedication ? "Editar Medicamento" : "Adicionar Medicamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {doctorInfo.crm && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  <span className="font-medium">Médico Prescritor:</span> {doctorInfo.name}
                  <br />
                  <span className="font-medium">CRM:</span> {doctorInfo.crm}
                </p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Medicamento *</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Dosagem *</Label>
                <Input
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="Ex: 500mg"
                  required
                />
              </div>
              <div>
                <Label>Data de Início *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Data de Término</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/50">
              <Label className="text-base font-semibold">Horários de Administração *</Label>
              <p className="text-sm text-muted-foreground">
                Configure os horários em que o paciente deve tomar o medicamento
              </p>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="time"
                    value={newScheduleTime}
                    onChange={(e) => setNewScheduleTime(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <Button type="button" onClick={addSchedule} variant="secondary" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Horário
                </Button>
              </div>

              {schedules.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Horários configurados:</p>
                  <div className="flex flex-wrap gap-2">
                    {schedules.sort().map((time) => (
                      <Badge key={time} variant="default" className="gap-2 pr-1">
                        <Clock className="h-3 w-3" />
                        {time}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 hover:bg-destructive/20"
                          onClick={() => removeSchedule(time)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {schedules.length === 0 && <p className="text-sm text-destructive">⚠️ Adicione pelo menos um horário</p>}
            </div>

            <div>
              <Label>Motivo da Receita Médica</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Efeitos Colaterais</Label>
              <Textarea
                value={formData.side_effects}
                onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!formData.name || !formData.dosage || !formData.start_date || schedules.length === 0}
              >
                Adicionar Medicamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
