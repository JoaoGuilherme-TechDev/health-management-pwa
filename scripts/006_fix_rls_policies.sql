-- Drop all problematic RLS policies that have subqueries causing infinite recursion
drop policy if exists "health_metrics_select_own" on public.health_metrics;
drop policy if exists "health_metrics_update_own" on public.health_metrics;
drop policy if exists "health_metrics_delete_own" on public.health_metrics;

drop policy if exists "medications_select_own" on public.medications;
drop policy if exists "medications_update_own" on public.medications;
drop policy if exists "medications_delete_own" on public.medications;

drop policy if exists "appointments_select_own" on public.appointments;
drop policy if exists "appointments_update_own" on public.appointments;
drop policy if exists "appointments_delete_own" on public.appointments;

drop policy if exists "notifications_insert_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_delete_own" on public.notifications;

-- Recreate health_metrics RLS policies (simple, no subqueries)
create policy "health_metrics_select_own"
  on public.health_metrics for select
  using (auth.uid() = user_id);

create policy "health_metrics_insert_own"
  on public.health_metrics for insert
  with check (auth.uid() = user_id);

create policy "health_metrics_update_own"
  on public.health_metrics for update
  using (auth.uid() = user_id);

create policy "health_metrics_delete_own"
  on public.health_metrics for delete
  using (auth.uid() = user_id);

-- Recreate medications RLS policies (simple, no subqueries)
create policy "medications_select_own"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "medications_insert_own"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "medications_update_own"
  on public.medications for update
  using (auth.uid() = user_id);

create policy "medications_delete_own"
  on public.medications for delete
  using (auth.uid() = user_id);

-- Recreate medication_reminders RLS policies (simple, no subqueries)
drop policy if exists "medication_reminders_select_own" on public.medication_reminders;
drop policy if exists "medication_reminders_update_own" on public.medication_reminders;

create policy "medication_reminders_select_own"
  on public.medication_reminders for select
  using (auth.uid() = user_id);

create policy "medication_reminders_insert_own"
  on public.medication_reminders for insert
  with check (auth.uid() = user_id);

create policy "medication_reminders_update_own"
  on public.medication_reminders for update
  using (auth.uid() = user_id);

-- Recreate appointments RLS policies (simple, no subqueries)
create policy "appointments_select_own"
  on public.appointments for select
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

create policy "appointments_insert_own"
  on public.appointments for insert
  with check (auth.uid() = patient_id);

create policy "appointments_update_own"
  on public.appointments for update
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

create policy "appointments_delete_own"
  on public.appointments for delete
  using (auth.uid() = patient_id);

-- Recreate notifications RLS policies (simple, no subqueries)
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_insert_own"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);
