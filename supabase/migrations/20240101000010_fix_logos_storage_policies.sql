-- ============================================================================
-- FIX LOGOS STORAGE POLICIES
-- ============================================================================
-- Fix storage policies to use correct path checking syntax

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

-- Create storage policy for logos bucket
-- Allow authenticated users to upload logos to organizations/ folder
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  (name LIKE 'organizations/%')
);

-- Allow authenticated users to update their own organization logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  (name LIKE 'organizations/%')
)
WITH CHECK (
  bucket_id = 'logos' AND
  (name LIKE 'organizations/%')
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
  (name LIKE 'organizations/%')
);

