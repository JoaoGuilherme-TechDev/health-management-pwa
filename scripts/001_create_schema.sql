-- Create profiles table extending auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  first_name text,
  last_name text,
  role text default 'patient' check (role in ('patient', 'admin', 'doctor')),
  phone text,
  date_of_birth date,
  emergency_contact text,
  medical_history text,
  allergies text,
  insurance_provider text,
  insurance_id text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
    WHERE t.relname = 'profiles'
      AND a.attname = 'id'
      AND i.indisunique
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_unique UNIQUE (id);
  END IF;
END $$;

-- Create health metrics table
create table if not exists public.health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  metric_type text not null check (metric_type in ('blood_pressure', 'heart_rate', 'temperature', 'blood_glucose', 'weight', 'height', 'oxygen_saturation')),
  value text not null,
  unit text not null,
  notes text,
  recorded_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Create medications table
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  dosage text not null,
  frequency text not null,
  start_date date not null,
  end_date date,
  prescribing_doctor text,
  reason text,
  side_effects text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create medication reminders table
create table if not exists public.medication_reminders (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reminder_time time not null,
  is_taken boolean default false,
  taken_at timestamp with time zone,
  reminder_date date not null,
  created_at timestamp with time zone default now()
);

-- Create appointments table
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete set null,
  appointment_type text not null,
  title text not null,
  description text,
  scheduled_at timestamp with time zone not null,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  notes text,
  location text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text not null check (notification_type in ('medication_reminder', 'appointment_reminder', 'health_alert', 'info', 'warning')),
  is_read boolean default false,
  read_at timestamp with time zone,
  action_url text,
  created_at timestamp with time zone default now()
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.health_metrics enable row level security;
alter table public.medications enable row level security;
alter table public.medication_reminders enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;

-- Profiles RLS policies
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Health metrics RLS policies
create policy "health_metrics_select_own"
  on public.health_metrics for select
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) in ('admin', 'doctor'));

create policy "health_metrics_insert_own"
  on public.health_metrics for insert
  with check (auth.uid() = user_id);

create policy "health_metrics_update_own"
  on public.health_metrics for update
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "health_metrics_delete_own"
  on public.health_metrics for delete
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- Medications RLS policies
create policy "medications_select_own"
  on public.medications for select
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) in ('admin', 'doctor'));

create policy "medications_insert_own"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "medications_update_own"
  on public.medications for update
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) in ('admin', 'doctor'));

create policy "medications_delete_own"
  on public.medications for delete
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- Medication reminders RLS policies
create policy "medication_reminders_select_own"
  on public.medication_reminders for select
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "medication_reminders_insert_own"
  on public.medication_reminders for insert
  with check (auth.uid() = user_id);

create policy "medication_reminders_update_own"
  on public.medication_reminders for update
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- Appointments RLS policies
create policy "appointments_select_own"
  on public.appointments for select
  using (auth.uid() = patient_id or auth.uid() = doctor_id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "appointments_insert_own"
  on public.appointments for insert
  with check (auth.uid() = patient_id or (select role from public.profiles where id = auth.uid()) in ('admin', 'doctor'));

create policy "appointments_update_own"
  on public.appointments for update
  using (auth.uid() = patient_id or auth.uid() = doctor_id or (select role from public.profiles where id = auth.uid()) = 'admin');

create policy "appointments_delete_own"
  on public.appointments for delete
  using (auth.uid() = patient_id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- Notifications RLS policies
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_insert_own"
  on public.notifications for insert
  with check (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) in ('admin', 'doctor'));

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id or (select role from public.profiles where id = auth.uid()) = 'admin');

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', null),
    coalesce(new.raw_user_meta_data ->> 'last_name', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'patient')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
