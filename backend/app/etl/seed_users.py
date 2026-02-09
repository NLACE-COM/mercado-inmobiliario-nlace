
from supabase import create_client, Client
import os
import asyncio
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend/.env
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY")

# Create client with Service Role Key (Verified)
supabase: Client = create_client(url, key)

ADMINS = [
    {"email": "cristian@nlace.com", "name": "Cristian Labarca"},
    {"email": "dalila@nlace.com", "name": "Dalila Becerra"},
    {"email": "mjsuarez.h@gmail.com", "name": "Cote Suárez"},
    {"email": "matiasdonas@gmail.com", "name": "Matías Doñas"}
]

DEFAULT_PASSWORD = "Nlace2026!Password"

async def seed_users():
    print(f"Connecting to Supabase at {url} (Admin Mode)...")
    
    for admin in ADMINS:
        email = admin["email"]
        name = admin["name"]
        
        print(f"Processing {email}...")
        
        user_id = None
        
        # 1. Try to Find User first to avoid rate limits or duplicates errors
        try:
             # There's no get_user_by_email in admin api directly in some versions, 
             # but we can list users or just try create and catch error.
             # Actually admin.list_users() is pagination based. 
             # Let's try create_user first.
             
             # admin.create_user payload:
             attributes = {
                 "email": email,
                 "password": DEFAULT_PASSWORD,
                 "email_confirm": True,
                 "user_metadata": {"full_name": name}
             }
             
             res = supabase.auth.admin.create_user(attributes)
             if res.user:
                 user_id = res.user.id
                 print(f"  - Created user {user_id}")
        except Exception as e:
            # If error is "User already registered", we need to find the ID.
            print(f"  - Create failed (checking if exists...): {e}")

        # 2. If creation failed, find the user ID
        if not user_id:
            try:
                # We have to list users to find the ID if we can't get by email
                # This acts as a search if we filter? Py-supabase list_users doesn't support filter well.
                # But we only have a few users.
                
                # Note: This is O(N) but N is small.
                users = supabase.auth.admin.list_users()
                for u in users:
                    if u.email == email:
                        user_id = u.id
                        print(f"  - Found existing user ID: {user_id}")
                        break
            except Exception as e:
                print(f"  - Failed to list users: {e}")

        # 3. Upsert Profile
        if user_id:
            try:
                print(f"  - Updating profile for {user_id}...")
                
                profile_data = {
                    "id": user_id,
                    "email": email,
                    "full_name": name,
                    "role": "admin"
                }
                
                # Using Service Role Key bypasses RLS
                res = supabase.table("profiles").upsert(profile_data).execute()
                
                if res.data:
                    print(f"  - SUCCESS: {email} is ADMIN.")
                else:
                    # In some versions upsert returns empty list but success status
                    print(f"  - Profile upserted (Implicit Success).")
                    
            except Exception as e:
                print(f"  - Error updating profile: {e}")
        else:
            print(f"  - Could not determine User ID for {email}. Skipping.")

        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(seed_users())
