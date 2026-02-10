
-- Set client encoding to UTF8 to avoid character issues
SET client_encoding = 'UTF8';

-- 1. FIX EVOLUTION NOTIFICATION ENCODING
-- Re-create function for physical evolution (bioimpedance) updates with explicit UTF-8 characters
CREATE OR REPLACE FUNCTION create_evolution_notifications()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO notifications (user_id, title, message, notification_type, related_id)
    VALUES (
      NEW.user_id,
      'Nova Avaliação Física',
      'Uma nova avaliação física foi registrada em ' || to_char(NEW.measured_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY'),
      'evolution_added',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger (just to be safe, though replacing function is enough)
DROP TRIGGER IF EXISTS evolution_notification_trigger ON physical_evolution;
CREATE TRIGGER evolution_notification_trigger
  AFTER INSERT ON physical_evolution
  FOR EACH ROW
  EXECUTE FUNCTION create_evolution_notifications();


-- 2. CREATE PRESCRIPTION NOTIFICATIONS
-- Create function for medical prescriptions
CREATE OR REPLACE FUNCTION create_prescription_notifications()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO notifications (user_id, title, message, notification_type, related_id)
    VALUES (
      NEW.patient_id,
      'Nova Receita Médica',
      'Uma nova receita médica foi adicionada: ' || NEW.title,
      'prescription_added',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for medical_prescriptions
DROP TRIGGER IF EXISTS prescription_notification_trigger ON medical_prescriptions;
CREATE TRIGGER prescription_notification_trigger
  AFTER INSERT ON medical_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION create_prescription_notifications();

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Fixed Evolution encoding and added Prescription notifications.';
END $$;
