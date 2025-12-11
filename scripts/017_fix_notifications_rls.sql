-- Fix RLS policies for notifications table to allow admin operations
-- This allows admins to create notifications for patients

-- Drop existing notification policies
DROP POLICY IF EXISTS notifications_insert ON notifications;
DROP POLICY IF EXISTS notifications_select ON notifications;
DROP POLICY IF EXISTS notifications_update ON notifications;
DROP POLICY IF EXISTS notifications_delete ON notifications;

-- Create new policies that support admin operations

-- SELECT: Users can view their own notifications, admins can view all
CREATE POLICY notifications_select ON notifications
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- INSERT: Users can create their own notifications, admins can create for anyone
CREATE POLICY notifications_insert ON notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- UPDATE: Users can update their own notifications (mark as read), admins can update any
CREATE POLICY notifications_update ON notifications
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- DELETE: Users can delete their own notifications, admins can delete any
CREATE POLICY notifications_delete ON notifications
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
