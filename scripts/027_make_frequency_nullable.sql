-- Tornar a coluna frequency opcional na tabela medications
-- Agora usamos medication_schedules para horários específicos

ALTER TABLE medications
ALTER COLUMN frequency DROP NOT NULL;

-- Atualizar medicamentos existentes sem frequency para um valor padrão
UPDATE medications
SET frequency = 'Horários personalizados'
WHERE frequency IS NULL;

-- Comentário explicativo
COMMENT ON COLUMN medications.frequency IS 'Campo legado - usar medication_schedules para horários específicos';
