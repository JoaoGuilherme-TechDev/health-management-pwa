-- Update Auth Schema for Local Authentication
-- Since we are moving away from Supabase Auth service, we need to store passwords locally.
-- We add an 'encrypted_password' column to the auth.users table.

ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS encrypted_password TEXT;

-- Optional: Create a session table if you want to implement session management in DB
CREATE TABLE IF NOT EXISTS auth.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON auth.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON auth.sessions(user_id);
