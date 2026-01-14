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

-- 4. Function: Process Medication Reminders (simple: if time matches, insert into notifications)
CREATE OR REPLACE FUNCTION process_due_medication_reminders()
RETURNS void AS $func$
DECLARE
  now_ts   timestamptz := now();
  now_sp   timestamptz := (now() AT TIME ZONE 'America/Sao_Paulo');
  now_time time        := now_sp::time;
  now_date date        := now_sp::date;
BEGIN
  INSERT INTO notifications (user_id, title, message, notification_type)
  SELECT
    m.user_id,
    'Hora de Tomar seu Remédio',
    m.name || COALESCE(' • ' || m.dosage, ''),
    'medication_reminder'
  FROM medications m
  JOIN medication_schedules ms
    ON ms.medication_id = m.id
   AND ms.is_active = true
  WHERE m.is_active = true
    AND m.start_date <= now_date
    AND (m.end_date IS NULL OR m.end_date >= now_date)
    AND date_trunc('minute', ms.scheduled_time) = date_trunc('minute', now_time)
    AND extract(dow from now_sp)::int = ANY(ms.days_of_week)
    AND NOT EXISTS (
      SELECT 1
      FROM notifications n
      WHERE n.user_id = m.user_id
        AND n.notification_type = 'medication_reminder'
        AND n.created_at > now_ts - interval '5 minutes'
    );
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function: Process Due Appointment Reminders (Exact 24h check, run frequently)
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
  LEFT JOIN notification_settings ns 
    ON ns.user_id = a.patient_id
    AND ns.notification_type = 'appointment_reminder'
  WHERE a.status = 'scheduled'
    AND (a.scheduled_at - make_interval(mins => p_lead_minutes)) AT TIME ZONE 'America/Sao_Paulo'
          BETWEEN from_ts AND to_ts
    AND COALESCE(ns.enabled, true) = true;
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
