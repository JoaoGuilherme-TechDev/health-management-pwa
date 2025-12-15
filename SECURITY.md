# 🔒 Política de Segurança

## Versões Suportadas

| Versão | Suporte         |
| ------ | --------------- |
| 1.0.x  | ✅ Ativo        |

## Reportar uma Vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança no HealthCare+, por favor:

1. **NÃO** abra uma issue pública
2. Envie um email para: security@exemplo.com
3. Inclua:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Possível impacto
   - Sugestões de correção (se houver)

## Medidas de Segurança Implementadas

### Autenticação
- ✅ JWT tokens via Supabase Auth
- ✅ Refresh tokens automáticos
- ✅ Session management seguro
- ✅ Password hashing via Supabase

### Autorização
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Políticas específicas por role (admin/patient)
- ✅ Verificação de permissões em todas as operações
- ✅ Isolamento de dados por usuário

### Dados
- ✅ Validação de entrada (client e server)
- ✅ Sanitização de dados
- ✅ Prepared statements (SQL injection prevention)
- ✅ XSS prevention
- ✅ CSRF protection

### Comunicação
- ✅ HTTPS obrigatório em produção
- ✅ Secure cookies
- ✅ HTTP-only cookies para sessões
- ✅ SameSite cookie policy

### Storage
- ✅ Upload de arquivos com validação
- ✅ Limites de tamanho de arquivo
- ✅ Tipos de arquivo permitidos controlados
- ✅ URLs signed para acesso a arquivos

### Monitoramento
- ✅ Logs de autenticação
- ✅ Rate limiting em APIs críticas
- ✅ Detecção de tentativas de acesso não autorizado

## Boas Práticas para Usuários

### Para Administradores (Médicos)
1. Use senhas fortes (mínimo 12 caracteres)
2. Nunca compartilhe suas credenciais
3. Faça logout ao sair de dispositivos compartilhados
4. Revise regularmente os logs de acesso
5. Mantenha o CRM e informações legais atualizadas

### Para Pacientes
1. Use senha única para esta aplicação
2. Habilite notificações para alertas de segurança
3. Revise regularmente suas informações de saúde
4. Reporte qualquer atividade suspeita imediatamente

## Conformidade

### LGPD (Lei Geral de Proteção de Dados)
- Dados pessoais são coletados apenas com consentimento
- Usuários podem solicitar exclusão de dados
- Dados são armazenados de forma segura
- Acesso a dados é restrito e auditado

### CFM (Conselho Federal de Medicina)
- Todos os registros médicos incluem CRM do profissional
- Prescrições são armazenadas com assinatura digital (CRM)
- Histórico de alterações é mantido
- Dados médicos são protegidos por RLS

## Atualizações de Segurança

Verificamos e atualizamos regularmente:
- Dependências npm (weekly)
- Framework Next.js (on release)
- Supabase SDK (on release)
- Bibliotecas de segurança (immediately on CVE)

## Contato

Para questões de segurança:
- Email: security@exemplo.com
- Resposta esperada: 48 horas
