"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart, X } from "lucide-react"
import { Logo } from "@/components/logo"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null)
  const [recipes, setRecipes] = useState<any[]>([])
  const [supplements, setSupplements] = useState<any[]>([])
  const [doctorInfo, setDoctorInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/patient")
      return
    }
    
    if (!authLoading && !user) {
      loadContent()
    }
  }, [authLoading, user, router])

  // In app/page.tsx, update the loadContent function:

  const loadContent = async () => {
    console.log("Starting loadContent...")
    
    try {
      // Load doctor info
      const adminRes = await fetch('/api/data?table=profiles&match_key=role&match_value=admin')
      if (adminRes.ok) {
        const admins = await adminRes.json()
        if (Array.isArray(admins) && admins.length > 0) {
          const adminProfile = admins[0]
          console.log("Doctor info loaded:", adminProfile)
          setDoctorInfo(adminProfile)
        }
      }

      // Load recipes
      console.log("Loading recipes...")
      const recipesRes = await fetch('/api/data?table=recipes')
      if (recipesRes.ok) {
        const recipesData = await recipesRes.json()
        // Sort manually since API might not sort
        const sortedRecipes = Array.isArray(recipesData) 
          ? recipesData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          : []
        console.log("Recipes loaded:", sortedRecipes.length, "items")
        setRecipes(sortedRecipes)
      }

      // Load supplements
      console.log("Loading supplements from supplement_catalog...")
      const supplementsRes = await fetch('/api/data?table=supplement_catalog')
      if (supplementsRes.ok) {
        const supplementsData = await supplementsRes.json()
        const sortedSupplements = Array.isArray(supplementsData)
          ? supplementsData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          : []
        console.log("Supplements loaded:", sortedSupplements.length, "items")
        setSupplements(sortedSupplements)
      }

    } catch (error) {
      console.error("Unexpected error in loadContent:", error)
    } finally {
      console.log("Loading complete")
      setLoading(false)
    }
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
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground font-logo">Dra. Estefânia Rappelli</span>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button asChild>
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}

      {/* Recipes Section */}
      <section id="recipes" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Receitas Saudáveis</h2>
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

<footer className="border-t border-border bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-6xl">
    <div className="flex flex-col sm:flex-row justify-between items-center gap-8 mb-8">
      <div className="flex items-center gap-2">
        <Logo className="h-6 w-6" />
        <span className="font-semibold text-foreground">Dra. Estefânia Rappelli</span>
      </div>
      <div className="flex gap-6 text-sm text-muted-foreground">
        <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
          Política de Privacidade
        </Link> 
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Termos de Serviço
        </Link>
        <Link href="https://wa.me/999999999999" className="hover:text-foreground transition-colors">
          Contato
        </Link>
      </div>
    </div>
    <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
      <p>&copy; 2025 Dra. Estefânia Rappelli. Todos os direitos reservados. Nutrologia e Performance.</p>
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
                <div className="relative w-full h-64 overflow-hidden rounded-lg">
                  <img
                    src={recipes[selectedRecipe].image_url || "/placeholder.svg"}
                    alt={recipes[selectedRecipe].title}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm scale-110"
                  />
                  <img
                    src={recipes[selectedRecipe].image_url || "/placeholder.svg"}
                    alt={recipes[selectedRecipe].title}
                    className="relative w-full h-full object-contain z-10"
                  />
                </div>
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
    </main>
    
  )
}
