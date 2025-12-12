# Configuração da Z-API para WhatsApp

Este guia explica como configurar a integração com Z-API para enviar notificações por WhatsApp.

## 1. Criar Conta na Z-API

1. Acesse [z-api.io](https://www.z-api.io/) e crie uma conta
2. Complete o processo de cadastro (email e informações básicas)
3. Faça login no painel administrativo

## 2. Criar uma Instância

### O que é uma instância?
Uma instância é como uma "linha" do WhatsApp conectada à API. Você pode ter múltiplas instâncias.

### Passos para criar:

1. No painel da Z-API, clique em **"Criar Instância"**
2. Escolha um nome para sua instância (ex: "health-management-prod")
3. Escolha o plano:
   - **Plano Gratuito**: 100 mensagens/mês (ideal para testes)
   - **Planos Pagos**: A partir de R$ 49/mês com mais mensagens
4. Clique em **"Criar"**

## 3. Conectar WhatsApp

### Conectar via QR Code:

1. Após criar a instância, você verá um **QR Code**
2. Abra o WhatsApp no seu celular
3. Vá em **Configurações** > **Aparelhos conectados** > **Conectar um aparelho**
4. Escaneie o QR Code exibido no painel da Z-API
5. Aguarde a conexão ser estabelecida (status ficará "CONNECTED")

⚠️ **IMPORTANTE**: Use um número dedicado para a API, não use seu WhatsApp pessoal em produção.

## 4. Obter Credenciais

Após conectar o WhatsApp, você terá acesso às credenciais:

### Instance ID
- Localização: No topo da página da instância
- Formato: Texto alfanumérico (ex: "3999ABC123DEF456")
- Copie este valor

### Token
- Localização: Logo abaixo do Instance ID
- Formato: Texto longo alfanumérico
- Clique em **"Mostrar Token"** e copie o valor

## 5. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no seu projeto Vercel:

\`\`\`env
ZAPI_INSTANCE_ID=sua_instance_id_aqui
ZAPI_TOKEN=seu_token_aqui
\`\`\`

### No Vercel:

1. Acesse o projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** > **Environment Variables**
3. Adicione cada variável:
   - `ZAPI_INSTANCE_ID` = seu Instance ID copiado
   - `ZAPI_TOKEN` = seu Token copiado
4. Selecione **All Environments** (Production, Preview, Development)
5. Clique em **Save**
6. **Reimplante o projeto** para as variáveis entrarem em vigor

## 6. Como Funciona

### WhatsApp Automático

O sistema envia WhatsApp automaticamente quando:
- **Lembretes de medicamento**: No horário exato agendado pelo médico
- **Lembretes de consulta**: 2-24 horas antes da consulta agendada

### Requisitos

- O paciente precisa ter o campo `phone` preenchido na tabela `profiles`
- Formato do telefone: `5511999999999` (código do país + DDD + número, sem espaços ou caracteres especiais)
- **Não precisa** do símbolo `+` no início

### Exemplo de Formato de Telefone Correto

❌ Errado:
- `+55 11 99999-9999`
- `(11) 99999-9999`
- `11 9 9999-9999`

✅ Correto:
- `5511999999999`

## 7. Teste Manual

Para testar a integração, use a API diretamente:

\`\`\`bash
curl -X POST http://localhost:3000/api/notifications/zapi \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "seu-user-id",
    "message": "Teste de WhatsApp via Z-API",
    "phoneNumber": "5511999999999"
  }'
\`\`\`

Ou teste direto pela interface da Z-API:
1. Vá no painel da sua instância
2. Clique em **"Testar Envio"**
3. Digite um número e mensagem de teste
4. Clique em **"Enviar"**

## 8. Recursos da Z-API

### Mensagens Suportadas
- ✅ Texto simples
- ✅ Texto com formatação (negrito, itálico)
- ✅ Emojis
- ✅ Imagens
- ✅ Documentos
- ✅ Áudio
- ✅ Vídeo
- ✅ Localização
- ✅ Botões interativos
- ✅ Listas de opções

### Formatação de Texto

A Z-API suporta formatação WhatsApp:
- **Negrito**: `*texto*`
- _Itálico_: `_texto_`
- ~Riscado~: `~texto~`
- ```Monoespaçado```: ` ```texto``` `

## 9. Custos

### Plano Gratuito
- 100 mensagens/mês
- 1 instância
- Suporte básico
- Ideal para testes

### Planos Pagos

| Plano | Mensagens/Mês | Preço |
|-------|---------------|-------|
| Starter | 1.000 | R$ 49 |
| Basic | 5.000 | R$ 149 |
| Pro | 20.000 | R$ 399 |
| Enterprise | Ilimitado | Sob consulta |

**Custo adicional**: Mensagens extras a partir de R$ 0,10 cada

## 10. Monitoramento

### Ver Mensagens Enviadas

1. Acesse o painel da Z-API
2. Vá em **"Mensagens"** no menu lateral
3. Veja todas as mensagens enviadas com status:
   - ✅ **Enviada**: WhatsApp entregou
   - ⏳ **Pendente**: Aguardando processamento
   - ❌ **Erro**: Falha no envio

### Logs da Aplicação

Todos os envios são logados com `[v0]`:
- Sucesso: `[v0] WhatsApp enviado com sucesso via Z-API`
- Erro: `[v0] Erro ao enviar WhatsApp via Z-API`

### Webhooks (Opcional)

Configure webhooks para receber notificações de:
- Mensagens recebidas
- Status de entrega
- Desconexão do WhatsApp

1. No painel, vá em **"Webhooks"**
2. Configure a URL do seu servidor
3. Escolha os eventos que deseja receber

## 11. Manutenção da Instância

### Manter WhatsApp Conectado

⚠️ **Importante**: O WhatsApp pode desconectar se:
- Você escanear o QR Code em outro dispositivo
- Ficar inativo por muito tempo
- Problemas de rede no celular

**Solução**: 
- Use um celular dedicado mantido sempre ligado e conectado
- Configure alertas de desconexão via webhook
- Verifique o status diariamente no painel

### Status da Instância

No painel você verá um dos seguintes status:
- 🟢 **CONNECTED**: Tudo funcionando
- 🟡 **DISCONNECTED**: WhatsApp desconectado (escaneie o QR Code novamente)
- 🔴 **ERROR**: Erro na instância (contate o suporte)

## 12. Troubleshooting

### Erro: "Instance not found"
- Verifique se `ZAPI_INSTANCE_ID` está correto
- Confirme que a instância está ativa no painel

### Erro: "Unauthorized"
- Verifique se `ZAPI_TOKEN` está correto
- O token pode ter expirado (gere um novo no painel)

### Mensagens não chegam
- Verifique se o número está no formato correto: `5511999999999`
- Confirme que o destinatário tem WhatsApp ativo
- Verifique o status da mensagem no painel da Z-API
- Confirme que a instância está conectada (status CONNECTED)

### WhatsApp desconectou
- Escaneie o QR Code novamente
- Verifique se o celular está com internet
- Confirme que não escaneou o código em outro lugar

### Erro: "Phone number blocked"
- O número foi bloqueado pelo WhatsApp (spam)
- Use outro número e evite enviar mensagens em massa
- Respeite o limite de mensagens do WhatsApp (não mais que 1 mensagem a cada 5 segundos)

## 13. Boas Práticas

1. **Rate Limiting**: Não envie mais de 1 mensagem por segundo
2. **Horários**: Evite enviar mensagens entre 22h e 8h
3. **Consentimento**: Garanta que usuários autorizaram receber WhatsApp
4. **Número Dedicado**: Use um número exclusivo para a API
5. **Backup**: Tenha uma instância reserva para emergências
6. **Monitoramento**: Configure webhooks para alertas de desconexão
7. **Testes**: Sempre teste em desenvolvimento antes de produção

## 14. Diferença Z-API vs API Oficial WhatsApp

| Característica | Z-API | API Oficial |
|----------------|-------|-------------|
| Aprovação | Não precisa | Precisa aprovação Meta |
| Tempo setup | Imediato | Semanas |
| Custo inicial | Baixo | Alto |
| WhatsApp Business | Não obrigatório | Obrigatório |
| Limitações | Limitado por plano | Escalável |
| Suporte | Email/Chat | Enterprise |

**Recomendação**: Use Z-API para MVP e pequenos volumes. Migre para API Oficial quando escalar.

## 15. Segurança

### Proteger Credenciais
- ✅ Nunca commite credenciais no código
- ✅ Use variáveis de ambiente
- ✅ Restrinja acesso ao painel da Z-API
- ✅ Gere tokens novos periodicamente

### IP Allowlist (Opcional)
1. No painel da Z-API, vá em **"Segurança"**
2. Adicione os IPs permitidos (IPs dos servidores Vercel)
3. Bloqueie qualquer outro IP

## 16. Próximos Passos

- [ ] Criar conta na Z-API
- [ ] Criar instância e conectar WhatsApp
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Testar envio manual via API
- [ ] Configurar cron jobs para lembretes automáticos
- [ ] Adicionar números de telefone nos perfis dos pacientes
- [ ] Monitorar uso e custos mensalmente

---

**Suporte Z-API**: 
- Email: suporte@z-api.io
- Documentação: [developer.z-api.io](https://developer.z-api.io)
- WhatsApp: Disponível no painel
