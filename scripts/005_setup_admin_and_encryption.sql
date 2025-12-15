-- Add encryption extension for pgcrypto
create extension if not exists pgcrypto;

-- Add encrypted columns to profiles table for sensitive data
alter table public.profiles 
add column if not exists phone_encrypted text,
add column if not exists emergency_contact_encrypted text,
add column if not exists medical_history_encrypted text,
add column if not exists allergies_encrypted text,
add column if not exists insurance_provider_encrypted text,
add column if not exists insurance_id_encrypted text;

-- Create function to encrypt data on insert/update
create or replace function encrypt_sensitive_data()
returns trigger as $$
begin
  if new.phone is not null then
    new.phone_encrypted := pgp_sym_encrypt(new.phone, current_setting('app.encryption_key'));
    new.phone := null;
  end if;
  
  if new.emergency_contact is not null then
    new.emergency_contact_encrypted := pgp_sym_encrypt(new.emergency_contact, current_setting('app.encryption_key'));
    new.emergency_contact := null;
  end if;
  
  if new.medical_history is not null then
    new.medical_history_encrypted := pgp_sym_encrypt(new.medical_history, current_setting('app.encryption_key'));
    new.medical_history := null;
  end if;
  
  if new.allergies is not null then
    new.allergies_encrypted := pgp_sym_encrypt(new.allergies, current_setting('app.encryption_key'));
    new.allergies := null;
  end if;
  
  if new.insurance_provider is not null then
    new.insurance_provider_encrypted := pgp_sym_encrypt(new.insurance_provider, current_setting('app.encryption_key'));
    new.insurance_provider := null;
  end if;
  
  if new.insurance_id is not null then
    new.insurance_id_encrypted := pgp_sym_encrypt(new.insurance_id, current_setting('app.encryption_key'));
    new.insurance_id := null;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Drop existing trigger if it exists
drop trigger if exists encrypt_sensitive_data_trigger on public.profiles;

-- Create trigger for encryption
create trigger encrypt_sensitive_data_trigger
before insert or update on public.profiles
for each row
execute function encrypt_sensitive_data();

-- Create function to decrypt data on select
create or replace function decrypt_profile(p_id uuid)
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  phone text,
  date_of_birth date,
  emergency_contact text,
  medical_history text,
  allergies text,
  insurance_provider text,
  insurance_id text,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) as $$
begin
  return query
  select
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    case when p.phone_encrypted is not null 
      then pgp_sym_decrypt(p.phone_encrypted, current_setting('app.encryption_key'))
      else null 
    end,
    p.date_of_birth,
    case when p.emergency_contact_encrypted is not null 
      then pgp_sym_decrypt(p.emergency_contact_encrypted, current_setting('app.encryption_key'))
      else null 
    end,
    case when p.medical_history_encrypted is not null 
      then pgp_sym_decrypt(p.medical_history_encrypted, current_setting('app.encryption_key'))
      else null 
    end,
    case when p.allergies_encrypted is not null 
      then pgp_sym_decrypt(p.allergies_encrypted, current_setting('app.encryption_key'))
      else null 
    end,
    case when p.insurance_provider_encrypted is not null 
      then pgp_sym_decrypt(p.insurance_provider_encrypted, current_setting('app.encryption_key'))
      else null 
    end,
    case when p.insurance_id_encrypted is not null 
      then pgp_sym_decrypt(p.insurance_id_encrypted, current_setting('app.encryption_key'))
      else null 
    end,
    p.avatar_url,
    p.created_at,
    p.updated_at
  from public.profiles p
  where p.id = p_id;
end;
$$ language plpgsql;

-- Update RLS policies to use decrypted view
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- Add comment about encryption to understand the setup
comment on column public.profiles.phone_encrypted is 'Encrypted phone number - use decrypt_profile() to read';
comment on column public.profiles.emergency_contact_encrypted is 'Encrypted emergency contact - use decrypt_profile() to read';
comment on column public.profiles.medical_history_encrypted is 'Encrypted medical history - use decrypt_profile() to read';
comment on column public.profiles.allergies_encrypted is 'Encrypted allergies - use decrypt_profile() to read';
comment on column public.profiles.insurance_provider_encrypted is 'Encrypted insurance provider - use decrypt_profile() to read';
comment on column public.profiles.insurance_id_encrypted is 'Encrypted insurance ID - use decrypt_profile() to read';
