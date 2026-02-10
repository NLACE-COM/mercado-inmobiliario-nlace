import requests
import time

print("Checking backend health...")
for i in range(10):
    try:
        r = requests.get("http://localhost:8000/brain/health", timeout=2)
        print(f"Health Response: {r.status_code}")
        if r.status_code == 200:
            break
    except Exception as e:
        print(f"Waiting for backend... ({e})")
        time.sleep(2)

print("Checking knowledge endpoint...")
try:
    r = requests.get("http://localhost:8000/brain/admin/knowledge", timeout=5)
    print(f"Knowledge Response Status: {r.status_code}")
    print(f"Content Sample: {r.text[:100]}")
except Exception as e:
    print(f"Knowledge Failed: {e}")
