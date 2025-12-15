# 🚀 Lista de Verificação para Deploy em Produção

## ✅ Antes do Deploy

### 1. Configuração do Supabase
- [ ] Todas as tabelas criadas (executar scripts SQL em ordem)
- [ ] RLS (Row Level Security) habilitado em todas as tabelas
- [ ] Políticas RLS configuradas corretamente
- [ ] Storage buckets criados ("prescriptions", "recipes", "supplements")
- [ ] Políticas de storage configuradas
- [ ] Triggers e funções configurados

### 2. Variáveis de Ambiente
Configurar no painel da Vercel:

\`\`\`env
# Supabase (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Supabase Auth
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_[KEY]=sua_chave_publicavel
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_JWT_SECRET=seu_jwt_secret
SUPABASE_SECRET_KEY=sua_chave_secreta

# Redirect URL
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://seu-dominio.vercel.app

# Notificações Push (OPCIONAL - mas recomendado)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_vapid_publica
VAPID_PRIVATE_KEY=sua_chave_vapid_privada
\`\`\`

### 3. Geração de Chaves VAPID
Se quiser notificações push:
\`\`\`bash
npx web-push generate-vapid-keys
\`\`\`
Adicione as chaves às variáveis de ambiente.

### 4. Configuração do Banco de Dados

#### Scripts SQL (executar em ordem):
1. `001_create_schema.sql` - Schema inicial
2. `002-018_*` - Correções e melhorias
3. `019_create_storage_buckets.sql` - Storage
4. `020_fix_health_metrics_rls.sql` - RLS metrics
5. `021_fix_notification_types.sql` - Tipos de notificação
6. `022_add_push_subscriptions_table.sql` - Push notifications
7. `023_remove_health_metrics_table.sql` - Limpeza
8. `024_cleanup_inactive_records.sql` - Limpeza de dados

### 5. Primeiro Acesso (Setup Admin)
- [ ] Acessar `/setup` pela primeira vez
- [ ] Criar conta de administrador
- [ ] Salvar credenciais com segurança
- [ ] Fazer login e configurar informações do médico

### 6. Testes Pré-Deploy
- [ ] Login de admin funciona
- [ ] Login de paciente funciona
- [ ] Criação de paciente funciona
- [ ] Adicionar medicamentos funciona
- [ ] Adicionar consultas funciona
- [ ] Upload de arquivos funciona
- [ ] Notificações são enviadas
- [ ] Landing page carrega corretamente

## 🔧 Otimizações de Performance

### Next.js
- [x] Imagens otimizadas com Next/Image
- [x] Lazy loading de componentes
- [x] Server Components onde possível
- [x] Metadata SEO configurado
- [x] Analytics da Vercel integrado

### PWA
- [x] Service Worker configurado
- [x] Manifest.json criado
- [x] Ícones de app configurados
- [x] Cache strategies implementadas
- [x] Suporte offline

### Segurança
- [x] RLS em todas as tabelas
- [x] Validação de entrada (client e server)
- [x] Sanitização de dados
- [x] Autenticação JWT via Supabase
- [x] HTTPS obrigatório
- [x] Rate limiting em APIs

## 🚀 Deploy na Vercel

### 1. Conectar Repositório
\`\`\`bash
# No GitHub
git add .
git commit -m "feat: preparar para produção"
git push origin main
\`\`\`

### 2. Importar no Vercel
1. Acesse vercel.com
2. Clique em "New Project"
3. Importe seu repositório do GitHub
4. Configure as variáveis de ambiente
5. Deploy!

### 3. Configurações Recomendadas
- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Node Version**: 18.x ou superior

### 4. Domínio Personalizado (Opcional)
- Adicionar domínio personalizado no painel da Vercel
- Configurar DNS conforme instruções
- Aguardar propagação (até 48h)

## 📱 Pós-Deploy

### 1. Verificações
- [ ] Site carrega em https://seu-dominio.vercel.app
- [ ] Login funciona
- [ ] Todas as páginas carregam
- [ ] Notificações funcionam
- [ ] Upload de arquivos funciona
- [ ] PWA pode ser instalado

### 2. Testes Mobile
- [ ] Testar em iOS Safari
- [ ] Testar em Android Chrome
- [ ] Instalar como PWA
- [ ] Testar offline
- [ ] Verificar notificações push

### 3. Monitoramento
- [ ] Configurar Vercel Analytics
- [ ] Monitorar erros no Supabase Dashboard
- [ ] Configurar alertas de downtime
- [ ] Revisar logs de acesso

## 🔍 Troubleshooting

### Deploy Falhou
1. Verificar variáveis de ambiente
2. Verificar logs de build na Vercel
3. Garantir que todas as dependências estão no package.json
4. Verificar compatibilidade com Node.js 18+

### Site não carrega
1. Verificar URL do Supabase nas variáveis
2. Limpar cache do navegador
3. Verificar console do navegador
4. Verificar logs da Vercel

### Notificações não funcionam
1. Verificar chaves VAPID configuradas
2. Verificar permissões do navegador
3. Testar em HTTPS (necessário para push)
4. Verificar script 022 foi executado

### RLS Errors
1. Executar todos os scripts SQL em ordem
2. Verificar role do usuário (admin/patient)
3. Consultar logs do Supabase
4. Verificar políticas estão ativas

## 📞 Suporte

Se encontrar problemas:
1. Verifique esta checklist primeiro
2. Consulte o README.md
3. Verifique logs do Supabase
4. Verifique logs da Vercel
5. Revise os scripts SQL

## 🎉 Deploy Completo!

Seu sistema HealthCare+ está pronto para produção! 

Lembre-se de:
- Fazer backup regular do banco de dados
- Monitorar performance e erros
- Manter dependências atualizadas
- Revisar segurança periodicamente
