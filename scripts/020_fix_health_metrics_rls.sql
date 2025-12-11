-- Fix RLS policies for health_metrics table to allow admins to insert/update metrics for any patient
-- Uses separate admin policies to avoid recursion issues

-- Drop existing policies
DROP POLICY IF EXISTS health_metrics_insert ON health_metrics;
DROP POLICY IF EXISTS health_metrics_update ON health_metrics;
DROP POLICY IF EXISTS health_metrics_select ON health_metrics;
DROP POLICY IF EXISTS health_metrics_delete ON health_metrics;

-- User can only select their own metrics
CREATE POLICY health_metrics_select ON health_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User can insert their own metrics
CREATE POLICY health_metrics_insert ON health_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User can update their own metrics
CREATE POLICY health_metrics_update ON health_metrics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User can delete their own metrics
CREATE POLICY health_metrics_delete ON health_metrics
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can select all health metrics (using role check directly, no subquery)
CREATE POLICY health_metrics_select_admin ON health_metrics
  FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can insert health metrics for any patient (using role check directly)
CREATE POLICY health_metrics_insert_admin ON health_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can update any health metrics (using role check directly)
CREATE POLICY health_metrics_update_admin ON health_metrics
  FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can delete any health metrics (using role check directly)
CREATE POLICY health_metrics_delete_admin ON health_metrics
  FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
