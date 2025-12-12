# Configuração do Twilio para SMS e WhatsApp

Este guia explica como configurar a integração com Twilio para enviar notificações por SMS e WhatsApp.

## 1. Criar Conta no Twilio

1. Acesse [twilio.com/try-twilio](https://www.twilio.com/try-twilio) e crie uma conta gratuita
2. Complete o processo de verificação (email e telefone)
3. Você receberá créditos gratuitos para testes

## 2. Obter Credenciais

### Account SID e Auth Token

1. Acesse o [Console do Twilio](https://console.twilio.com/)
2. No Dashboard, você verá:
   - **Account SID**: Sua identificação única
   - **Auth Token**: Token de autenticação (clique em "Show" para visualizar)
3. Copie ambos os valores

### Número de Telefone para SMS

1. No menu lateral, vá em **Phone Numbers** > **Manage** > **Buy a number**
2. Escolha um número com capacidade de SMS (no Brasil use +55)
3. Compre o número (custo aproximado: $1/mês)
4. Copie o número no formato: `+5511999999999`

### WhatsApp Sandbox (para testes)

1. No menu lateral, vá em **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Siga as instruções para conectar seu WhatsApp ao Sandbox
3. Envie a mensagem de ativação (ex: "join <seu-código>") para o número do sandbox
4. Copie o número do WhatsApp Sandbox

## 3. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no seu projeto Vercel:

\`\`\`env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+5511999999999
TWILIO_WHATSAPP_NUMBER=+14155238886
\`\`\`

### No Vercel:

1. Acesse o projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** > **Environment Variables**
3. Adicione cada variável:
   - `TWILIO_ACCOUNT_SID` = seu Account SID
   - `TWILIO_AUTH_TOKEN` = seu Auth Token
   - `TWILIO_PHONE_NUMBER` = número de telefone comprado
   - `TWILIO_WHATSAPP_NUMBER` = número do WhatsApp Sandbox (use `+14155238886` para testes)
4. Selecione **All Environments** (Production, Preview, Development)
5. Clique em **Save**

## 4. Instalar Dependência

O pacote `twilio` já está configurado no código. Certifique-se de que está instalado:

\`\`\`bash
npm install twilio
\`\`\`

## 5. Como Funciona

### SMS Automático

O sistema envia SMS automaticamente quando:
- **Lembretes de medicamento**: No horário exato agendado pelo médico
- **Lembretes de consulta**: 2-24 horas antes da consulta

### Requisitos

- O paciente precisa ter o campo `phone` preenchido na tabela `profiles`
- Formato do telefone: `+5511999999999` (com código do país)

### Teste Manual

Para testar a integração, use a API diretamente:

\`\`\`bash
curl -X POST http://localhost:3000/api/notifications/twilio \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "seu-user-id",
    "message": "Teste de SMS",
    "phoneNumber": "+5511999999999",
    "type": "sms"
  }'
\`\`\`

Para WhatsApp:

\`\`\`bash
curl -X POST http://localhost:3000/api/notifications/twilio \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "seu-user-id",
    "message": "Teste de WhatsApp",
    "phoneNumber": "+5511999999999",
    "type": "whatsapp"
  }'
\`\`\`

## 6. Custos

### Conta Gratuita (Trial)
- Créditos gratuitos: ~$15 USD
- Limitações:
  - Só envia para números verificados
  - Mensagens incluem prefixo "Sent from your Twilio trial account"

### Conta Paga
- SMS no Brasil: ~$0.07 USD por mensagem
- WhatsApp: ~$0.005-0.01 USD por mensagem
- Número de telefone: ~$1 USD/mês

## 7. Produção - Aprovação WhatsApp

Para usar WhatsApp em produção (sem sandbox):

1. No Console Twilio, vá em **Messaging** > **Senders** > **WhatsApp senders**
2. Clique em **Request to enable WhatsApp**
3. Preencha as informações da empresa
4. Aguarde aprovação do Facebook/Meta (pode levar alguns dias)
5. Após aprovação, atualize `TWILIO_WHATSAPP_NUMBER` com seu número oficial

## 8. Monitoramento

### Ver Mensagens Enviadas

1. Acesse o [Console do Twilio](https://console.twilio.com/)
2. Vá em **Monitor** > **Logs** > **Messaging**
3. Veja todas as mensagens enviadas, status e erros

### Logs da Aplicação

Todos os envios são logados com `[v0]`:
- Sucesso: `[v0] SMS enviado com sucesso`
- Erro: `[v0] Erro ao enviar SMS via Twilio`

## 9. Troubleshooting

### Erro: "Unable to create record"
- Verifique se o número de telefone está no formato correto: `+5511999999999`
- Confirme que o número está verificado (conta trial)

### Erro: "Authenticate"
- Verifique se `TWILIO_ACCOUNT_SID` e `TWILIO_AUTH_TOKEN` estão corretos
- Confirme que as variáveis estão no ambiente correto (Production/Preview)

### Mensagens não chegam
- Verifique se o número do destinatário está correto
- Para WhatsApp, confirme que o usuário completou o opt-in no sandbox
- Verifique os logs no Console do Twilio

### Erro: "From phone number not verified"
- Na conta trial, você precisa verificar cada número de telefone que receberá mensagens
- Vá em **Phone Numbers** > **Verified Caller IDs** e adicione o número

## 10. Melhores Práticas

1. **Rate Limiting**: Implemente controle de frequência para evitar spam
2. **Opt-in**: Garanta que usuários consentem receber SMS/WhatsApp
3. **Horários**: Evite enviar mensagens tarde da noite ou muito cedo
4. **Custos**: Monitore o uso para controlar gastos
5. **Fallback**: Use push notifications como backup se SMS falhar

## 11. Próximos Passos

- [ ] Testar envio de SMS em desenvolvimento
- [ ] Verificar números de telefone na tabela `profiles`
- [ ] Configurar cron jobs na Vercel para lembretes automáticos
- [ ] Monitorar custos no Console do Twilio
- [ ] Solicitar aprovação do WhatsApp para produção

---

**Suporte**: Se precisar de ajuda, acesse [support.twilio.com](https://support.twilio.com) ou a [documentação oficial](https://www.twilio.com/docs).
\`\`\`

```json file="" isHidden
