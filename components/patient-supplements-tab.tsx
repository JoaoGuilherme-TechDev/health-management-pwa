"use client"

import type React from "react"
import { formatBrasiliaDate } from "@/lib/timezone"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Pill } from "lucide-react"
import { NotificationService } from "@/lib/notification-service" // Add this import

interface PatientSupplementsTabProps {
  patientId: string
}

export function PatientSupplementsTab({ patientId }: PatientSupplementsTabProps) {
  const [supplements, setSupplements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    supplement_name: "",
    dosage: "",
    frequency: "",
    timing: "",
    reason: "",
    start_date: "",
    end_date: "",
    notes: "",
  })

  useEffect(() => {
    loadSupplements()

    const supabase = createClient()
    const channel = supabase
      .channel(`supplements-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patient_supplements",
          filter: `patient_id=eq.${patientId}`,
        },
        () => {
          console.log("[v0] Suplemento atualizado, recarregando...")
          loadSupplements()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [patientId])

  const loadSupplements = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("patient_supplements")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    if (data) {
      setSupplements(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from("patient_supplements").insert({
      patient_id: patientId,
      doctor_id: user?.id,
      supplement_name: formData.supplement_name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      timing: formData.timing,
      reason: formData.reason,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      notes: formData.notes,
    })

    if (!error) {
      // Use NotificationService instead of individual functions
      try {
        await NotificationService.sendSupplementNotification(patientId, formData.supplement_name)
        console.log("Supplement notification sent successfully")
      } catch (notificationError) {
        console.error("Erro ao enviar notificações:", notificationError)
      }

      setOpen(false)
      setFormData({
        supplement_name: "",
        dosage: "",
        frequency: "",
        timing: "",
        reason: "",
        start_date: "",
        end_date: "",
        notes: "",
      })
      loadSupplements()
    } else {
      alert("Erro ao adicionar suplemento: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este suplemento? Esta ação não pode ser desfeita.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("patient_supplements").delete().eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar suplemento:", error)
      alert("Erro ao excluir suplemento")
      return
    }

    alert("Suplemento excluído com sucesso!")
    loadSupplements()
  }

  if (loading) {
    return <div className="text-center py-4">Carregando suplementos...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Suplementos Recomendados</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Suplemento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recomendar Suplemento</DialogTitle>
              <DialogDescription>Adicione um suplemento ao plano do paciente</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplement_name">Nome do Suplemento *</Label>
                  <Input
                    id="supplement_name"
                    value={formData.supplement_name}
                    onChange={(e) => setFormData({ ...formData, supplement_name: e.target.value })}
                    placeholder="Whey Protein"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosagem *</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="30g"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência *</Label>
                  <Input
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    placeholder="2x ao dia"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timing">Momento de Consumo</Label>
                  <Input
                    id="timing"
                    value={formData.timing}
                    onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                    placeholder="Após o treino"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo da Recomendação</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={2}
                  placeholder="Para melhorar recuperação muscular"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Término (opcional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {supplements.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhum suplemento recomendado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {supplements.map((supplement) => (
            <Card key={supplement.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{supplement.supplement_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {supplement.dosage} • {supplement.frequency}
                      {supplement.timing && ` • ${supplement.timing}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(supplement.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplement.reason && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Motivo:</p>
                    <p className="text-sm text-muted-foreground">{supplement.reason}</p>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <strong>Período:</strong> {formatBrasiliaDate(supplement.start_date, "date")}
                  {supplement.end_date && ` até ${formatBrasiliaDate(supplement.end_date, "date")}`}
                </div>

                {supplement.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-foreground mb-1">Observações:</p>
                    <p className="text-sm text-muted-foreground">{supplement.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}