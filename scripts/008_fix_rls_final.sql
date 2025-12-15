-- Drop all existing RLS policies that cause infinite recursion
drop policy if exists "health_metrics_select_own" on public.health_metrics;
drop policy if exists "health_metrics_insert_own" on public.health_metrics;
drop policy if exists "health_metrics_update_own" on public.health_metrics;
drop policy if exists "health_metrics_delete_own" on public.health_metrics;

drop policy if exists "medications_select_own" on public.medications;
drop policy if exists "medications_insert_own" on public.medications;
drop policy if exists "medications_update_own" on public.medications;
drop policy if exists "medications_delete_own" on public.medications;

drop policy if exists "medication_reminders_select_own" on public.medication_reminders;
drop policy if exists "medication_reminders_insert_own" on public.medication_reminders;
drop policy if exists "medication_reminders_update_own" on public.medication_reminders;

drop policy if exists "appointments_select_own" on public.appointments;
drop policy if exists "appointments_insert_own" on public.appointments;
drop policy if exists "appointments_update_own" on public.appointments;
drop policy if exists "appointments_delete_own" on public.appointments;

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_insert_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_delete_own" on public.notifications;

-- Create simple RLS policies without role checking to avoid infinite recursion
-- Health metrics - only users can see their own, we handle admin access in app
create policy "health_metrics_select_own"
  on public.health_metrics for select
  using (auth.uid() = user_id);

create policy "health_metrics_insert_admin_only"
  on public.health_metrics for insert
  with check (false); -- Only admins can insert via app logic

create policy "health_metrics_update_admin_only"
  on public.health_metrics for update
  using (false); -- Only admins can update via app logic

create policy "health_metrics_delete_admin_only"
  on public.health_metrics for delete
  using (false); -- Only admins can delete via app logic

-- Medications - only users can see their own
create policy "medications_select_own"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "medications_insert_admin_only"
  on public.medications for insert
  with check (false); -- Only admins can insert via app logic

create policy "medications_update_admin_only"
  on public.medications for update
  using (false); -- Only admins can update via app logic

create policy "medications_delete_admin_only"
  on public.medications for delete
  using (false); -- Only admins can delete via app logic

-- Medication reminders
create policy "medication_reminders_select_own"
  on public.medication_reminders for select
  using (auth.uid() = user_id);

create policy "medication_reminders_insert_admin_only"
  on public.medication_reminders for insert
  with check (false);

create policy "medication_reminders_update_own"
  on public.medication_reminders for update
  using (auth.uid() = user_id);

-- Appointments
create policy "appointments_select_own"
  on public.appointments for select
  using (auth.uid() = patient_id);

create policy "appointments_insert_admin_only"
  on public.appointments for insert
  with check (false);

create policy "appointments_update_admin_only"
  on public.appointments for update
  using (false);

create policy "appointments_delete_admin_only"
  on public.appointments for delete
  using (false);

-- Notifications
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_insert_system"
  on public.notifications for insert
  with check (false); -- System/admin creates via app

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);
