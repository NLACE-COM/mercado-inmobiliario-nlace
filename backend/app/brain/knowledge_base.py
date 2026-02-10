
import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from root or backend
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../../.env'))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
openai_api_key = os.environ.get("OPENAI_API_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase Credentials")

if not openai_api_key:
    print("WARNING: OPENAI_API_KEY not found. RAG will fail.")

supabase: Client = create_client(supabase_url, supabase_key)

# Lazy instantiation of embeddings to avoid startup crash if key is missing
embeddings = None

def get_embeddings():
    global embeddings
    if embeddings is None:
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY not found. Cannot initialize embeddings.")
        embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
    return embeddings

def get_vector_store():
    return SupabaseVectorStore(
        client=supabase,
        embedding=get_embeddings(),
        table_name="knowledge_docs",
        query_name="match_documents",
    )

def ingest_text(text: str, metadata: dict):
    """
    Ingests a text chunk into the Knowledge Base.
    """
    try:
        vector_store = get_vector_store()
        vector_store.add_texts([text], metadatas=[metadata])
        print(f"Ingested: {text[:50]}...")
    except Exception as e:
        print(f"Error ingesting text: {e}")
        raise e

if __name__ == "__main__":
    # Example ingestion of historical context
    knowledge = [
        {
            "text": "El terremoto de 2010 generó cambios normativos en el cálculo estructural de edificios en altura, aumentando costos de construcción en un 15%.",
            "meta": {"topic": "normativa", "year": 2010, "event": "terremoto"}
        },
        {
            "text": "Durante el estallido social de 2019, la venta de propiedades en 'zona cero' (Santiago Centro) cayó un 40% durante el Q4.",
            "meta": {"topic": "mercado", "year": 2019, "event": "estallido_social"}
        },
        {
            "text": "La pandemia COVID-19 (2020) aceleró la demanda de casas con patio en comunas periféricas como Colina y Lampa.",
            "meta": {"topic": "tendencia", "year": 2020, "event": "covid"}
        },
        {
            "text": "La eliminación del CEEC (Crédito Especial Empresas Constructoras) en 2023 impactó el precio final de viviendas nuevas.",
            "meta": {"topic": "tributario", "year": 2023, "event": "reforma_tributaria"}
        }
    ]
    
    print("Ingesting initial knowledge base...")
    if openai_api_key:
        for item in knowledge:
            ingest_text(item["text"], item["meta"])
    else:
        print("Skipping ingestion: No OpenAI Key")
