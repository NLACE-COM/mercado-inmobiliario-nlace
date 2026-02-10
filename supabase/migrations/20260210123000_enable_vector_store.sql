-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents
create table if not exists knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  content text,
  metadata jsonb,
  embedding vector(1536) -- 1536 dimensions for text-embedding-ada-002
);

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter jsonb DEFAULT '{}'
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_docs.id,
    knowledge_docs.content,
    knowledge_docs.metadata,
    1 - (knowledge_docs.embedding <=> query_embedding) as similarity
  from knowledge_docs
  where 1 - (knowledge_docs.embedding <=> query_embedding) > match_threshold
  and knowledge_docs.metadata @> filter
  order by knowledge_docs.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create an index for faster queries (optional but recommended)
create index on knowledge_docs using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
