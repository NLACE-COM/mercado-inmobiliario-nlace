from app.db import get_supabase_client

try:
    supabase = get_supabase_client()
    res = supabase.table("knowledge_docs").select("*").limit(1).execute()
    print("Table knowledge_docs exists.")
except Exception as e:
    print(f"Error accessing table knowledge_docs: {e}")
