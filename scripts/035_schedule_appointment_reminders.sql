-- Process 24h appointment reminders respecting user preferences
CREATE TABLE IF NOT EXISTS notification_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

DO $blk$
BEGIN
  -- On hosted environments like Supabase, direct UPDATE on cron.job is often forbidden
  -- for non-superusers. Instead, we call cron.schedule once and ignore "already exists" errors.
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.schedule(
        'process_due_appointment_reminders',
        '* * * * *',
        $cmd$SELECT process_due_appointment_reminders();$cmd$
      );
    EXCEPTION
      WHEN others THEN
        -- Most likely: job already exists or insufficient privileges to modify it.
        -- We swallow the error so the script can run in restricted roles.
        RAISE NOTICE 'cron.schedule for process_due_appointment_reminders failed: %', SQLERRM;
    END;
  END IF;
END
$blk$;
