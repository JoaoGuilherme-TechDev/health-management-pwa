-- Fix RLS policies to allow admins to insert medications, appointments, and prescriptions for patients

-- Drop existing policies
DROP POLICY IF EXISTS medications_insert ON public.medications;
DROP POLICY IF EXISTS medications_update ON public.medications;
DROP POLICY IF EXISTS medications_delete ON public.medications;

DROP POLICY IF EXISTS appointments_insert ON public.appointments;
DROP POLICY IF EXISTS appointments_update ON public.appointments;
DROP POLICY IF EXISTS appointments_delete ON public.appointments;

-- Medications: Allow admins to insert/update/delete for any user
CREATE POLICY medications_insert ON public.medications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY medications_update ON public.medications
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY medications_delete ON public.medications
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Appointments: Allow admins to insert/update/delete for any patient
CREATE POLICY appointments_insert ON public.appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY appointments_update ON public.appointments
  FOR UPDATE
  USING (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY appointments_delete ON public.appointments
  FOR DELETE
  USING (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Physical Evolution: Already has admin policies, just verify they exist
-- These policies should already allow admins to insert/update/delete

-- Comment: Medical prescriptions already have admin-only insert/update/delete policies
-- No changes needed for medical_prescriptions table
