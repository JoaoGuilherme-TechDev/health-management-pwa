"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { UtensilsCrossed, Flame, Droplets, Beef, Wheat, ExternalLink } from "lucide-react"
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
  const router = useRouter()
  const [dietRecipes, setDietRecipes] = useState<DietRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

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
  
  const loadDiet = async (id: string) => {
    try {
      setError(null)
      const res = await fetch(
        `/api/data?table=patient_diet_recipes&match_key=patient_id&match_value=${id}`
      )

      if (!res.ok) {
        const errorText = await res.text()
        console.error("[v0] Error loading recipes:", errorText)
        setError("Erro ao carregar receitas")
        setDietRecipes([])
        return
      }

      let recipes = await res.json()
      if (!Array.isArray(recipes)) recipes = [recipes]
      recipes.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setDietRecipes(recipes)
    } catch (err) {
      console.error("[v0] Error loading diet data:", err)
      setError("Erro inesperado ao carregar dados")
    }
  }

  useEffect(() => {
    let isMounted = true
    let interval: ReturnType<typeof setInterval> | undefined

    const initialize = async () => {
      try {
        const authRes = await fetch("/api/auth/me")
        if (!authRes.ok) {
          setError("Usuário não autenticado")
          setLoading(false)
          router.push("/login")
          return
        }

        const { user } = await authRes.json()

        if (!user) {
          setError("Usuário não autenticado")
          setLoading(false)
          router.push("/login")
          return
        }

        if (!isMounted) return

        setUserId(user.id)
        await loadDiet(user.id)
        setLoading(false)

        interval = setInterval(() => {
          if (isMounted && user.id && !document.hidden) {
            loadDiet(user.id)
          }
        }, 15000)
      } catch (err) {
        console.error("[v0] Error initializing diet page:", err)
        if (isMounted) {
          setError("Erro ao inicializar a página")
          setLoading(false)
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
      if (interval) clearInterval(interval)
    }
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p className="text-muted-foreground">Carregando sua dieta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minha Dieta</h1>
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum plano de dieta cadastrado</h3>
            <p className="text-muted-foreground">Seu médico ainda não adicionou planos alimentares</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dietRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="overflow-hidden rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-foreground">{recipe.title}</h3>
                      {recipe.meal_type && (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                          {getMealTypeLabel(recipe.meal_type)}
                        </span>
                      )}
                    </div>

                    {recipe.description && <p className="text-sm text-muted-foreground mb-4">{recipe.description}</p>}

                    {recipe.image_url && (
                      <div className="bg-teal-50 dark:bg-teal-950/20 rounded-lg p-4 mb-4 flex items-center gap-3">
                        <ExternalLink className="h-5 w-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                        <div className="flex-1">
                          <a
                            href={recipe.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300"
                          >
                            Ver Plano de Dieta
                          </a>
                          <p className="text-xs text-teal-600/70 dark:text-teal-500/70">Clique para abrir o arquivo</p>
                        </div>
                      </div>
                    )}

                    {(recipe.calories || recipe.protein || recipe.carbs || recipe.fats) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg mb-4">
                        {recipe.calories && (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                            </div>
                            <span className="font-semibold text-sm">{recipe.calories}</span>
                            <span className="text-xs text-muted-foreground block">kcal</span>
                          </div>
                        )}
                        {recipe.protein && (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Beef className="h-4 w-4 text-red-500" />
                            </div>
                            <span className="font-semibold text-sm">{recipe.protein}g</span>
                            <span className="text-xs text-muted-foreground block">prot</span>
                          </div>
                        )}
                        {recipe.carbs && (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Wheat className="h-4 w-4 text-yellow-600" />
                            </div>
                            <span className="font-semibold text-sm">{recipe.carbs}g</span>
                            <span className="text-xs text-muted-foreground block">carb</span>
                          </div>
                        )}
                        {recipe.fats && (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Droplets className="h-4 w-4 text-blue-500" />
                            </div>
                            <span className="font-semibold text-sm">{recipe.fats}g</span>
                            <span className="text-xs text-muted-foreground block">gord</span>
                          </div>
                        )}
                      </div>
                    )}

                    {recipe.doctor_name && (
                      <p className="text-xs text-muted-foreground">
                        Prescrito por: Dr(a). {recipe.doctor_name} {recipe.doctor_crm && `• CRM ${recipe.doctor_crm}`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  </div>
  )
}
