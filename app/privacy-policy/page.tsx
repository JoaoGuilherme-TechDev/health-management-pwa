import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart, LogOut, Utensils } from "lucide-react"
import  Link  from "next/link"

export default function PrivacyPolicyPage() {
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
          <CardTitle className="text-3xl font-bold">Política de Privacidade</CardTitle> 
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Coleta de Informações</h2>
            <p className="text-muted-foreground">
              Coletamos informações pessoais que você nos fornece diretamente, como nome, e-mail, dados de saúde e histórico médico.
              Essas informações são essenciais para fornecer os serviços de gestão de saúde personalizados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Uso das Informações</h2>
            <p className="text-muted-foreground">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc pl-6 mt-2 text-muted-foreground">
              <li>Fornecer e manter nossos serviços de saúde.</li>
              <li>Monitorar e analisar tendências e uso.</li>
              <li>Comunicar com você sobre consultas, medicamentos e atualizações.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Proteção de Dados</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Compartilhamento</h2>
            <p className="text-muted-foreground">
              Não vendemos suas informações pessoais. Compartilhamos dados apenas com profissionais de saúde autorizados por você ou quando exigido por lei.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
