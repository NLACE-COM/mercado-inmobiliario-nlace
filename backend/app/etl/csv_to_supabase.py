"""
ETL Pipeline: CSV (TINSA Export) → Supabase

Este script importa datos desde un archivo CSV exportado de BigQuery.

Uso:
    1. Exporta la tabla desde BigQuery a CSV
    2. Guarda el CSV en: backend/data/tinsa_export.csv
    3. Ejecuta: python -m app.etl.csv_to_supabase
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import pandas as pd

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / ".env")

from supabase import create_client, Client

# Configuration
CSV_PATH = Path(__file__).parent.parent.parent / "data" / "tinsa_export.csv"
BATCH_SIZE = 100

def get_supabase_client() -> Client:
    """Initialize Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL y SUPABASE_KEY deben estar en .env")
    
    return create_client(url, key)

def preview_csv(limit: int = 10):
    """Preview CSV data."""
    if not CSV_PATH.exists():
        print(f"❌ Archivo no encontrado: {CSV_PATH}")
        print(f"\n📝 Pasos para exportar desde BigQuery:")
        print(f"1. En BigQuery, haz click en la tabla")
        print(f"2. Click en 'EXPORTAR' → 'Exportar a CSV'")
        print(f"3. Descarga el archivo")
        print(f"4. Guárdalo como: {CSV_PATH}")
        return None
    
    print(f"\n📊 Previsualizando {limit} registros del CSV...\n")
    
    try:
        # Try different encodings
        for encoding in ['utf-8', 'latin-1', 'iso-8859-1']:
            try:
                df = pd.read_csv(CSV_PATH, encoding=encoding, nrows=limit)
                print(f"✅ Archivo leído correctamente (encoding: {encoding})")
                break
            except UnicodeDecodeError:
                continue
        else:
            df = pd.read_csv(CSV_PATH, nrows=limit)
        
        print(f"\n📋 Columnas disponibles ({len(df.columns)}):")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i:2d}. {col}")
        
        print(f"\n📊 Primeras {min(limit, len(df))} filas:")
        print(df.head(limit).to_string())
        
        print(f"\n✅ Total de filas en preview: {len(df)}")
        
        # Get total count
        df_full = pd.read_csv(CSV_PATH)
        print(f"✅ Total de filas en archivo: {len(df_full):,}")
        
        return df
    except Exception as e:
        print(f"❌ Error al leer CSV: {e}")
        return None

