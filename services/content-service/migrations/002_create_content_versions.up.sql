CREATE TABLE IF NOT EXISTS content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_block_id UUID NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_versions_content_block_id ON content_versions(content_block_id);
CREATE INDEX idx_content_versions_number ON content_versions(content_block_id, version_number);
