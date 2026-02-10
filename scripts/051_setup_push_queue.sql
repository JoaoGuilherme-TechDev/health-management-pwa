-- Standardize Push Notifications (Replacing pg_net)
-- This script creates a queue table for push notifications.
-- A separate worker process (Node.js or Cron) should poll this table and send notifications.

CREATE TABLE IF NOT EXISTS public.push_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_queue_status ON public.push_queue(status) WHERE status = 'pending';

-- Trigger to automatically add new notifications to the push queue
CREATE OR REPLACE FUNCTION public.queue_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue push notifications for important types
  IF NEW.notification_type IN ('appointment_scheduled', 'appointment_reminder', 'medication_reminder', 'prescription_new', 'diet_new', 'evolution_new', 'supplement_new') THEN
    INSERT INTO public.push_queue (notification_id, user_id, title, message)
    VALUES (NEW.id, NEW.user_id, NEW.title, NEW.message);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_queue_push_notification ON public.notifications;
CREATE TRIGGER trigger_queue_push_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_push_notification();

-- Note: You need to run a worker script (e.g., 'npm run push-worker') to process this queue.