def map_tinsa_to_supabase(df: pd.DataFrame) -> list:
    """
    Transform TINSA CSV data to match Supabase schema.
    
    IMPORTANTE: Ajustar los nombres de columnas según el CSV real.
    """
    projects = []
    
    print(f"\n🔄 Transformando {len(df)} registros...")
    
    for idx, row in df.iterrows():
        try:
            # TODO: Ajustar estos nombres según las columnas reales del CSV
            # Usa el preview para ver los nombres exactos
            
            project = {
                # Campos básicos - AJUSTAR NOMBRES
                "name": str(row.get("nombre_proyecto", row.get("proyecto", f"Proyecto {idx}"))),
                "developer": str(row.get("inmobiliaria", row.get("desarrolladora", None))) if pd.notna(row.get("inmobiliaria", row.get("desarrolladora"))) else None,
                "commune": str(row.get("comuna", None)) if pd.notna(row.get("comuna")) else None,
                "region": str(row.get("region", "RM")) if pd.notna(row.get("region")) else "RM",
                "address": str(row.get("direccion", None)) if pd.notna(row.get("direccion")) else None,
                
                # Ubicación - AJUSTAR NOMBRES
                "latitude": float(row.get("latitud", row.get("lat", None))) if pd.notna(row.get("latitud", row.get("lat"))) else None,
                "longitude": float(row.get("longitud", row.get("lon", row.get("lng", None)))) if pd.notna(row.get("longitud", row.get("lon", row.get("lng")))) else None,
                
                # Unidades - AJUSTAR NOMBRES
                "total_units": int(row.get("total_unidades", row.get("unidades_totales", 0))) if pd.notna(row.get("total_unidades", row.get("unidades_totales"))) else 0,
                "sold_units": int(row.get("unidades_vendidas", row.get("vendidas", 0))) if pd.notna(row.get("unidades_vendidas", row.get("vendidas"))) else 0,
                "available_units": int(row.get("unidades_disponibles", row.get("disponibles", 0))) if pd.notna(row.get("unidades_disponibles", row.get("disponibles"))) else 0,
                
                # Precios - AJUSTAR NOMBRES
                "avg_price_uf": float(row.get("precio_promedio_uf", row.get("precio_uf", None))) if pd.notna(row.get("precio_promedio_uf", row.get("precio_uf"))) else None,
                "avg_price_m2_uf": float(row.get("precio_m2_uf", row.get("uf_m2", None))) if pd.notna(row.get("precio_m2_uf", row.get("uf_m2"))) else None,
                
                # Estado - AJUSTAR NOMBRES
                "project_status": str(row.get("estado", row.get("estado_proyecto", None))) if pd.notna(row.get("estado", row.get("estado_proyecto"))) else None,
                "property_type": str(row.get("tipo_propiedad", "Departamento")) if pd.notna(row.get("tipo_propiedad")) else "Departamento",
            }
            
            # Validación básica: al menos debe tener nombre y comuna
            if project["name"] and project["commune"]:
                projects.append(project)
            else:
                print(f"  ⚠️  Fila {idx} omitida: falta nombre o comuna")
                
        except Exception as e:
            print(f"  ⚠️  Error en fila {idx}: {e}")
            continue
    
    print(f"✅ Transformados {len(projects)} proyectos válidos")
    return projects

def migrate_from_csv(dry_run: bool = True):
    """
    Main migration function from CSV.
    
    Args:
        dry_run: If True, only preview data without inserting
    """
    print("🚀 Iniciando importación CSV → Supabase\n")
    
    if not CSV_PATH.exists():
        print(f"❌ Archivo no encontrado: {CSV_PATH}")
        print(f"\n📝 Crea la carpeta y coloca el archivo:")
        print(f"   mkdir -p {CSV_PATH.parent}")
        print(f"   # Luego copia tu CSV exportado a: {CSV_PATH}")
        return
    
    # Preview
    preview_df = preview_csv(limit=5)
    if preview_df is None:
        return
    
    if dry_run:
        print("\n⚠️  Modo DRY RUN activado. No se insertarán datos.")
        print("\n📝 Pasos siguientes:")
        print("1. Revisa las columnas mostradas arriba")
        print("2. Edita la función map_tinsa_to_supabase() en este archivo")
        print("3. Ajusta los nombres de columnas según tu CSV")
        print("4. Ejecuta: python -m app.etl.csv_to_supabase --migrate")
        return
    
    # Full migration
    print(f"\n🔄 Iniciando migración completa...")
    
    try:
        # Read full CSV
        df = pd.read_csv(CSV_PATH)
        print(f"✅ CSV cargado: {len(df):,} registros")
        
        # Transform data
        projects = map_tinsa_to_supabase(df)
        
        if not projects:
            print("❌ No se generaron proyectos válidos. Revisa el mapeo.")
            return
        
        # Insert in batches
        supabase = get_supabase_client()
        inserted_count = 0
        errors = 0
        
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
                errors += 1
                print(f"  ⚠️  Error en batch {i//BATCH_SIZE + 1}: {e}")
        
        print(f"\n🎉 Migración completada:")
        print(f"   ✅ Insertados: {inserted_count} proyectos")
        if errors > 0:
            print(f"   ⚠️  Errores: {errors} batches")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Importar CSV de TINSA a Supabase")
    parser.add_argument("--migrate", action="store_true", help="Ejecutar migración real (sin dry-run)")
    parser.add_argument("--preview", action="store_true", help="Solo mostrar preview del CSV")
    
    args = parser.parse_args()
    
    if args.preview:
        preview_csv(limit=20)
    else:
        migrate_from_csv(dry_run=not args.migrate)
