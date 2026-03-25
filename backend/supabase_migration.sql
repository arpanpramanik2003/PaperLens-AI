-- ============================================================
-- PaperLens: Supabase pgvector migration
-- Run this in your Supabase SQL Editor before deploying.
-- ============================================================

-- 1. Enable pgvector (skip if already enabled)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Drop existing table if re-running (safe in dev)
-- DROP TABLE IF EXISTS paper_chunks;

-- 3. Create paper_chunks table
CREATE TABLE IF NOT EXISTS paper_chunks (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id    TEXT        NOT NULL,
  user_id     TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  embedding   vector(384),          -- matches all-MiniLM-L6-v2 / bge-small-en dimension
  page        INT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. Index for fast paper-scoped lookups
CREATE INDEX IF NOT EXISTS paper_chunks_paper_id_idx ON paper_chunks (paper_id);

-- 5. IVFFlat index for cosine similarity search (optional but recommended for large scale)
-- CREATE INDEX IF NOT EXISTS paper_chunks_embedding_idx
--   ON paper_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 6. Cosine similarity search function (called via Supabase RPC)
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(384),
  target_paper_id TEXT,
  match_count     INT DEFAULT 5
)
RETURNS TABLE (
  id         uuid,
  paper_id   TEXT,
  content    TEXT,
  page       INT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    paper_id,
    content,
    page,
    1 - (embedding <=> query_embedding) AS similarity
  FROM paper_chunks
  WHERE paper_id = target_paper_id
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
