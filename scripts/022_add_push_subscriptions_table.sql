-- Create table to store push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subscription)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY push_subscriptions_select ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY push_subscriptions_insert ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY push_subscriptions_delete ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);
