-- Add support for document attachments in appointments and health metrics
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS attachment_url text;

ALTER TABLE health_metrics
ADD COLUMN IF NOT EXISTS attachment_url text;

-- Add columns to profiles for diet and supplement plans
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS diet_plan text,
ADD COLUMN IF NOT EXISTS supplement_plan text;

-- Create Supabase storage buckets for file uploads
-- Note: These need to be created via Supabase Dashboard Storage section
-- Buckets needed: prescriptions, appointments, health-metrics

-- Create function to automatically create notifications for medications
CREATE OR REPLACE FUNCTION create_medication_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for new active medication
  IF (NEW.is_active = true AND (OLD IS NULL OR OLD.is_active = false)) THEN
    INSERT INTO notifications (user_id, title, message, notification_type)
    VALUES (
      NEW.user_id,
      'Novo Medicamento Adicionado',
      'O medicamento ' || NEW.name || ' foi adicionado ao seu plano de tratamento.',
      'medication_reminder'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for medication notifications
DROP TRIGGER IF EXISTS medication_notification_trigger ON medications;
CREATE TRIGGER medication_notification_trigger
  AFTER INSERT OR UPDATE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION create_medication_notifications();

-- Create function to automatically create notifications for appointments
CREATE OR REPLACE FUNCTION create_appointment_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for new appointment
  IF (NEW.status = 'scheduled' AND OLD IS NULL) THEN
    INSERT INTO notifications (user_id, title, message, notification_type)
    VALUES (
      NEW.patient_id,
      'Nova Consulta Agendada',
      'Consulta agendada para ' || to_char(NEW.scheduled_at, 'DD/MM/YYYY às HH24:MI'),
      'appointment_reminder'
    );
  END IF;
  
  -- Create 24h reminder notification
  IF (NEW.status = 'scheduled' AND NEW.scheduled_at IS NOT NULL) THEN
    -- This would ideally be handled by a cron job or scheduled task
    -- For now, we'll create the reminder immediately
    INSERT INTO notifications (user_id, title, message, notification_type, created_at)
    VALUES (
      NEW.patient_id,
      'Lembrete: Consulta Amanhã',
      'Você tem uma consulta amanhã às a ' || to_char(NEW.scheduled_at, 'HH24:MI') || '. Local: ' || COALESCE(NEW.location, 'Não especificado'),
      'appointment_reminder',
      NEW.scheduled_at - INTERVAL '24 hours'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for appointment notifications
DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;
CREATE TRIGGER appointment_notification_trigger
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notifications();

CREATE OR REPLACE FUNCTION create_diet_notifications()
 RETURNS TRIGGER AS $$
BEGIN
   IF (TG_OP = 'INSERT') THEN
     INSERT INTO notifications (user_id, title, message, notification_type)
     VALUES (
       NEW.patient_id,
       'Nova Dieta',
       'Receita adicionada: ' || NEW.title,
       'diet_added'
     );
   END IF;
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;
 
 DROP TRIGGER IF EXISTS diet_notification_trigger ON patient_diet_recipes;
 CREATE TRIGGER diet_notification_trigger
   AFTER INSERT ON patient_diet_recipes
   FOR EACH ROW
   EXECUTE FUNCTION create_diet_notifications();
 
CREATE OR REPLACE FUNCTION create_supplement_notifications()
 RETURNS TRIGGER AS $$
BEGIN
   IF (TG_OP = 'INSERT') THEN
     INSERT INTO notifications (user_id, title, message, notification_type)
     VALUES (
       NEW.patient_id,
       'Novo Suplemento',
       'Suplemento adicionado: ' || NEW.supplement_name,
       'supplement_added'
     );
   END IF;
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;
 
 DROP TRIGGER IF EXISTS supplement_notification_trigger ON patient_supplements;
 CREATE TRIGGER supplement_notification_trigger
   AFTER INSERT ON patient_supplements
   FOR EACH ROW
   EXECUTE FUNCTION create_supplement_notifications();

 DROP POLICY IF EXISTS "patient_diet_recipes_select_own" ON patient_diet_recipes;
CREATE POLICY "patient_diet_recipes_select_own"
  ON patient_diet_recipes FOR SELECT
  USING (patient_id = auth.uid());

 DROP POLICY IF EXISTS "patient_supplements_select_own" ON patient_supplements;
CREATE POLICY "patient_supplements_select_own"
  ON patient_supplements FOR SELECT
  USING (patient_id = auth.uid());

 DROP POLICY IF EXISTS "patient_physical_evolution_select_own" ON physical_evolution;
CREATE POLICY "patient_physical_evolution_select_own"
  ON physical_evolution FOR SELECT
  USING (user_id = auth.uid());
