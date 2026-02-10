import asyncio
from app.db import get_supabase_client

async def check():
    supabase = get_supabase_client()
    try:
        res = supabase.table('projects').select('*').eq('id', 'c2c3bdda-5078-450a-9711-81458a350711').execute()
        print(f"Project found: {bool(res.data)}")
        if res.data:
            print(res.data[0]['name'])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
