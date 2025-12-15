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
}

interface MedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medication: Medication | null
  onSave: () => void
}

export function MedicationDialog({ open, onOpenChange, medication, onSave }: MedicationDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    prescribing_doctor: "",
    reason: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        prescribing_doctor: medication.prescribing_doctor,
        reason: medication.reason,
        start_date: medication.start_date,
        end_date: medication.end_date || "",
        is_active: medication.is_active,
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
        is_active: true,
      })
    }
  }, [medication, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      if (medication) {
        // Update existing
        await supabase.from("medications").update(formData).eq("id", medication.id)
      } else {
        // Create new
        await supabase.from("medications").insert({
          user_id: user.id,
          ...formData,
        })
      }
    }

    setSaving(false)
    onSave()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{medication ? "Edit Medication" : "Add Medication"}</DialogTitle>
          <DialogDescription>Enter your medication details below</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Medication Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Aspirin"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                required
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Input
                id="frequency"
                required
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="e.g., Twice daily"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctor">Prescribing Doctor</Label>
            <Input
              id="doctor"
              value={formData.prescribing_doctor}
              onChange={(e) => setFormData({ ...formData, prescribing_doctor: e.target.value })}
              placeholder="Doctor name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Medication</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Why are you taking this medication?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Date *</Label>
              <Input
                id="start"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Date</Label>
              <Input
                id="end"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="active" className="font-normal cursor-pointer">
              Mark as active
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Medication"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
