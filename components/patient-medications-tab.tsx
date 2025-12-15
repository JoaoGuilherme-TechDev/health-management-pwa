"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pill, Trash2, Clock, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatBrasiliaDate } from "@/lib/timezone"

export function PatientMedicationsTab({ patientId }: { patientId: string }) {
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [doctorInfo, setDoctorInfo] = useState({ name: "", crm: "" })
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    start_date: "",
    end_date: "",
    reason: "",
    side_effects: "",
  })
  const [schedules, setSchedules] = useState<string[]>(["08:00"]) // Horários agendados
  const [newScheduleTime, setNewScheduleTime] = useState("08:00")

  useEffect(() => {
    loadMedications()
    loadDoctorInfo()

    const supabase = createClient()
    const channel = supabase
      .channel(`medications-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medications",
          filter: `user_id=eq.${patientId}`,
        },
        () => {
          console.log("[v0] Medicamento atualizado, recarregando...")
          loadMedications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [patientId])

  const loadMedications = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("medications")
      .select(`
        *,
        medication_schedules (
          id,
          scheduled_time,
          days_of_week,
          is_active
        )
      `)
      .eq("user_id", patientId)
      .order("created_at", { ascending: false })

    setMedications(data || [])
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

    const supabase = createClient()

    const dataToInsert = {
      user_id: patientId,
      doctor_crm: doctorInfo.crm,
      doctor_name: doctorInfo.name,
      frequency: "Horários personalizados", // Campo legado, mantido para compatibilidade
      ...formData,
    }

    const { data: medication, error } = await supabase.from("medications").insert(dataToInsert).select().single()

    if (error) {
      console.error("[v0] Erro ao adicionar medicamento:", error)
      alert(`Erro ao adicionar medicamento: ${error.message}`)
      return
    }

    if (medication) {
      const schedulesToInsert = schedules.map((time) => ({
        medication_id: medication.id,
        user_id: patientId,
        scheduled_time: time,
        days_of_week: [0, 1, 2, 3, 4, 5, 6], // Todos os dias por padrão
      }))

      const { error: scheduleError } = await supabase.from("medication_schedules").insert(schedulesToInsert)

      if (scheduleError) {
        console.error("[v0] Erro ao adicionar horários:", scheduleError)
        alert("Medicamento adicionado, mas houve erro ao configurar os horários")
        return
      }
    }

    alert("Medicamento e horários adicionados com sucesso!")
    setShowDialog(false)
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
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este medicamento? Esta ação não pode ser desfeita.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("medications").delete().eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar medicamento:", error)
      alert("Erro ao remover medicamento")
      return
    }

    alert("Medicamento removido com sucesso!")
    loadMedications()
  }

  if (loading) return <div>Carregando medicamentos...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Medicamentos Prescritos</CardTitle>
            <Button onClick={() => setShowDialog(true)} className="gap-2">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Medicamento</DialogTitle>
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
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label>Dosagem *</Label>
                <Input
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="Ex: 500mg"
                />
              </div>
              <div>
                <Label>Data de Início *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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
              <Label>Motivo da Prescrição</Label>
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
