-- Create notification_settings table used by the app
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  medication_reminders BOOLEAN DEFAULT true,
  appointment_reminders BOOLEAN DEFAULT true,
  lab_results BOOLEAN DEFAULT true,
  doctor_messages BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT false,
  silent_hours_start TIME DEFAULT '22:00',
  silent_hours_end TIME DEFAULT '07:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies: user manages own settings; admin can view/update all
DROP POLICY IF EXISTS notification_settings_select ON public.notification_settings;
DROP POLICY IF EXISTS notification_settings_insert ON public.notification_settings;
DROP POLICY IF EXISTS notification_settings_update ON public.notification_settings;

CREATE POLICY notification_settings_select ON public.notification_settings
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY notification_settings_insert ON public.notification_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY notification_settings_update ON public.notification_settings
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON public.notification_settings(user_id);
