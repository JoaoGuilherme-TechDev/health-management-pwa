"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pill, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function PatientMedicationsTab({ patientId }: { patientId: string }) {
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [doctorInfo, setDoctorInfo] = useState({ name: "", crm: "" })
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    start_date: "",
    end_date: "",
    reason: "",
    side_effects: "",
  })

  useEffect(() => {
    loadMedications()
    loadDoctorInfo()
  }, [patientId])

  const loadMedications = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", patientId)
      .eq("is_active", true)
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

  const handleAdd = async () => {
    console.log("[v0] Iniciando adição de medicamento...")
    const supabase = createClient()

    const dataToInsert = {
      user_id: patientId,
      doctor_crm: doctorInfo.crm,
      doctor_name: doctorInfo.name,
      ...formData,
    }

    console.log("[v0] Dados a inserir:", dataToInsert)

    const { data, error } = await supabase.from("medications").insert(dataToInsert).select()

    console.log("[v0] Resposta da inserção:", { data, error })

    if (error) {
      console.error("[v0] Erro ao adicionar medicamento:", error)
      alert(`Erro ao adicionar medicamento: ${error.message}`)
      return
    }

    if (!data || data.length === 0) {
      console.error("[v0] Nenhum dado foi inserido")
      alert("Erro: Nenhum medicamento foi adicionado. Verifique as permissões.")
      return
    }

    console.log("[v0] Medicamento adicionado com sucesso:", data)

    // Send push notification to patient
    try {
      await fetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: patientId,
          title: "Novo Medicamento Prescrito",
          message: `${doctorInfo.name} prescreveu ${formData.name} - ${formData.dosage}`,
          notification_type: "medication_added",
          url: "/patient/medications",
        }),
      })
    } catch (notifError) {
      console.error("[v0] Erro ao enviar notificação:", notifError)
    }

    alert("Medicamento adicionado com sucesso!")

    setShowDialog(false)
    setFormData({
      name: "",
      dosage: "",
      frequency: "",
      start_date: "",
      end_date: "",
      reason: "",
      side_effects: "",
    })
    loadMedications()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("medications").update({ is_active: false }).eq("id", id)
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
                      <p className="text-sm text-muted-foreground mt-1">
                        Dosagem: {med.dosage} • Frequência: {med.frequency}
                      </p>
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
                        Início: {new Date(med.start_date).toLocaleDateString("pt-BR")}
                        {med.end_date && ` • Fim: ${new Date(med.end_date).toLocaleDateString("pt-BR")}`}
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
        <DialogContent className="max-w-2xl">
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
                <Label>Frequência *</Label>
                <Input
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  placeholder="Ex: 2x ao dia"
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
                disabled={!formData.name || !formData.dosage || !formData.frequency || !formData.start_date}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
