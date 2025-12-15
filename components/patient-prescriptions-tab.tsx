"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, FileText, Trash2, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatBrasiliaDate } from "@/lib/timezone"

export function PatientPrescriptionsTab({ patientId }: { patientId: string }) {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    valid_until: "",
    notes: "",
    prescription_file_url: "",
  })

  useEffect(() => {
    loadPrescriptions()

    const supabase = createClient()
    const channel = supabase
      .channel(`prescriptions-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medical_prescriptions",
          filter: `patient_id=eq.${patientId}`,
        },
        () => {
          console.log("[v0] Receita atualizada, recarregando...")
          loadPrescriptions()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [patientId])

  const loadPrescriptions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("medical_prescriptions")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    setPrescriptions(data || [])
    setLoading(false)
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    const supabase = createClient()
    const timestamp = Date.now()
    const path = `prescriptions/${patientId}/${timestamp}-${file.name}`

    try {
      const { data, error } = await supabase.storage.from("prescriptions").upload(path, file)

      if (error) {
        console.error("[v0] Erro no upload:", error)
        alert(`Erro ao fazer upload: ${error.message}`)
      } else if (data) {
        const { data: urlData } = supabase.storage.from("prescriptions").getPublicUrl(path)
        if (urlData?.publicUrl) {
          setFormData({ ...formData, prescription_file_url: urlData.publicUrl })
        }
      }
    } catch (err) {
      console.error("[v0] Exceção no upload:", err)
      alert("Erro inesperado ao fazer upload do arquivo")
    }
    setUploading(false)
  }

  const handleAdd = async () => {
    console.log("[v0] Iniciando adição de receita...")
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Usuário atual (admin):", user?.id)

    const dataToInsert = {
      patient_id: patientId,
      doctor_id: user?.id,
      ...formData,
    }

    console.log("[v0] Dados a inserir:", dataToInsert)

    const { data, error } = await supabase.from("medical_prescriptions").insert(dataToInsert).select()

    console.log("[v0] Resposta da inserção:", { data, error })

    if (error) {
      console.error("[v0] Erro ao adicionar receita:", error)
      alert(`Erro ao adicionar receita: ${error.message}`)
      return
    }

    if (!data || data.length === 0) {
      console.error("[v0] Nenhum dado foi inserido")
      alert("Erro: Nenhuma receita foi adicionada. Verifique as permissões.")
      return
    }

    console.log("[v0] Receita adicionada com sucesso:", data)

    try {
      await fetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: patientId,
          title: "Nova Receita Médica",
          message: `Nova receita médica disponível: ${formData.title}`,
          notification_type: "prescription_added",
          url: "/patient/medications",
        }),
      })
    } catch (notifError) {
      console.error("[v0] Erro ao enviar notificação:", notifError)
    }

    alert("Receita adicionada com sucesso!")

    setShowDialog(false)
    setFormData({
      title: "",
      description: "",
      valid_until: "",
      notes: "",
      prescription_file_url: "",
    })
    loadPrescriptions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta receita? Esta ação não pode ser desfeita.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("medical_prescriptions").delete().eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar receita:", error)
      alert("Erro ao remover receita")
      return
    }

    alert("Receita removida com sucesso!")
    loadPrescriptions()
  }

  if (loading) return <div>Carregando receitas...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Receitas Médicas e Dietas</CardTitle>
            <Button onClick={() => setShowDialog(true)} className="gap-2">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Receita Médica / Dieta</DialogTitle>
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
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
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
