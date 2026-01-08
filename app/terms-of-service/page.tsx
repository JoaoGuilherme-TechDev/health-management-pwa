import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart } from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
      <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">HealthCare+</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Início
            </Link>
          </Button>
        </div>
      </nav>


    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Termos de Serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar ou usar nosso serviço, você concorda em ficar vinculado a estes termos. Se você não concordar com alguma parte dos termos, não poderá acessar o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Uso do Serviço</h2>
            <p className="text-muted-foreground">
              O serviço é destinado ao gerenciamento de saúde pessoal e acompanhamento médico. Você é responsável por manter a confidencialidade de sua conta e senha.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Responsabilidade Médica</h2>
            <p className="text-muted-foreground">
              Este aplicativo é uma ferramenta de apoio e não substitui o aconselhamento médico profissional. Sempre procure a orientação de seu médico ou outro profissional de saúde qualificado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Modificações</h2>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de modificar ou substituir estes termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  </div>
  )
}
