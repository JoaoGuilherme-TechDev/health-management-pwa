
-- Setup or verify push notification configuration

-- 1. Ensure push_subscriptions table has correct constraints (Fixed in code, ensuring DB matches)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_id_subscription_key'
  ) THEN
    ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_subscription_key UNIQUE (user_id, subscription);
  END IF;
END $$;

-- 2. Note on Webhooks
-- If you are using Supabase, you must configure a Database Webhook in the Dashboard:
--   Table: public.notifications
--   Events: INSERT
--   Type: HTTP Request
--   URL: https://your-app-url.com/api/webhooks/trigger-push
--   Headers: Content-Type: application/json, x-webhook-secret: (optional)

-- If you are using vanilla Postgres with pg_net:
-- (Uncomment the following block if you have pg_net installed and want to configure via SQL)
/*
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION trigger_push_webhook()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-app-url.com/api/webhooks/trigger-push',
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_webhook_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_webhook();
*/
