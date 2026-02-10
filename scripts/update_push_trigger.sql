CREATE OR REPLACE FUNCTION public.queue_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.notification_type IN ('appointment_scheduled', 'appointment_reminder', 'medication_reminder') THEN
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
