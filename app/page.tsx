"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart, X } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null)
  const [recipes, setRecipes] = useState<any[]>([])
  const [supplements, setSupplements] = useState<any[]>([])
  const [doctorInfo, setDoctorInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    const supabase = createClient()

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("doctor_full_name, doctor_crm, doctor_specialization")
      .eq("role", "admin")
      .single()

    setDoctorInfo(adminProfile)

    const [recipesData, supplementsData] = await Promise.all([
      supabase.from("recipes").select("*").order("created_at", { ascending: false }),
      supabase.from("supplements").select("*").order("created_at", { ascending: false }),
    ])

    setRecipes(recipesData.data || [])
    setSupplements(supplementsData.data || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>
  }

   return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">HealthCare+</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}

      {/* Recipes Section */}
      <section id="recipes" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Receitas Fitness Saudáveis</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Refeições nutritivas desenvolvidas para apoiar o crescimento muscular e recuperação
            </p>
            {doctorInfo && (
              <div className="mt-6 inline-block px-6 py-3 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-sm font-medium text-foreground">
                  Receitas elaboradas por: <span className="font-bold">{doctorInfo.doctor_full_name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {doctorInfo.doctor_crm} {doctorInfo.doctor_specialization && `• ${doctorInfo.doctor_specialization}`}
                </p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {recipes.map((recipe, i) => (
              <button
                key={recipe.id}
                onClick={() => setSelectedRecipe(i)}
                className="p-8 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer text-left hover:shadow-lg hover:bg-primary/5"
              >
                {recipe.image_url && (
                  <img
                    src={recipe.image_url || "/placeholder.svg"}
                    alt={recipe.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-xl font-semibold text-foreground mb-2">{recipe.title}</h3>
                <p className="text-muted-foreground">{recipe.description}</p>
                <p className="text-sm text-primary mt-4 font-medium">Clique para ver a receita →</p>
              </button>
            ))}
          </div>

          {recipes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma receita disponível ainda.</p>
            </div>
          )}
                  </div>
      </section>

      {/* Supplements Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-primary/5 border-t border-border">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Suplementos Recomendados</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Suplementos essenciais para melhorar seu desempenho fitness e saúde
              </p>
            {doctorInfo && (
              <div className="mt-6 inline-block px-6 py-3 rounded-lg border border-primary/20 bg-background">
                <p className="text-sm font-medium text-foreground">
                  Recomendações de: <span className="font-bold">{doctorInfo.doctor_full_name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {doctorInfo.doctor_crm} {doctorInfo.doctor_specialization && `• ${doctorInfo.doctor_specialization}`}
                </p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supplements.map((supplement) => (
              <div key={supplement.id} className="p-6 rounded-lg border border-border bg-background">
                {supplement.image_url && (
                  <img
                    src={supplement.image_url || "/placeholder.svg"}
                    alt={supplement.name}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-lg font-semibold text-foreground mb-2">{supplement.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{supplement.benefit}</p>
                <p className="text-sm font-medium text-primary">Dosagem: {supplement.dosage}</p>
              </div>
            ))}
          </div>

          {supplements.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum suplemento disponível ainda.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">HealthCare+</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                Política de Privacidade
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Termos de Serviço
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Contato
              </Link>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 HealthCare+. Todos os direitos reservados. Sua saúde é nossa missão.</p>
          </div>
        </div>
      </footer>

      {/* Recipe Detail Modal */}
      {selectedRecipe !== null && recipes[selectedRecipe] && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-background">
              <h2 className="text-2xl font-bold text-foreground">{recipes[selectedRecipe].title}</h2>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {recipes[selectedRecipe].image_url && (
                <img
                  src={recipes[selectedRecipe].image_url || "/placeholder.svg"}
                  alt={recipes[selectedRecipe].title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              {/* Ingredients */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Ingredientes</h3>
                <ul className="space-y-2">
                  {recipes[selectedRecipe].ingredients.map((ingredient: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span className="text-muted-foreground">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preparation */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Modo de Preparo</h3>
                <ol className="space-y-3">
                  {recipes[selectedRecipe].preparation.map((step: string, i: number) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-semibold text-primary min-w-6">{i + 1}.</span>
                      <span className="text-muted-foreground pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="sticky bottom-0 p-6 border-t border-border bg-background">
              <Button onClick={() => setSelectedRecipe(null)} className="w-full">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>)
}