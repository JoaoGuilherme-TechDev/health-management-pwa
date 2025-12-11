-- Fix RLS policies for health_metrics table to allow admins to insert/update metrics for any patient
-- This version avoids recursion issues by using direct role checks

-- Drop existing restrictive policies
DROP POLICY IF EXISTS health_metrics_insert ON health_metrics;
DROP POLICY IF EXISTS health_metrics_update ON health_metrics;
DROP POLICY IF EXISTS health_metrics_delete ON health_metrics;
DROP POLICY IF EXISTS health_metrics_select ON health_metrics;

-- Allow users to view their own metrics, admins can view all
CREATE POLICY health_metrics_select ON health_metrics
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Allow admins to insert metrics for any patient
CREATE POLICY health_metrics_insert ON health_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Allow admins to update metrics for any patient
CREATE POLICY health_metrics_update ON health_metrics
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Allow admins to delete metrics for any patient
CREATE POLICY health_metrics_delete ON health_metrics
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );
