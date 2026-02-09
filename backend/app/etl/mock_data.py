
import os
import random
import uuid
from datetime import datetime, timedelta
from faker import Faker
from dotenv import load_dotenv

# Load env vars first
# Adjusted path: Assuming script is run from project root, .env is in backend/.env
# or if run from backend/, it's just .env.
# Let's try absolute path or relative to this file.
dotenv_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(dotenv_path=dotenv_path)

from supabase import create_client, Client

fake = Faker('es_CL')

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("Please ensure SUPABASE_URL and SUPABASE_KEY are set in backend/.env")
    return create_client(url, key)

PROJECT_TYPOLOGIES = ['1D+1B', '2D+2B', '3D+2B', '3D+3B']
COMMUNES_DATA = [
    ('Las Condes', 'RM', -33.41, -70.58),
    ('Vitacura', 'RM', -33.39, -70.60),
    ('Providencia', 'RM', -33.43, -70.61),
    ('Ñuñoa', 'RM', -33.45, -70.60),
    ('Santiago', 'RM', -33.45, -70.66),
    ('San Miguel', 'RM', -33.49, -70.65),
    ('La Florida', 'RM', -33.52, -70.59)
]

DEVELOPERS = [
    'Inmobiliaria Almagro', 'Imagina', 'Paz Corp', 'Echeverría Izquierdo', 
    'Siena', 'Bricsa', 'Aconcagua', 'Fundamenta', 'Simonetti'
]

STATUSES = ['En Blanco', 'En Verde', 'Entrega Inmediata']
CATEGORIES = ['Privado', 'Subsidio DS19']

def generate_mock_projects(n=50):
    supabase = get_supabase_client()
    projects_batch = []
    
    print(f"Generating {n} mock projects...")

    for _ in range(n):
        c_name, region, c_lat, c_lon = random.choice(COMMUNES_DATA)
        
        # Jitter location slightly around commune center
        lat = c_lat + (random.random() - 0.5) * 0.04
        lon = c_lon + (random.random() - 0.5) * 0.04
        
        total_units = random.randint(50, 400)
        sold_percent = random.uniform(0.1, 0.95)
        sold_units = int(total_units * sold_percent)
        available_units = total_units - sold_units
        
        sales_speed = round(random.uniform(2.0, 15.0), 2)
        mao = round(available_units / max(1, sales_speed), 1)

        project = {
            "name": f"Edificio {fake.first_name()} {fake.street_suffix()}",
            "developer": random.choice(DEVELOPERS),
            "commune": c_name,
            "region": region,
            "address": fake.address(),
            "location": f"POINT({lon} {lat})", # PostGIS format
            "latitude": lat,
            "longitude": lon,
            "project_status": random.choice(STATUSES),
            "property_type": "Departamento",
            "category": random.choice(CATEGORIES),
            "total_floors": random.randint(5, 30),
            "total_apartments": total_units,
            
            "total_units": total_units,
            "sold_units": sold_units,
            "available_units": available_units,
            
            "sales_speed_monthly": sales_speed,
            "months_to_sell_out": mao,
            
            "min_price_uf": random.randint(2500, 4000),
            "max_price_uf": random.randint(8000, 15000),
            "avg_price_uf": random.randint(4500, 9000),
            "avg_price_m2_uf": round(random.uniform(60.0, 120.0), 2),
            
            "delivery_date": (datetime.now() + timedelta(days=random.randint(-100, 800))).date().isoformat(),
            "construction_start_date": (datetime.now() - timedelta(days=random.randint(200, 600))).date().isoformat(),
        }
        projects_batch.append(project)

    inserted_projects = []
    # Insert projects one by one to avoid batch constraint errors
    print("Inserting projects...")
    for proj in projects_batch:
        try:
            res = supabase.table("projects").upsert(
                proj, on_conflict="name,commune"
            ).execute()
            if res.data:
                inserted_projects.extend(res.data)
        except Exception as e:
            print(f"Skipping duplicate/error: {e}")
    
    print(f"Successfully inserted {len(inserted_projects)} projects.")
        
    # Now generate typologies for each project
    typologies_batch = []
    for p in inserted_projects:
        p_id = p['id']
        # Create 2-4 typologies per project
        num_types = random.randint(2, 4)
        chosen_types = random.sample(PROJECT_TYPOLOGIES, k=num_types)
        
        for t_name in chosen_types:
            beds = int(t_name[0])
            baths = int(t_name[3])
            surface = round(random.uniform(30, 140), 2)
            price_uf = round(surface * p['avg_price_m2_uf'] * random.uniform(0.9, 1.1), 2)
            
            typ = {
                "project_id": p_id,
                "name": t_name,
                "bedrooms": beds,
                "bathrooms": baths,
                "surface_total": surface,
                "surface_indoor": surface * 0.85,
                "surface_terrace": surface * 0.15,
                "current_price_uf": price_uf,
                "price_per_m2_uf": round(price_uf / surface, 2),
                "stock": random.randint(1, 20),
                "total_units": random.randint(20, 50)
            }
            typologies_batch.append(typ)
    
    # Insert typologies
    if typologies_batch:
        try:
            supabase.table("project_typologies").insert(typologies_batch).execute()
            print(f"Inserted {len(typologies_batch)} typologies.")
        except Exception as e:
            print(f"Error inserting typologies: {e}")

if __name__ == "__main__":
    generate_mock_projects(50)
