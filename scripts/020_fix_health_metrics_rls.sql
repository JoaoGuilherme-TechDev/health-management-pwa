-- Fix RLS policies for health_metrics table to allow admins to insert/update metrics for any patient

-- Drop existing restrictive policies
DROP POLICY IF EXISTS health_metrics_insert ON health_metrics;
DROP POLICY IF EXISTS health_metrics_update ON health_metrics;

-- Create new policies that allow admins to manage all health metrics
CREATE POLICY health_metrics_insert ON health_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY health_metrics_update ON health_metrics
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
