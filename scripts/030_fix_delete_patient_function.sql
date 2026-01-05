-- Fix ambiguous column reference in delete_patient_cascade function
-- We rename the parameter to p_patient_id to avoid any conflict with column names

DROP FUNCTION IF EXISTS delete_patient_cascade(uuid);

CREATE OR REPLACE FUNCTION delete_patient_cascade(p_patient_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deletar todos os dados relacionados ao paciente
  DELETE FROM medication_schedules WHERE user_id = p_patient_id; -- Also delete schedules!
  DELETE FROM medication_reminders WHERE user_id = p_patient_id;
  DELETE FROM medications WHERE user_id = p_patient_id;
  DELETE FROM appointments WHERE patient_id = p_patient_id;
  DELETE FROM medical_prescriptions WHERE patient_id = p_patient_id;
  DELETE FROM patient_diet_recipes WHERE patient_id = p_patient_id;
  DELETE FROM patient_supplements WHERE patient_id = p_patient_id;
  DELETE FROM physical_evolution WHERE user_id = p_patient_id;
  DELETE FROM notifications WHERE user_id = p_patient_id;
  DELETE FROM push_subscriptions WHERE user_id = p_patient_id;
  
  -- Deletar o perfil do paciente
  DELETE FROM profiles WHERE id = p_patient_id;
  
  -- Deletar o usuário do Auth
  DELETE FROM auth.users WHERE id = p_patient_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_patient_cascade(UUID) TO authenticated;
