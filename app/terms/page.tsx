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
                Ao acessar ou usar o <strong>HealthCare+</strong>, você concorda em ficar vinculado a estes Termos de
                Serviço. Se você não concordar com qualquer parte destes termos, não deverá utilizar o aplicativo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground">
                O HealthCare+ é um aplicativo voltado ao gerenciamento de saúde, permitindo o agendamento e acompanhamento
                de consultas, controle de medicamentos, visualização de prescrições, planos alimentares e evolução
                física, além do envio de lembretes e notificações relacionadas ao seu cuidado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">3. Cadastro e Segurança da Conta</h2>
              <p className="text-muted-foreground">
                Para utilizar determinadas funcionalidades, você deverá criar uma conta, fornecendo informações verdadeiras,
                completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e
                por todas as atividades realizadas em sua conta. Em caso de uso não autorizado, você deve nos informar
                imediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">4. Uso Adequado do Serviço</h2>
              <p className="text-muted-foreground mb-2">
                Você se compromete a utilizar o HealthCare+ de forma ética e em conformidade com a legislação aplicável,
                sendo vedado:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>utilizar o serviço para fins ilícitos, discriminatórios ou abusivos;</li>
                <li>inserir informações falsas, ofensivas ou que violem direitos de terceiros;</li>
                <li>tentar acessar áreas não autorizadas do sistema ou comprometer a segurança do aplicativo;</li>
                <li>realizar engenharia reversa ou qualquer forma de exploração indevida do código-fonte.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">5. Natureza Informativa e Não Médica</h2>
              <p className="text-muted-foreground">
                O HealthCare+ é uma ferramenta de apoio à organização do cuidado em saúde e não substitui, em hipótese
                alguma, a consulta presencial com profissionais habilitados. Nenhuma informação disponibilizada no
                aplicativo deve ser interpretada como diagnóstico, prescrição ou recomendação médica definitiva. Em caso de
                dúvidas ou emergência, procure imediatamente atendimento médico.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">6. Conteúdo Inserido por Usuários e Profissionais</h2>
              <p className="text-muted-foreground">
                Você é responsável por todo conteúdo que inserir ou compartilhar no aplicativo. Profissionais de saúde que
                utilizarem o HealthCare+ para registrar informações sobre pacientes devem agir de acordo com a ética e as
                normas de sua profissão. Não nos responsabilizamos por erros, omissões ou condutas desses profissionais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">7. Notificações e Comunicações</h2>
              <p className="text-muted-foreground">
                Ao utilizar o aplicativo, você poderá receber notificações push, e-mails ou mensagens (como SMS/WhatsApp)
                com lembretes de consultas, medicamentos e informações relacionadas ao serviço. Você pode gerenciar suas
                preferências nas configurações do aplicativo ou do seu dispositivo. Algumas comunicações importantes sobre
                segurança e atualização dos termos poderão ser enviadas mesmo que você desative notificações opcionais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">8. Privacidade e Proteção de Dados</h2>
              <p className="text-muted-foreground">
                O tratamento de seus dados pessoais, incluindo dados de saúde, é regido pela nossa Política de
                Privacidade. Ao aceitar estes Termos, você também declara ter lido e concordado com a Política de
                Privacidade do HealthCare+.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">9. Propriedade Intelectual</h2>
              <p className="text-muted-foreground">
                Todos os direitos relativos ao aplicativo, incluindo design, logotipos, marcas, layout, funcionalidades e
                conteúdos disponibilizados, pertencem ao HealthCare+ ou a seus licenciadores, sendo protegidos por leis de
                propriedade intelectual. Você recebe apenas uma licença limitada, não exclusiva e intransferível para uso
                pessoal do serviço, vedada qualquer reprodução, distribuição ou exploração comercial não autorizada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">10. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground">
                Na máxima extensão permitida pela legislação aplicável, o HealthCare+ não se responsabiliza por danos
                indiretos, lucros cessantes, perda de dados ou quaisquer outros prejuízos decorrentes do uso ou da
                impossibilidade de uso do aplicativo, bem como por ações ou omissões de profissionais de saúde e terceiros
                que utilizem a plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">11. Encerramento e Suspensão do Acesso</h2>
              <p className="text-muted-foreground">
                Podemos suspender ou encerrar seu acesso ao HealthCare+ a qualquer momento em caso de descumprimento
                destes Termos, uso indevido do serviço ou por exigência legal. Você também pode solicitar a exclusão de
                sua conta a qualquer momento, nos termos da nossa Política de Privacidade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">12. Alterações destes Termos</h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de alterar estes Termos de Serviço a qualquer momento. Alterações relevantes serão
                comunicadas por meio do aplicativo ou por outros canais apropriados. O uso contínuo do HealthCare+ após a
                publicação das alterações significa que você aceita os novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">13. Contato</h2>
              <p className="text-muted-foreground">
                Em caso de dúvidas sobre estes Termos de Serviço, entre em contato pelo e-mail{" "}
                <span className="font-medium">contato@seu-dominio.com</span>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
