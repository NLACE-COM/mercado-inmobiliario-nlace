
from supabase import create_client, Client
import os
import asyncio
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime

# Load env from backend/.env
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY")

# Create client with Service Role Key (Admin)
supabase: Client = create_client(url, key)

ADMIN_EMAILS = [
    "cristian@nlace.com",
    "dalila@nlace.com",
    "mjsuarez.h@gmail.com",
    "matiasdonas@gmail.com"
]

async def confirm_users():
    print(f"Connecting to Supabase at {url} (Admin Mode)...")
    
    # 1. List all users to find IDs (simplest way given small userbase)
    try:
        # In current supabase-py, admin.list_users() returns a list of User objects
        users = supabase.auth.admin.list_users()
        print(f"Found {len(users)} total users in Auth.")
        
        for u in users:
            if u.email in ADMIN_EMAILS:
                print(f"\nChecking {u.email} (ID: {u.id})...")
                
                if u.email_confirmed_at:
                    print(f"  - Already confirmed at {u.email_confirmed_at}")
                else:
                    print(f"  - NOT CONFIRMED. Attempting to force confirm...")
                    
                    try:
                        # Force update the user to confirm email
                        # attributes={ "email_confirm": True } works in many Gotrue versions
                        attributes = { "email_confirm": True }
                        
                        res = supabase.auth.admin.update_user_by_id(u.id, attributes)
                        
                        if res.user and res.user.email_confirmed_at:
                             print(f"  - SUCCESS: Confirmed! ({res.user.email_confirmed_at})")
                        else:
                             print(f"  - WARNING: Update call finished but email_confirmed_at is still None/Empty. Response: {res}")
                             
                    except Exception as e:
                        print(f"  - Error updating user: {e}")
            
    except Exception as e:
        print(f"Error listing users: {e}")

if __name__ == "__main__":
    asyncio.run(confirm_users())
