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

## Testando as Notificações

Após configurar:

1. Faça login como paciente
2. Vá em **Configurações** → **Notificações**
3. Ative as notificações push
4. O navegador vai pedir permissão
5. Aceite a permissão
6. Como admin, agende uma consulta ou adicione um medicamento
7. A notificação deve aparecer!

---

## Troubleshooting

### Notificações não aparecem?

1. **Verifique as variáveis de ambiente** na Vercel
2. **Limpe o cache do navegador** e recarregue
3. **Verifique as permissões** do navegador (ícone de cadeado na URL)
4. **Abra o Console do navegador** (F12) e veja se há erros
5. **Certifique-se** que está usando HTTPS (obrigatório para push notifications)

### Erro "subscription failed"?

- As chaves VAPID podem estar incorretas
- Regere as chaves e atualize na Vercel

### Notificações funcionam local mas não em produção?

- Verifique se o NEXT_PUBLIC_SITE_URL está correto
- Deve ser a URL completa do seu app (https://...)
