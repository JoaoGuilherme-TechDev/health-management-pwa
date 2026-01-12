-- Enhance medication reminders with snooze/dismiss and recurrence
ALTER TABLE medication_reminders
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz,
  ADD COLUMN IF NOT EXISTS dismissed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivered boolean DEFAULT false;

CREATE OR REPLACE FUNCTION process_due_medication_reminders()
RETURNS void AS $$
DECLARE
  now_ts timestamptz := now();
  now_time time := (now() AT TIME ZONE 'America/Sao_Paulo')::time;
  now_date date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  INSERT INTO notifications (user_id, title, message, notification_type)
  SELECT
    m.user_id,
    'Hora de Tomar seu Remédio',
    m.name || COALESCE(' • ' || m.dosage, ''),
    'medication_reminder'
  FROM medications m
  JOIN medication_schedules ms ON ms.medication_id = m.id AND ms.is_active = true
  LEFT JOIN notification_settings ns ON ns.user_id = m.user_id
  WHERE m.is_active = true
    AND m.start_date <= now_date
    AND (m.end_date IS NULL OR m.end_date >= now_date)
    AND date_trunc('minute', ms.scheduled_time) = date_trunc('minute', now_time)
    AND extract(dow from (now() AT TIME ZONE 'America/Sao_Paulo'))::int = ANY(ms.days_of_week)
    AND COALESCE(ns.enable_medication_notifications, true) = true
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = m.user_id
        AND n.notification_type = 'medication_reminder'
        AND n.message LIKE '%' || m.name || '%'
        AND n.created_at > now_ts - interval '5 minutes'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $blk$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process_due_medication_reminders') THEN
    UPDATE cron.job
      SET schedule = '* * * * *',
          command = $cmd$SELECT process_due_medication_reminders();$cmd$,
          active = true
    WHERE jobname = 'process_due_medication_reminders';
  ELSE
    PERFORM cron.schedule('process_due_medication_reminders', '* * * * *', $cmd$SELECT process_due_medication_reminders();$cmd$);
  END IF;
END
$blk$;
