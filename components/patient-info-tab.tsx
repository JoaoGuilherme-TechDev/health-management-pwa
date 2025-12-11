"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Edit2, Save, X } from "lucide-react"

export function PatientInfoTab({ patient, onUpdate }: { patient: any; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(patient)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    console.log("[v0] Iniciando salvamento das informações do paciente...")
    console.log("[v0] Patient ID:", patient.id)
    console.log("[v0] Form Data:", formData)

    setSaving(true)
    setError(null)

    const supabase = createClient()

    const updateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      cpf: formData.cpf,
      rg: formData.rg,
      date_of_birth: formData.date_of_birth,
      birth_city: formData.birth_city,
      birth_state: formData.birth_state,
      blood_type: formData.blood_type,
      emergency_contact: formData.emergency_contact,
      medical_history: formData.medical_history,
      allergies: formData.allergies,
      insurance_provider: formData.insurance_provider,
      insurance_id: formData.insurance_id,
    }

    console.log("[v0] Dados a serem atualizados:", updateData)

    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", patient.id).select()

    console.log("[v0] Resposta do Supabase - data:", data)
    console.log("[v0] Resposta do Supabase - error:", error)

    if (error) {
      console.error("[v0] Erro ao salvar:", error)
      setError(`Erro ao salvar: ${error.message}`)
      setSaving(false)
      return
    }

    if (!data || data.length === 0) {
      console.error("[v0] Nenhum dado foi atualizado")
      setError("Nenhum dado foi atualizado. Verifique as permissões.")
      setSaving(false)
      return
    }

    console.log("[v0] Dados salvos com sucesso!")
    setIsEditing(false)
    onUpdate()
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Informações do Paciente</CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setFormData(patient)
                  setError(null)
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Dados Pessoais */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Dados Pessoais</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={formData.first_name || ""}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Sobrenome</Label>
              <Input
                value={formData.last_name || ""}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                type="email"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>CPF</Label>
              <Input
                value={formData.cpf || ""}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>RG</Label>
              <Input
                value={formData.rg || ""}
                onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={formData.date_of_birth || ""}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Tipo Sanguíneo</Label>
              <Input
                value={formData.blood_type || ""}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                disabled={!isEditing}
                placeholder="Ex: O+"
              />
            </div>
            <div>
              <Label>Cidade de Nascimento</Label>
              <Input
                value={formData.birth_city || ""}
                onChange={(e) => setFormData({ ...formData, birth_city: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Estado de Nascimento</Label>
              <Input
                value={formData.birth_state || ""}
                onChange={(e) => setFormData({ ...formData, birth_state: e.target.value })}
                disabled={!isEditing}
                placeholder="Ex: SP"
              />
            </div>
          </div>
        </div>

        {/* Informações Médicas */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Informações Médicas</h3>
          <div className="space-y-4">
            <div>
              <Label>Histórico Médico</Label>
              <Textarea
                value={formData.medical_history || ""}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                disabled={!isEditing}
                rows={4}
                placeholder="Descreva o histórico médico do paciente..."
              />
            </div>
            <div>
              <Label>Alergias</Label>
              <Textarea
                value={formData.allergies || ""}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                disabled={!isEditing}
                rows={3}
                placeholder="Liste todas as alergias conhecidas..."
              />
            </div>
          </div>
        </div>

        {/* Informações de Contato de Emergência */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Contato de Emergência</h3>
          <div>
            <Label>Contato de Emergência</Label>
            <Input
              value={formData.emergency_contact || ""}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              disabled={!isEditing}
              placeholder="Nome e telefone do contato de emergência"
            />
          </div>
        </div>

        {/* Informações do Plano de Saúde */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Plano de Saúde</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Operadora</Label>
              <Input
                value={formData.insurance_provider || ""}
                onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Número da Carteirinha</Label>
              <Input
                value={formData.insurance_id || ""}
                onChange={(e) => setFormData({ ...formData, insurance_id: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
