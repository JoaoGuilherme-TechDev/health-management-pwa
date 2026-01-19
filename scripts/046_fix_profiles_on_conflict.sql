-- Ensure profiles table supports ON CONFLICT usage on id/email
-- Run this script in Supabase SQL Editor to fix

DO $$
BEGIN
  -- Ensure there is a unique constraint on profiles.id
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
    WHERE t.relname = 'profiles'
      AND a.attname = 'id'
      AND i.indisunique
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_unique UNIQUE (id);
  END IF;

  -- Ensure there is a unique constraint on profiles.email
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
    WHERE t.relname = 'profiles'
      AND a.attname = 'email'
      AND i.indisunique
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;

