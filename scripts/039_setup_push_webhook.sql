-- Enable pg_net extension for making HTTP requests
-- Note: You can enable this in the Supabase Dashboard > Database > Extensions
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create a function to trigger the push notification webhook
CREATE OR REPLACE FUNCTION trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  request_id bigint;
  -- IMPORTANT: Replace these with your actual deployment URL and secret
  -- In production, you might want to store these in a configuration table or use Vault
  project_url text := current_setting('app.project_url', true); 
  webhook_secret text := current_setting('app.webhook_secret', true);
BEGIN
  -- Default fallback if settings are not present (mostly for local dev/testing)
  IF project_url IS NULL OR project_url = '' THEN
    project_url := 'http://host.docker.internal:3000'; -- Default for local dev
  END IF;
  
  IF webhook_secret IS NULL THEN
    webhook_secret := '';
  END IF;

  -- Construct the payload matching Supabase Webhook format
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW)
  );

  -- Send the POST request using pg_net
  -- We ignore the result since it's asynchronous
  PERFORM net.http_post(
    url := project_url || '/api/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to trigger push notification webhook: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the notifications table
DROP TRIGGER IF EXISTS on_notification_created_push ON notifications;
CREATE TRIGGER on_notification_created_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_notification();

-- Instructions for setting up the configuration variables:
-- Run this in your SQL editor to set the variables for the session or configure them in postgresql.conf
-- ALTER DATABASE postgres SET "app.project_url" = 'https://your-project.vercel.app';
-- ALTER DATABASE postgres SET "app.webhook_secret" = 'your-secure-secret';
