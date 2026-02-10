"""
ETL Pipeline: TINSA CSV → Supabase

Importa datos reales de TINSA desde archivos CSV a Supabase.

Archivos soportados:
- tinsa_norte_sur.csv (101,658 registros)
- tinsa_rm.csv (500 registros)

Uso:
    # Preview
    python -m app.etl.import_tinsa --preview

    # Dry run (sin insertar)
    python -m app.etl.import_tinsa

    # Migración real
    python -m app.etl.import_tinsa --migrate
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import pandas as pd
import numpy as np
from datetime import datetime

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / ".env")

from supabase import create_client, Client

# Configuration
DATA_DIR = Path(__file__).parent.parent.parent / "data"
FILES = {
    "norte_sur": DATA_DIR / "tinsa_norte_sur.csv",
    "rm": DATA_DIR / "tinsa_rm.csv"
}
BATCH_SIZE = 50  # Smaller batches for safety

def get_supabase_client() -> Client:
    """Initialize Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL y SUPABASE_KEY deben estar en .env")
    
    return create_client(url, key)

def clean_numeric(value):
    """Clean numeric values with commas."""
    if pd.isna(value) or value == '-':
        return None
    if isinstance(value, (int, float)):
        return float(value)
    # Remove commas and convert
    try:
        return float(str(value).replace(',', '.').replace(' ', ''))
    except:
        return None

def clean_coordinates(lat, lon):
    """
    Clean and validate coordinates.
    TINSA uses different formats:
    - Sometimes comma as decimal: -33,4565
    - Sometimes comma as thousand separator: -7,014,442
    """
    try:
        if pd.isna(lat) or pd.isna(lon):
            return None, None
        
        lat_str = str(lat).strip()
        lon_str = str(lon).strip()
        
        # Count commas to determine format
        lat_commas = lat_str.count(',')
        lon_commas = lon_str.count(',')
        
        # If multiple commas, it's a thousand separator (remove them)
        if lat_commas > 1:
            lat_str = lat_str.replace(',', '')
        # If one comma, it's likely a decimal separator (replace with dot)
        elif lat_commas == 1:
            lat_str = lat_str.replace(',', '.')
        
        if lon_commas > 1:
            lon_str = lon_str.replace(',', '')
        elif lon_commas == 1:
            lon_str = lon_str.replace(',', '.')
        
        lat_clean = float(lat_str)
        lon_clean = float(lon_str)
        
        # Adjust if values are too large (missing decimal point)
        # Example: -7014442 should be around -7 to -20 (Northern Chile)
        if abs(lat_clean) > 100:
            # Determine how many digits to divide by
            lat_clean = lat_clean / (10 ** (len(str(int(abs(lat_clean)))) - 2))
        
        if abs(lon_clean) > 100:
            lon_clean = lon_clean / (10 ** (len(str(int(abs(lon_clean)))) - 2))
        
        # Validate ranges for Chile
        # Latitudes: -17 to -56 (north to south)
        # Longitudes: -66 to -75 (east to west)
        if -56 <= lat_clean <= -17 and -75 <= lon_clean <= -66:
            return round(lat_clean, 6), round(lon_clean, 6)
        
        # If still invalid, return None
        return None, None
    except Exception as e:
        return None, None

