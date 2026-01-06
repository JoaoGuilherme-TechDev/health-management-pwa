-- Fix notification types check constraint to include all types used in the app

-- Drop the existing check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Add the new check constraint with all notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN (
  'medication_reminder',
  'appointment_reminder',
  'health_alert',
  'info',
  'warning',
  'general',
  'medication_created',
  'appointment_scheduled',
  'prescription_created',
  'diet_created',
  'supplement_created',
  'evolution_created'
));
