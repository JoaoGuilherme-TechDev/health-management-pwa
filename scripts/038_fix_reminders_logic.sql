DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'medication_reminders'
  ) THEN
    ALTER TABLE medication_reminders
    ADD CONSTRAINT medication_reminders_unique_instance
    UNIQUE (medication_id, reminder_date, reminder_time);

    CREATE OR REPLACE FUNCTION process_due_medication_reminders()
    RETURNS void AS $func$
    DECLARE
      now_ts timestamptz := now();
      now_time time := (now() AT TIME ZONE 'America/Sao_Paulo')::time;
      now_date date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
      reminder_record RECORD;
    BEGIN
      FOR reminder_record IN
        SELECT
          m.id as medication_id,
          m.user_id,
          m.name,
          m.dosage,
          ms.scheduled_time
        FROM medications m
        JOIN medication_schedules ms ON ms.medication_id = m.id AND ms.is_active = true
        LEFT JOIN notification_settings ns ON ns.user_id = m.user_id
        WHERE m.is_active = true
          AND m.start_date <= now_date
          AND (m.end_date IS NULL OR m.end_date >= now_date)
          AND date_trunc('minute', ms.scheduled_time) = date_trunc('minute', now_time)
          AND extract(dow from (now() AT TIME ZONE 'America/Sao_Paulo'))::int = ANY(ms.days_of_week)
          AND COALESCE(ns.enable_medication_notifications, true) = true
      LOOP
        INSERT INTO medication_reminders (medication_id, user_id, reminder_date, reminder_time)
        VALUES (reminder_record.medication_id, reminder_record.user_id, now_date, reminder_record.scheduled_time)
        ON CONFLICT (medication_id, reminder_date, reminder_time) DO NOTHING;

        WITH inserted_reminder AS (
          SELECT id FROM medication_reminders
          WHERE medication_id = reminder_record.medication_id
            AND reminder_date = now_date
            AND reminder_time = reminder_record.scheduled_time
        )
        INSERT INTO notifications (user_id, title, message, notification_type, related_id)
        SELECT
          reminder_record.user_id,
          'Hora de Tomar seu Remédio',
          reminder_record.name || COALESCE(' • ' || reminder_record.dosage, ''),
          'medication_reminder',
          inserted_reminder.id
        FROM inserted_reminder
        WHERE NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.related_id = inserted_reminder.id
            AND n.notification_type = 'medication_reminder'
        );
      END LOOP;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION process_due_appointment_reminders(p_lead_minutes integer DEFAULT 1440)
RETURNS void AS $$
DECLARE
  now_utc timestamptz := now();
  now_local timestamptz := (now() AT TIME ZONE 'America/Sao_Paulo');
  from_ts timestamptz := now_local - make_interval(mins => 1);
  to_ts   timestamptz := now_local + make_interval(mins => 1);
BEGIN
  INSERT INTO notifications (user_id, title, message, notification_type, related_id)
  SELECT
    a.patient_id,
    'Lembrete: Consulta Amanhã',
    'Consulta amanhã às ' || to_char(a.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') || COALESCE(' • ' || a.location, ''),
    'appointment_reminder',
    a.id
  FROM appointments a
  JOIN profiles p ON p.id = a.patient_id
  LEFT JOIN notification_settings ns ON ns.user_id = a.patient_id
  WHERE a.status = 'scheduled'
    AND (a.scheduled_at - make_interval(mins => p_lead_minutes)) AT TIME ZONE 'America/Sao_Paulo'
          BETWEEN from_ts AND to_ts
    AND COALESCE(ns.enable_appointment_notifications, true) = true
    AND NOT EXISTS (
      SELECT 1 FROM notification_event_logs l
      WHERE l.user_id = a.patient_id
        AND l.event_type = 'appointment_reminder_created'
        AND (l.payload->>'appointment_id')::uuid = a.id
    );

  INSERT INTO notification_event_logs (user_id, event_type, payload)
  SELECT
    a.patient_id,
    'appointment_reminder_created',
    jsonb_build_object(
      'appointment_id', a.id,
      'scheduled_at', a.scheduled_at,
      'location', a.location,
      'lead_minutes', p_lead_minutes,
      'triggered_at_utc', now_utc
    )
  FROM appointments a
  WHERE a.status = 'scheduled'
    AND (a.scheduled_at - make_interval(mins => p_lead_minutes)) AT TIME ZONE 'America/Sao_Paulo'
          BETWEEN from_ts AND to_ts
    AND NOT EXISTS (
      SELECT 1 FROM notification_event_logs l 
      WHERE l.user_id = a.patient_id
        AND l.event_type = 'appointment_reminder_created'
        AND (l.payload->>'appointment_id')::uuid = a.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
