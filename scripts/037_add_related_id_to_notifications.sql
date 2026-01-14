-- Add related_id to notifications to link to source objects
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS related_id UUID;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_related_id ON notifications(related_id);
