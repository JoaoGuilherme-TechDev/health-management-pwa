# Configuração de Lembretes de Medicamentos Agendados

## Visão Geral

O sistema de medicamentos agora usa **horários específicos agendados** ao invés de frequências genéricas. O médico pode adicionar múltiplos horários para cada medicamento (ex: 08:00, 14:00, 20:00).

## Arquitetura

### Tabelas

1. **medications** - Dados principais do medicamento
2. **medication_schedules** - Horários agendados para cada medicamento
3. **medication_reminders** - Lembretes criados automaticamente nos horários agendados
4. **notifications** - Notificações in-app para o paciente

### Fluxo de Funcionamento

1. **Médico adiciona medicamento** → Seleciona horários específicos (ex: 08:00, 14:00, 20:00)
2. **Sistema cria schedules** → Cada horário é salvo em `medication_schedules`
3. **Cron job executa** → A cada minuto, verifica horários que devem disparar
4. **Lembretes são criados** → Cria entrada em `medication_reminders` e `notifications`
5. **Paciente recebe notificações** → Push notification + notificação in-app

## Configuração do Cron Job

### Vercel Cron

Adicione no arquivo `vercel.json`:

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

**Nota:** O plano gratuito da Vercel suporta cron jobs, mas com limitações de execução.

### Alternativa: Cron-job.org

Se preferir um serviço externo gratuito:

1. Acesse https://cron-job.org
2. Crie uma conta
3. Adicione um novo cron job:
   - URL: `https://seu-dominio.vercel.app/api/medications/scheduled-reminders`
   - Intervalo: A cada minuto (`* * * * *`)
   - Método: POST

### Alternativa: GitHub Actions

Crie `.github/workflows/medication-reminders.yml`:

\`\`\`yaml
name: Medication Reminders

on:
  schedule:
    - cron: '*/5 * * * *' # A cada 5 minutos

jobs:
  trigger-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminders endpoint
        run: |
          curl -X POST https://seu-dominio.vercel.app/api/medications/scheduled-reminders
\`\`\`

## Como Usar

### No Painel Admin

1. Abra um paciente
2. Vá para a aba "Medicamentos"
3. Clique em "Adicionar Medicamento"
4. Preencha os dados básicos
5. Na seção "Horários de Administração":
   - Selecione um horário
   - Clique em "Adicionar Horário"
   - Repita para adicionar mais horários
6. Clique em "Adicionar Medicamento"

### Comportamento das Notificações

- **Notificação in-app**: Aparece no painel de notificações do paciente
- **Push notification**: Enviada para o dispositivo do paciente (se habilitado)
- **Lembretes criados**: Apenas nos horários configurados
- **Duplicação prevenida**: Sistema não cria lembretes duplicados para o mesmo horário/dia

## Troubleshooting

### Lembretes não estão sendo criados

1. Verifique se o cron job está configurado
2. Teste manualmente: `POST /api/medications/scheduled-reminders`
3. Verifique os logs no Vercel

### Notificações duplicadas

- Sistema previne duplicação automaticamente
- Verifica `schedule_id` + `reminder_date` antes de criar

### Horários não aparecem

1. Execute o SQL script `026_add_medication_schedules.sql`
2. Verifique se RLS está configurado corretamente
3. Confirme que `medication_schedules` foi criada

## Migrando de Frequência para Horários

Medicamentos antigos com campo `frequency` continuam funcionando, mas não têm lembretes automáticos. Para migrar:

1. Edite o medicamento no painel admin
2. Adicione os horários desejados
3. Salve as alterações

## Segurança

- RLS habilitado em todas as tabelas
- Pacientes só veem seus próprios horários e lembretes
- Admins (médicos) podem gerenciar todos os dados
- Push notifications requerem configuração de VAPID keys
