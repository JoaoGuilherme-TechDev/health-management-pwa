-- Fix RLS policies for health_metrics table to allow admins to insert/update metrics for any patient
-- This version uses separate admin policies like other working tables (physical_evolution, patient_diet_recipes, etc.)

-- Drop existing policies
DROP POLICY IF EXISTS health_metrics_insert ON health_metrics;
DROP POLICY IF EXISTS health_metrics_update ON health_metrics;
DROP POLICY IF EXISTS health_metrics_delete ON health_metrics;
DROP POLICY IF EXISTS health_metrics_select ON health_metrics;

-- SELECT policies
-- Allow users to view their own metrics
CREATE POLICY health_metrics_select ON health_metrics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to view all metrics
CREATE POLICY health_metrics_select_admin ON health_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERT policies
-- Allow users to insert their own metrics
CREATE POLICY health_metrics_insert ON health_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow admins to insert metrics for any patient
CREATE POLICY health_metrics_insert_admin ON health_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- UPDATE policies
-- Allow users to update their own metrics
CREATE POLICY health_metrics_update ON health_metrics
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to update any metrics
CREATE POLICY health_metrics_update_admin ON health_metrics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- DELETE policies
-- Allow users to delete their own metrics
CREATE POLICY health_metrics_delete ON health_metrics
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to delete any metrics
CREATE POLICY health_metrics_delete_admin ON health_metrics
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
