-- Create an admin user account
-- IMPORTANT: Replace the email and password with your desired admin credentials
-- After creating this user, you can sign in with the credentials below

-- Note: In production, use Supabase Auth API or dashboard to create the admin user
-- This script is for demonstration purposes

-- The admin profile will be automatically created via the trigger when the user signs up
-- You'll need to manually update the role to 'admin' after the user account is created

-- Example admin user (update email/password as needed):
-- Email: admin@healthcareplus.com
-- Password: ChangeMe123!

-- Step 1: Create the admin user via Supabase Auth (do this in Supabase dashboard or via API)
-- Step 2: Once created, run this query to set the role:
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';
