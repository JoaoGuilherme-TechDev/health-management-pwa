-- Função para deletar paciente e todos os dados relacionados em cascata
CREATE TABLE IF NOT EXISTS deletion_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  action text NOT NULL DEFAULT 'delete_patient',
  counts jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION delete_patient_cascade(patient_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actor uuid := auth.uid();
  actor_role text;
  v_medications int := 0;
  v_appointments int := 0;
  v_prescriptions int := 0;
  v_diet_recipes int := 0;
  v_supplements int := 0;
  v_physical int := 0;
  v_notifications int := 0;
  v_push_subs int := 0;
  v_counts jsonb;
BEGIN
  -- Verificações de segurança e existência
  PERFORM 1 FROM profiles WHERE id = $1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paciente não encontrado';
  END IF;

  SELECT role INTO actor_role FROM public.profiles WHERE id = actor;
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  IF actor <> $1 AND actor_role <> 'admin' THEN
    RAISE EXCEPTION 'Operação não permitida';
  END IF;

  -- Deletar todos os dados relacionados ao paciente
 
    DELETE FROM medications WHERE user_id = $1;
    GET DIAGNOSTICS v_medications = ROW_COUNT;
    DELETE FROM appointments WHERE patient_id = $1;
    GET DIAGNOSTICS v_appointments = ROW_COUNT;
    DELETE FROM medical_prescriptions WHERE patient_id = $1;
    GET DIAGNOSTICS v_prescriptions = ROW_COUNT;
    DELETE FROM patient_diet_recipes WHERE patient_id = $1;
    GET DIAGNOSTICS v_diet_recipes = ROW_COUNT;
    DELETE FROM patient_supplements WHERE patient_id = $1;
    GET DIAGNOSTICS v_supplements = ROW_COUNT;
    DELETE FROM physical_evolution WHERE user_id = $1;
    GET DIAGNOSTICS v_physical = ROW_COUNT;
    DELETE FROM notifications WHERE user_id = $1;
    GET DIAGNOSTICS v_notifications = ROW_COUNT;
    DELETE FROM push_subscriptions WHERE user_id = $1;
    GET DIAGNOSTICS v_push_subs = ROW_COUNT;
  
  -- Deletar o perfil do paciente
  DELETE FROM profiles WHERE id = $1;
  
  -- Deletar o usuário do Auth
  DELETE FROM auth.users WHERE id = $1;

  v_counts := jsonb_build_object(
    'medications', v_medications,
    'appointments', v_appointments,
    'medical_prescriptions', v_prescriptions,
    'diet_recipes', v_diet_recipes,
    'supplements', v_supplements,
    'physical_evolution', v_physical,
    'notifications', v_notifications,
    'push_subscriptions', v_push_subs
  );
  INSERT INTO deletion_audit (actor_id, patient_id, counts)
  VALUES (actor, $1, v_counts);
END;
$$;

-- Permitir que admins executem essa função
GRANT EXECUTE ON FUNCTION delete_patient_cascade(UUID) TO authenticated;
