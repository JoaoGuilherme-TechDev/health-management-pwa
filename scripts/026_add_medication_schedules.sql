-- Criar tabela de horários de medicamentos
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_time TIME NOT NULL, -- Horário agendado (ex: 08:00, 14:00, 20:00)
  days_of_week INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=Domingo, 6=Sábado (todos os dias por padrão)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_medication_schedules_medication_id ON medication_schedules(medication_id);
CREATE INDEX idx_medication_schedules_user_id ON medication_schedules(user_id);
CREATE INDEX idx_medication_schedules_time ON medication_schedules(scheduled_time) WHERE is_active = true;

-- RLS Policies
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo
CREATE POLICY medication_schedules_admin_all ON medication_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Pacientes podem ver seus próprios horários
CREATE POLICY medication_schedules_select_own ON medication_schedules
  FOR SELECT
  USING (user_id = auth.uid());

-- Atualizar tabela medication_reminders para referenciar o schedule
ALTER TABLE medication_reminders ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES medication_schedules(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_medication_reminders_schedule_id ON medication_reminders(schedule_id);

COMMENT ON TABLE medication_schedules IS 'Horários agendados para medicamentos - permite múltiplos horários por medicamento';
COMMENT ON COLUMN medication_schedules.days_of_week IS 'Array de dias da semana: 0=Domingo, 1=Segunda, ..., 6=Sábado';
