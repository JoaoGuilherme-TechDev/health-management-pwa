# Guia Completo: Remoção de Realtime + Integração Z-API

Este guia contém TODAS as mudanças necessárias para:
1. Remover Supabase Realtime de todas as páginas
2. Adicionar botões de reload manual
3. Integrar Z-API para enviar notificações WhatsApp

---

## PARTE 1: INTEGRAÇÃO Z-API (PASSO A PASSO)

### Passo 1: Criar Conta na Z-API

1. Acesse: https://www.z-api.io/
2. Clique em "Criar Conta" ou "Começar Gratuitamente"
3. Preencha seus dados:
   - Nome completo
   - Email
   - Senha
   - Telefone
4. Confirme seu email

### Passo 2: Conectar WhatsApp

1. Faça login no painel da Z-API: https://painel.z-api.io/
2. Clique em "Nova Instância"
3. Escolha um nome para sua instância (ex: "Sistema de Saúde")
4. Será gerado um QR Code
5. **Importante**: Use um número de WhatsApp EXCLUSIVO para o sistema
   - NÃO use seu WhatsApp pessoal
   - Recomendação: Compre um chip apenas para o sistema
6. Abra o WhatsApp no celular
7. Vá em Configurações → Aparelhos Conectados → Conectar Aparelho
8. Escaneie o QR Code mostrado no painel Z-API
9. Aguarde a mensagem "Conectado com sucesso"

### Passo 3: Obter Credenciais

Após conectar o WhatsApp, você verá:

1. **Instance ID**: Um código como `3D5B9F2A4C8E`
2. **Token**: Um token de autenticação como `B5F9A3E7D2C1`

**COPIE E SALVE ESSES DADOS COM SEGURANÇA!**

### Passo 4: Adicionar Variáveis de Ambiente no Vercel

1. Acesse seu projeto no Vercel: https://vercel.com/
2. Clique no seu projeto
3. Vá em "Settings" → "Environment Variables"
4. Adicione as seguintes variáveis:

