"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UtensilsCrossed } from "lucide-react"

export default function PatientDietPage() {
  const [dietRecipes, setDietRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadDiet = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from("patient_diet_recipes")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })

      setDietRecipes(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDiet()

    const supabase = createClient()
    const channel = supabase
      .channel("diet-recipes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_diet_recipes" }, () => {
        loadDiet()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return <div className="text-center py-12">Carregando sua dieta...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minha Dieta</h1>
        <p className="text-muted-foreground mt-2">Plano alimentar personalizado pelo seu médico</p>
      </div>

      {dietRecipes.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma receita cadastrada</h3>
            <p className="text-muted-foreground">Seu médico ainda não adicionou receitas ao seu plano alimentar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {dietRecipes.map((recipe) => (
            <Card key={recipe.id}>
              <CardHeader>
                {recipe.image_url && (
                  <img
                    src={recipe.image_url || "/placeholder.svg"}
                    alt={recipe.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <CardTitle>{recipe.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {recipe.meal_type && (
                    <span className="inline-block px-2 py-1 text-xs rounded bg-primary/10 text-primary w-fit">
                      {recipe.meal_type}
                    </span>
                  )}
                  {recipe.doctor_name && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                      <span>Dr(a). {recipe.doctor_name}</span>
                      {recipe.doctor_crm && <span>• CRM {recipe.doctor_crm}</span>}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recipe.description && <p className="text-sm text-muted-foreground">{recipe.description}</p>}

                {(recipe.calories || recipe.protein || recipe.carbs || recipe.fats) && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
                    {recipe.calories && (
                      <div className="text-sm">
                        <span className="font-medium">Calorias:</span> {recipe.calories}kcal
                      </div>
                    )}
                    {recipe.protein && (
                      <div className="text-sm">
                        <span className="font-medium">Proteínas:</span> {recipe.protein}g
                      </div>
                    )}
                    {recipe.carbs && (
                      <div className="text-sm">
                        <span className="font-medium">Carboidratos:</span> {recipe.carbs}g
                      </div>
                    )}
                    {recipe.fats && (
                      <div className="text-sm">
                        <span className="font-medium">Gorduras:</span> {recipe.fats}g
                      </div>
                    )}
                  </div>
                )}

                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Ingredientes:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {recipe.ingredients.map((ing: string, idx: number) => (
                        <li key={idx}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {recipe.preparation && recipe.preparation.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Modo de Preparo:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {recipe.preparation.map((step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {recipe.notes && <p className="text-xs text-muted-foreground italic mt-2">Obs: {recipe.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
