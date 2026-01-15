-- Fix reminders logic and ensure all necessary tables exist
-- This script consolidates table creation and function definitions to ensure everything works
-- It handles: medication_reminders, notification_settings, notification_event_logs, and reminder processing functions

-- 1. Ensure medication_reminders table exists
CREATE TABLE IF NOT EXISTS public.medication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_time time NOT NULL,
  is_taken boolean DEFAULT false,
  taken_at timestamp with time zone,
  reminder_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  schedule_id UUID REFERENCES medication_schedules(id) ON DELETE CASCADE,
  snoozed_until timestamptz,
  dismissed boolean DEFAULT false,
  delivered boolean DEFAULT false
);

-- Indices for medication_reminders
CREATE INDEX IF NOT EXISTS idx_medication_reminders_medication_id ON medication_reminders(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_user_id ON medication_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_schedule_id ON medication_reminders(schedule_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_date_time ON medication_reminders(reminder_date, reminder_time);

-- RLS for medication_reminders
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medication_reminders' AND policyname = 'medication_reminders_select') THEN
    CREATE POLICY "medication_reminders_select" ON public.medication_reminders FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medication_reminders' AND policyname = 'medication_reminders_insert') THEN
    CREATE POLICY "medication_reminders_insert" ON public.medication_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medication_reminders' AND policyname = 'medication_reminders_update') THEN
    CREATE POLICY "medication_reminders_update" ON public.medication_reminders FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medication_reminders' AND policyname = 'medication_reminders_delete') THEN
    CREATE POLICY "medication_reminders_delete" ON public.medication_reminders FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Unique constraint for medication_reminders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medication_reminders_unique_instance') THEN
    ALTER TABLE medication_reminders ADD CONSTRAINT medication_reminders_unique_instance UNIQUE (medication_id, reminder_date, reminder_time);
  END IF;
END $$;

-- 2. Ensure notification_settings table exists (Normalized structure matching TS code)
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- e.g., 'medication_reminder', 'appointment_reminder'
  enabled boolean DEFAULT true,
  sound_enabled boolean DEFAULT true,
  vibration_enabled boolean DEFAULT true,
  led_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- RLS for notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'notification_settings_select') THEN
    CREATE POLICY "notification_settings_select" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'notification_settings_insert') THEN
    CREATE POLICY "notification_settings_insert" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_settings' AND policyname = 'notification_settings_update') THEN
    CREATE POLICY "notification_settings_update" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION process_due_medication_reminders()
RETURNS void AS $func$
DECLARE
  now_sp   timestamptz := (now() AT TIME ZONE 'America/Sao_Paulo');
  now_time time        := now_sp::time;
  now_date date        := now_sp::date;
BEGIN
  -- 1) Identify due medications that haven't been processed yet today
  -- We use a CTE to capture the items we are about to process to ensure atomicity
  WITH due_meds AS (
    SELECT 
      m.id as medication_id,
      m.user_id,
      ms.id as schedule_id,
      ms.scheduled_time,
      m.name,
      m.dosage
    FROM medications m
    JOIN medication_schedules ms ON ms.medication_id = m.id
    WHERE m.is_active = true 
      AND ms.is_active = true
      AND m.start_date <= now_date
      AND (m.end_date IS NULL OR m.end_date >= now_date)
      AND extract(dow from now_sp)::int = ANY(ms.days_of_week)
      -- Strict check: Exact minute match as requested
      AND date_trunc('minute', ms.scheduled_time) = date_trunc('minute', now_time)
      -- Key Check: Ensure we haven't already created a reminder record for this specific slot
      AND NOT EXISTS (
        SELECT 1 FROM medication_reminders mr 
        WHERE mr.medication_id = m.id 
          AND mr.reminder_date = now_date 
          AND mr.reminder_time = ms.scheduled_time
      )
  ),
  -- 2) Create the persistent reminder record (Log/Lock)
  -- This ensures that even if the notification is deleted, we know we generated it
  created_reminders AS (
    INSERT INTO medication_reminders (medication_id, user_id, schedule_id, reminder_date, reminder_time)
    SELECT 
      medication_id, 
      user_id, 
      schedule_id, 
      now_date, 
      scheduled_time
    FROM due_meds
    RETURNING medication_id -- Just to ensure execution
  )
  -- 3) Create the user notification
  INSERT INTO notifications (user_id, title, message, notification_type, related_id)
  SELECT 
    dm.user_id,
    'Hora de Tomar seu Remédio',
    to_char(dm.scheduled_time, 'HH24:MI') || ' • ' || dm.name || COALESCE(' • ' || dm.dosage, ''),
    'medication_reminder',
    dm.medication_id
  FROM due_meds dm;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function: Process Due Appointment Reminders (Robust 24h check)
CREATE OR REPLACE FUNCTION process_due_appointment_reminders()
RETURNS void AS $$
DECLARE
  now_sp        timestamp := (now() AT TIME ZONE 'America/Sao_Paulo');
  target_time   timestamp := now_sp + interval '24 hours';
  window_start  timestamp := target_time - interval '2 minutes';
  window_end    timestamp := target_time + interval '2 minutes';
BEGIN
  -- Use a CTE to capture the appointments to process atomically
  WITH due_appointments AS (
    SELECT
      a.id,
      a.patient_id,
      a.scheduled_at,
      a.location
    FROM appointments a
    WHERE a.status = 'scheduled'
      -- Compare formatted time or range to ensure we catch it
      AND (a.scheduled_at AT TIME ZONE 'America/Sao_Paulo') >= window_start
      AND (a.scheduled_at AT TIME ZONE 'America/Sao_Paulo') <= window_end
      -- Idempotency check: Ensure notification doesn't already exist for this appointment
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

-- 6. Function: Create Appointment Reminders 24h (Daily Batch - for all appointments tomorrow)
CREATE OR REPLACE FUNCTION create_appointment_reminders_24h()
RETURNS void AS $$
DECLARE
  now_utc timestamptz := now();
  now_sp timestamptz := (now() AT TIME ZONE 'America/Sao_Paulo');
  tomorrow_date date := (now_sp + interval '1 day')::date;
BEGIN
  INSERT INTO notifications (user_id, title, message, notification_type, related_id)
  SELECT
    a.patient_id,
    'Lembrete: Consulta Amanhã',
    'Consulta amanhã às ' || to_char(a.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') || COALESCE(' • ' || a.location, ''),
    'appointment_reminder',
    a.id
  FROM appointments a
  LEFT JOIN notification_settings ns 
    ON ns.user_id = a.patient_id
    AND ns.notification_type = 'appointment_reminder'
  WHERE a.status = 'scheduled'
    AND (a.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date = tomorrow_date
    AND COALESCE(ns.enabled, true) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
