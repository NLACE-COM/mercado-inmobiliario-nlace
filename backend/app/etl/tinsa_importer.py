"""
ETL Pipeline: TINSA CSV → Supabase

Imports real TINSA data from CSV files exported from BigQuery.
Handles Chilean number formatting, coordinate fixes, and project/typology grouping.

TINSA CSVs have one row per PROJECT + TYPOLOGY + PERIOD combination.
This script:
  1. Reads CSV with proper encoding and Chilean number parsing
  2. Groups rows by project (PROYECTO + COMUNA_INCOIN) for the latest period
  3. Inserts/updates projects table (one row per project)
  4. Inserts typology-level data into project_typologies
  5. Stores historical snapshots in project_metrics_history

Usage:
    python -m app.etl.tinsa_importer --preview            # See columns and sample data
    python -m app.etl.tinsa_importer --file data/tinsa_norte_sur.csv  # Dry-run
    python -m app.etl.tinsa_importer --file data/tinsa_norte_sur.csv --migrate  # Real import
"""
from __future__ import annotations

import os
import sys
import re
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
import pandas as pd
import numpy as np

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / ".env")

from supabase import create_client, Client

# Configuration
BATCH_SIZE = 50
DEFAULT_FILES = [
    Path(__file__).parent.parent.parent / "data" / "tinsa_norte_sur.csv",
    Path(__file__).parent.parent.parent / "data" / "tinsa_rm.csv",
]


def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL y SUPABASE_KEY deben estar en backend/.env")
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Number parsing helpers (Chilean locale: dot=thousands, comma=decimal)
# ---------------------------------------------------------------------------

def parse_chilean_number(value) -> float | None:
    """Parse a number in Chilean format: 4.250,0 → 4250.0"""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    s = str(value).strip()
    if s in ("-", "", "nan", "None", "NaN"):
        return None
    # Remove dots (thousands), replace comma with period (decimal)
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def parse_chilean_int(value) -> int | None:
    n = parse_chilean_number(value)
    if n is None:
        return None
    return int(round(n))


