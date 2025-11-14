-- ============================================================================
-- CREATE PRODUCT IMAGES STORAGE BUCKET
-- ============================================================================
-- This migration creates a storage bucket for product images

-- Create product-images bucket (public for viewing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for product-images bucket
-- Allow authenticated users to upload product images to their user folder
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (name LIKE (auth.uid()::text || '/products/%'))
);

-- Allow authenticated users to update their own product images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (name LIKE (auth.uid()::text || '/products/%'))
)
WITH CHECK (
  bucket_id = 'product-images' AND
  (name LIKE (auth.uid()::text || '/products/%'))
);

-- Allow anyone to read product images (public bucket)
CREATE POLICY "Anyone can read product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their own product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (name LIKE (auth.uid()::text || '/products/%'))
);

