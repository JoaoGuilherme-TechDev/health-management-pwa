-- Function to process due medications and create notifications
-- This function is designed to be called by a cron job (e.g., every minute)

CREATE OR REPLACE FUNCTION process_due_medications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_time_val time;
  current_day_int integer;
  processed_count integer := 0;
BEGIN
  -- Get current time in Brasilia timezone (HH:MM:00)
  -- We truncate to minute to match scheduled times
  current_time_val := date_trunc('minute', now() AT TIME ZONE 'America/Sao_Paulo')::time;
  
  -- Get current day of week (0-6, Sunday=0) in Brasilia timezone
  current_day_int := extract(dow from (now() AT TIME ZONE 'America/Sao_Paulo'))::integer;
  
  -- Insert notifications for medications due now
  -- We select schedules that match the current time and day
  INSERT INTO notifications (user_id, title, message, notification_type, action_url)
  SELECT 
    ms.user_id,
    'Hora do Medicamento',
    'Está na hora de tomar: ' || m.name || COALESCE(' (' || m.dosage || ')', ''),
    'medication_reminder',
    '/patient/medications'
  FROM medication_schedules ms
  JOIN medications m ON m.id = ms.medication_id
  WHERE 
    -- Match time (comparing HH:MM)
    date_trunc('minute', ms.scheduled_time) = current_time_val
    -- Active schedule
    AND ms.is_active = true
    -- Active medication
    AND m.is_active = true
    -- Date range check
    AND m.start_date <= CURRENT_DATE
    AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
    -- Day of week check
    AND current_day_int = ANY(ms.days_of_week)
    -- Check if notifications are enabled for this user
    AND EXISTS (
        SELECT 1 FROM notification_settings ns 
        WHERE ns.user_id = ms.user_id 
        AND ns.enabled = true 
        AND ns.medication_reminders = true
    )
    -- Avoid duplicates (if cron runs multiple times in same minute)
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = ms.user_id
      AND n.notification_type = 'medication_reminder'
      AND n.message LIKE '%' || m.name || '%'
      AND n.created_at > (now() - interval '10 minutes')
    );

END;
$$;

-- Instructions for setting up pg_cron (if extension is enabled):
-- SELECT cron.schedule('process_medications_minutely', '* * * * *', 'SELECT process_due_medications()');
