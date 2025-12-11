-- Create initial admin user
-- Replace the email, password hash, and user ID with your actual values
-- This script should be run once to set up the first admin user

-- First, you need to sign up through the login page, then run this to set them as admin:
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-admin-email@example.com';

-- Alternatively, if you want to create an admin directly in Supabase:
-- 1. Go to your Supabase project
-- 2. Go to Authentication > Users
-- 3. Click "Add user" and create a new user with email and password
-- 4. Copy the user ID
-- 5. Go to SQL Editor and run:

-- INSERT INTO public.profiles (id, email, role, full_name, created_at)
-- VALUES ('USER_ID_FROM_STEP_4', 'admin@example.com', 'admin', 'Admin User', NOW())
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', email = 'admin@example.com';

-- For development, you can use this direct insert after creating a user:
-- Make sure to replace: USER_ID, ADMIN_EMAIL, and ADMIN_NAME

INSERT INTO public.profiles (id, email, role, full_name, created_at)
VALUES (
  'your-user-id-here', 
  'admin@example.com', 
  'admin', 
  'Admin User', 
  NOW()
)
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  email = 'admin@example.com';
