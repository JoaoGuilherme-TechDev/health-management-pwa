-- Remove health_metrics table and all related policies
-- This script removes all health metrics functionality from the database

-- Drop all RLS policies for health_metrics
DROP POLICY IF EXISTS health_metrics_select ON health_metrics;
DROP POLICY IF EXISTS health_metrics_select_own ON health_metrics;
DROP POLICY IF EXISTS health_metrics_select_admin ON health_metrics;
DROP POLICY IF EXISTS health_metrics_insert ON health_metrics;
DROP POLICY IF EXISTS health_metrics_insert_own ON health_metrics;
DROP POLICY IF EXISTS health_metrics_insert_admin ON health_metrics;
DROP POLICY IF EXISTS health_metrics_insert_admin_only ON health_metrics;
DROP POLICY IF EXISTS health_metrics_update ON health_metrics;
DROP POLICY IF EXISTS health_metrics_update_own ON health_metrics;
DROP POLICY IF EXISTS health_metrics_update_admin ON health_metrics;
DROP POLICY IF EXISTS health_metrics_update_admin_only ON health_metrics;
DROP POLICY IF EXISTS health_metrics_delete ON health_metrics;
DROP POLICY IF EXISTS health_metrics_delete_own ON health_metrics;
DROP POLICY IF EXISTS health_metrics_delete_admin ON health_metrics;
DROP POLICY IF EXISTS health_metrics_delete_admin_only ON health_metrics;

-- Drop the health_metrics table
DROP TABLE IF EXISTS health_metrics CASCADE;

-- Note: We're keeping the health_alert notification type in notifications table
-- in case it's used elsewhere, but it can be removed manually if needed
