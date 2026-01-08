-- Script to setup server-side cron jobs for reminders
-- This requires the pg_cron and pg_net extensions to be enabled in Supabase

-- 1. Enable extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Schedule the job to run every minute
-- REPLACE 'YOUR_APP_URL' with your actual production URL
-- If you are testing locally, you might need to use ngrok or similar to expose your local API
select cron.schedule(
  'check-reminders-every-minute',
  '* * * * *',
  $$
  select
    net.http_get(
      url:='https://YOUR_APP_URL/api/cron/reminders',
      headers:='{"Content-Type": "application/json"}'::jsonb
    ) as request_id;
  $$
);

-- To view scheduled jobs:
-- select * from cron.job;

-- To unschedule:
-- select cron.unschedule('check-reminders-every-minute');
