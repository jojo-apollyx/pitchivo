-- ============================================================================
-- ADD IMAGE TYPES TO DOCUMENTS STORAGE BUCKET
-- ============================================================================
-- Update the documents bucket to allow image file types for vision API support

-- Update the documents bucket to include image MIME types
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    -- Document types
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    -- Image types (for Azure OpenAI vision API)
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
]
WHERE id = 'documents';

