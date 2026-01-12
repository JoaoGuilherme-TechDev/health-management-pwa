"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface RecipeFormProps {
  recipe?: any
  onSuccess: () => void
  onCancel: () => void
}

export default function RecipeForm({ recipe, onSuccess, onCancel }: RecipeFormProps) {
  const [formData, setFormData] = useState({
    title: recipe?.title || "",
    description: recipe?.description || "",
    ingredients: recipe?.ingredients.join("\n") || "",
    preparation: recipe?.preparation.join("\n") || "",
    image_url: recipe?.image_url || "",
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleImageUpload = async (file: File) => {
    const timestamp = Date.now()
    const path = `recipes/${timestamp}-${file.name}`
    const { data, error } = await supabase.storage.from("recipes").upload(path, file)
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("recipes").getPublicUrl(path)
      setFormData({ ...formData, image_url: urlData.publicUrl })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const ingredientsArray = formData.ingredients
      .split("\n")
      .map((i: string) => i.trim())
      .filter((i: any) => i)
    const preparationArray = formData.preparation
      .split("\n")
      .map((p: string) => p.trim())
      .filter((p: any) => p)

    const payload = {
      title: formData.title,
      description: formData.description,
      ingredients: ingredientsArray,
      preparation: preparationArray,
      image_url: formData.image_url,
    }

    if (recipe?.id) {
      await supabase.from("recipes").update(payload).eq("id", recipe.id)
    } else {
      await supabase.from("recipes").insert([payload])
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{recipe ? "Editar Receita" : "Adicionar Nova Receita"}</CardTitle>
        <button onClick={onCancel} className="p-1 hover:bg-muted rounded">
          <X className="h-5 w-5" />
        </button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Título</label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título da receita"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <Input
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve descrição"
            />
          </div>


          <div>
            <label className="text-sm font-medium text-foreground">Ingredientes (um por linha)</label>
            <Textarea
              required
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              placeholder="1 xícara de farinha&#10;2 ovos&#10;..."
              rows={5}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Passos de Preparo (um por linha)</label>
            <Textarea
              required
              value={formData.preparation}
              onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
              placeholder="Misture os ingredientes&#10;Asse por 30 minutos&#10;..."
              rows={5}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : recipe ? "Atualizar Receita" : "Adicionar Receita"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
