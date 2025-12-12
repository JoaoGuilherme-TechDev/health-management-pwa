# Configuração de Notificações Push

## Variáveis de Ambiente Necessárias

Para que as notificações push funcionem, você precisa configurar 3 variáveis:

### 1. NEXT_PUBLIC_VAPID_PUBLIC_KEY
Chave pública VAPID (visível no cliente)

### 2. VAPID_PRIVATE_KEY
Chave privada VAPID (apenas no servidor)

### 3. NEXT_PUBLIC_SITE_URL
URL do seu site em produção (ex: https://seu-app.vercel.app)

---

## Como Gerar as Chaves VAPID

### Opção 1: Usando o Script Fornecido (Recomendado)

Execute o script que já existe no projeto:

\`\`\`bash
node scripts/generate-vapid-keys.js
\`\`\`

Isso vai gerar um par de chaves VAPID e mostrar no console.

### Opção 2: Manualmente com npx

\`\`\`bash
npx web-push generate-vapid-keys
\`\`\`

---

## Configuração na Vercel

1. Vá para o seu projeto na Vercel
2. Acesse **Settings** → **Environment Variables**
3. Adicione as 3 variáveis:

\`\`\`
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua-chave-publica-aqui
VAPID_PRIVATE_KEY=sua-chave-privada-aqui
NEXT_PUBLIC_SITE_URL=https://seu-app.vercel.app
\`\`\`

4. Certifique-se de aplicar para **Production, Preview e Development**
5. Faça um novo deploy para aplicar as mudanças

---

## Como Funcionam as Notificações com App Fechado

As notificações push funcionam através do **Service Worker**, que fica ativo mesmo com o navegador fechado:

### Requisitos:
- ✅ HTTPS (obrigatório para Service Workers)
- ✅ Permissão de notificações concedida pelo usuário
- ✅ Service Worker registrado (automático no primeiro acesso)
- ✅ Chaves VAPID configuradas corretamente

### Comportamento:
1. **App Aberto**: Notificação + Som de Alarme + Notificação Push
2. **App Minimizado**: Notificação Push do Sistema
3. **Navegador Fechado**: Notificação Push do Sistema (Service Worker ativo)

### Características das Notificações de Medicamentos:
- 🔴 **Persistentes**: Não desaparecem automaticamente
- 📳 **Vibração Intensa**: Padrão [500ms, 200ms, 500ms, 200ms, 500ms]
- 🔊 **Som**: Som padrão do sistema + alarme no app aberto
- 🔄 **Re-notificação**: Permite múltiplas notificações do mesmo tipo

---

## Testando as Notificações

Após configurar:

1. Faça login como paciente
2. Vá em **Configurações** → **Notificações**
3. Ative as notificações push
4. O navegador vai pedir permissão
5. Aceite a permissão
6. Como admin, agende uma consulta ou adicione um medicamento com horários
7. A notificação deve aparecer no horário agendado!

**IMPORTANTE**: As notificações de medicamento só aparecem nos horários configurados, NÃO na criação!

---

## Configurando o Cron Job (OBRIGATÓRIO)

As notificações de medicamentos são enviadas através de um cron job que verifica os horários agendados.

### Na Vercel (Recomendado):

1. Crie um arquivo `vercel.json` na raiz do projeto:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/medications/scheduled-reminders",
      "schedule": "* * * * *"
    }
  ]
}
\`\`\`

2. Faça deploy
3. As notificações serão verificadas a cada minuto automaticamente

### Alternativa - Serviço Externo (Cron-job.org, EasyCron):

1. Cadastre-se no serviço
2. Configure uma tarefa para:
   - **URL**: `https://seu-app.vercel.app/api/medications/scheduled-reminders`
   - **Método**: POST
   - **Frequência**: A cada 1 minuto
   - **Headers**: `Content-Type: application/json`

---

## Troubleshooting

### Notificações não aparecem?

1. **Verifique as variáveis de ambiente** na Vercel
2. **Limpe o cache do navegador** e recarregue
3. **Verifique as permissões** do navegador (ícone de cadeado na URL)
4. **Abra o Console do navegador** (F12) e veja se há erros
5. **Certifique-se** que está usando HTTPS (obrigatório para push notifications)
6. **Verifique se o cron job está configurado** - Sem ele, as notificações não são enviadas!

### Erro "subscription failed"?

- As chaves VAPID podem estar incorretas
- Regere as chaves e atualize na Vercel
- Limpe o cache e tente novamente

### Notificações funcionam local mas não em produção?

- Verifique se o NEXT_PUBLIC_SITE_URL está correto
- Deve ser a URL completa do seu app (https://...)
- Verifique se as variáveis estão aplicadas em **Production**

### Notificações não aparecem com navegador fechado?

- Verifique se o Service Worker está registrado: vá em DevTools → Application → Service Workers
- Verifique se as permissões de notificação estão concedidas no sistema operacional
- No Windows: Configurações → Sistema → Notificações
- No macOS: Preferências do Sistema → Notificações
- No Android: Configurações → Apps → Navegador → Notificações

### Notificações aparecem na criação do medicamento?

- Isso NÃO deveria acontecer! Verifique se o código foi atualizado corretamente
- As notificações só devem aparecer nos horários agendados pelo cron job

---

## Logs e Debugging

Para verificar se as notificações estão sendo processadas:

1. Acesse os logs da Vercel (Functions)
2. Procure por logs do tipo:
   - `[v0] Processando lembretes agendados para XX:XX`
   - `[v0] Push notification enviada com sucesso`
   - `[v0] Lembrete já existe` (indica duplicação evitada)

3. No navegador (Console F12), procure por:
   - `[v0] Service Worker registrado com sucesso`
   - `[Service Worker] Notificação push recebida`
   - `[Service Worker] Notificação exibida com sucesso`

---

## Segurança

- ✅ As chaves VAPID privadas NUNCA são expostas no cliente
- ✅ Apenas subscriptions válidas no banco podem receber notificações
- ✅ Subscriptions inválidas são removidas automaticamente (410, 404)
- ✅ Todas as notificações são associadas a um user_id específico
