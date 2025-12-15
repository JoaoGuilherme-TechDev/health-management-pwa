# 🤝 Contribuindo para o HealthCare+

Obrigado por considerar contribuir para o HealthCare+! Este documento fornece diretrizes para contribuição.

## Como Contribuir

### 1. Reportar Bugs
- Use a aba "Issues" do GitHub
- Descreva o problema claramente
- Inclua passos para reproduzir
- Adicione screenshots se relevante
- Especifique ambiente (browser, OS, etc.)

### 2. Sugerir Features
- Abra uma issue com tag [FEATURE]
- Explique o caso de uso
- Descreva o comportamento esperado
- Considere impacto em usuários existentes

### 3. Pull Requests

#### Antes de Começar
1. Fork o repositório
2. Clone seu fork
3. Crie uma branch: `git checkout -b feature/minha-feature`
4. Configure as variáveis de ambiente

#### Durante o Desenvolvimento
1. Siga os padrões de código existentes
2. Escreva código limpo e comentado
3. Teste suas alterações localmente
4. Commit com mensagens descritivas

#### Padrões de Commit
\`\`\`
feat: adiciona nova funcionalidade
fix: corrige um bug
docs: atualiza documentação
style: formatação, pontos e vírgulas, etc
refactor: refatoração de código
test: adiciona ou atualiza testes
chore: atualização de dependências, etc
\`\`\`

#### Ao Finalizar
1. Push para seu fork
2. Abra um Pull Request
3. Descreva suas alterações
4. Referencie issues relacionadas
5. Aguarde review

## Diretrizes de Código

### TypeScript
- Use tipos explícitos sempre que possível
- Evite `any` - use `unknown` se necessário
- Prefira interfaces para objetos
- Use enums para constantes relacionadas

### React/Next.js
- Use Server Components por padrão
- Client Components apenas quando necessário
- Prefira composição a herança
- Use hooks personalizados para lógica reutilizável

### Styling
- Use Tailwind CSS
- Siga a paleta de cores do tema
- Mobile-first responsive design
- Mantenha consistência com componentes existentes

### Segurança
- Nunca commite secrets ou API keys
- Valide entrada de usuários
- Use RLS para proteção de dados
- Sanitize dados antes de exibir

## Estrutura do Projeto

\`\`\`
healthcare-plus/
├── app/                    # Next.js App Router
│   ├── admin/             # Rotas administrativas
│   ├── patient/           # Rotas do paciente
│   ├── auth/              # Autenticação
│   └── api/               # API routes
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   └── *.tsx             # Componentes específicos
├── lib/                   # Utilitários
│   ├── supabase/         # Cliente Supabase
│   └── security.ts       # Funções de segurança
├── scripts/               # Scripts SQL
└── public/                # Assets estáticos
\`\`\`

## Testando

### Local
\`\`\`bash
npm run dev
# ou
bun dev
\`\`\`

### Build de Produção
\`\`\`bash
npm run build
npm start
\`\`\`

## Código de Conduta

### Nossas Expectativas
- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

### Comportamentos Inaceitáveis
- Assédio ou discriminação
- Trolling ou comentários depreciativos
- Publicar informações privadas sem permissão
- Conduta não profissional

## Perguntas?

- Abra uma Discussion no GitHub
- Entre em contato: contribuidores@exemplo.com

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).

Obrigado por ajudar a melhorar o HealthCare+! 💚
