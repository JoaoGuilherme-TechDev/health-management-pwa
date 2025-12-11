# Health Management PWA - Sistema Completo

## ✅ Funcionalidades Implementadas

### 🔐 Autenticação e Autorização
- Login com Supabase Auth
- Separação de roles: Admin e Paciente
- RLS (Row Level Security) configurado para todas as tabelas
- Redirecionamento automático baseado em role

### 👨‍⚕️ Painel do Admin

#### Navegação Principal
- **Painel**: Dashboard com estatísticas
- **Pacientes**: Gerenciamento completo de pacientes
- **Receitas (Landing)**: Gerenciar receitas fitness da landing page
- **Suplementos (Landing)**: Gerenciar suplementos da landing page
- **Métricas de Saúde**: Visualização geral
- **Alertas**: Sistema de alertas
- **Configurações**: Configurações do sistema

#### Gerenciamento de Pacientes
Cada paciente tem 8 abas completas:

1. **Informações**: Dados pessoais brasileiros (CPF, RG, tipo sanguíneo, etc.)
2. **Medicamentos**: Prescrição de medicamentos com dosagem e frequência
3. **Consultas**: Agendamento de consultas médicas
4. **Receitas Médicas**: Upload de PDF/PNG/JPG de receitas (obrigatório por lei)
5. **Dieta**: Receitas personalizadas com macros e modo de preparo
6. **Suplementos**: Recomendações personalizadas de suplementação
7. **Métricas**: Acompanhamento de métricas gerais de saúde
8. **Evolução Física**: Registro de bioimpedância (peso, massa muscular, % gordura, etc.)

### 👤 Painel do Paciente (Somente Leitura)

#### Navegação
- **Painel**: Dashboard com resumo
- **Medicamentos**: Visualizar medicamentos prescritos
- **Dieta**: Visualizar receitas personalizadas
- **Suplementos**: Visualizar suplementos recomendados
- **Evolução Física**: Ver evolução de bioimpedância
- **Métricas de Saúde**: Acompanhar métricas
- **Consultas**: Ver consultas agendadas
- **Notificações**: Receber lembretes e alertas
- **Configurações**: Perfil pessoal

### 🔔 Sistema de Notificações Automáticas

#### Lembretes de Medicamentos
- Notificação diária para cada medicamento ativo
- Mensagem inclui nome, dosagem e frequência
- Criado automaticamente às 9h da manhã

#### Lembretes de Consultas
- Notificação enviada 24h antes da consulta
- Inclui título, horário e data da consulta
- Previne esquecimento de compromissos médicos

#### Como Funciona
1. Cron job executa diariamente às 9h (vercel.json)
2. API `/api/cron/daily-reminders` chama dois endpoints:
   - `/api/notifications/create-medication-reminders`
   - `/api/notifications/create-appointment-reminders`
3. Sistema verifica se já existe notificação para hoje
4. Cria notificações apenas se não existirem
5. Paciente recebe no painel em `/patient/notifications`

### 🎨 Design System
- Paleta de cores focada em saúde (azul-verde pastel)
- Temas claro e escuro
- Interface responsiva (mobile-first)
- Componentes shadcn/ui
- Tradução completa em PT-BR

### 💾 Banco de Dados (Supabase)

#### Tabelas Principais
- `profiles`: Dados dos usuários (admin/paciente)
- `medications`: Medicamentos prescritos
- `appointments`: Consultas agendadas
- `medical_prescriptions`: Receitas médicas (com arquivo)
- `patient_diet_recipes`: Receitas de dieta personalizadas
- `patient_supplements`: Suplementos recomendados
- `physical_evolution`: Evolução física/bioimpedância
- `health_metrics`: Métricas gerais de saúde
- `notifications`: Sistema de notificações
- `recipes`: Receitas fitness (landing page)
- `supplements`: Suplementos (landing page)

#### RLS Policies
- Admins podem ler/escrever em todas as tabelas
- Pacientes só podem ler seus próprios dados
- Pacientes NÃO podem inserir/editar dados
- Apenas visualização no painel do paciente

### 📋 Scripts SQL Necessários

Execute na ordem:
1. `001_create_schema.sql` - Estrutura inicial
2. `011_add_brazilian_fields_and_evolution.sql` - Campos BR
3. `012_remove_encryption_triggers.sql` - Remove encriptação
4. `014_fix_admin_rls_no_recursion.sql` - Corrige RLS admin
5. `015_add_patient_specific_content.sql` - Dieta e suplementos
6. `016_add_file_support_and_notifications.sql` - Arquivos e notificações

## 🚀 Como Configurar

### 1. Variáveis de Ambiente
\`\`\`env
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_aqui
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
CRON_SECRET=sua_secret_para_cron
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
\`\`\`

### 2. Executar Scripts SQL
1. Acesse Supabase Dashboard
2. Vá em SQL Editor
3. Execute cada script na ordem listada acima

### 3. Criar Usuário Admin
1. Use `/setup` para criar o primeiro admin
2. Email: admin@example.com
3. Senha: escolha uma segura

### 4. Configurar Cron Job
O arquivo `vercel.json` já está configurado.
Vercel executará automaticamente às 9h diariamente.

## 📱 PWA Features
- Manifest configurado
- Service Worker
- Instalável no mobile
- Funciona offline (cache)

## 🔒 Segurança
- RLS habilitado em todas as tabelas
- Políticas separadas para admin e paciente
- Senhas com bcrypt
- Sessões seguras com Supabase Auth
- Upload de arquivos via Supabase Storage
- HTTPS obrigatório em produção

## ⚠️ IMPORTANTE - Notificações Críticas

**As notificações são ESSENCIAIS para segurança do paciente:**
- Esquecer medicamento pode ser fatal
- Perder consulta pode atrasar tratamento
- Sistema deve funcionar 100% do tempo

**Monitoramento recomendado:**
- Configure alertas se cron falhar
- Verifique logs diariamente
- Teste notificações semanalmente

## 📝 Próximos Passos Sugeridos
- [ ] Push notifications (Web Push API)
- [ ] Email notifications como backup
- [ ] SMS para lembretes críticos
- [ ] Gráficos de evolução temporal
- [ ] Exportação de relatórios PDF
- [ ] Integração com wearables
