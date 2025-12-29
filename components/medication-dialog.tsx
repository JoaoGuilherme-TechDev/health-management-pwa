"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescribing_doctor: string
  reason: string
  start_date: string
  end_date: string | null
  is_active: boolean
  user_id: string
  doctor_crm?: string
  doctor_name?: string
}

interface MedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medication: Medication | null
  onSave: () => void
  patientId?: string // Add this if dialog is used in admin context
}

export function MedicationDialog({ open, onOpenChange, medication, onSave, patientId }: MedicationDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    prescribing_doctor: "",
    reason: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    side_effects: "", // Add this field to match your table
  })
  const [saving, setSaving] = useState(false)
  const [doctorInfo, setDoctorInfo] = useState({ name: "", crm: "" })

  // Load doctor info if creating as admin
  useEffect(() => {
    const loadDoctorInfo = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
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
    loadDoctorInfo()
  }, [])

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        prescribing_doctor: medication.doctor_name || medication.prescribing_doctor || "",
        reason: medication.reason,
        start_date: medication.start_date,
        end_date: medication.end_date || "",
        side_effects: "", // You might need to fetch this separately
      })
    } else {
      setFormData({
        name: "",
        dosage: "",
        frequency: "",
        prescribing_doctor: "",
        reason: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        side_effects: "",
      })
    }
  }, [medication, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert("Usuário não autenticado")
      setSaving(false)
      return
    }

    try {
      const medicationData = {
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency || "Não especificada",
        reason: formData.reason,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        side_effects: formData.side_effects,
        // Use patientId if provided (admin context), otherwise use user.id (patient context)
        user_id: patientId || user.id,
        doctor_crm: doctorInfo.crm,
        doctor_name: doctorInfo.name || formData.prescribing_doctor,
        prescribing_doctor: formData.prescribing_doctor,
      }

      if (medication) {
        // Update existing
        const { error } = await supabase
          .from("medications")
          .update(medicationData)
          .eq("id", medication.id)

        if (error) throw error
      } else {
        // Create new - Use the same structure as your main form
        const { error } = await supabase
          .from("medications")
          .insert(medicationData)

        if (error) throw error
      }

      setSaving(false)
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving medication:", error)
      alert(`Erro ao salvar medicação: ${error.message}`)
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{medication ? "Editar Medicação" : "Adicionar Medicação"}</DialogTitle>
          <DialogDescription>
            {patientId ? "Adicione uma medicação para o paciente" : "Insira os detalhes da sua medicação abaixo"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Medicação *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ex.: Paracetamol"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosagem *</Label>
              <Input
                id="dosage"
                required
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="ex.: 500mg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência *</Label>
              <Input
                id="frequency"
                required
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="ex.: 2x ao dia"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescribing_doctor">Médico Prescritor</Label>
            <Input
              id="prescribing_doctor"
              value={formData.prescribing_doctor}
              onChange={(e) => setFormData({ ...formData, prescribing_doctor: e.target.value })}
              placeholder="Nome do médico"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Medicação</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Por que esta medicação foi prescrita?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="side_effects">Efeitos Colaterais</Label>
            <Textarea
              id="side_effects"
              value={formData.side_effects}
              onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
              placeholder="Quais efeitos colaterais foram observados?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Salvando..." : medication ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}