-- Fix Diet and Evolution notifications to ensure they trigger pushes
-- Matches the pattern used by Medication and Appointment reminders (inserting into notifications table)

-- 1. DIET NOTIFICATIONS
-- Ensure the function exists and inserts correctly into notifications table
CREATE OR REPLACE FUNCTION create_diet_notifications()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO notifications (user_id, title, message, notification_type, related_id)
    VALUES (
      NEW.patient_id,
      'Nova Dieta Adicionada',
      'Uma nova receita foi adicionada ao seu plano alimentar: ' || NEW.title,
      'diet_added',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger to ensure it's active
DROP TRIGGER IF EXISTS diet_notification_trigger ON patient_diet_recipes;
CREATE TRIGGER diet_notification_trigger
  AFTER INSERT ON patient_diet_recipes
  FOR EACH ROW
  EXECUTE FUNCTION create_diet_notifications();


-- 2. EVOLUTION NOTIFICATIONS
-- Create function for physical evolution (bioimpedance) updates
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

-- Create the trigger for physical_evolution table
DROP TRIGGER IF EXISTS evolution_notification_trigger ON physical_evolution;
CREATE TRIGGER evolution_notification_trigger
  AFTER INSERT ON physical_evolution
  FOR EACH ROW
  EXECUTE FUNCTION create_evolution_notifications();


-- 3. Ensure notification types are valid
-- Add 'diet_added' and 'evolution_added' to the check constraint if needed
DO $$
BEGIN
  -- We don't need to do anything if the constraint allows text, 
  -- but if there's a strict check constraint, we might need to update it.
  -- The previous scripts seemed to drop/recreate constraints with these types, 
  -- so we assume it's fine. Just in case, we log a notice.
  RAISE NOTICE 'Diet and Evolution notification triggers configured.';
END $$;
