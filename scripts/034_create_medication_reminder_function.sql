CREATE OR REPLACE FUNCTION public.create_medication_reminder(p_user_id UUID, p_medication_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_time_val time;
  current_day_int integer;
  schedule_rec medication_schedules%ROWTYPE;
  med_rec medications%ROWTYPE;
BEGIN
  current_time_val := date_trunc('minute', now() AT TIME ZONE 'America/Sao_Paulo')::time;
  current_day_int := extract(dow from (now() AT TIME ZONE 'America/Sao_Paulo'))::integer;

  SELECT m.* INTO med_rec
  FROM medications m
  WHERE m.id = p_medication_id
    AND m.user_id = p_user_id
    AND m.is_active = true;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF med_rec.start_date > CURRENT_DATE OR (med_rec.end_date IS NOT NULL AND med_rec.end_date < CURRENT_DATE) THEN
    RETURN;
  END IF;

  SELECT ms.* INTO schedule_rec
  FROM medication_schedules ms
  WHERE ms.medication_id = p_medication_id
    AND ms.user_id = p_user_id
    AND ms.is_active = true
    AND date_trunc('minute', ms.scheduled_time) = current_time_val
    AND current_day_int = ANY(ms.days_of_week)
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM notification_settings ns
    WHERE ns.user_id = p_user_id
      AND ns.enabled = true
      AND ns.medication_reminders = true
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = p_user_id
      AND n.notification_type = 'medication_reminder'
      AND n.message LIKE '%' || med_rec.name || '%'
      AND n.created_at > (now() - interval '10 minutes')
  ) THEN
    RETURN;
  END IF;

  INSERT INTO notifications (user_id, title, message, notification_type, action_url)
  VALUES (
    p_user_id,
    'Hora de Tomar seu Remédio',
    med_rec.name,
    'medication_reminder',
    '/patient/medications'
  );

  INSERT INTO medication_reminders (medication_id, user_id, reminder_time, reminder_date, schedule_id)
  VALUES (
    p_medication_id,
    p_user_id,
    current_time_val,
    CURRENT_DATE,
    schedule_rec.id
  );
END;
$$;
