-- Process 24h appointment reminders respecting user preferences
CREATE TABLE IF NOT EXISTS notification_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION process_due_appointment_reminders()
RETURNS void AS $$
DECLARE
  now_ts timestamptz := now();
BEGIN
  INSERT INTO notifications (user_id, title, message, notification_type)
  SELECT
    a.patient_id,
    'Lembrete: Consulta Amanhã',
    'Consulta amanhã às ' || to_char(a.scheduled_at, 'HH24:MI') || COALESCE(' • ' || a.location, ''),
    'appointment_reminder'
  FROM appointments a
  JOIN profiles p ON p.id = a.patient_id
  LEFT JOIN notification_settings ns ON ns.user_id = a.patient_id
  WHERE a.status = 'scheduled'
    AND a.scheduled_at > now_ts
    AND a.scheduled_at <= now_ts + interval '24 hours'
    AND COALESCE(ns.enable_appointment_notifications, true) = true
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = a.patient_id
        AND n.notification_type = 'appointment_reminder'
        AND n.message LIKE '%' || to_char(a.scheduled_at, 'HH24:MI') || '%'
        AND n.created_at > now_ts - interval '1 hour'
    );

  INSERT INTO notification_event_logs (user_id, event_type, payload)
  SELECT a.patient_id, 'appointment_reminder_created',
         jsonb_build_object('appointment_id', a.id, 'scheduled_at', a.scheduled_at, 'location', a.location)
  FROM appointments a
  WHERE a.status = 'scheduled'
    AND a.scheduled_at > now_ts
    AND a.scheduled_at <= now_ts + interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $blk$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process_due_appointment_reminders') THEN
    UPDATE cron.job
      SET schedule = '* * * * *',
          command = $cmd$SELECT process_due_appointment_reminders();$cmd$,
          active = true
    WHERE jobname = 'process_due_appointment_reminders';
  ELSE
    PERFORM cron.schedule('process_due_appointment_reminders', '* * * * *', $cmd$SELECT process_due_appointment_reminders();$cmd$);
  END IF;
END
$blk$;
