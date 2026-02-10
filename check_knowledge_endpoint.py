import requests
import json

try:
    print("Testing GET http://localhost:8000/brain/admin/knowledge...")
    response = requests.get("http://localhost:8000/brain/admin/knowledge", timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
