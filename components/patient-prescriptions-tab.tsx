// components/patient-prescriptions-tab.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, FileText, Trash2, ExternalLink, Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatBrasiliaDate } from "@/lib/timezone"
import { useAuth } from "@/hooks/use-auth"

export function PatientPrescriptionsTab({ patientId }: { patientId: string }) {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingPrescription, setEditingPrescription] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    valid_until: "",
    notes: "",
    prescription_file_url: "",
  })
  
  const { user } = useAuth()

  useEffect(() => {
    loadPrescriptions()

    const interval = setInterval(() => {
      if (!document.hidden) loadPrescriptions()
    }, 15000)
    return () => clearInterval(interval)
  }, [patientId])

  const loadPrescriptions = async () => {
    try {
      const res = await fetch(`/api/data?table=medical_prescriptions&match_key=patient_id&match_value=${patientId}`)
      if (res.ok) {
        const data = await res.json()
        setPrescriptions(data || [])
      }
    } catch (error) {
      console.error("Error loading prescriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)

    if (!user) {
      alert("Usuário não autenticado")
      setUploading(false)
      return
    }

    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50)
    const randomStr = Math.random().toString(36).substring(2, 8)
    const filePath = `prescriptions/${patientId}/${user.id}/${timestamp}-${randomStr}-${sanitizedFileName}`

    console.log("[v0] Fazendo upload para:", filePath)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("bucket", "prescriptions")
      uploadFormData.append("path", filePath)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro no upload")
      }

      console.log("[v0] Upload bem-sucedido:", data)

      if (data.publicUrl) {
        console.log("[v0] URL pública gerada:", data.publicUrl)
        setFormData((prev) => ({ ...prev, prescription_file_url: data.publicUrl }))
      } else {
        alert("Erro ao gerar URL pública do arquivo")
      }
    } catch (err: any) {
      console.error("[v0] Exceção no upload:", err)
      alert(`Erro ao fazer upload: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleAdd = async () => {
    console.log("[v0] Iniciando adição de receita...")

    if (!formData.prescription_file_url) {
      alert("Por favor, faça o upload da receita médica antes de adicionar.")
      return
    }

    if (!user) {
      alert("Erro: Usuário não autenticado")
      return
    }

    const baseData = {
      patient_id: patientId,
      doctor_id: user.id,
      title: formData.title,
      description: formData.description || null,
      valid_until: formData.valid_until || null,
      notes: formData.notes || null,
      prescription_file_url: formData.prescription_file_url,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingPrescription) {
        const res = await fetch(`/api/data?table=medical_prescriptions&match_key=id&match_value=${editingPrescription.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(baseData)
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Erro ao atualizar")
        }
        alert("Receita atualizada com sucesso!")
      } else {
        const dataToInsert = {
          ...baseData,
          created_at: new Date().toISOString(),
        }

        const res = await fetch(`/api/data?table=medical_prescriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToInsert)
        })

        if (!res.ok) {
           const err = await res.json()
           throw new Error(err.error || "Erro ao adicionar")
        }

        alert("Receita adicionada com sucesso!")
      }

      setShowDialog(false)
      setEditingPrescription(null)
      setFormData({
        title: "",
        description: "",
        valid_until: "",
        notes: "",
        prescription_file_url: "",
      })
      loadPrescriptions()
    } catch (err: any) {
      console.error("[v0] Exceção:", err)
      alert(`Erro inesperado ao salvar receita: ${err.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta receita? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
        const res = await fetch(`/api/data?table=medical_prescriptions&match_key=id&match_value=${id}`, {
            method: 'DELETE'
        })
        
        if (!res.ok) {
            throw new Error("Erro ao deletar")
        }

        alert("Receita removida com sucesso!")
        loadPrescriptions()
    } catch (error) {
      console.error("[v0] Erro ao deletar receita:", error)
      alert("Erro ao remover receita")
    }
  }

  const handleEdit = (pres: any) => {
    setFormData({
      title: pres.title || "",
      description: pres.description || "",
      valid_until: pres.valid_until ? pres.valid_until.substring(0, 10) : "",
      notes: pres.notes || "",
      prescription_file_url: pres.prescription_file_url || "",
    })
    setEditingPrescription(pres)
    setShowDialog(true)
  }

  if (loading) return <div>Carregando receitas...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Receitas Médicas e Dietas</CardTitle>
            <Button
              onClick={() => {
                setEditingPrescription(null)
                setFormData({
                  title: "",
                  description: "",
                  valid_until: "",
                  notes: "",
                  prescription_file_url: "",
                })
                setShowDialog(true)
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Receita
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma receita cadastrada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((pres) => (
                <div key={pres.id} className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-lg">{pres.title}</h4>
                      {pres.description && <p className="text-sm text-muted-foreground mt-2">{pres.description}</p>}
                      {pres.prescription_file_url && (
                        <a
                          href={pres.prescription_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver Documento Anexado
                        </a>
                      )}
                      {pres.valid_until && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Válido até: {formatBrasiliaDate(pres.valid_until, "date")}
                        </p>
                      )}
                      {pres.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Observações:</span> {pres.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        Criado em: {formatBrasiliaDate(pres.created_at, "date")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(pres)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(pres.id)}
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
            <DialogTitle>
              {editingPrescription ? "Editar Receita Médica / Dieta" : "Adicionar Receita Médica / Dieta"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Receita Médica - Janeiro 2024"
              />
            </div>

            <div>
              <Label>Upload de Receita Médica (PDF, PNG, JPG) *</Label>
              <div className="flex gap-4 items-center">
                {formData.prescription_file_url && (
                  <a
                    href={formData.prescription_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Documento anexado
                  </a>
                )}
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <span className="text-sm text-muted-foreground">Enviando...</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Obrigatório: Para fins legais, anexe a receita médica digitalizada assinada pelo médico.
              </p>
            </div>

            <div>
              <Label>Descrição / Observações</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Informações adicionais sobre a receita..."
              />
            </div>
            <div>
              <Label>Válido Até</Label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={!formData.title || !formData.prescription_file_url || uploading}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
