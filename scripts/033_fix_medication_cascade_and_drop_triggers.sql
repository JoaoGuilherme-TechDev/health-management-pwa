-- Drop notification triggers and functions that are causing duplication
DROP TRIGGER IF EXISTS medication_notification_trigger ON medications;
DROP FUNCTION IF EXISTS create_medication_notifications();

DROP TRIGGER IF EXISTS appointment_notification_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_notifications();

-- Ensure medication_schedules deletes on medication delete (Cascade)
-- First drop the constraint if it exists (using standard naming convention)
ALTER TABLE medication_schedules
DROP CONSTRAINT IF EXISTS medication_schedules_medication_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE medication_schedules
ADD CONSTRAINT medication_schedules_medication_id_fkey
FOREIGN KEY (medication_id)
REFERENCES medications(id)
ON DELETE CASCADE;

-- Ensure medication_reminders deletes on medication delete (Cascade)
ALTER TABLE medication_reminders
DROP CONSTRAINT IF EXISTS medication_reminders_medication_id_fkey;

ALTER TABLE medication_reminders
ADD CONSTRAINT medication_reminders_medication_id_fkey
FOREIGN KEY (medication_id)
REFERENCES medications(id)
ON DELETE CASCADE;
