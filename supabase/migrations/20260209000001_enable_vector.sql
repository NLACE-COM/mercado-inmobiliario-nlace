-- Enable pgvector for embeddings (Knowledge Base)
create extension if not exists vector;

--------------------------------------------------------------------------------
-- 5. Knowledge Base (RAG)
--------------------------------------------------------------------------------
create table if not exists public.knowledge_docs (
    id uuid primary key default uuid_generate_v4(),
    content text, -- The text chunk (e.g., "The 2010 earthquake changed density regulations in...")
    metadata jsonb, -- { "source": "BC Central", "date": "2010-03", "topic": "regulation" }
    embedding vector(1536) -- OpenAIs embedding size (or 768 for others)
);

-- Function to search for context
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
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
    public.knowledge_docs.id,
    public.knowledge_docs.content,
    public.knowledge_docs.metadata,
    1 - (public.knowledge_docs.embedding <=> query_embedding) as similarity
  from public.knowledge_docs
  where 1 - (public.knowledge_docs.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
