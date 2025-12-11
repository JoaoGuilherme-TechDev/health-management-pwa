-- Create storage buckets for file uploads

-- Create prescriptions bucket for medical prescription uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for prescriptions bucket
CREATE POLICY "Admin can upload prescription files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' AND
  (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
);

CREATE POLICY "Admin can update prescription files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
);

CREATE POLICY "Admin can delete prescription files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
);

CREATE POLICY "Anyone can view prescription files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'prescriptions');
