-- ============================================================================
-- CREATE TEMP IMAGES STORAGE BUCKET
-- ============================================================================
-- This migration creates a storage bucket for temporary/general-purpose images
-- Used for rich text editor, email templates, sequence templates, and other general use cases

-- Create temp-images bucket (public for viewing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-images',
  'temp-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can upload temp images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update temp images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read temp images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete temp images" ON storage.objects;

-- Create storage policy for temp-images bucket
-- Allow authenticated users to upload images to their user folder
CREATE POLICY "Authenticated users can upload temp images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'temp-images' AND
  (name LIKE (auth.uid()::text || '/temp/%'))
);

-- Allow authenticated users to update their own temp images
CREATE POLICY "Authenticated users can update temp images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'temp-images' AND
  (name LIKE (auth.uid()::text || '/temp/%'))
)
WITH CHECK (
  bucket_id = 'temp-images' AND
  (name LIKE (auth.uid()::text || '/temp/%'))
);

-- Allow anyone to read temp images (public bucket)
CREATE POLICY "Anyone can read temp images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'temp-images');

-- Allow authenticated users to delete their own temp images
CREATE POLICY "Authenticated users can delete temp images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'temp-images' AND
  (name LIKE (auth.uid()::text || '/temp/%'))
);

