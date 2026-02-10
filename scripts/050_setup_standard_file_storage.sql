-- Standardize File Storage (Replacing Supabase Storage)
-- This script creates a 'files' table to store file metadata and references.
-- You can implement the actual file storage on the local filesystem or S3.

CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT NOT NULL, -- e.g., 'prescriptions', 'avatars'
  name TEXT NOT NULL, -- Original filename
  storage_path TEXT NOT NULL, -- Path on disk or S3 key
  mime_type TEXT,
  size BIGINT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_files_bucket_owner ON public.files(bucket_id, owner_id);

-- RLS Policies for Files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Select: Users can see their own files, Admins can see all
CREATE POLICY "files_select_policy" ON public.files
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert: Users can upload their own files
CREATE POLICY "files_insert_policy" ON public.files
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Delete: Users can delete their own files, Admins can delete any
CREATE POLICY "files_delete_policy" ON public.files
  FOR DELETE USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Note: The application code needs to be updated to write to this table 
-- instead of calling supabase.storage.from().upload()
