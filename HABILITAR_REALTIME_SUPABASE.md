# Guia: Habilitar Realtime no Supabase para Auto-Reload

## 🚨 Problema

O painel admin já tem o código de Supabase Realtime implementado, mas as tabelas não estão recarregando automaticamente. Isso acontece porque **o Realtime precisa ser habilitado manualmente em cada tabela no Supabase**.

## ✅ Solução

Execute o script SQL `028_enable_realtime_all_tables.sql` para habilitar o Realtime em todas as tabelas.

## 📋 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto do Health Management PWA

### 2. Executar o Script SQL

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New Query"**
3. Copie todo o conteúdo do arquivo `scripts/028_enable_realtime_all_tables.sql`
4. Cole no editor SQL
5. Clique em **"Run"** ou pressione `Ctrl+Enter`

### 3. Verificar se Funcionou

O script executa um SELECT no final para mostrar todas as tabelas com Realtime habilitado. Você deve ver algo assim:

\`\`\`
schemaname | tablename
-----------+-----------------------
public     | appointments
public     | medications
public     | medication_schedules
public     | medical_prescriptions
public     | notifications
public     | patient_diet_recipes
public     | patient_supplements
public     | physical_evolution
public     | profiles
\`\`\`

### 4. Testar no Aplicativo

1. Abra o painel admin em uma aba
2. Abra a mesma página em outra aba
3. Adicione um medicamento, consulta ou qualquer dado em uma aba
4. A outra aba deve atualizar **automaticamente** em 1-2 segundos!

## 🔧 Alternativa: Habilitar Manualmente (Via UI)

Se preferir não usar SQL, pode habilitar manualmente:

1. No Supabase Dashboard, vá em **"Database" > "Replication"**
2. Para cada tabela listada abaixo, clique no botão **"Enable"**:
   - `profiles`
   - `medications`
   - `medication_schedules`
   - `appointments`
   - `medical_prescriptions`
   - `patient_diet_recipes`
   - `patient_supplements`
   - `physical_evolution`
   - `notifications`

## 📊 Como Funciona

O Realtime do Supabase usa **PostgreSQL Logical Replication** para transmitir mudanças em tempo real. Quando habilitado:

1. Qualquer `INSERT`, `UPDATE` ou `DELETE` na tabela é detectado
2. O Supabase envia uma notificação para todos os clientes conectados
3. O código do painel admin recebe a notificação e recarrega os dados automaticamente

## 🐛 Troubleshooting

### Ainda não está atualizando?

1. **Verifique o console do navegador** - Deve mostrar logs como:
   \`\`\`
   [v0] Medicamento atualizado, recarregando...
   [v0] Iniciando carregamento de medicamentos...
   \`\`\`

2. **Verifique se está conectado** - No console, procure por:
   \`\`\`javascript
   // Sucesso:
   realtime: SUBSCRIBED
   
   // Erro:
   realtime: CHANNEL_ERROR
   \`\`\`

3. **Verifique as Políticas RLS** - As políticas devem permitir `SELECT` para o admin:
   \`\`\`sql
   -- Verificar políticas
   SELECT tablename, policyname, permissive, roles, cmd 
   FROM pg_policies 
   WHERE schemaname = 'public'
   ORDER BY tablename;
   \`\`\`

4. **Reinicie o app** - Às vezes é necessário fazer um hard refresh (`Ctrl+Shift+R`)

### Erro: "permission denied for publication"

Execute como superusuário ou solicite ao suporte do Supabase.

### Latência alta

O Realtime pode ter um pequeno delay (1-3 segundos). Isso é normal.

## 📚 Documentação Oficial

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Logical Replication](https://supabase.com/docs/guides/realtime/postgres-changes)

## ✨ Benefícios do Realtime

- ✅ **Sincronização automática** entre múltiplas abas/dispositivos
- ✅ **Sem necessidade de refresh manual** 
- ✅ **UX melhorada** - usuários veem mudanças instantaneamente
- ✅ **Menos bugs** - dados sempre atualizados
- ✅ **Colaboração em tempo real** - múltiplos médicos podem trabalhar simultaneamente

---

**Após executar o script, o painel admin estará 100% funcional com auto-reload!** 🎉
