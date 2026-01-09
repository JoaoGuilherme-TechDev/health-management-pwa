"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, TrendingUp, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatBrasiliaDate } from "@/lib/timezone"
import { notifyEvolutionCreated } from "@/lib/notifications"

export function PatientEvolutionTab({ patientId }: { patientId: string }) {
  const [evolution, setEvolution] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    muscle_mass: "",
    body_fat_percentage: "",
    visceral_fat: "",
    metabolic_age: "",
    bmr: "",
    body_water_percentage: "",
    bone_mass: "",
    bmi: "",
    notes: "",
  })

  // Auto-calculate BMI
  useEffect(() => {
    if (formData.weight && formData.height) {
      const weight = Number.parseFloat(formData.weight)
      const height = Number.parseFloat(formData.height) / 100 // convert to meters

      if (weight > 0 && height > 0) {
        const bmi = (weight / (height * height)).toFixed(2)
        // Only update if different to avoid loops (though useEffect dependency handles this)
        if (formData.bmi !== bmi) {
          setFormData((prev) => ({ ...prev, bmi }))
        }
      }
    }
  }, [formData.weight, formData.height])

  useEffect(() => {
    loadEvolution()

    const supabase = createClient()
    const channel = supabase
      .channel(`evolution-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "physical_evolution",
          filter: `user_id=eq.${patientId}`,
        },
        () => {
          console.log("[v0] Evolução física atualizada, recarregando...")
          loadEvolution()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [patientId])

  const loadEvolution = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("physical_evolution")
      .select("*")
      .eq("user_id", patientId)
      .order("measured_at", { ascending: false })

    setEvolution(data || [])
    setLoading(false)
  }

  const handleAdd = async () => {
    try {
      const validateNumber = (value: string, min: number, max: number, fieldName: string) => {
        if (!value) return true
        const num = Number.parseFloat(value)
        if (isNaN(num) || num < min || num > max) {
          alert(`${fieldName} deve estar entre ${min} e ${max}`)
          return false
        }
        return true
      }

      // Validate numeric ranges
      if (!validateNumber(formData.weight, 20, 500, "Peso")) return
      if (!validateNumber(formData.height, 100, 250, "Altura")) return
      if (!validateNumber(formData.muscle_mass, 0, 200, "Massa Muscular")) return
      if (!validateNumber(formData.body_fat_percentage, 0, 100, "Gordura Corporal")) return
      if (!validateNumber(formData.visceral_fat, 0, 100, "Gordura Visceral")) return
      if (!validateNumber(formData.metabolic_age, 0, 150, "Idade Metabólica")) return
      if (!validateNumber(formData.bmr, 0, 10000, "TMB")) return
      if (!validateNumber(formData.body_water_percentage, 0, 100, "Água Corporal")) return
      if (!validateNumber(formData.bone_mass, 0, 50, "Massa Óssea")) return

      const supabase = createClient()

      // Create evolution record
      const { data: evolutionData, error } = await supabase
        .from("physical_evolution")
        .insert({
          user_id: patientId,
          weight: formData.weight ? Number.parseFloat(formData.weight) : null,
          height: formData.height ? Number.parseFloat(formData.height) : null,
          muscle_mass: formData.muscle_mass ? Number.parseFloat(formData.muscle_mass) : null,
          body_fat_percentage: formData.body_fat_percentage ? Number.parseFloat(formData.body_fat_percentage) : null,
          visceral_fat: formData.visceral_fat ? Number.parseFloat(formData.visceral_fat) : null,
          metabolic_age: formData.metabolic_age ? Number.parseInt(formData.metabolic_age) : null,
          bmr: formData.bmr ? Number.parseFloat(formData.bmr) : null,
          body_water_percentage: formData.body_water_percentage
            ? Number.parseFloat(formData.body_water_percentage)
            : null,
          bone_mass: formData.bone_mass ? Number.parseFloat(formData.bone_mass) : null,
          bmi: formData.bmi ? Number.parseFloat(formData.bmi) : null,
          notes: formData.notes,
        })
        .select()
        .single()

      if (error) {
        console.error("Erro ao adicionar evolução:", error)
        alert(`Erro ao adicionar medição: ${error.message}`)
        return
      }

      console.log("Evolução adicionada com sucesso:", evolutionData)

      // Create notification for evolution
      try {
        // Create a meaningful message for the evolution notification
        let measurementDetails = "Nova medição de evolução física registrada"

        const details = []
        if (formData.weight) details.push(`${formData.weight}kg`)
        if (formData.body_fat_percentage) details.push(`${formData.body_fat_percentage}% gordura`)

        if (details.length > 0) {
          measurementDetails = `Nova medição: ${details.join(" • ")}`
        }

        await notifyEvolutionCreated(patientId, measurementDetails, true)
      } catch (notifError) {
        console.error("Erro ao enviar notificação:", notifError)
        // Don't fail the whole operation if notification fails
      }

      alert("Medição registrada com sucesso!")

      setShowDialog(false)
      setFormData({
        weight: "",
        height: "",
        muscle_mass: "",
        body_fat_percentage: "",
        visceral_fat: "",
        metabolic_age: "",
        bmr: "",
        body_water_percentage: "",
        bone_mass: "",
        bmi: "",
        notes: "",
      })
      loadEvolution()
    } catch (error: any) {
      console.error("Erro inesperado ao adicionar evolução:", error)
      alert(`Erro: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta medição? Esta ação não pode ser desfeita.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("physical_evolution").delete().eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar medição:", error)
      alert("Erro ao remover medição")
      return
    }

    alert("Medição removida com sucesso!")
    loadEvolution()
  }

  if (loading) return <div>Carregando evolução física...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Evolução Física e Bioimpedância</CardTitle>
            <Button onClick={() => setShowDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar Medição
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {evolution.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma medição registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {evolution.map((evo) => (
                <div
                  key={evo.id}
                  className="p-6 rounded-lg border-2 border-primary/20 bg-linear-to-br from-primary/5 to-accent/5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-muted-foreground">{formatBrasiliaDate(evo.measured_at, "date")}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(evo.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {evo.weight && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Peso</p>
                        <p className="text-lg font-semibold text-foreground">{evo.weight} kg</p>
                      </div>
                    )}
                    {evo.height && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Altura</p>
                        <p className="text-lg font-semibold text-foreground">{evo.height} cm</p>
                      </div>
                    )}
                    {evo.bmi && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">IMC</p>
                        <p className="text-lg font-semibold text-foreground">{evo.bmi}</p>
                      </div>
                    )}
                    {evo.muscle_mass && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Massa Muscular</p>
                        <p className="text-lg font-semibold text-foreground">{evo.muscle_mass} kg</p>
                      </div>
                    )}
                    {evo.body_fat_percentage && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Gordura Corporal</p>
                        <p className="text-lg font-semibold text-foreground">{evo.body_fat_percentage}%</p>
                      </div>
                    )}
                    {evo.visceral_fat && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Gordura Visceral</p>
                        <p className="text-lg font-semibold text-foreground">{evo.visceral_fat}</p>
                      </div>
                    )}
                    {evo.body_water_percentage && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Água Corporal</p>
                        <p className="text-lg font-semibold text-foreground">{evo.body_water_percentage}%</p>
                      </div>
                    )}
                    {evo.bone_mass && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Massa Óssea</p>
                        <p className="text-lg font-semibold text-foreground">{evo.bone_mass} kg</p>
                      </div>
                    )}
                    {evo.metabolic_age && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Idade Metabólica</p>
                        <p className="text-lg font-semibold text-foreground">{evo.metabolic_age} anos</p>
                      </div>
                    )}
                    {evo.bmr && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">TMB</p>
                        <p className="text-lg font-semibold text-foreground">{evo.bmr} kcal</p>
                      </div>
                    )}
                  </div>

                  {evo.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-foreground">{evo.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Medição de Bioimpedância</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
              <div>
                <Label>Altura (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
              <div>
                <Label>Massa Muscular (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.muscle_mass}
                  onChange={(e) => setFormData({ ...formData, muscle_mass: e.target.value })}
                />
              </div>
              <div>
                <Label>Gordura Corporal (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.body_fat_percentage}
                  onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
                />
              </div>
              <div>
                <Label>Gordura Visceral</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.visceral_fat}
                  onChange={(e) => setFormData({ ...formData, visceral_fat: e.target.value })}
                />
              </div>
              <div>
                <Label>Idade Metabólica (anos)</Label>
                <Input
                  type="number"
                  value={formData.metabolic_age}
                  onChange={(e) => setFormData({ ...formData, metabolic_age: e.target.value })}
                />
              </div>
              <div>
                <Label>TMB (kcal)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.bmr}
                  onChange={(e) => setFormData({ ...formData, bmr: e.target.value })}
                  placeholder="Taxa Metabólica Basal"
                />
              </div>
              <div>
                <Label>Água Corporal (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.body_water_percentage}
                  onChange={(e) => setFormData({ ...formData, body_water_percentage: e.target.value })}
                />
              </div>
              <div>
                <Label>Massa Óssea (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.bone_mass}
                  onChange={(e) => setFormData({ ...formData, bone_mass: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Adicione observações sobre a medição..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