def parse_percentage(value) -> float | None:
    """Parse '5%' or '0%' → 5.0 or 0.0"""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    s = str(value).strip().replace("%", "").replace(",", ".")
    if s in ("-", "", "nan"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_boolean(value) -> bool | None:
    """Parse 'SI'/'NO'/'-' → True/False/None"""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    s = str(value).strip().upper()
    if s == "SI":
        return True
    if s == "NO":
        return False
    return None


def parse_date(value) -> str | None:
    """Try to parse various date formats from TINSA."""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    s = str(value).strip()
    if s in ("-", "", "nan"):
        return None

    # Try "01-07-2015" format
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue

    # Try "diciembre-2017", "marzo-2024" etc.
    months_es = {
        "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
        "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
        "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
    }
    s_lower = s.lower()
    for month_name, month_num in months_es.items():
        if month_name in s_lower:
            year_match = re.search(r"(\d{4})", s)
            if year_match:
                year = int(year_match.group(1))
                return f"{year}-{month_num:02d}-01"

    return None


def fix_coordinates(lat_raw, lon_raw) -> tuple[float | None, float | None]:
    """
    Fix TINSA coordinate issues.
    TINSA data often has:
    - Swapped lat/lon columns
    - Chilean decimal format (comma)
    - Missing decimal points
    """
    lat = parse_chilean_number(lat_raw)
    lon = parse_chilean_number(lon_raw)

    if lat is None or lon is None:
        return None, None

    # TINSA sometimes stores coordinates without proper decimal placement
    # For Chile: lat should be roughly -17 to -56, lon should be roughly -66 to -76

    # If values are way out of range, try dividing to find decimal position
    for divisor in (1, 10, 100, 1000, 10000, 100000):
        test_lat = lat / divisor
        test_lon = lon / divisor
        if -60 <= test_lat <= -15 and -80 <= test_lon <= -60:
            return round(test_lat, 6), round(test_lon, 6)

    # Maybe they're swapped
    for divisor in (1, 10, 100, 1000, 10000, 100000):
        test_lat = lon / divisor  # swap
        test_lon = lat / divisor  # swap
        if -60 <= test_lat <= -15 and -80 <= test_lon <= -60:
            return round(test_lat, 6), round(test_lon, 6)

    # Can't fix, return None
    return None, None


# ---------------------------------------------------------------------------
# CSV reading
# ---------------------------------------------------------------------------

def read_tinsa_csv(file_path: Path, nrows: int | None = None) -> pd.DataFrame:
    """Read a TINSA CSV with proper encoding detection."""
    encodings = ["utf-8", "latin-1", "iso-8859-1", "cp1252"]
    separators = ["\t", ",", ";"]

    for enc in encodings:
        for sep in separators:
            try:
                df = pd.read_csv(
                    file_path,
                    encoding=enc,
                    sep=sep,
                    nrows=nrows,
                    dtype=str,  # Read everything as string first
                    na_values=["-", "nan", "NaN", ""],
                    keep_default_na=True,
                )
                # Valid if we have more than 5 columns (not all in one column)
                if len(df.columns) > 5:
                    print(f"  CSV leido: encoding={enc}, sep={'TAB' if sep == chr(9) else sep}")
                    return df
            except (UnicodeDecodeError, pd.errors.ParserError):
                continue

    raise ValueError(f"No se pudo leer {file_path} con ninguna combinación de encoding/separador")


def preview_csv(file_path: Path):
    """Show CSV structure and sample data."""
    print(f"\n{'='*70}")
    print(f"  PREVIEW: {file_path.name}")
    print(f"{'='*70}")

    if not file_path.exists():
        print(f"  Archivo no encontrado: {file_path}")
        return

    # Read sample
    df = read_tinsa_csv(file_path, nrows=5)

    print(f"\n  Columnas ({len(df.columns)}):")
    for i, col in enumerate(df.columns, 1):
        sample = df[col].dropna().iloc[0] if not df[col].dropna().empty else "(vacío)"
        print(f"    {i:2d}. {col:<40s} → {str(sample)[:50]}")

    # Count total rows
    df_count = read_tinsa_csv(file_path)
    total = len(df_count)
    projects = df_count["PROYECTO"].nunique() if "PROYECTO" in df_count.columns else "?"
    communes = df_count["COMUNA_INCOIN"].nunique() if "COMUNA_INCOIN" in df_count.columns else "?"
    periods = df_count["PERIODO"].unique().tolist() if "PERIODO" in df_count.columns else []

    print(f"\n  Total filas:       {total:,}")
    print(f"  Proyectos unicos:  {projects}")
    print(f"  Comunas:           {communes}")
    print(f"  Periodos:          {periods}")

    # Coordinate sample
    if "LATITUD" in df_count.columns and "LONGITUD" in df_count.columns:
        sample_coords = df_count[["LATITUD", "LONGITUD"]].dropna().head(3)
        print(f"\n  Muestra coordenadas (raw):")
        for _, row in sample_coords.iterrows():
            lat, lon = fix_coordinates(row["LATITUD"], row["LONGITUD"])
            print(f"    RAW: lat={row['LATITUD']}, lon={row['LONGITUD']}  →  FIXED: lat={lat}, lon={lon}")


# ---------------------------------------------------------------------------
# Data transformation
# ---------------------------------------------------------------------------

def transform_projects(df: pd.DataFrame) -> tuple[list[dict], list[dict]]:
    """
    Transform TINSA rows into projects and typologies.

    Since each CSV row = one typology in one period for one project,
    we group by (PROYECTO, COMUNA_INCOIN) and take the latest period.

    Returns: (projects_list, typologies_list)
    """
    # Determine the latest period per project
    # Sort so latest data wins: higher year + later period (2P > 1P)
    df["_year"] = pd.to_numeric(df["AÑO"], errors="coerce").fillna(0).astype(int)
    df["_period_sort"] = df["PERIODO"].map(lambda x: int(str(x)[0]) if str(x) and str(x).strip() and str(x).strip()[0].isdigit() else 0)
    df = df.sort_values(["_year", "_period_sort"], ascending=[False, False])

    # Group by project identity
    grouped = df.groupby(["PROYECTO", "COMUNA_INCOIN"], sort=False)

    projects = []
    typologies = []
    skipped = 0

    for (project_name, commune), group in grouped:
        if not project_name or not commune or str(project_name) == "nan":
            skipped += 1
            continue

        # Take latest period row(s) for this project
        latest_year = group["_year"].iloc[0]
        latest_period = group["PERIODO"].iloc[0]
        latest_rows = group[
            (group["_year"] == latest_year) & (group["PERIODO"] == latest_period)
        ]

        # Use first row for project-level data
        row = latest_rows.iloc[0]

        # Parse coordinates
        lat, lon = fix_coordinates(row.get("LATITUD"), row.get("LONGITUD"))

        # Aggregate units across typologies in the same period
        total_stock = sum(parse_chilean_int(r.get("STOCK INICIAL", r.get("STOCK INICIAL (PERIODO)"))) or 0 for _, r in latest_rows.iterrows())
        total_available = sum(parse_chilean_int(r.get("OFERTA DISPONIBLE (PERIODO)", r.get("OFERTA DISPONIBLE"))) or 0 for _, r in latest_rows.iterrows())
        total_sold = sum(parse_chilean_int(r.get("UNIDADES VENDIDAS (PERIODO)", r.get("UNIDADES VENDIDAS"))) or 0 for _, r in latest_rows.iterrows())
        total_offer = sum(parse_chilean_int(r.get("OFERTA DEL PERIODO", r.get("OFERTA DEL PERIODO"))) or 0 for _, r in latest_rows.iterrows())

        # Average velocity across typologies
        velocities_a = [parse_chilean_number(r.get("UNIDADES/MES (AÑO)", r.get("UNIDADES/MES (A)"))) for _, r in latest_rows.iterrows()]
        velocities_a = [v for v in velocities_a if v is not None and v > 0]
        avg_velocity_a = sum(velocities_a) / len(velocities_a) if velocities_a else None

        velocities_p = [parse_chilean_number(r.get("UNIDADES/MES (PERIODO)", r.get("UNIDADES/MES (P)"))) for _, r in latest_rows.iterrows()]
        velocities_p = [v for v in velocities_p if v is not None and v > 0]
        avg_velocity_p = sum(velocities_p) / len(velocities_p) if velocities_p else None

        # Price range across typologies
        all_min_prices = [parse_chilean_number(r.get("PRECIO MINIMO UF")) for _, r in latest_rows.iterrows()]
        all_max_prices = [parse_chilean_number(r.get("PRECIO MAXIMO UF")) for _, r in latest_rows.iterrows()]
        all_avg_prices = [parse_chilean_number(r.get("PRECIO PROMEDIO")) for _, r in latest_rows.iterrows()]
        all_uf_m2 = [parse_chilean_number(r.get("UF/M² PROMEDIO")) for _, r in latest_rows.iterrows()]

        min_prices = [p for p in all_min_prices if p is not None and p > 0]
        max_prices = [p for p in all_max_prices if p is not None and p > 0]
        avg_prices = [p for p in all_avg_prices if p is not None and p > 0]
        uf_m2_vals = [p for p in all_uf_m2 if p is not None and p > 0]

        project = {
            "name": str(project_name).strip(),
            "commune": str(commune).strip(),
            "region": str(row.get("REGION", "")).strip() or None,
            "zona": str(row.get("ZONA", "")).strip() or None,
            "address": str(row.get("DIRECCION", "")).strip() or None,
            "street_number": str(row.get("NUMERO", "")).strip() or None,
            "developer": str(row.get("DESARROLLADOR", "")).strip() or None,
            "seller": str(row.get("VENDE", "")).strip() or None,
            "builder": str(row.get("CONSTRUYE", "")).strip() or None,
            "property_type": str(row.get("TIPO DE PROPIEDAD", "")).strip() or None,
            "category": str(row.get("TIPO CATEGORIA", "")).strip() or None,
            "project_status": str(row.get("ESTADO PROYECTO (PERIODO)", row.get("ESTADO PROYECTO", ""))).strip() or None,
            "construction_status": str(row.get("ESTADO OBRA (PERIODO)", row.get("ESTADO OBRA", ""))).strip() or None,
            "latitude": lat,
            "longitude": lon,
            # Period tracking
            "year": int(latest_year) if latest_year else None,
            "period": str(latest_period).strip() if latest_period else None,
            # Dates
            "sales_start_date": parse_date(row.get("INICIO VENTAS")),
            "delivery_date": parse_date(row.get("FECHA ENTREGA ESTIMADA")),
            # Units (aggregated across typologies)
            "initial_stock": total_stock if total_stock > 0 else None,
            "total_units": total_stock if total_stock > 0 else None,
            "available_units": total_available,
            "sold_units": total_sold,
            "period_offer": total_offer if total_offer > 0 else None,
            # Velocity
            "sales_speed_monthly": round(avg_velocity_a, 2) if avg_velocity_a else None,
            "velocity_projected": round(avg_velocity_p, 2) if avg_velocity_p else None,
            "months_to_sell_out": parse_chilean_number(row.get("MESES PARA AGOTAR STOCK (PERIODO)", row.get("MESES PARA AGOTAR STOCK (A)"))),
            "months_on_sale": parse_chilean_number(row.get("MESES EN VENTA (PERIODO)", row.get("MESES EN VENTA"))),
            # Prices (range across typologies)
            "min_price_uf": min(min_prices) if min_prices else None,
            "max_price_uf": max(max_prices) if max_prices else None,
            "avg_price_uf": round(sum(avg_prices) / len(avg_prices), 2) if avg_prices else None,
            "avg_price_m2_uf": round(sum(uf_m2_vals) / len(uf_m2_vals), 2) if uf_m2_vals else None,
            # Building
            "total_floors": parse_chilean_int(row.get("NRO. PISOS")),
            "total_apartments": total_stock if total_stock > 0 else None,
            # Extras
            "parking_count": parse_chilean_int(row.get("CANT ESTACIONAMIENTOS")),
            "parking_price": parse_chilean_number(row.get("PRECIO ESTACIONAMIENTO")),
            "storage_price": parse_chilean_number(row.get("PRECIO BODEGA")),
            "pilot_available": parse_boolean(row.get("PILOTO DISPONIBLE")),
            "sales_room": parse_boolean(row.get("SALA DE VENTAS EN EL PROYECTO")),
            "discount_percentage": parse_percentage(row.get("DESCUENTO PROMEDIO")),
            "subsidy_type": str(row.get("TIPO DE SUBSIDIO", "")).strip() or None,
        }

        # Clean None strings
        for k, v in project.items():
            if isinstance(v, str) and v.lower() in ("nan", "none", ""):
                project[k] = None

        projects.append(project)

        # Build typologies for this project
        for _, trow in latest_rows.iterrows():
            typ_code = str(trow.get("TIPOLOGIA", "")).strip()
            if not typ_code or typ_code == "nan":
                continue

            # Parse bedrooms/bathrooms from typology code like "1D-1B", "2D-2B"
            beds, baths = None, None
            typ_match = re.match(r"(\d+)D[+-](\d+)B", typ_code)
            if typ_match:
                beds = int(typ_match.group(1))
                baths = int(typ_match.group(2))

            surface = parse_chilean_number(trow.get("SUPERFICIE PROMEDIO"))
            terrace = parse_chilean_number(trow.get("SUP TERRAZA PROMEDIO"))

            typ = {
                "_project_name": str(project_name).strip(),
                "_project_commune": str(commune).strip(),
                "name": str(trow.get("NOMBRE TIPOLOGIA", "")).strip() or typ_code,
                "typology_code": typ_code,
                "bedrooms": beds,
                "bathrooms": baths,
                "surface_total": surface,
                "surface_indoor": round(surface - terrace, 2) if surface and terrace else surface,
                "surface_terrace": terrace,
                "land_surface": parse_chilean_number(trow.get("SUPERFICIE TERRENO")),
                "kitchen_type": str(trow.get("TIPO DE COCINA", "")).strip() or None,
                "parking_spots": parse_chilean_int(trow.get("PLAZAS")),
                "avg_price_uf": parse_chilean_number(trow.get("PRECIO PROMEDIO")),
                "price_per_m2_uf": parse_chilean_number(trow.get("UF/M² PROMEDIO")),
                "min_price_uf": parse_chilean_number(trow.get("PRECIO MINIMO UF")),
                "max_price_uf": parse_chilean_number(trow.get("PRECIO MAXIMO UF")),
                "current_price_uf": parse_chilean_number(trow.get("PRECIO PROMEDIO")),
                "stock": parse_chilean_int(trow.get("OFERTA DISPONIBLE (PERIODO)", trow.get("OFERTA DISPONIBLE"))),
                "total_units": parse_chilean_int(trow.get("STOCK INICIAL (PERIODO)", trow.get("STOCK INICIAL"))),
            }

            # Clean
            for k, v in typ.items():
                if isinstance(v, str) and v.lower() in ("nan", "none", ""):
                    typ[k] = None

            typologies.append(typ)

    print(f"  Proyectos: {len(projects)}, Tipologías: {len(typologies)}, Omitidos: {skipped}")
    return projects, typologies


# ---------------------------------------------------------------------------
# Database operations
# ---------------------------------------------------------------------------

from collections import defaultdict

def insert_projects(supabase: Client, projects: list[dict]) -> dict[str, str]:
    """Insert projects and return mapping of (name, commune) → id."""
    project_ids = {}
    inserted = 0
    errors = 0

    # Group by shape (keys) to allow batch insert of dicts without None values
    groups = defaultdict(list)
    for p in projects:
        clean_p = {k: v for k, v in p.items() if v is not None and not (isinstance(v, str) and v.lower() in ("nan", "none", ""))}
        shape = tuple(sorted(clean_p.keys()))
        groups[shape].append(clean_p)

    for shape, items in groups.items():
        for i in range(0, len(items), BATCH_SIZE):
            batch = items[i:i + BATCH_SIZE]
            try:
                res = supabase.table("projects").upsert(
                    batch,
                    on_conflict="name,commune"
                ).execute()
                if res.data:
                    for p in res.data:
                        project_ids[(p["name"], p["commune"])] = p["id"]
                    inserted += len(res.data)
            except Exception as e:
                errors += 1
                # Try one by one for this batch
                for proj in batch:
                    try:
                        res = supabase.table("projects").upsert(
                            proj,
                            on_conflict="name,commune"
                        ).execute()
                        if res.data:
                            p = res.data[0]
                            project_ids[(p["name"], p["commune"])] = p["id"]
                            inserted += 1
                    except Exception as e2:
                        pass
        print(f"    Proyectos insertados: {inserted}/{len(projects)}...")

    print(f"  Total proyectos insertados: {inserted}, errores: {errors}")
    return project_ids


def insert_typologies(supabase: Client, typologies: list[dict], project_ids: dict[str, str]):
    """Insert typologies linked to their projects."""
    # Resolve project_id from the mapping
    resolved = []
    unresolved = 0
    for typ in typologies:
        key = (typ.pop("_project_name"), typ.pop("_project_commune"))
        pid = project_ids.get(key)
        if pid:
            typ["project_id"] = pid
            resolved.append(typ)
        else:
            unresolved += 1

    if unresolved > 0:
        print(f"  Tipologías sin proyecto padre: {unresolved}")

    # Delete existing typologies for these projects (to avoid duplicates on re-import)
    unique_pids = list(set(t["project_id"] for t in resolved))
    for i in range(0, len(unique_pids), BATCH_SIZE):
        batch_pids = unique_pids[i:i + BATCH_SIZE]
        try:
            supabase.table("project_typologies").delete().in_("project_id", batch_pids).execute()
        except Exception as e:
            print(f"    Warning: No se pudieron borrar algunas tipologías previas (batch {i//BATCH_SIZE}): {e}")

    inserted = 0
    for i in range(0, len(resolved), BATCH_SIZE):
        batch = resolved[i:i + BATCH_SIZE]
        try:
            supabase.table("project_typologies").insert(batch).execute()
            inserted += len(batch)
            print(f"    Tipologías: {inserted}/{len(resolved)} insertadas...")
        except Exception as e:
            print(f"    Error batch tipologías: {e}")
            # Try one by one
            for typ in batch:
                try:
                    supabase.table("project_typologies").insert(typ).execute()
                    inserted += 1
                except Exception:
                    pass

    print(f"  Total tipologías insertadas: {inserted}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def import_file(file_path: Path, dry_run: bool = True):
    """Import a single TINSA CSV file."""
    print(f"\n{'='*70}")
    print(f"  IMPORTANDO: {file_path.name}")
    print(f"  Tamaño: {file_path.stat().st_size / 1024 / 1024:.1f} MB")
    print(f"  Modo: {'DRY-RUN (sin insertar)' if dry_run else 'MIGRACIÓN REAL'}")
    print(f"{'='*70}")

    # Read full CSV
    print("\n1. Leyendo CSV...")
    df = read_tinsa_csv(file_path)
    print(f"   Filas totales: {len(df):,}")
    print(f"   Columnas: {len(df.columns)}")

    # Transform
    print("\n2. Transformando datos...")
    projects, typologies = transform_projects(df)

    if not projects:
        print("   No se generaron proyectos. Revisa el formato del CSV.")
        return

    # Show summary
    print(f"\n3. Resumen de transformación:")
    print(f"   Proyectos únicos: {len(projects)}")
    print(f"   Tipologías: {len(typologies)}")

    # Show sample project
    sample = projects[0]
    print(f"\n   Muestra (primer proyecto):")
    for k, v in sample.items():
        if v is not None:
            print(f"     {k:<25s} = {v}")

    # Coordinates stats
    with_coords = sum(1 for p in projects if p["latitude"] is not None)
    print(f"\n   Con coordenadas válidas: {with_coords}/{len(projects)} ({100*with_coords//len(projects) if projects else 0}%)")

    # Communes
    communes = sorted(set(p["commune"] for p in projects if p["commune"]))
    print(f"   Comunas: {len(communes)} → {communes[:10]}{'...' if len(communes) > 10 else ''}")

    if dry_run:
        print(f"\n   DRY-RUN completado. Para importar de verdad:")
        print(f"   python -m app.etl.tinsa_importer --file {file_path} --migrate")
        return

    # Real import
    print("\n4. Insertando en Supabase...")
    supabase = get_supabase_client()

    print("\n   4a. Proyectos...")
    project_ids = insert_projects(supabase, projects)

    print("\n   4b. Tipologías...")
    insert_typologies(supabase, typologies, project_ids)

    print(f"\n{'='*70}")
    print(f"  IMPORTACIÓN COMPLETADA: {file_path.name}")
    print(f"  Proyectos: {len(project_ids)}")
    print(f"{'='*70}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Importar CSV de TINSA a Supabase")
    parser.add_argument("--file", type=str, help="Ruta al archivo CSV")
    parser.add_argument("--migrate", action="store_true", help="Ejecutar importación real")
    parser.add_argument("--preview", action="store_true", help="Solo mostrar estructura del CSV")
    parser.add_argument("--all", action="store_true", help="Importar todos los archivos en data/")

    args = parser.parse_args()

    if args.preview:
        if args.file:
            preview_csv(Path(args.file))
        else:
            for f in DEFAULT_FILES:
                if f.exists():
                    preview_csv(f)
                else:
                    print(f"\n  Archivo no encontrado: {f}")
        return

    if args.all:
        for f in DEFAULT_FILES:
            if f.exists():
                import_file(f, dry_run=not args.migrate)
            else:
                print(f"\n  Saltando (no encontrado): {f}")
        return

    if args.file:
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"Archivo no encontrado: {file_path}")
            sys.exit(1)
        import_file(file_path, dry_run=not args.migrate)
    else:
        print("Uso:")
        print("  python -m app.etl.tinsa_importer --preview")
        print("  python -m app.etl.tinsa_importer --file data/tinsa_norte_sur.csv")
        print("  python -m app.etl.tinsa_importer --file data/tinsa_norte_sur.csv --migrate")
        print("  python -m app.etl.tinsa_importer --all --migrate")
        print()

        # Show what files exist
        for f in DEFAULT_FILES:
            status = "ENCONTRADO" if f.exists() else "no encontrado"
            print(f"  {f.name}: {status}")


if __name__ == "__main__":
    main()