\`\`\`
ZAPI_INSTANCE_ID=seu_instance_id_aqui
ZAPI_TOKEN=seu_token_aqui
\`\`\`

5. Clique em "Save"
6. **IMPORTANTE**: Faça um novo deploy para as variáveis entrarem em vigor
   - Vá em "Deployments"
   - Clique nos 3 pontinhos do último deploy
   - Clique em "Redeploy"

### Passo 5: Testar Integração

Execute este teste na API do projeto:

\`\`\`bash
curl -X POST https://seu-projeto.vercel.app/api/notifications/zapi \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-teste",
    "message": "🏥 Teste do sistema de notificações",
    "phoneNumber": "5511999999999"
  }'
\`\`\`

Substitua:
- `seu-projeto.vercel.app` pelo domínio real
- `5511999999999` pelo seu número no formato correto (DDI + DDD + Número, SEM espaços ou símbolos)

**Formato correto do número:**
- ✅ Correto: `5511999999999` (Brasil, SP, 99999-9999)
- ❌ Errado: `+55 11 99999-9999`
- ❌ Errado: `(11) 99999-9999`

---

## PARTE 2: QUANDO AS NOTIFICAÇÕES WHATSAPP SÃO ENVIADAS

### 1. Novo Medicamento Adicionado
**Gatilho**: Admin adiciona medicamento no painel
**Mensagem**:
\`\`\`
🏥 *Novo Medicamento Prescrito*

Olá! Seu médico prescreveu um novo medicamento para você:

💊 *Medicamento*: [Nome]
📋 *Dosagem*: [Dosagem]
⏰ *Horários*: [08:00, 14:00, 20:00]

👨‍⚕️ Prescrito por: Dr(a). [Nome] - CRM [Número]

Acesse o app para ver todos os detalhes!
\`\`\`

### 2. Nova Consulta Agendada
**Gatilho**: Admin agenda consulta
**Mensagem**:
\`\`\`
🏥 *Consulta Agendada*

Olá! Uma nova consulta foi agendada para você:

📅 *Data*: [15/01/2025]
🕐 *Horário*: [14:30]
📍 *Local*: [Endereço]
👨‍⚕️ *Médico*: Dr(a). [Nome]

Não esqueça de comparecer!
\`\`\`

### 3. Nova Dieta Adicionada
**Gatilho**: Admin adiciona receita de dieta
**Mensagem**:
\`\`\`
🏥 *Nova Receita de Dieta*

Olá! Seu médico adicionou uma nova receita:

🍽️ *Refeição*: [Almoço]
📝 *Título*: [Frango Grelhado com Legumes]

Acesse o app para ver os ingredientes e modo de preparo!
\`\`\`

### 4. Novo Suplemento Recomendado
**Gatilho**: Admin adiciona suplemento
**Mensagem**:
\`\`\`
🏥 *Novo Suplemento Recomendado*

Olá! Seu médico recomendou um suplemento:

💊 *Suplemento*: [Whey Protein]
📋 *Dosagem*: [30g]
⏰ *Frequência*: [2x ao dia]

Acesse o app para mais detalhes!
\`\`\`

### 5. Nova Medição de Bioimpedância
**Gatilho**: Admin registra evolução física
**Mensagem**:
\`\`\`
🏥 *Nova Avaliação Física*

Olá! Uma nova medição foi registrada:

⚖️ *Peso*: [75.5 kg]
💪 *Massa Muscular*: [32.1 kg]
📊 *Gordura*: [18.5%]

Acesse o app para ver todos os dados!
\`\`\`

### 6. Lembrete de Consulta (24h antes)
**Gatilho**: Cron job executado 24h antes da consulta
**Mensagem**:
\`\`\`
⏰ *Lembrete de Consulta*

Olá! Sua consulta é AMANHÃ:

📅 *Data*: [15/01/2025]
🕐 *Horário*: [14:30]
📍 *Local*: [Endereço]
👨‍⚕️ *Médico*: Dr(a). [Nome]

Não esqueça!
\`\`\`

### 7. Despertador para Remédio
**Gatilho**: Cron job executado nos horários cadastrados
**Mensagem**:
\`\`\`
⏰ *Está na hora do seu remédio!*

💊 *Medicamento*: [Dipirona]
📋 *Dosagem*: [500mg]

Tome agora para manter o tratamento em dia!
\`\`\`

---

## PARTE 3: CONFIGURAR CRON JOBS (OBRIGATÓRIO)

### O que são Cron Jobs?

Cron jobs são tarefas agendadas que executam automaticamente em horários específicos. São ESSENCIAIS para:
- Enviar lembretes de consulta 24h antes
- Enviar despertador de remédio nos horários exatos

### Opção 1: Vercel Cron (Recomendado)

1. Crie o arquivo `vercel.json` na raiz do projeto:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/medications/scheduled-reminders",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/notifications/create-appointment-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
\`\`\`

2. Faça commit e push para o GitHub
3. O Vercel detectará automaticamente e ativará os cron jobs

**Frequências:**
- `* * * * *` = A cada minuto (lembretes de medicamento)
- `0 * * * *` = A cada hora (lembretes de consulta)

### Opção 2: EasyCron (Alternativa Gratuita)

Se o Vercel Cron não estiver disponível no seu plano:

1. Acesse: https://www.easycron.com/
2. Crie uma conta gratuita
3. Adicione 2 tarefas:

**Tarefa 1: Lembretes de Medicamento**
- URL: `https://seu-projeto.vercel.app/api/medications/scheduled-reminders`
- Intervalo: `Cada 1 minuto`
- Método: `GET`

**Tarefa 2: Lembretes de Consulta**
- URL: `https://seu-projeto.vercel.app/api/notifications/create-appointment-reminders`
- Intervalo: `A cada hora`
- Método: `GET`

---

## PARTE 4: VALIDAÇÃO E TESTES

### Checklist de Validação:

- [ ] Z-API configurada e WhatsApp conectado
- [ ] Variáveis `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN` no Vercel
- [ ] Deploy realizado após adicionar variáveis
- [ ] Teste manual de envio funcionando
- [ ] Cron jobs configurados (Vercel ou EasyCron)
- [ ] Botões de "Atualizar" aparecendo em todas as páginas

### Como Testar Cada Notificação:

1. **Medicamento**: Adicione um medicamento no painel admin → Verifique WhatsApp
2. **Consulta**: Agende uma consulta → Verifique WhatsApp
3. **Dieta**: Adicione uma receita → Verifique WhatsApp
4. **Suplemento**: Adicione um suplemento → Verifique WhatsApp
5. **Evolução**: Registre uma medição → Verifique WhatsApp
6. **Lembrete Consulta**: Agende consulta para daqui 23h → Aguarde 1h → Verifique
7. **Despertador Remédio**: Adicione medicamento com horário daqui 2min → Aguarde → Verifique

