-- Schedule medication reminders to run every minute
-- This requires pg_cron extension to be enabled

DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- On hosted environments like Supabase, direct UPDATE on cron.job is often forbidden
    -- for non-superusers. We attempt to schedule the job once and ignore errors such as
    -- "job already exists" or insufficient privileges to modify it.
    BEGIN
      PERFORM cron.schedule(
        'process_due_medication_reminders', -- job name
        '* * * * *',                        -- every minute
        $$SELECT process_due_medication_reminders()$$
      );
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'cron.schedule for process_due_medication_reminders failed: %', SQLERRM;
    END;
  END IF;
END $$;
