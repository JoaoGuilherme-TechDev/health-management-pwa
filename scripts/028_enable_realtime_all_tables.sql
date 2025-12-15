-- Habilitar Realtime em TODAS as tabelas para auto-reload no painel admin

-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole este script > Run

-- Habilitar Realtime para profiles (pacientes)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Habilitar Realtime para medications (medicamentos)
ALTER PUBLICATION supabase_realtime ADD TABLE medications;

-- Habilitar Realtime para medication_schedules (horários de medicamentos)
ALTER PUBLICATION supabase_realtime ADD TABLE medication_schedules;

-- Habilitar Realtime para appointments (consultas)
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Habilitar Realtime para medical_prescriptions (receitas médicas)
ALTER PUBLICATION supabase_realtime ADD TABLE medical_prescriptions;

-- Habilitar Realtime para patient_diet_recipes (receitas de dieta)
ALTER PUBLICATION supabase_realtime ADD TABLE patient_diet_recipes;

-- Habilitar Realtime para patient_supplements (suplementos)
ALTER PUBLICATION supabase_realtime ADD TABLE patient_supplements;

-- Habilitar Realtime para physical_evolution (evolução física)
ALTER PUBLICATION supabase_realtime ADD TABLE physical_evolution;

-- Habilitar Realtime para notifications (notificações)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verificar se as tabelas foram adicionadas com sucesso
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
