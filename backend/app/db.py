import os
from supabase import create_client, Client

from dotenv import load_dotenv
import pathlib

# Load .env from backend root
basedir = pathlib.Path(__file__).parent.parent
load_dotenv(basedir / ".env")

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

def get_supabase_client():
    if not url or not key:
        print("CRITICAL: Supabase URL or Key missing in db.py")
        return None
    try:
        return create_client(url, key)
    except Exception as e:
        print(f"CRITICAL: Failed to create client: {e}")
        return None
