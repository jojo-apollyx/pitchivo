-- Drop dependent table first if it exists (to handle partial migration failures)
DROP TABLE IF EXISTS public.product_field_applications CASCADE;

-- Drop document_extractions table if it exists (to handle partial migration failures)
DROP TABLE IF EXISTS public.document_extractions CASCADE;

-- Create document_extractions table
CREATE TABLE public.document_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT NOT NULL UNIQUE,
    filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Extraction data
    raw_extracted_data JSONB,
    file_summary JSONB,
    extracted_values JSONB,
    reviewed_values JSONB,
    user_corrections JSONB,
    
    -- Status tracking
    analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
    review_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_status IN ('pending_review', 'reviewed')),
    error_message TEXT,
    
    -- Review tracking
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    
    -- Reference counting for safe deletion
    reference_count INTEGER NOT NULL DEFAULT 0,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create product_field_applications table (without foreign key to document_extractions first)
CREATE TABLE public.product_field_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    file_id UUID,
    
    -- Track which fields were applied
    fields_applied TEXT[] NOT NULL DEFAULT '{}',
    
    -- Tracking
    applied_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Composite unique constraint to prevent duplicate applications
    UNIQUE(product_id, file_id)
);

-- Add foreign key constraint to document_extractions after both tables are created
ALTER TABLE public.product_field_applications
    ADD CONSTRAINT fk_product_field_applications_file_id
    FOREIGN KEY (file_id) REFERENCES public.document_extractions(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_document_extractions_content_hash ON public.document_extractions(content_hash);
CREATE INDEX idx_document_extractions_organization_id ON public.document_extractions(organization_id);
CREATE INDEX idx_document_extractions_uploaded_by ON public.document_extractions(uploaded_by);
CREATE INDEX idx_document_extractions_analysis_status ON public.document_extractions(analysis_status);
CREATE INDEX idx_document_extractions_deleted_at ON public.document_extractions(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_product_field_applications_product_id ON public.product_field_applications(product_id);
CREATE INDEX idx_product_field_applications_file_id ON public.product_field_applications(file_id);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_extractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_extractions_updated_at
    BEFORE UPDATE ON public.document_extractions
    FOR EACH ROW
    EXECUTE FUNCTION update_document_extractions_updated_at();

-- Trigger to increment/decrement reference_count
CREATE OR REPLACE FUNCTION increment_file_reference_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.document_extractions
    SET reference_count = reference_count + 1
    WHERE id = NEW.file_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_file_reference_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.document_extractions
    SET reference_count = reference_count - 1
    WHERE id = OLD.file_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_field_applications_insert
    AFTER INSERT ON public.product_field_applications
    FOR EACH ROW
    EXECUTE FUNCTION increment_file_reference_count();

CREATE TRIGGER product_field_applications_delete
    AFTER DELETE ON public.product_field_applications
    FOR EACH ROW
    EXECUTE FUNCTION decrement_file_reference_count();

-- RLS Policies
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_field_applications ENABLE ROW LEVEL SECURITY;

-- Users can view files in their organization
CREATE POLICY "Users can view document_extractions in their org"
    ON public.document_extractions
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
        )
        AND deleted_at IS NULL
    );

-- Users can insert files in their organization
CREATE POLICY "Users can insert document_extractions in their org"
    ON public.document_extractions
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

-- Users can update files they uploaded or in their org
CREATE POLICY "Users can update document_extractions in their org"
    ON public.document_extractions
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

-- Users can soft delete files in their organization
CREATE POLICY "Users can soft delete document_extractions in their org"
    ON public.document_extractions
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

-- Product field applications policies
CREATE POLICY "Users can view product_field_applications in their org"
    ON public.product_field_applications
    FOR SELECT
    USING (
        product_id IN (
            SELECT product_id FROM public.products 
            WHERE org_id IN (
                SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert product_field_applications in their org"
    ON public.product_field_applications
    FOR INSERT
    WITH CHECK (
        product_id IN (
            SELECT product_id FROM public.products 
            WHERE org_id IN (
                SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
            )
        )
        AND applied_by = auth.uid()
    );

CREATE POLICY "Users can delete product_field_applications in their org"
    ON public.product_field_applications
    FOR DELETE
    USING (
        product_id IN (
            SELECT product_id FROM public.products 
            WHERE org_id IN (
                SELECT organization_id FROM public.user_profiles WHERE id = auth.uid()
            )
        )
    );

-- Create storage bucket for document files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can upload documents in their org folder"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' 
        AND (storage.foldername(name))[1] IN (
            SELECT organization_id::text FROM public.user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can view documents in their org folder"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'documents' 
        AND (storage.foldername(name))[1] IN (
            SELECT organization_id::text FROM public.user_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete documents in their org folder"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'documents' 
        AND (storage.foldername(name))[1] IN (
            SELECT organization_id::text FROM public.user_profiles WHERE id = auth.uid()
        )
    );

