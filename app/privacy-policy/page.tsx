import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPolicyPage() {
  return (
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
  )
}
