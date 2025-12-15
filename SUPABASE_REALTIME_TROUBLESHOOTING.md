# Troubleshooting - Supabase Realtime Não Funciona

## Problema

O sistema JÁ TEM Supabase Realtime implementado em TODAS as páginas, mas as informações NÃO estão atualizando automaticamente quando o médico adiciona dados.

## Causa Raiz

O Supabase Realtime precisa ser **HABILITADO MANUALMENTE** nas tabelas do banco de dados. Por padrão, o Realtime está DESABILITADO em todas as tabelas.

## Solução Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Database** → **Replication**

### 2. Habilitar Realtime em TODAS as tabelas

Na página de Replication, habilite o Realtime para as seguintes tabelas clicando no botão de toggle:

#### Tabelas Essenciais (OBRIGATÓRIO):
- ✅ `profiles`
- ✅ `medications`
- ✅ `medication_schedules`
- ✅ `appointments`
- ✅ `medical_prescriptions`
- ✅ `patient_diet_recipes`
- ✅ `patient_supplements`
- ✅ `physical_evolution`
- ✅ `notifications`

### 3. Verificar Políticas RLS

As políticas RLS devem permitir SELECT para o Realtime funcionar:

\`\`\`sql
-- Verificar se há políticas SELECT ativas
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND cmd = 'SELECT';
\`\`\`

Se não houver políticas SELECT, o Realtime não conseguirá enviar atualizações.

### 4. Testar o Realtime

Após habilitar, teste:

1. Abra o painel admin em uma aba
2. Abra o painel do paciente em outra aba  
3. Adicione um medicamento no painel admin
4. Veja se aparece AUTOMATICAMENTE no painel do paciente (sem refresh)

### 5. Verificar Console do Navegador

Abra o DevTools (F12) e verifique se há mensagens como:

\`\`\`
[v0] Medicamento atualizado, recarregando...
\`\`\`

Se NÃO aparecer, o Realtime não está funcionando.

## Como Funciona o Realtime no Sistema

Cada componente cria um **channel** que escuta mudanças na tabela:

\`\`\`typescript
const supabase = createClient()
const channel = supabase
  .channel(`medications-${patientId}`)
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'medications',
      filter: `user_id=eq.${patientId}`,
    },
    () => {
      console.log('[v0] Medicamento atualizado, recarregando...')
      loadMedications()  // Recarrega os dados
    }
  )
  .subscribe()
\`\`\`

Quando algo muda na tabela (INSERT, UPDATE ou DELETE), o Supabase envia uma notificação e o componente automaticamente chama `loadMedications()` para buscar os dados atualizados.

## Páginas com Realtime Implementado

### Painel Admin:
- ✅ Dashboard (`app/admin/page.tsx`) - estatísticas
- ✅ Lista de Pacientes (`app/admin/patients/page.tsx`)
- ✅ Tab Medicamentos (`components/patient-medications-tab.tsx`)
- ✅ Tab Consultas (`components/patient-appointments-tab.tsx`)
- ✅ Tab Prescrições (`components/patient-prescriptions-tab.tsx`)
- ✅ Tab Dieta (`components/patient-diet-tab.tsx`)
- ✅ Tab Suplementos (`components/patient-supplements-tab.tsx`)
- ✅ Tab Evolução Física (`components/patient-evolution-tab.tsx`)

### Painel Paciente:
- ✅ Página de Medicamentos (`app/patient/medications/page.tsx`)
- ✅ Página de Consultas (`app/patient/appointments/page.tsx`)
- ✅ Página de Dieta (`app/patient/diet/page.tsx`)
- ✅ Página de Suplementos (`app/patient/supplements/page.tsx`)
- ✅ Página de Evolução (`app/patient/evolution/page.tsx`)
- ✅ Página de Notificações (`app/patient/notifications/page.tsx`)

## Se Ainda Não Funcionar

### Opção 1: Verificar Variáveis de Ambiente

Certifique-se de que as variáveis estão corretas no Vercel:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
\`\`\`

### Opção 2: Verificar Limites do Plano

O plano gratuito do Supabase tem limite de:
- 200 conexões simultâneas de Realtime
- 2GB de transferência de Realtime/mês

Se ultrapassar, o Realtime para de funcionar.

### Opção 3: Forçar Reconexão

Adicione este código ao `lib/supabase/client.ts`:

\`\`\`typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  )
}
\`\`\`

## Alternativa: Polling (Não Recomendado)

Se o Realtime absolutamente não funcionar, você pode usar polling:

\`\`\`typescript
useEffect(() => {
  loadMedications()
  
  // Recarrega a cada 5 segundos
  const interval = setInterval(loadMedications, 5000)
  
  return () => clearInterval(interval)
}, [patientId])
\`\`\`

**AVISO**: Polling consome mais recursos e pode ter atrasos de até 5 segundos.

## Resumo

1. ✅ O código JÁ TEM Realtime implementado
2. ❌ O Realtime está DESABILITADO no Supabase
3. 🔧 Habilite o Realtime no Dashboard → Database → Replication
4. ✅ Teste adicionando dados e vendo se atualiza automaticamente

**O sistema está 100% pronto. Só falta habilitar o Realtime no Supabase Dashboard!**
