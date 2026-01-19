-- Recreate notification_settings with all columns legacy code may expect
-- Run this in Supabase SQL editor to stop errors like:
--   relation "notification_settings" does not exist
--   column "email_notifications" of relation "notification_settings" does not exist
--   column "push_notifications" of relation "notification_settings" does not exist
--   column "sms_notifications" of relation "notification_settings" does not exist

-- 1) Create table if it does not exist
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type text, -- optional, some code may use it
  enabled boolean DEFAULT true,
  sound_enabled boolean DEFAULT true,
  vibration_enabled boolean DEFAULT true,
  led_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT true,
  enable_medication_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Ensure all columns exist even if table was created before
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_settings' AND column_name = 'notification_type'
  ) THEN
    ALTER TABLE public.notification_settings ADD COLUMN notification_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_settings' AND column_name = 'enabled'
  ) THEN
    ALTER TABLE public.notification_settings ADD COLUMN enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_settings' AND column_name = 'sound_enabled'
  ) THEN
    ALTER TABLE public.notification_settings ADD COLUMN sound_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_settings' AND column_name = 'vibration_enabled'
  ) THEN
    ALTER TABLE public.notification_settings ADD COLUMN vibration_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_settings' AND column_name = 'led_enabled'
  ) THEN
    ALTER TABLE public.notification_settings ADD COLUMN led_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_settings' AND column_name = 'email_notifications'
  ) THEN
    ALTER TABLE public.notification_settings ADD COLUMN email_notifications boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_settings' AND column_name = 'push_notifications'
  ) THEN
    ALTER TABLE public.notification_settings ADD COLUMN push_notifications boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_settings' AND column_name = 'sms_notifications'
  ) THEN
    ALTER TABLE public.notification_settings ADD COLUMN sms_notifications boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_settings' AND column_name = 'enable_medication_notifications'
  ) THEN
    ALTER TABLE public.notification_settings ADD COLUMN enable_medication_notifications boolean DEFAULT true;
  END IF;
END;
$$;

-- 3) Basic RLS so any legacy selects/inserts still work for the current user
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_settings'
      AND policyname = 'notification_settings_select_basic'
  ) THEN
    CREATE POLICY "notification_settings_select_basic"
      ON public.notification_settings
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_settings'
      AND policyname = 'notification_settings_insert_basic'
  ) THEN
    CREATE POLICY "notification_settings_insert_basic"
      ON public.notification_settings
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_settings'
      AND policyname = 'notification_settings_update_basic'
  ) THEN
    CREATE POLICY "notification_settings_update_basic"
      ON public.notification_settings
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