def map_tinsa_to_supabase(row, source_file="norte_sur") -> dict:
    """
    Transform TINSA row to Supabase schema.
    """
    try:
        # Clean coordinates
        lat, lon = clean_coordinates(row.get('LATITUD'), row.get('LONGITUD'))
        
        # Calculate units
        stock_inicial = int(row.get('STOCK INICIAL', 0)) if pd.notna(row.get('STOCK INICIAL')) else 0
        vendidas = int(row.get('UNIDADES VENDIDAS', 0)) if pd.notna(row.get('UNIDADES VENDIDAS')) else 0
        disponibles = int(row.get('OFERTA DISPONIBLE', 0)) if pd.notna(row.get('OFERTA DISPONIBLE')) else 0
        
        # If disponibles is 0, calculate from stock - vendidas
        if disponibles == 0 and stock_inicial > 0:
            disponibles = max(0, stock_inicial - vendidas)
        
        total_units = stock_inicial if stock_inicial > 0 else (vendidas + disponibles)
        
        # Prices
        precio_promedio = clean_numeric(row.get('PRECIO PROMEDIO'))
        precio_m2 = clean_numeric(row.get('UF/M² PROMEDIO'))
        precio_min = clean_numeric(row.get('PRECIO MINIMO UF'))
        precio_max = clean_numeric(row.get('PRECIO MAXIMO UF'))
        
        # Sales metrics
        velocidad_p = clean_numeric(row.get('UNIDADES/MES (P)'))
        velocidad_a = clean_numeric(row.get('UNIDADES/MES (A)'))
        mao = clean_numeric(row.get('MESES PARA AGOTAR STOCK (A)'))
        
        # Use actual velocity or calculate
        sales_speed = velocidad_a if velocidad_a else velocidad_p
        
        # Build address
        direccion = str(row.get('DIRECCION', '')).strip()
        numero = str(row.get('NUMERO', '')).strip()
        address = f"{direccion} {numero}".strip() if direccion else None
        
        project = {
            # Basic info
            "name": str(row.get('PROYECTO', 'Sin nombre')).strip(),
            "developer": str(row.get('DESARROLLADOR')).strip() if pd.notna(row.get('DESARROLLADOR')) else None,
            "commune": str(row.get('COMUNA_INCOIN')).strip() if pd.notna(row.get('COMUNA_INCOIN')) else None,
            "region": str(row.get('REGION', 'RM')).strip(),
            "address": address,
            
            # Location
            "latitude": lat,
            "longitude": lon,
            
            # Units
            "total_units": total_units,
            "sold_units": vendidas,
            "available_units": disponibles,
            
            # Prices
            "avg_price_uf": precio_promedio,
            "avg_price_m2_uf": precio_m2,
            "min_price_uf": precio_min,
            "max_price_uf": precio_max,
            
            # Sales metrics
            "sales_speed_monthly": sales_speed,
            "months_to_sell_out": mao,
            
            # Status
            "project_status": str(row.get('ESTADO PROYECTO')).strip() if pd.notna(row.get('ESTADO PROYECTO')) else None,
            "property_type": str(row.get('TIPO DE PROPIEDAD', 'DEPARTAMENTO')).strip(),
            "category": str(row.get('TIPO CATEGORIA')).strip() if pd.notna(row.get('TIPO CATEGORIA')) else None,
            
            # Additional
            "total_floors": int(row.get('NRO. PISOS', 0)) if pd.notna(row.get('NRO. PISOS')) else None,
        }
        
        return project
        
    except Exception as e:
        print(f"  ⚠️  Error transformando fila: {e}")
        return None

def preview_file(filepath: Path, limit: int = 10):
    """Preview CSV file."""
    if not filepath.exists():
        print(f"❌ Archivo no encontrado: {filepath}")
        return None
    
    print(f"\n📊 Previsualizando: {filepath.name}")
    print(f"{'='*80}\n")
    
    try:
        df = pd.read_csv(filepath, nrows=limit)
        print(f"✅ Columnas: {len(df.columns)}")
        print(f"✅ Filas en preview: {len(df)}")
        
        # Show first few rows
        print(f"\n📋 Primeras {min(3, len(df))} filas:")
        print(df.head(3)[['PROYECTO', 'COMUNA_INCOIN', 'PRECIO PROMEDIO', 'STOCK INICIAL']].to_string())
        
        # Get total count
        df_full = pd.read_csv(filepath, low_memory=False)
        print(f"\n✅ Total de filas en archivo: {len(df_full):,}")
        
        return df
    except Exception as e:
        print(f"❌ Error al leer archivo: {e}")
        return None

