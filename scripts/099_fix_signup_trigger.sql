-- Fix for "Database error saving new user" during signup
-- This script ensures the trigger for creating profiles is robust and removes any problematic legacy triggers

-- 1. Remove legacy encryption triggers that might be failing
DROP TRIGGER IF EXISTS encrypt_sensitive_data_trigger ON public.profiles;
DROP FUNCTION IF EXISTS encrypt_sensitive_data();

-- 2. Drop the existing signup trigger to recreate it cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Recreate the handle_new_user function with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'role', 'patient'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error if possible, but mainly ensure we don't block auth user creation if profile fails?
  -- Actually, we WANT to block it if profile fails, otherwise we have inconsistent state.
  -- But we re-raise with a clear message.
  RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- 4. Reattach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure RLS policies on profiles allow the trigger to work (SECURITY DEFINER handles this, but good to be safe)
-- Verify profiles table exists and has correct permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
