
-- 1) Create auth schema if it doesn't exist (Standard Postgres compatibility)
CREATE SCHEMA IF NOT EXISTS auth;

-- 2) Create auth.users table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  id_v4 uuid,
  aud character varying(255),
  role character varying(255),
  email character varying(255) UNIQUE,
  encrypted_password character varying(255),
  email_confirmed_at timestamp with time zone,
  invited_at timestamp with time zone,
  confirmation_token character varying(255),
  confirmation_sent_at timestamp with time zone,
  recovery_token character varying(255),
  recovery_sent_at timestamp with time zone,
  email_change_token_new character varying(255),
  email_change character varying(255),
  email_change_sent_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  phone character varying(255),
  phone_confirmed_at timestamp with time zone,
  phone_change character varying(255),
  phone_change_token character varying(255),
  phone_change_sent_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  email_change_token_current character varying(255),
  email_change_confirm_status smallint,
  banned_until timestamp with time zone,
  reauthentication_token character varying(255),
  reauthentication_sent_at timestamp with time zone,
  is_sso_user boolean DEFAULT false NOT NULL,
  deleted_at timestamp with time zone
);

-- 3) Mock auth.uid() function for RLS
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql 
AS $$
  -- Returns a mock UUID. In a real app, this should return the current user's ID from session/jwt.
  -- For testing/migration purposes, you might want to set a session variable.
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- 4) Create extensions commonly used
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
