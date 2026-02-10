"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Edit2, Plus, Utensils } from "lucide-react"
import RecipeForm from "@/components/recipe-form"

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<any>(null)

  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      const res = await fetch("/api/data?table=recipes")
      if (res.ok) {
        const data = await res.json()
        setRecipes(data || [])
      }
    } catch (error) {
      console.error("Error loading recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza de que deseja excluir esta receita?")) {
      try {
        await fetch(`/api/data?table=recipes&match_key=id&match_value=${id}`, {
          method: 'DELETE'
        })
        loadRecipes()
      } catch (error) {
        console.error("Error deleting recipe:", error)
        alert("Erro ao excluir receita")
      }
    }
  }

  if (loading) return <div className="text-center py-12">Carregando receitas...</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Receitas</h1>
          <p className="text-muted-foreground mt-2">Adicione, edite ou exclua receitas fitness</p>
          </div>
          <Button
          onClick={() => {
            setEditingRecipe(null)
            setShowForm(!showForm)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Receita
        </Button>
      </div>

      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onSuccess={() => {
            setShowForm(false)
            setEditingRecipe(null)
            loadRecipes()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingRecipe(null)
          }}
        />
      )}

      <div className="grid gap-6">
        {recipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardContent className="pt-6">
              <div className="flex gap-6">
                {recipe.image_url && (
                  <img
                    src={recipe.image_url || "/placeholder.svg"}
                    alt={recipe.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{recipe.title}</h3>
                  <p className="text-muted-foreground mb-4">{recipe.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Ingredientes: {recipe.ingredients.length}</p>
                    <p className="text-sm font-medium text-foreground">Passos: {recipe.preparation.length}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRecipe(recipe)
                      setShowForm(true)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(recipe.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recipes.length === 0 && !showForm && (
        <Card>
          <CardContent className="pt-12 text-center">
             <Utensils className="h-12 w-12 text-foreground inline-block mr-2 mb-2 " />
            <p className="text-muted-foreground mb-4">Nenhuma receita ainda. Crie a sua primeira!</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Receita
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
