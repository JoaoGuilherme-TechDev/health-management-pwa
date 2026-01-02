"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UtensilsCrossed, Flame, Droplets, Beef, Wheat } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface DietRecipe {
  id: string
  title: string
  description?: string
  meal_type?: string
  image_url?: string
  doctor_name?: string
  doctor_crm?: string
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  fiber?: number
  ingredients?: string[]
  preparation?: string[]
  notes?: string
}

export default function PatientDietPage() {
  const [dietRecipes, setDietRecipes] = useState<DietRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(true)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const loadDiet = async (id: string) => {
    try {
      setError(null)
      const supabase = createClient()

      const { data: recipes, error: recipesError } = await supabase
        .from("patient_diet_recipes")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false })

      if (recipesError) {
        console.error("[v0] Error loading recipes:", recipesError)
        setError(`Erro ao carregar receitas: ${recipesError.message}`)
      } else {
        setDietRecipes(recipes || [])
      }
    } catch (err) {
      console.error("[v0] Error loading diet data:", err)
      setError("Erro inesperado ao carregar dados")
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        setError("Usuário não autenticado")
        setLoading(false)
        return
      }

      setUserId(data.user.id)
      await loadDiet(data.user.id)

      const recipesChannel = supabase
        .channel(`diet-recipes-${data.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "patient_diet_recipes",
            filter: `patient_id=eq.${data.user.id}`,
          },
          () => {
            console.log("[v0] Diet recipes updated")
            if (isMounted) loadDiet(data.user.id)
          },
        )
        .subscribe((status) => {
          console.log("[v0] Diet recipes subscription status:", status)
        })

      setLoading(false)

      return () => {
        supabase.removeChannel(recipesChannel)
      }
    }

    let cleanup: Promise<(() => void) | undefined> | undefined
    if (isMounted) {
      cleanup = initialize()
    }

    return () => {
      cleanup?.then((fn) => fn?.())
    }
  }, [isMounted])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-muted-foreground">Carregando sua dieta...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minha Dieta e Nutrição</h1>
        <p className="text-muted-foreground mt-2">Plano alimentar prescrito pelo seu médico</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
            <Card key={recipe.id} className="hover:border-primary transition-colors">
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
                      <div className="text-sm flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <div>
                          <span className="font-medium">{recipe.calories}</span>
                          <span className="text-xs text-muted-foreground ml-1">kcal</span>
                        </div>
                      </div>
                    )}
                    {recipe.protein && (
                      <div className="text-sm flex items-center gap-2">
                        <Beef className="h-4 w-4 text-red-500" />
                        <div>
                          <span className="font-medium">{recipe.protein}</span>
                          <span className="text-xs text-muted-foreground ml-1">g prot</span>
                        </div>
                      </div>
                    )}
                    {recipe.carbs && (
                      <div className="text-sm flex items-center gap-2">
                        <Wheat className="h-4 w-4 text-yellow-600" />
                        <div>
                          <span className="font-medium">{recipe.carbs}</span>
                          <span className="text-xs text-muted-foreground ml-1">g carb</span>
                        </div>
                      </div>
                    )}
                    {recipe.fats && (
                      <div className="text-sm flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <div>
                          <span className="font-medium">{recipe.fats}</span>
                          <span className="text-xs text-muted-foreground ml-1">g gord</span>
                        </div>
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
