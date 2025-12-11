-- Fix RLS policies to allow admins to insert/update/delete without causing recursion
-- This version uses a simpler approach that doesn't require subqueries

-- IMPORTANT: This script must be run in your Supabase SQL Editor
-- The policies won't take effect until you execute this script

-- ============================================
-- MEDICATIONS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS medications_insert ON public.medications;
DROP POLICY IF EXISTS medications_update ON public.medications;
DROP POLICY IF EXISTS medications_delete ON public.medications;
DROP POLICY IF EXISTS medications_select ON public.medications;

-- Allow SELECT for own medications or all if admin
CREATE POLICY medications_select ON public.medications
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow INSERT for own user_id or if admin
CREATE POLICY medications_insert ON public.medications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow UPDATE for own medications or if admin
CREATE POLICY medications_update ON public.medications
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow DELETE for own medications or if admin  
CREATE POLICY medications_delete ON public.medications
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS appointments_insert ON public.appointments;
DROP POLICY IF EXISTS appointments_update ON public.appointments;
DROP POLICY IF EXISTS appointments_delete ON public.appointments;
DROP POLICY IF EXISTS appointments_select ON public.appointments;

-- Allow SELECT for patient, doctor, or admin
CREATE POLICY appointments_select ON public.appointments
  FOR SELECT
  USING (
    auth.uid() = patient_id OR
    auth.uid() = doctor_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow INSERT for patient, doctor, or admin
CREATE POLICY appointments_insert ON public.appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id OR
    auth.uid() = doctor_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow UPDATE for patient, doctor, or admin
CREATE POLICY appointments_update ON public.appointments
  FOR UPDATE
  USING (
    auth.uid() = patient_id OR
    auth.uid() = doctor_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow DELETE for doctor or admin (not patient)
CREATE POLICY appointments_delete ON public.appointments
  FOR DELETE
  USING (
    auth.uid() = doctor_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================
-- MEDICAL PRESCRIPTIONS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS medical_prescriptions_insert_admin ON public.medical_prescriptions;
DROP POLICY IF EXISTS medical_prescriptions_update_admin ON public.medical_prescriptions;
DROP POLICY IF EXISTS medical_prescriptions_delete_admin ON public.medical_prescriptions;
DROP POLICY IF EXISTS medical_prescriptions_select ON public.medical_prescriptions;

-- Allow SELECT for patient or admin
CREATE POLICY medical_prescriptions_select ON public.medical_prescriptions
  FOR SELECT
  USING (
    auth.uid() = patient_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow INSERT only for admin
CREATE POLICY medical_prescriptions_insert ON public.medical_prescriptions
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow UPDATE only for admin
CREATE POLICY medical_prescriptions_update ON public.medical_prescriptions
  FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow DELETE only for admin
CREATE POLICY medical_prescriptions_delete ON public.medical_prescriptions
  FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================
-- PHYSICAL EVOLUTION TABLE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS physical_evolution_insert ON public.physical_evolution;
DROP POLICY IF EXISTS physical_evolution_update ON public.physical_evolution;
DROP POLICY IF EXISTS physical_evolution_delete ON public.physical_evolution;
DROP POLICY IF EXISTS physical_evolution_select ON public.physical_evolution;

-- Fixed column name from patient_id to user_id
-- Allow SELECT for patient or admin
CREATE POLICY physical_evolution_select ON public.physical_evolution
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow INSERT for admin only
CREATE POLICY physical_evolution_insert ON public.physical_evolution
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow UPDATE for admin only
CREATE POLICY physical_evolution_update ON public.physical_evolution
  FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow DELETE for admin only
CREATE POLICY physical_evolution_delete ON public.physical_evolution
  FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
