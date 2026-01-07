import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsOfServicePage() {
  return (
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
  )
}
