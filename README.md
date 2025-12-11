# HealthCare+ - Sistema de Gerenciamento de Saúde

Sistema PWA completo para gerenciamento de saúde de pacientes, desenvolvido com Next.js 16, Supabase e Tailwind CSS.

## 🚀 Funcionalidades

### Para Administradores (Médicos)
- ✅ Gerenciamento completo de pacientes
- ✅ Prescrição de medicamentos com notificações automáticas
- ✅ Agendamento de consultas
- ✅ Recomendações de dieta e suplementação
- ✅ Acompanhamento de evolução física (bioimpedância)
- ✅ Sistema de notificações push em tempo real
- ✅ Upload de arquivos de prescrição
- ✅ Rastreamento de CRM e informações legais

### Para Pacientes
- ✅ Visualização de medicamentos prescritos
- ✅ Calendário de consultas
- ✅ Planos de dieta personalizados
- ✅ Recomendações de suplementos
- ✅ Histórico de evolução física
- ✅ Notificações de atualizações médicas
- ✅ Interface mobile-first otimizada
- ✅ Informações do médico responsável em todos os registros

### Landing Page Pública
- ✅ Receitas fitness saudáveis
- ✅ Suplementos recomendados
- ✅ Informações do médico responsável
- ✅ Design responsivo e moderno

## 🛠 Tecnologias

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Estilo**: Tailwind CSS v4
- **Componentes UI**: shadcn/ui
- **Notificações**: Web Push API
- **Storage**: Supabase Storage
- **Deploy**: Vercel

## 📋 Pré-requisitos

- Node.js 18+ ou Bun
- Conta Supabase
- Conta Vercel (para deploy)
- Chaves VAPID para notificações push (opcional)

## 🔧 Instalação

1. Clone o repositório:
\`\`\`bash
git clone https://github.com/seu-usuario/health-management-pwa.git
cd health-management-pwa
\`\`\`

2. Instale as dependências:
\`\`\`bash
npm install
# ou
bun install
\`\`\`

3. Configure as variáveis de ambiente:
Crie um arquivo \`.env.local\` com as seguintes variáveis:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Redirect para desenvolvimento
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Notificações Push (opcional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_vapid_publica
VAPID_PRIVATE_KEY=sua_chave_vapid_privada
\`\`\`

4. Execute os scripts SQL na ordem:
- Acesse o Supabase SQL Editor
- Execute os scripts da pasta \`/scripts\` em ordem numérica (001, 002, etc.)

5. Inicie o servidor de desenvolvimento:
\`\`\`bash
npm run dev
# ou
bun dev
\`\`\`

6. Acesse http://localhost:3000

## 🔐 Primeiro Acesso

1. Acesse \`/setup\` para criar a conta de administrador
2. Credenciais padrão serão exibidas (salve com segurança!)
3. Faça login com as credenciais fornecidas
4. Configure suas informações profissionais em Configurações

## 📱 Notificações Push

Para habilitar notificações push:

1. Gere chaves VAPID:
\`\`\`bash
npx web-push generate-vapid-keys
\`\`\`

2. Adicione as chaves às variáveis de ambiente
3. Execute o script SQL \`022_add_push_subscriptions_table.sql\`
4. Os pacientes poderão permitir notificações nas configurações

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. Deploy automático a cada push para main

### Outras Plataformas

O projeto é compatível com qualquer plataforma que suporte Next.js 16:
- Netlify
- Cloudflare Pages
- Railway
- Render

## 📂 Estrutura do Projeto

\`\`\`
├── app/                    # Páginas e rotas Next.js
│   ├── admin/             # Painel administrativo
│   ├── patient/           # Painel do paciente
│   ├── auth/              # Páginas de autenticação
│   └── api/               # API routes
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes shadcn/ui
│   └── patient-*-tab.tsx # Tabs de gerenciamento do paciente
├── lib/                   # Utilitários e helpers
│   ├── supabase/         # Clientes Supabase
│   └── security.ts       # Funções de segurança
├── scripts/               # Scripts SQL de migração
├── public/                # Arquivos estáticos e service worker
└── proxy.ts              # Middleware de autenticação
\`\`\`

## 🔒 Segurança

- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Validação de entrada em servidor e cliente
- ✅ Sanitização de dados
- ✅ Autenticação JWT via Supabase
- ✅ Rate limiting em APIs críticas
- ✅ HTTPS obrigatório
- ✅ Validação de CRM e dados médicos

## 🐛 Troubleshooting

### Erro: "Session not found"
- Limpe os cookies do navegador
- Verifique se as variáveis de ambiente do Supabase estão corretas
- Certifique-se de que o proxy.ts está configurado corretamente

### RLS Policy Error
- Execute todos os scripts SQL em ordem
- Verifique se o usuário tem o role correto (admin/patient)
- Consulte os logs do Supabase para detalhes

### Notificações não funcionam
- Verifique se as chaves VAPID estão configuradas
- Certifique-se de que o HTTPS está ativo (necessário para notificações)
- Verifique permissões do navegador

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Desenvolvido por

HealthCare+ - Sistema de Gerenciamento de Saúde
Desenvolvido com ❤️ para profissionais de saúde e seus pacientes
\`\`\`

```tsx file="" isHidden