---

## PARTE 5: TROUBLESHOOTING

### Problema: "Z-API não configurada"
**Solução**: 
- Verifique se as variáveis estão no Vercel
- Faça novo deploy após adicionar variáveis
- Verifique se não há espaços extras nas variáveis

### Problema: Mensagem não chega
**Solução**:
- Verifique se o número está no formato correto (apenas números, com DDI)
- Confirme que o WhatsApp está conectado no painel Z-API
- Veja os logs na Z-API: https://painel.z-api.io/ → Sua Instância → Logs

### Problema: "Número inválido"
**Solução**:
- Formato correto: `5511999999999` (DDI + DDD + Número)
- Remova TODOS os espaços, parênteses, hífens, +
- Exemplo: De `+55 (11) 99999-9999` para `5511999999999`

### Problema: Cron jobs não executam
**Solução Vercel**:
- Verifique se o `vercel.json` está na raiz do projeto
- Confirme que fez deploy após criar o arquivo
- Vá em Settings → Cron Jobs para ver status

**Solução EasyCron**:
- Verifique se as URLs estão corretas
- Confirme que as tarefas estão ativas (toggle verde)
- Veja o histórico de execução para erros

---

## PARTE 6: MONITORAMENTO

### Logs da Z-API

Acesse: https://painel.z-api.io/ → Sua Instância → Logs

Você verá:
- ✅ Mensagens enviadas com sucesso
- ❌ Mensagens que falharam
- 📊 Estatísticas de uso

### Logs do Vercel

1. Acesse seu projeto no Vercel
2. Vá em "Deployments"  
3. Clique no deployment ativo
4. Clique em "Functions"
5. Clique na função desejada
6. Veja os logs em tempo real

Procure por:
- `[v0] Enviando WhatsApp via Z-API...`
- `[v0] WhatsApp enviado com sucesso`
- `[v0] Erro Z-API:` (se houver problemas)

---

## PARTE 7: CUSTOS E LIMITES

### Z-API Plano Gratuito:
- ✅ 500 mensagens/mês GRÁTIS
- ✅ 1 instância conectada
- ✅ Suporte por email

### Z-API Planos Pagos:
- **Starter** (R$ 39,90/mês): 2.000 mensagens
- **Professional** (R$ 89,90/mês): 10.000 mensagens
- **Business** (R$ 189,90/mês): 30.000 mensagens

### Cálculo de Uso Mensal:

Exemplo: 50 pacientes ativos

**Notificações Imediatas:**
- Medicamentos: 50 pacientes × 2 novos/mês = 100 msgs
- Consultas: 50 pacientes × 1/mês = 50 msgs
- Dietas: 50 pacientes × 1/mês = 50 msgs
- Suplementos: 50 pacientes × 0,5/mês = 25 msgs
- Evolução: 50 pacientes × 2/mês = 100 msgs

**Lembretes Automáticos:**
- Consultas (24h antes): 50/mês = 50 msgs
- Medicamentos (3 horários/dia): 50 pacientes × 3 × 30 dias = 4.500 msgs

**Total: ~4.875 mensagens/mês** = Plano Professional necessário

---

## SUPORTE

Problemas com Z-API:
- Email: suporte@z-api.io
- WhatsApp: (11) 93111-1111
- Documentação: https://developer.z-api.io/

Problemas com o código:
- Verifique os logs do Vercel
- Teste as APIs manualmente com curl
- Consulte este guia completo

---

## ✅ CHECKLIST FINAL

Antes de ir para produção, confirme:

- [ ] Z-API configurada e testada
- [ ] WhatsApp conectado e ativo
- [ ] Variáveis de ambiente no Vercel
- [ ] Deploy realizado
- [ ] Cron jobs ativos
- [ ] Todas as 7 notificações testadas
- [ ] Números de telefone dos pacientes cadastrados
- [ ] Plano Z-API adequado ao volume
- [ ] Botões de "Atualizar" funcionando em todas as páginas
- [ ] Sistema de reload manual testado

**🎉 SISTEMA PRONTO PARA PRODUÇÃO!**
