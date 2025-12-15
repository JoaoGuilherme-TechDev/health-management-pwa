-- Remove todas as políticas RLS existentes que causam recursão
-- E cria políticas simples sem subqueries

-- Remover políticas antigas de health_metrics
DROP POLICY IF EXISTS "health_metrics_select_own" ON public.health_metrics;
DROP POLICY IF EXISTS "health_metrics_select" ON public.health_metrics;
DROP POLICY IF EXISTS "health_metrics_insert_own" ON public.health_metrics;
DROP POLICY IF EXISTS "health_metrics_insert" ON public.health_metrics;
DROP POLICY IF EXISTS "health_metrics_insert_admin_only" ON public.health_metrics;
DROP POLICY IF EXISTS "health_metrics_update_own" ON public.health_metrics;
DROP POLICY IF EXISTS "health_metrics_update" ON public.health_metrics;
DROP POLICY IF EXISTS "health_metrics_update_admin_only" ON public.health_metrics;
DROP POLICY IF EXISTS "health_metrics_delete_own" ON public.health_metrics;
DROP POLICY IF EXISTS "health_metrics_delete" ON public.health_metrics;
DROP POLICY IF EXISTS "health_metrics_delete_admin_only" ON public.health_metrics;

-- Remover políticas antigas de medications
DROP POLICY IF EXISTS "medications_select_own" ON public.medications;
DROP POLICY IF EXISTS "medications_select" ON public.medications;
DROP POLICY IF EXISTS "medications_insert_own" ON public.medications;
DROP POLICY IF EXISTS "medications_insert" ON public.medications;
DROP POLICY IF EXISTS "medications_insert_admin_only" ON public.medications;
DROP POLICY IF EXISTS "medications_update_own" ON public.medications;
DROP POLICY IF EXISTS "medications_update" ON public.medications;
DROP POLICY IF EXISTS "medications_update_admin_only" ON public.medications;
DROP POLICY IF EXISTS "medications_delete_own" ON public.medications;
DROP POLICY IF EXISTS "medications_delete" ON public.medications;
DROP POLICY IF EXISTS "medications_delete_admin_only" ON public.medications;

-- Remover políticas antigas de medication_reminders
DROP POLICY IF EXISTS "medication_reminders_select_own" ON public.medication_reminders;
DROP POLICY IF EXISTS "medication_reminders_select" ON public.medication_reminders;
DROP POLICY IF EXISTS "medication_reminders_insert_own" ON public.medication_reminders;
DROP POLICY IF EXISTS "medication_reminders_insert" ON public.medication_reminders;
DROP POLICY IF EXISTS "medication_reminders_insert_admin_only" ON public.medication_reminders;
DROP POLICY IF EXISTS "medication_reminders_update_own" ON public.medication_reminders;
DROP POLICY IF EXISTS "medication_reminders_update" ON public.medication_reminders;

-- Remover políticas antigas de appointments
DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_admin_only" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_admin_only" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_admin_only" ON public.appointments;

-- Remover políticas antigas de notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;

-- Remover políticas antigas de profiles
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- CRIAR NOVAS POLÍTICAS SIMPLES SEM SUBQUERIES

-- Profiles: Permitir leitura para todos (sem subquery), inserção e atualização apenas do próprio perfil
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Health Metrics: Apenas o próprio usuário pode ver/modificar
CREATE POLICY "health_metrics_select" ON public.health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "health_metrics_insert" ON public.health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "health_metrics_update" ON public.health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "health_metrics_delete" ON public.health_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Medications: Apenas o próprio usuário pode ver/modificar
CREATE POLICY "medications_select" ON public.medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medications_insert" ON public.medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medications_update" ON public.medications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "medications_delete" ON public.medications
  FOR DELETE USING (auth.uid() = user_id);

-- Medication Reminders: Apenas o próprio usuário pode ver/modificar
CREATE POLICY "medication_reminders_select" ON public.medication_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medication_reminders_insert" ON public.medication_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medication_reminders_update" ON public.medication_reminders
  FOR UPDATE USING (auth.uid() = user_id);

-- Appointments: Apenas o paciente pode ver seus agendamentos
CREATE POLICY "appointments_select" ON public.appointments
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "appointments_delete" ON public.appointments
  FOR DELETE USING (auth.uid() = patient_id);

-- Notifications: Apenas o próprio usuário pode ver/modificar
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
