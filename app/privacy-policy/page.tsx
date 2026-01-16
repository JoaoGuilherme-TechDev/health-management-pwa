// app/privacy-policy/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart } from "lucide-react"

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

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
            <p>
              Bem-vindo(a) ao <strong>HealthCare+</strong>. Esta Política de Privacidade explica como coletamos, usamos,
              armazenamos e protegemos suas informações pessoais quando você utiliza nosso aplicativo e serviços
              relacionados.
            </p>
            <p>
              Ao utilizar o HealthCare+, você declara estar ciente e de acordo com o tratamento dos seus dados pessoais
              conforme descrito abaixo. Caso não concorde com esta política, recomendamos que não utilize o serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
            <p className="mb-2">
              Podemos coletar os seguintes tipos de informações, de acordo com o uso que você faz do aplicativo:
            </p>
            <ul>
              <li>
                <strong>Dados de conta:</strong> nome, e-mail, telefone, senha (armazenada de forma criptografada) e
                demais dados de cadastro necessários para criar e manter seu acesso.
              </li>
              <li>
                <strong>Dados de saúde:</strong> consultas agendadas, histórico de consultas, prescrições médicas,
                medicamentos e horários, alergias, evolução física, dietas, anotações e outras informações relacionadas
                ao seu cuidado em saúde.
              </li>
              <li>
                <strong>Dados de uso:</strong> páginas acessadas, interações dentro do app, identificadores de dispositivo,
                tipo de navegador, sistema operacional, endereço IP e registros de erro.
              </li>
              <li>
                <strong>Dados de comunicação e notificações:</strong> tokens de notificação push, número de telefone
                utilizado para envio de SMS ou mensagens, preferências de comunicação e histórico de notificações
                relacionadas ao serviço.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Como Utilizamos Seus Dados</h2>
            <p className="mb-2">Utilizamos seus dados pessoais para:</p>
            <ul>
              <li>criar e gerenciar sua conta no HealthCare+;</li>
              <li>exibir e organizar suas consultas, medicamentos, prescrições, dietas e evolução;</li>
              <li>enviar lembretes e notificações sobre consultas, medicamentos e outras informações importantes;</li>
              <li>personalizar sua experiência no aplicativo;</li>
              <li>monitorar e melhorar o desempenho, segurança e estabilidade do serviço;</li>
              <li>cumprir obrigações legais e regulatórias, quando aplicável.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Bases Legais para Tratamento</h2>
            <p className="mb-2">O tratamento dos seus dados pessoais pode ocorrer com base em:</p>
            <ul>
              <li>
                <strong>Execução de contrato:</strong> para fornecer o serviço que você solicitou ao criar sua conta e
                utilizar o aplicativo.
              </li>
              <li>
                <strong>Consentimento:</strong> especialmente para dados sensíveis de saúde e para envio de certas
                comunicações e notificações.
              </li>
              <li>
                <strong>Legítimo interesse:</strong> para aprimorar o serviço, prevenir fraudes e garantir a segurança,
                desde que respeitados seus direitos e liberdades fundamentais.
              </li>
              <li>
                <strong>Obrigação legal:</strong> quando precisarmos cumprir obrigações previstas em lei ou por
                autoridades competentes.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Compartilhamento de Informações</h2>
            <p className="mb-2">
              Não vendemos seus dados pessoais. Podemos compartilhar suas informações apenas nas seguintes situações:
            </p>
            <ul>
              <li>
                <strong>Profissionais de saúde e clínicas parceiras:</strong> para permitir o agendamento, acompanhamento
                e registro de consultas, prescrições e planos de cuidado.
              </li>
              <li>
                <strong>Fornecedores de tecnologia:</strong> empresas que prestam serviços de hospedagem, banco de dados,
                envio de e-mails, SMS ou notificações push e ferramentas de análise.
              </li>
              <li>
                <strong>Autoridades públicas:</strong> quando necessário para cumprimento de obrigação legal, ordem
                judicial ou solicitação de autoridade competente.
              </li>
              <li>
                <strong>Operações societárias:</strong> em caso de fusão, aquisição ou reorganização, seus dados podem
                ser transferidos, respeitando os requisitos legais aplicáveis.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Transferências Internacionais</h2>
            <p>
              Alguns dos nossos fornecedores de tecnologia podem estar localizados em outros países. Nesses casos,
              adotamos medidas para garantir que a transferência de dados ocorra de forma segura e em conformidade com a
              legislação aplicável, utilizando cláusulas contratuais adequadas ou outros mecanismos de proteção.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Segurança das Informações</h2>
            <p>
              Empregamos medidas técnicas e organizacionais razoáveis para proteger seus dados pessoais contra acessos
              não autorizados, perda, destruição ou alteração, incluindo criptografia em trânsito, controles de acesso e
              monitoramento de segurança. Ainda assim, nenhum sistema é totalmente imune a riscos, e não podemos garantir
              segurança absoluta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Retenção de Dados</h2>
            <p>
              Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta Política de
              Privacidade, respeitando prazos legais e regulatórios aplicáveis. Ao encerrar sua conta, poderemos
              anonimizar ou excluir seus dados, mantendo apenas o que for necessário para cumprimento de obrigações
              legais ou exercício regular de direitos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Seus Direitos</h2>
            <p className="mb-2">
              De acordo com a legislação de proteção de dados aplicável, você pode ter os seguintes direitos em relação
              aos seus dados pessoais:
            </p>
            <ul>
              <li>confirmar se realizamos tratamento de seus dados pessoais;</li>
              <li>acessar os dados pessoais que mantemos sobre você;</li>
              <li>solicitar correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
              <li>solicitar a portabilidade de seus dados, quando aplicável;</li>
              <li>revogar consentimentos concedidos e se opor a tratamentos realizados com base em legítimo interesse;</li>
              <li>solicitar a exclusão da sua conta, observadas as limitações legais.</li>
            </ul>
            <p className="mt-2">
              Para exercer seus direitos, entre em contato conosco pelo e-mail{" "}
              <span className="font-medium">contato@seu-dominio.com</span>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Privacidade de Crianças e Adolescentes</h2>
            <p>
              O HealthCare+ não é destinado diretamente a crianças sem supervisão. O uso por menores de idade deve
              ocorrer com o acompanhamento e consentimento de pais ou responsáveis legais, quando exigido pela
              legislação. Caso identifiquemos o tratamento indevido de dados de menores sem o consentimento adequado,
              adotaremos as medidas necessárias para regularizar ou excluir tais dados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Atualizações desta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças no serviço, na
              legislação ou em requisitos regulatórios. Sempre que houver alterações relevantes, poderemos notificá-lo
              por meio do aplicativo ou por outros canais apropriados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contato</h2>
            <p>
              Em caso de dúvidas, solicitações ou reclamações relacionadas a esta Política de Privacidade ou ao
              tratamento de seus dados pessoais, entre em contato pelo e-mail{" "}
              <span className="font-medium">contato@seu-dominio.com</span>.
            </p>
          </section>
        </div>

      </div>

      <footer className="border-t border-border bg-muted/30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; 2025 HealthCare+. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
