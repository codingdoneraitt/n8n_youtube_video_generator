CREATE TABLE IF NOT EXISTS question_bank (
  id BIGSERIAL PRIMARY KEY,
  source_app TEXT NOT NULL,
  source_question_id TEXT NOT NULL,
  content_hash TEXT NOT NULL UNIQUE,
  question JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'unused'
    CHECK (status IN ('unused', 'processing', 'rendered', 'uploaded', 'published', 'failed')),
  reserved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  youtube_id TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_bank_status ON question_bank(status);
CREATE INDEX IF NOT EXISTS idx_question_bank_source_app ON question_bank(source_app);

CREATE TABLE IF NOT EXISTS video_runs (
  id UUID PRIMARY KEY,
  source_app TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'rendering', 'rendered', 'uploaded', 'published', 'failed')),
  question_ids BIGINT[] NOT NULL DEFAULT '{}',
  renderer_job_id TEXT,
  artifact_url TEXT,
  youtube_id TEXT,
  metadata JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
