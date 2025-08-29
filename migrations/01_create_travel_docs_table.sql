-- 01_create_travel_docs_table.sql
-- Create the pgvector extension and travel_docs table

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS travel_docs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NULL,
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create ivfflat index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_travel_docs_embedding 
ON travel_docs USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create RPC function for search
CREATE OR REPLACE FUNCTION search_travel_docs(
  embedding_param vector(768),
  limit_param int DEFAULT 5
)
RETURNS TABLE (
  id int,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT 
    id,
    title,
    content,
    metadata,
    1 - (embedding <=> embedding_param) AS similarity
  FROM travel_docs
  ORDER BY embedding <=> embedding_param
  LIMIT limit_param;
$$;
