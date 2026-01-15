-- Fix timezone issue in appointment reminders (displaying UTC instead of Brasilia time)
-- This script updates the notification generation functions to explicitly convert times to 'America/Sao_Paulo'

CREATE OR REPLACE FUNCTION create_appointment_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for new appointment
  IF (NEW.status = 'scheduled' AND OLD IS NULL) THEN
    INSERT INTO notifications (user_id, title, message, notification_type)
    VALUES (
      NEW.patient_id,
      'Nova Consulta Agendada',
      'Consulta agendada para ' || to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY às HH24:MI'),
      'appointment_created'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



CREATE OR REPLACE FUNCTION process_due_appointment_reminders()
RETURNS void AS $$
DECLARE
  now_sp timestamp := (now() AT TIME ZONE 'America/Sao_Paulo');
  window_minutes integer := 1;
BEGIN
  WITH due_appointments AS (
    SELECT
      a.id,
      a.patient_id,
      a.scheduled_at,
      a.location
    FROM appointments a
    LEFT JOIN notification_settings ns 
      ON ns.user_id = a.patient_id
      AND ns.notification_type = 'appointment_reminder'
    WHERE a.status = 'scheduled'
      AND COALESCE(ns.enabled, true) = true
      AND (a.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date = (now_sp + interval '24 hours')::date
      AND (a.scheduled_at AT TIME ZONE 'America/Sao_Paulo') - now_sp <= interval '24 hours'
      AND (a.scheduled_at AT TIME ZONE 'America/Sao_Paulo') - now_sp > interval '24 hours' - (window_minutes || ' minutes')::interval
      AND NOT EXISTS (
        SELECT 1
        FROM notifications n
        WHERE n.user_id = a.patient_id
          AND n.notification_type = 'appointment_reminder'
          AND n.related_id = a.id
      )
  )
  INSERT INTO notifications (user_id, title, message, notification_type, related_id)
  SELECT
    da.patient_id,
    'Lembrete: Consulta Amanhã',
    'Sua consulta é amanhã às ' || to_char(da.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') || COALESCE(' em ' || da.location, ''),
    'appointment_reminder',
    da.id
  FROM due_appointments da;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_appointment_reminders_24h()
RETURNS void AS $$
BEGIN
  PERFORM process_due_appointment_reminders();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
