"""
ETL Pipeline: BigQuery (TINSA) → Supabase

Este script migra datos desde Google BigQuery a Supabase.

Requisitos:
1. Credenciales de Google Cloud (JSON key file)
2. Variables de entorno configuradas en .env

Uso:
    python -m app.etl.bigquery_to_supabase
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / ".env")

try:
    from google.cloud import bigquery
    import pandas as pd
except ImportError:
    print("❌ Error: Faltan dependencias requeridas.")
    print("\nInstala las dependencias con:")
    print("  .venv/bin/pip install google-cloud-bigquery pandas db-dtypes")
    sys.exit(1)

from supabase import create_client, Client

# Configuration
PROJECT_ID = "my-project-wap-486916"
DATASET_ID = "BBDDTINSATables"
TABLE_ID = "BBDDTINSA_PYTO_CENTROcsv_1770655119181"
BATCH_SIZE = 100  # Number of records to insert at once

def get_bigquery_client():
    """Initialize BigQuery client with credentials."""
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    if not credentials_path:
        print("⚠️  GOOGLE_APPLICATION_CREDENTIALS no está configurado.")
        print("\nPara configurarlo:")
        print("1. Descarga el JSON de credenciales desde Google Cloud Console")
        print("2. Guárdalo en: backend/credentials/gcp-key.json")
        print("3. Agrega a backend/.env:")
        print('   GOOGLE_APPLICATION_CREDENTIALS="./credentials/gcp-key.json"')
        return None
    
    if not Path(credentials_path).exists():
        print(f"❌ Archivo de credenciales no encontrado: {credentials_path}")
        return None
    
    return bigquery.Client(project=PROJECT_ID)

def get_supabase_client() -> Client:
    """Initialize Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL y SUPABASE_KEY deben estar en .env")
    
    return create_client(url, key)

def preview_bigquery_data(client: bigquery.Client, limit: int = 5):
    """Preview data from BigQuery table."""
    query = f"""
    SELECT *
    FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
    LIMIT {limit}
    """
    
    print(f"\n📊 Previsualizando {limit} registros de BigQuery...\n")
    
    try:
        df = client.query(query).to_dataframe()
        print(df.head())
        print(f"\n✅ Columnas disponibles: {list(df.columns)}")
        print(f"✅ Total de filas en preview: {len(df)}")
        return df
    except Exception as e:
        print(f"❌ Error al consultar BigQuery: {e}")
        return None

def get_table_schema(client: bigquery.Client):
    """Get schema information from BigQuery table."""
    table_ref = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"
    
    try:
        table = client.get_table(table_ref)
        print(f"\n📋 Esquema de la tabla BigQuery:\n")
        for field in table.schema:
            print(f"  - {field.name}: {field.field_type}")
        print(f"\n✅ Total de filas: {table.num_rows:,}")
        return table.schema, table.num_rows
    except Exception as e:
        print(f"❌ Error al obtener esquema: {e}")
        return None, 0

def map_tinsa_to_supabase(df: pd.DataFrame) -> list:
    """
    Transform TINSA data to match Supabase schema.
    
    Esta función debe ser personalizada según los campos reales de TINSA.
    """
    projects = []
    
    # TODO: Mapear campos reales de TINSA a nuestro esquema
    # Ejemplo de mapeo (ajustar según campos reales):
    
    for _, row in df.iterrows():
        project = {
            # Campos básicos
            "name": row.get("nombre_proyecto", "Sin nombre"),
            "developer": row.get("inmobiliaria", None),
            "commune": row.get("comuna", None),
            "region": row.get("region", "RM"),
            "address": row.get("direccion", None),
            
            # Ubicación
            "latitude": row.get("latitud", None),
            "longitude": row.get("longitud", None),
            
            # Unidades
            "total_units": int(row.get("total_unidades", 0)) if pd.notna(row.get("total_unidades")) else 0,
            "sold_units": int(row.get("unidades_vendidas", 0)) if pd.notna(row.get("unidades_vendidas")) else 0,
            "available_units": int(row.get("unidades_disponibles", 0)) if pd.notna(row.get("unidades_disponibles")) else 0,
            
            # Precios
            "avg_price_uf": float(row.get("precio_promedio_uf", 0)) if pd.notna(row.get("precio_promedio_uf")) else None,
            "avg_price_m2_uf": float(row.get("precio_m2_uf", 0)) if pd.notna(row.get("precio_m2_uf")) else None,
            
            # Estado
            "project_status": row.get("estado", None),
            "property_type": row.get("tipo_propiedad", "Departamento"),
        }
        
        projects.append(project)
    
    return projects

def migrate_data(dry_run: bool = True):
    """
    Main migration function.
    
    Args:
        dry_run: If True, only preview data without inserting
    """
    print("🚀 Iniciando migración BigQuery → Supabase\n")
    
    # Initialize clients
    bq_client = get_bigquery_client()
    if not bq_client:
        return
    
    supabase = get_supabase_client()
    
    # Get schema info
    schema, total_rows = get_table_schema(bq_client)
    if not schema:
        return
    
    # Preview data
    preview_df = preview_bigquery_data(bq_client, limit=10)
    if preview_df is None:
        return
    
    if dry_run:
        print("\n⚠️  Modo DRY RUN activado. No se insertarán datos.")
        print("\nPara ejecutar la migración real, ejecuta:")
        print("  python -m app.etl.bigquery_to_supabase --migrate")
        return
    
    # Full migration
    print(f"\n🔄 Iniciando migración de {total_rows:,} registros...")
    
    query = f"SELECT * FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`"
    
    try:
        df = bq_client.query(query).to_dataframe()
        print(f"✅ Datos extraídos: {len(df)} registros")
        
        # Transform data
        projects = map_tinsa_to_supabase(df)
        print(f"✅ Datos transformados: {len(projects)} proyectos")
        
        # Insert in batches
        inserted_count = 0
        for i in range(0, len(projects), BATCH_SIZE):
            batch = projects[i:i + BATCH_SIZE]
            try:
                supabase.table("projects").upsert(
                    batch, 
                    on_conflict="name,commune"
                ).execute()
                inserted_count += len(batch)
                print(f"  ✅ Insertados {inserted_count}/{len(projects)} proyectos...")
            except Exception as e:
                print(f"  ⚠️  Error en batch {i}: {e}")
        
        print(f"\n🎉 Migración completada: {inserted_count} proyectos insertados")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrar datos de BigQuery a Supabase")
    parser.add_argument("--migrate", action="store_true", help="Ejecutar migración real (sin dry-run)")
    parser.add_argument("--preview", action="store_true", help="Solo mostrar preview de datos")
    
    args = parser.parse_args()
    
    if args.preview:
        bq_client = get_bigquery_client()
        if bq_client:
            get_table_schema(bq_client)
            preview_bigquery_data(bq_client, limit=20)
    else:
        migrate_data(dry_run=not args.migrate)
