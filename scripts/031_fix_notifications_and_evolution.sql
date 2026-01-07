-- Ensure notifications can be inserted by anyone (for simplicity and to fix admin/doctor issues)
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;

CREATE POLICY "notifications_insert_policy"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    -- User inserting their own notification (rare, usually system/admin does it)
    auth.uid() = user_id 
    OR 
    -- Admin or Doctor inserting for someone else
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'doctor')
    )
  );

-- Add BMI column to physical_evolution if it doesn't exist
ALTER TABLE public.physical_evolution ADD COLUMN IF NOT EXISTS bmi numeric(5,2);
