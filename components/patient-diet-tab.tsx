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
import { Plus, Trash2, Utensils } from "lucide-react"
import { showSimpleNotification } from "@/lib/simple-notifications"

interface PatientDietTabProps {
  patientId: string
}

export function PatientDietTab({ patientId }: PatientDietTabProps) {
  const [dietRecipes, setDietRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meal_type: "lunch",
    ingredients: "",
    preparation: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    notes: "",
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
          console.log("[v0] Receita de dieta atualizada, recarregando...")
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
    const { data } = await supabase
      .from("patient_diet_recipes")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    if (data) {
      setDietRecipes(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isPatient = user?.id === patientId

    const { error } = await supabase.from("patient_diet_recipes").insert({
      patient_id: patientId,
      doctor_id: user?.id,
      title: formData.title,
      description: formData.description,
      meal_type: formData.meal_type,
      ingredients: formData.ingredients.split("\n").filter((i) => i.trim()),
      preparation: formData.preparation.split("\n").filter((p) => p.trim()),
      calories: formData.calories ? Number.parseInt(formData.calories) : null,
      protein: formData.protein ? Number.parseFloat(formData.protein) : null,
      carbs: formData.carbs ? Number.parseFloat(formData.carbs) : null,
      fats: formData.fats ? Number.parseFloat(formData.fats) : null,
      notes: formData.notes,
    })

    if (!error) {
      if (isPatient) {
        await showSimpleNotification("🥗 Nova Receita de Dieta", {
          body: `${formData.title} - ${formData.meal_type}`,
        })
      }

      setOpen(false)
      setFormData({
        title: "",
        description: "",
        meal_type: "lunch",
        ingredients: "",
        preparation: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        notes: "",
      })
      loadDietRecipes()
    } else {
      alert("Erro ao adicionar receita: " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("patient_diet_recipes").delete().eq("id", id)

    if (error) {
      console.error("[v0] Erro ao deletar receita:", error)
      alert("Erro ao excluir receita")
      return
    }

    alert("Receita excluída com sucesso!")
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
    return <div className="text-center py-4">Carregando receitas...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Receitas Personalizadas de Dieta</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Receita de Dieta</DialogTitle>
              <DialogDescription>Crie uma receita personalizada para o paciente</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredientes (um por linha) *</Label>
                <Textarea
                  id="ingredients"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  rows={5}
                  placeholder="200g de frango&#10;1 xícara de arroz integral&#10;2 colheres de azeite"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparation">Modo de Preparo (um passo por linha) *</Label>
                <Textarea
                  id="preparation"
                  value={formData.preparation}
                  onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
                  rows={5}
                  placeholder="Tempere o frango com sal e limão&#10;Grelhe por 5 minutos de cada lado&#10;Cozinhe o arroz em água fervente"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calorias</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    placeholder="450"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Proteína (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.1"
                    value={formData.protein}
                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                    placeholder="35"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carboidratos (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.1"
                    value={formData.carbs}
                    onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                    placeholder="45"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fats">Gorduras (g)</Label>
                  <Input
                    id="fats"
                    type="number"
                    step="0.1"
                    value={formData.fats}
                    onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                    placeholder="12"
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
                  placeholder="Consumir após o treino"
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

      {dietRecipes.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhuma receita de dieta cadastrada ainda</p>
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
                {recipe.description && <p className="text-sm text-muted-foreground">{recipe.description}</p>}

                {(recipe.calories || recipe.protein || recipe.carbs || recipe.fats) && (
                  <div className="flex gap-4 text-sm">
                    {recipe.calories && (
                      <span className="text-muted-foreground">
                        <strong>{recipe.calories}</strong> kcal
                      </span>
                    )}
                    {recipe.protein && (
                      <span className="text-muted-foreground">
                        Proteína: <strong>{recipe.protein}g</strong>
                      </span>
                    )}
                    {recipe.carbs && (
                      <span className="text-muted-foreground">
                        Carbs: <strong>{recipe.carbs}g</strong>
                      </span>
                    )}
                    {recipe.fats && (
                      <span className="text-muted-foreground">
                        Gordura: <strong>{recipe.fats}g</strong>
                      </span>
                    )}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Ingredientes:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {recipe.ingredients.map((ing: string, i: number) => (
                        <li key={i}>• {ing}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Preparo:</p>
                    <ol className="text-sm text-muted-foreground space-y-1">
                      {recipe.preparation.map((step: string, i: number) => (
                        <li key={i}>
                          {i + 1}. {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {recipe.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-foreground mb-1">Observações:</p>
                    <p className="text-sm text-muted-foreground">{recipe.notes}</p>
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
