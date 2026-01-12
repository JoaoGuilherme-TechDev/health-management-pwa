-- Função para deletar paciente e todos os dados relacionados em cascata
CREATE OR REPLACE FUNCTION delete_patient_cascade(patient_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deletar todos os dados relacionados ao paciente

  DELETE FROM medications WHERE user_id = $1;
  DELETE FROM appointments WHERE patient_id = $1;
  DELETE FROM medical_prescriptions WHERE patient_id = $1;
  DELETE FROM patient_diet_recipes WHERE patient_id = $1;
  DELETE FROM patient_supplements WHERE patient_id = $1;
  DELETE FROM physical_evolution WHERE user_id = $1;
  DELETE FROM notifications WHERE user_id = $1;
  DELETE FROM push_subscriptions WHERE user_id = $1;
  
  -- Deletar o perfil do paciente
  DELETE FROM profiles WHERE id = $1;
  
  -- Deletar o usuário do Auth
  DELETE FROM auth.users WHERE id = $1;
END;
$$;

-- Permitir que admins executem essa função
GRANT EXECUTE ON FUNCTION delete_patient_cascade(UUID) TO authenticated;
