"use client"

import type React from "react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Utensils, FileText } from "lucide-react"

interface PatientDietTabProps {
  patientId: string
}

export function PatientDietTab({ patientId }: PatientDietTabProps) {
  const [dietRecipes, setDietRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meal_type: "lunch",
    pdf_url: "",
  })

  useEffect(() => {
    loadDietRecipes()

    const supabase = createClient()
    const channel = supabase
      .channel(`diet-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patient_diet_recipes",
          filter: `patient_id=eq.${patientId}`,
        },
        () => {
          loadDietRecipes()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [patientId])

  const loadDietRecipes = async () => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("patient_diet_recipes")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
      if (error) {
        setError(error.message)
        setDietRecipes([])
      } else {
        setDietRecipes(data || [])
        setError(null)
      }
    } catch (err: any) {
      setError(err.message || "Falha ao carregar receitas de dieta")
      setDietRecipes([])
    } finally {
      setLoading(false)
    }
  }

  const handlePdfUpload = async (file: File) => {
    const supabase = createClient()
    try {
      setUploading(true)
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50)
      const randomStr = Math.random().toString(36).substring(2, 8)
      const path = `diet-pdfs/${timestamp}-${randomStr}-${sanitizedFileName}`
      const { data, error } = await supabase.storage.from("diets").upload(path, file)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("diets").getPublicUrl(path)
        setFormData({ ...formData, pdf_url: urlData.publicUrl })
      } else {
        alert("Erro ao fazer upload do PDF: " + error?.message)
      }
    } catch (err: any) {
      alert("Erro ao fazer upload: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from("patient_diet_recipes").insert({
      patient_id: patientId,
      user_id: user?.id,
      title: formData.title,
      description: formData.description,
      meal_type: formData.meal_type,
      image_url: formData.pdf_url,
      ingredients: [],
      preparation: [],
      calories: null,
      protein: null,
      carbs: null,
      fats: null,
      notes: "",
    })

    if (!error) {
      setOpen(false)
      setFormData({
        title: "",
        description: "",
        meal_type: "lunch",
        pdf_url: "",
      })
      loadDietRecipes()
    } else {
      alert("Erro ao adicionar plano de dieta: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano de dieta? Esta ação não pode ser desfeita.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("patient_diet_recipes").delete().eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar receita:", error)
      alert("Erro ao excluir plano de dieta")
      return
    }

    alert("Plano de dieta excluído com sucesso!")
    loadDietRecipes()
  }

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: "Café da Manhã",
      lunch: "Almoço",
      dinner: "Jantar",
      snack: "Lanche",
    }
    return labels[type] || type
  }

  if (loading) {
    return <div className="text-center py-4">Carregando planos de dieta...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Planos de Dieta Personalizados</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Plano de Dieta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <Select value={formData.meal_type} onValueChange={(v) => setFormData({ ...formData, meal_type: v })}>
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
                  {formData.pdf_url && (
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
                    required={!formData.pdf_url}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading || !formData.pdf_url}>
                  {uploading ? "Enviando..." : "Adicionar Plano"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {dietRecipes.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhum plano de dieta cadastrado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {dietRecipes.map((recipe) => (
            <Card key={recipe.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{recipe.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{getMealTypeLabel(recipe.meal_type)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(recipe.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recipe.description && <p className="text-sm text-foreground">{recipe.description}</p>}

                {recipe.image_url && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Plano de Dieta (PDF):</p>
                    <div className="border border-border rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={`${recipe.image_url}#toolbar=0`}
                        className="w-full h-96"
                        title={recipe.title}
                        style={{ border: "none" }}
                      />
                    </div>
                    <a
                      href={recipe.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Abrir em nova aba
                    </a>
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
