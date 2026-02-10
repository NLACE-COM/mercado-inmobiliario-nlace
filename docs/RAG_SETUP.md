# 🧠 Configuración del Cerebro IA (RAG)

Para que el Cerebro IA pueda leer documentos, aprender y responder preguntas avanzadas, es necesario habilitar la **Base de Vectores** en Supabase.

El frontend puede mostrar "Cargando documentos..." infinitamente si esta base de datos no está configurada.

## 🚀 Pasos para Habilitar RAG

### 1. Ejecutar Migración SQL

1.  Ve al **Dashboard de Supabase** -> Proyecto -> **SQL Editor**.
2.  Crea una nueva consulta ("New Query").
3.  Copia y pega el contenido del archivo:
    *   `supabase/migrations/20260210123000_enable_vector_store.sql`
4.  Haz clic en **Run**.

### Contenido SQL:

```sql
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
```

### 2. Verificar Variables de Entorno

Asegúrate de que tu archivo `.env` en el backend tenga configurada la `OPENAI_API_KEY`. RAG necesita llamar a OpenAI para generar embeddings.

```bash
# backend/.env
OPENAI_API_KEY=sk-...
```

---

Una vez ejecutado el SQL, podrás subir archivos Excel, PDF, CSV o TXT desde el panel de administración y el Cerebro IA los usará para responder preguntas.
