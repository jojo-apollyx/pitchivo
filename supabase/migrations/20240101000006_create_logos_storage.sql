-- ============================================================================
-- CREATE LOGOS STORAGE BUCKET
-- ============================================================================
-- This migration creates a storage bucket for organization logos

-- Create logos bucket (public for now, can be made private later)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for logos bucket
-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = 'organizations'
);

-- Allow authenticated users to update their own organization logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = 'organizations'
);

-- Allow anyone to read logos (public bucket)
CREATE POLICY "Anyone can read logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Allow authenticated users to delete their own organization logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (storage.foldername(name))[1] = 'organizations'
);

