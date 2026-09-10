-- Document-based verification (2u/2v redesign). Until now "verified" was a bare boolean an admin
-- flipped with nothing behind it - no submitted credentials, no reject/needs-more-info path, no
-- note admin could leave for themselves or the provider. This adds a real tri-state status plus a
-- small document inbox per provider.
ALTER TABLE provider_profiles ADD COLUMN verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

-- Backfill: any profile already verified=true is APPROVED, everything else starts PENDING (there
-- was no REJECTED concept before this migration, so nothing maps to it).
UPDATE provider_profiles SET verification_status = 'APPROVED' WHERE verified = true;

-- Shown to the provider - set when an admin rejects or asks for more documents, cleared on
-- approval. Distinct from internal_note below, which the provider never sees.
ALTER TABLE provider_profiles ADD COLUMN provider_message TEXT;
ALTER TABLE provider_profiles ADD COLUMN internal_note TEXT;

CREATE TABLE provider_documents (
    id UUID PRIMARY KEY,
    provider_profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(30) NOT NULL,
    file_data_uri TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    review_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Re-uploading a document type (e.g. after a rejection) replaces the row rather than piling up
    -- old submissions.
    UNIQUE (provider_profile_id, document_type)
);

CREATE INDEX idx_provider_documents_provider_profile_id ON provider_documents (provider_profile_id);
