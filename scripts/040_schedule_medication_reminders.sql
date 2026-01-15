-- Schedule medication reminders to run every minute
-- This requires pg_cron extension to be enabled

DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule the job if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process_due_medication_reminders') THEN
      PERFORM cron.schedule(
        'process_due_medication_reminders', -- job name
        '* * * * *',                        -- every minute
        $$SELECT process_due_medication_reminders()$$
      );
    ELSE
      -- Update existing job to ensure correct schedule and command
      UPDATE cron.job
      SET schedule = '* * * * *',
          command = $$SELECT process_due_medication_reminders()$$,
          active = true
      WHERE jobname = 'process_due_medication_reminders';
    END IF;
  END IF;
END $$;
