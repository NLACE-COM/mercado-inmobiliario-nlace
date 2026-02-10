from app.db import get_supabase_client

try:
    supabase = get_supabase_client()
    # Try to select from the table. If it doesn't exist, it should raise an error.
    res = supabase.table("system_prompts").select("*").limit(1).execute()
    print("Table system_prompts exists.")
except Exception as e:
    print(f"Error accessing table: {e}")
