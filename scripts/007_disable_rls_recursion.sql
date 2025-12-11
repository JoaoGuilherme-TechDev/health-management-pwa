-- Drop the problematic RLS policies that cause infinite recursion
drop policy if exists "health_metrics_select_own" on public.health_metrics;
drop policy if exists "health_metrics_update_own" on public.health_metrics;
drop policy if exists "medications_select_own" on public.medications;
drop policy if exists "medications_update_own" on public.medications;
drop policy if exists "medication_reminders_select_own" on public.medication_reminders;
drop policy if exists "appointments_select_own" on public.appointments;
drop policy if exists "appointments_insert_own" on public.appointments;
drop policy if exists "appointments_update_own" on public.appointments;
drop policy if exists "notifications_insert_own" on public.notifications;

-- Recreate policies without role subqueries - roles will be checked in application code
create policy "health_metrics_select_own"
  on public.health_metrics for select
  using (auth.uid() = user_id);

create policy "health_metrics_update_own"
  on public.health_metrics for update
  using (auth.uid() = user_id);

create policy "medications_select_own"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "medications_update_own"
  on public.medications for update
  using (auth.uid() = user_id);

create policy "medication_reminders_select_own"
  on public.medication_reminders for select
  using (auth.uid() = user_id);

create policy "appointments_select_own"
  on public.appointments for select
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

create policy "appointments_insert_own"
  on public.appointments for insert
  with check (auth.uid() = patient_id);

create policy "appointments_update_own"
  on public.appointments for update
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

create policy "notifications_insert_own"
  on public.notifications for insert
  with check (auth.uid() = user_id);
