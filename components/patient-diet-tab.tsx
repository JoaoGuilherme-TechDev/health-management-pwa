"use client"

import type React from "react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Utensils, FileText, ExternalLink, Edit2 } from "lucide-react"
import { formatBrasiliaDate } from "@/lib/timezone"
import { useAuth } from "@/hooks/use-auth"

interface PatientDietTabProps {
  patientId: string
}

export function PatientDietTab({ patientId }: PatientDietTabProps) {
  const [dietRecipes, setDietRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingDiet, setEditingDiet] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meal_type: "lunch",
    image_url: "",
  })

  const { user } = useAuth()

  useEffect(() => {
    loadDietRecipes()
    
    const interval = setInterval(() => {
      if (!document.hidden) loadDietRecipes()
    }, 15000)

    return () => clearInterval(interval)
  }, [patientId])

  const loadDietRecipes = async () => {
    try {
      const res = await fetch(`/api/data?table=patient_diet_recipes&match_key=patient_id&match_value=${patientId}`)
      
      if (res.ok) {
        const data = await res.json()
        setDietRecipes(data || [])
        setError(null)
      } else {
        const err = await res.json()
        setError(err.error || "Erro ao carregar dietas")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePdfUpload = async (file: File) => {
    setUploading(true)

    if (!user) {
      alert("Usuário não autenticado")
      setUploading(false)
      return
    }

    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50)
    const randomStr = Math.random().toString(36).substring(2, 8)
    const filePath = `diets/${patientId}/${user.id}/${timestamp}-${randomStr}-${sanitizedFileName}`

    console.log("[v0] Fazendo upload para:", filePath)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", "diets")
      formData.append("path", filePath)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro no upload")
      }

      console.log("[v0] Upload bem-sucedido:", data)

      if (data.publicUrl) {
        console.log("[v0] URL pública gerada:", data.publicUrl)
        setFormData((prev) => ({ ...prev, image_url: data.publicUrl }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.image_url) {
      alert("Por favor, faça o upload do PDF antes de adicionar.")
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
      meal_type: formData.meal_type,
      image_url: formData.image_url,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingDiet) {
        const res = await fetch(`/api/data?table=patient_diet_recipes&match_key=id&match_value=${editingDiet.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(baseData)
        })

        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Erro ao atualizar")
        }
        alert("Plano de dieta atualizado com sucesso!")
      } else {
        const dataToInsert = {
          ...baseData,
          created_at: new Date().toISOString(),
        }

        const res = await fetch(`/api/data?table=patient_diet_recipes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToInsert)
        })

        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Erro ao adicionar")
        }

        alert("Plano de dieta adicionado com sucesso!")
      }

      setOpen(false)
      setEditingDiet(null)
      setFormData({
        title: "",
        description: "",
        meal_type: "lunch",
        image_url: "",
      })
      loadDietRecipes()
    } catch (err: any) {
      console.error("[v0] Exceção:", err)
      alert(`Erro inesperado ao salvar plano de dieta: ${err.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este plano de dieta?")) {
      return
    }

    try {
        const res = await fetch(`/api/data?table=patient_diet_recipes&match_key=id&match_value=${id}`, {
            method: 'DELETE'
        })
        
        if (!res.ok) {
            throw new Error("Erro ao deletar")
        }

        alert("Plano de dieta removido com sucesso!")
        loadDietRecipes()
    } catch (error) {
      console.error("[v0] Erro ao deletar plano de dieta:", error)
      alert("Erro ao remover plano de dieta")
    }
  }

  const handleEdit = (diet: any) => {
    setFormData({
      title: diet.title || "",
      description: diet.description || "",
      meal_type: diet.meal_type || "lunch",
      image_url: diet.image_url || "",
    })
    setEditingDiet(diet)
    setOpen(true)
  }

  const getMealTypeLabel = (mealType: string) => {
    if (!mealType) return "Não especificado"
    switch (mealType.toLowerCase()) {
      case "breakfast":
        return "Café da Manhã"
      case "lunch":
        return "Almoço"
      case "dinner":
        return "Jantar"
      case "snack":
        return "Lanche"
      default:
        return mealType
    }
  }

  if (loading) {
    return <div className="text-center py-4">Carregando planos de dieta...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Planos de Dieta Personalizados</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  className="gap-2"
                  onClick={() => {
                    setEditingDiet(null)
                    setFormData({
                      title: "",
                      description: "",
                      meal_type: "lunch",
                      image_url: "",
                    })
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Plano
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Plano de Dieta</DialogTitle>
                  <DialogDescription>Envie um PDF com o plano de dieta personalizado</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título do Plano *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Plano Semanal de Dieta"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meal_type">Tipo de Refeição</Label>
                      <Select
                        value={formData.meal_type}
                        onValueChange={(v) => setFormData({ ...formData, meal_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Café da Manhã</SelectItem>
                          <SelectItem value="lunch">Almoço</SelectItem>
                          <SelectItem value="dinner">Jantar</SelectItem>
                          <SelectItem value="snack">Lanche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição do Plano</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Descrição breve do plano de dieta"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pdf">Arquivo PDF do Plano de Dieta *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4">
                      {formData.image_url && (
                        <div className="mb-4 flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="text-sm text-foreground">PDF enviado com sucesso!</span>
                        </div>
                      )}
                      <input
                        id="pdf"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              alert("O arquivo PDF não pode ser maior que 10MB")
                              return
                            }
                            handlePdfUpload(file)
                          }
                        }}
                        disabled={uploading}
                        className="block w-full text-sm border border-border rounded-lg cursor-pointer bg-background disabled:opacity-50"
                        required={!formData.image_url}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={uploading || !formData.image_url}>
                      {uploading ? "Enviando..." : "Adicionar Plano"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {dietRecipes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum plano de dieta cadastrado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dietRecipes.map((diet) => (
                <div
                  key={diet.id}
                  className="p-6 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-lg">{diet.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 text-xs font-medium">
                          {getMealTypeLabel(diet.meal_type)}
                        </span>
                      </div>
                      {diet.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{diet.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(diet)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(diet.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {diet.image_url && (
                    <div className="mt-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                      <a
                        href={diet.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-medium text-sm transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        <span>Ver Plano de Dieta</span>
                      </a>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Clique para abrir ou baixar o arquivo da dieta
                      </p>
                    </div>
                  )}

                  <div className="border-t border-border mt-4 pt-3">
                    <p className="text-xs text-muted-foreground">
                      Adicionado em: {formatBrasiliaDate(diet.created_at, "date")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