def migrate_file(filepath: Path, dry_run: bool = True):
    """Migrate a single CSV file."""
    if not filepath.exists():
        print(f"❌ Archivo no encontrado: {filepath}")
        return 0, 0
    
    print(f"\n{'='*80}")
    print(f"📄 Procesando: {filepath.name}")
    print(f"{'='*80}\n")
    
    try:
        # Read CSV
        print(f"📖 Leyendo archivo...")
        df = pd.read_csv(filepath, low_memory=False)
        print(f"✅ Cargadas {len(df):,} filas")
        
        # Transform data
        print(f"\n🔄 Transformando datos...")
        projects = []
        skipped = 0
        
        for idx, row in df.iterrows():
            project = map_tinsa_to_supabase(row, source_file=filepath.stem)
            
            if project and project.get('name') and project.get('commune'):
                projects.append(project)
            else:
                skipped += 1
            
            # Progress indicator
            if (idx + 1) % 10000 == 0:
                print(f"  Procesadas {idx + 1:,} filas...")
        
        print(f"✅ Transformados {len(projects):,} proyectos")
        if skipped > 0:
            print(f"⚠️  Omitidas {skipped:,} filas (falta nombre o comuna)")
        
        # Deduplicate projects (TINSA has multiple rows per project)
        print(f"\n🔄 Deduplicando proyectos...")
        projects_dict = {}
        
        for project in projects:
            key = (project['name'], project['commune'])
            
            if key not in projects_dict:
                projects_dict[key] = project
            else:
                # Merge data: keep most recent/complete values
                existing = projects_dict[key]
                
                # Update with non-null values
                for field, value in project.items():
                    if value is not None and (existing.get(field) is None or field in ['sold_units', 'available_units']):
                        # For units, take the maximum (most recent data)
                        if field in ['sold_units', 'available_units', 'total_units']:
                            existing[field] = max(existing.get(field, 0) or 0, value or 0)
                        else:
                            existing[field] = value
        
        projects_unique = list(projects_dict.values())
        print(f"✅ Proyectos únicos: {len(projects_unique):,} (de {len(projects):,} filas)")
        
        if dry_run:
            print(f"\n⚠️  Modo DRY RUN - No se insertarán datos")
            print(f"\n📊 Muestra de datos transformados:")
            if projects_unique:
                sample = projects_unique[0]
                for key, value in list(sample.items())[:10]:
                    print(f"  {key}: {value}")
            return len(projects_unique), 0
        
        # Insert in batches
        print(f"\n💾 Insertando en Supabase...")
        supabase = get_supabase_client()
        inserted_count = 0
        errors = 0
        
        for i in range(0, len(projects_unique), BATCH_SIZE):
            batch = projects_unique[i:i + BATCH_SIZE]
            try:
                supabase.table("projects").upsert(
                    batch,
                    on_conflict="name,commune"
                ).execute()
                inserted_count += len(batch)
                
                # Progress
                if inserted_count % 500 == 0 or inserted_count == len(projects_unique):
                    print(f"  ✅ Insertados {inserted_count:,}/{len(projects_unique):,} proyectos...")
                    
            except Exception as e:
                errors += 1
                print(f"  ⚠️  Error en batch {i//BATCH_SIZE + 1}: {str(e)[:100]}")
        
        print(f"\n✅ Completado: {inserted_count:,} proyectos insertados")
        if errors > 0:
            print(f"⚠️  Errores: {errors} batches")
        
        return inserted_count, errors
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        import traceback
        traceback.print_exc()
        return 0, 1

def main(preview_only=False, dry_run=True):
    """Main migration function."""
    print("🚀 Importación de Datos TINSA → Supabase")
    print(f"{'='*80}\n")
    
    if preview_only:
        for name, filepath in FILES.items():
            preview_file(filepath, limit=10)
        return
    
    total_inserted = 0
    total_errors = 0
    
    # Process each file
    for name, filepath in FILES.items():
        if filepath.exists():
            inserted, errors = migrate_file(filepath, dry_run=dry_run)
            total_inserted += inserted
            total_errors += errors
    
    # Summary
    print(f"\n{'='*80}")
    print(f"📊 RESUMEN FINAL")
    print(f"{'='*80}")
    print(f"✅ Total proyectos procesados: {total_inserted:,}")
    if total_errors > 0:
        print(f"⚠️  Total errores: {total_errors}")
    
    if dry_run:
        print(f"\n💡 Para ejecutar la migración real:")
        print(f"   python -m app.etl.import_tinsa --migrate")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Importar datos TINSA a Supabase")
    parser.add_argument("--migrate", action="store_true", help="Ejecutar migración real")
    parser.add_argument("--preview", action="store_true", help="Solo mostrar preview")
    
    args = parser.parse_args()
    
    main(preview_only=args.preview, dry_run=not args.migrate)
