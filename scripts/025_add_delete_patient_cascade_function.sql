-- Função para deletar paciente e todos os dados relacionados em cascata
CREATE OR REPLACE FUNCTION delete_patient_cascade(target_patient_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deletar todos os dados relacionados ao paciente
  DELETE FROM medication_reminders WHERE user_id = target_patient_id;
  DELETE FROM medications WHERE user_id = target_patient_id;
  DELETE FROM appointments WHERE patient_id = target_patient_id;
  DELETE FROM medical_prescriptions WHERE patient_id = target_patient_id;
  DELETE FROM patient_diet_recipes WHERE patient_id = target_patient_id;
  DELETE FROM patient_supplements WHERE patient_id = target_patient_id;
  DELETE FROM physical_evolution WHERE user_id = target_patient_id;
  DELETE FROM notifications WHERE user_id = target_patient_id;
  DELETE FROM push_subscriptions WHERE user_id = target_patient_id;
  
  -- Deletar o perfil do paciente
  DELETE FROM profiles WHERE id = target_patient_id;
  
  -- Deletar o usuário do Auth
  DELETE FROM auth.users WHERE id = target_patient_id;
END;
$$;

-- Permitir que admins executem essa função
GRANT EXECUTE ON FUNCTION delete_patient_cascade(UUID) TO authenticated;
