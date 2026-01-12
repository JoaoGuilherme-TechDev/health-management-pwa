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
import { Plus, Trash2, Utensils, FileText, ExternalLink } from "lucide-react"

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
    // Fetch diet recipes for the patient
    const fetchDietRecipes = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("diet_recipes").select().eq("patient_id", patientId)
      if (error) {
        setError(error.message)
      } else {
        setDietRecipes(data || [])
      }
      setLoading(false)
    }

    fetchDietRecipes()
  }, [patientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const { data, error } = await supabase.from("diet_recipes").insert([formData])
    if (error) {
      alert("Erro ao adicionar plano de dieta: " + error.message)
    } else {
      setDietRecipes([...dietRecipes, data[0]])
      setOpen(false)
      setFormData({
        title: "",
        description: "",
        meal_type: "lunch",
        pdf_url: "",
      })
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("diet_recipes").delete().eq("id", id)
    if (error) {
      alert("Erro ao deletar plano de dieta: " + error.message)
    } else {
      setDietRecipes(dietRecipes.filter((recipe) => recipe.id !== id))
    }
  }

  const getMealTypeLabel = (mealType: string) => {
    switch (mealType) {
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

  const handlePdfUpload = async (file: File) => {
    const supabase = createClient()
    try {
      setUploading(true)
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50)
      const randomStr = Math.random().toString(36).substring(2, 8)
      const patientId_ = patientId
      const path = `${patientId_}/${timestamp}-${randomStr}-${sanitizedFileName}`
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

                {recipe.pdf_url && (
                  <a
                    href={recipe.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver Plano de Dieta (PDF)
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
