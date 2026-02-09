
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend/.env
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

try:
    print("Attempting to list users with auth.admin...")
    # This requires Service Role Key
    users = supabase.auth.admin.list_users()
    print(f"Success! Found {len(users)} users.")
except Exception as e:
    print(f"Failed: {e}")
