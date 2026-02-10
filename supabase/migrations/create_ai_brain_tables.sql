-- Tabla para System Prompts
CREATE TABLE IF NOT EXISTS system_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    label VARCHAR(255) DEFAULT 'Custom Prompt',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar el prompt activo rápidamente
CREATE INDEX IF NOT EXISTS idx_system_prompts_active ON system_prompts(is_active) WHERE is_active = true;

-- Tabla para Knowledge Base (documentos)
CREATE TABLE IF NOT EXISTS knowledge_docs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536),  -- Para embeddings de OpenAI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda por similitud (si usas pgvector)
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_embedding ON knowledge_docs 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Función para búsqueda de similitud
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_docs.id,
    knowledge_docs.content,
    knowledge_docs.metadata,
    1 - (knowledge_docs.embedding <=> query_embedding) as similarity
  FROM knowledge_docs
  WHERE 1 - (knowledge_docs.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_docs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_prompts_updated_at BEFORE UPDATE ON system_prompts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_docs_updated_at BEFORE UPDATE ON knowledge_docs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar un prompt por defecto
INSERT INTO system_prompts (content, label, is_active)
VALUES (
    'Eres un analista experto en el mercado inmobiliario chileno, especializado en proyectos de desarrollo inmobiliario.

Tu nombre es "Cerebro IA" y trabajas para NLACE, una plataforma de inteligencia de mercado inmobiliario.

## Contexto
Tienes acceso a una base de datos completa de proyectos inmobiliarios en Chile, incluyendo:
- Ubicaciones y comunas
- Precios (UF/m², totales)
- Características (dormitorios, baños, superficie)
- Estados de venta y disponibilidad
- Inmobiliarias desarrolladoras
- Fechas de entrega

## Tu Rol
1. **Analizar datos**: Proporciona insights basados en los datos reales del mercado
2. **Responder preguntas**: Sobre proyectos específicos, tendencias, precios, ubicaciones
3. **Comparar opciones**: Ayuda a comparar diferentes proyectos según criterios específicos
4. **Recomendar**: Sugiere proyectos basándote en las necesidades del usuario

## Instrucciones
- Usa siempre datos concretos cuando estén disponibles
- Menciona las fuentes (nombres de proyectos, comunas, inmobiliarias)
- Si no tienes información, dilo claramente
- Sé conciso pero completo
- Usa formato markdown para mejor legibilidad
- Incluye números y estadísticas cuando sea relevante

Recuerda: Tu objetivo es ayudar a tomar decisiones informadas en el mercado inmobiliario.',
    'Prompt por Defecto - Analista Inmobiliario',
    true
)
ON CONFLICT DO NOTHING;
