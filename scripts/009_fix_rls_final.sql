-- Remove todas as políticas RLS existentes que causam recursão infinita
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

-- Criar políticas RLS simples sem subqueries que causam recursão

-- Health metrics policies
create policy "health_metrics_select"
  on public.health_metrics for select
  using (auth.uid() = user_id);

create policy "health_metrics_insert"
  on public.health_metrics for insert
  with check (auth.uid() = user_id);

create policy "health_metrics_update"
  on public.health_metrics for update
  using (auth.uid() = user_id);

create policy "health_metrics_delete"
  on public.health_metrics for delete
  using (auth.uid() = user_id);

-- Medications policies
create policy "medications_select"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "medications_insert"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "medications_update"
  on public.medications for update
  using (auth.uid() = user_id);

create policy "medications_delete"
  on public.medications for delete
  using (auth.uid() = user_id);

-- Medication reminders policies
create policy "medication_reminders_select"
  on public.medication_reminders for select
  using (auth.uid() = user_id);

create policy "medication_reminders_insert"
  on public.medication_reminders for insert
  with check (auth.uid() = user_id);

create policy "medication_reminders_update"
  on public.medication_reminders for update
  using (auth.uid() = user_id);

-- Appointments policies
create policy "appointments_select"
  on public.appointments for select
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

create policy "appointments_insert"
  on public.appointments for insert
  with check (auth.uid() = patient_id or auth.uid() = doctor_id);

create policy "appointments_update"
  on public.appointments for update
  using (auth.uid() = patient_id or auth.uid() = doctor_id);

create policy "appointments_delete"
  on public.appointments for delete
  using (auth.uid() = patient_id);

-- Notifications policies
create policy "notifications_select"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_insert"
  on public.notifications for insert
  with check (true); -- Permitir que admins/médicos insiram notificações

create policy "notifications_update"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "notifications_delete"
  on public.notifications for delete
  using (auth.uid() = user_id);
