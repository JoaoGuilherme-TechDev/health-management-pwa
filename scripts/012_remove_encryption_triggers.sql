-- Remove encryption triggers that are causing errors
-- The encryption_key configuration parameter was never set up properly

-- Drop the encryption trigger
DROP TRIGGER IF EXISTS encrypt_sensitive_data_trigger ON public.profiles;

-- Drop the encryption function
DROP FUNCTION IF EXISTS encrypt_sensitive_data();

-- Drop the decrypt function
DROP FUNCTION IF EXISTS decrypt_profile(uuid);

-- Remove the encrypted columns (we'll just use the plain columns)
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS phone_encrypted,
  DROP COLUMN IF EXISTS emergency_contact_encrypted,
  DROP COLUMN IF EXISTS medical_history_encrypted,
  DROP COLUMN IF EXISTS allergies_encrypted,
  DROP COLUMN IF EXISTS insurance_provider_encrypted,
  DROP COLUMN IF EXISTS insurance_id_encrypted;

-- Note: The plain text columns (phone, emergency_contact, etc.) will continue to work normally
-- If encryption is needed in the future, it should be implemented properly with environment variables
