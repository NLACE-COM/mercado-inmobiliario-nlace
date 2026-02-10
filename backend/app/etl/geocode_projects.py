"""
Geocoding Service: Obtener coordenadas para proyectos sin ubicación

Este script usa múltiples servicios de geocoding para completar
las coordenadas faltantes en la base de datos.

Servicios:
1. Nominatim (OpenStreetMap) - Gratuito, sin API key
2. Google Maps - Fallback (requiere API key)

Uso:
    # Preview: ver cuántos proyectos necesitan geocoding
    python -m app.etl.geocode_projects --preview
    
    # Dry run: probar geocoding sin actualizar BD
    python -m app.etl.geocode_projects --dry-run --limit 10
    
    # Geocoding real
    python -m app.etl.geocode_projects --limit 100
    
    # Geocoding completo (todos los proyectos)
    python -m app.etl.geocode_projects
"""

import os
import sys
import time
import json
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional, Tuple
import hashlib

load_dotenv(Path(__file__).parent.parent.parent / ".env")

from geopy.geocoders import Nominatim, GoogleV3
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from supabase import create_client, Client

# Configuration
CACHE_FILE = Path(__file__).parent.parent.parent / "data" / "geocoding_cache.json"
DELAY_BETWEEN_REQUESTS = 1.5  # Seconds (Nominatim requires 1 second minimum)
BATCH_SIZE = 50  # Update DB every N geocoded projects

def get_supabase_client() -> Client:
    """Initialize Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL y SUPABASE_KEY deben estar en .env")
    
    return create_client(url, key)

class GeocodingCache:
    """Simple file-based cache for geocoding results."""
    
    def __init__(self, cache_file: Path):
        self.cache_file = cache_file
        self.cache = self._load_cache()
    
    def _load_cache(self) -> dict:
        """Load cache from file."""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _save_cache(self):
        """Save cache to file."""
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_file, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, ensure_ascii=False, indent=2)
    
    def _make_key(self, address: str, commune: str, region: str) -> str:
        """Create cache key from address components."""
        key_str = f"{address}|{commune}|{region}".lower().strip()
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, address: str, commune: str, region: str) -> Optional[Tuple[float, float]]:
        """Get cached coordinates."""
        key = self._make_key(address, commune, region)
        result = self.cache.get(key)
        if result:
            return (result['lat'], result['lon'])
        return None
    
    def set(self, address: str, commune: str, region: str, lat: float, lon: float):
        """Cache coordinates."""
        key = self._make_key(address, commune, region)
        self.cache[key] = {'lat': lat, 'lon': lon}
        self._save_cache()

class GeocodingService:
    """Multi-provider geocoding service with fallback."""
    
    def __init__(self, cache: GeocodingCache):
        self.cache = cache
        
        # Initialize Nominatim (free, no API key needed)
        self.nominatim = Nominatim(
            user_agent="mercado-inmobiliario-chile/1.0",
            timeout=10
        )
        
        # Initialize Google Maps (if API key available)
        google_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        self.google = GoogleV3(api_key=google_api_key) if google_api_key else None
        
        self.stats = {
            'cache_hits': 0,
            'nominatim_success': 0,
            'google_success': 0,
            'failures': 0
        }
    
    def geocode(self, address: str, commune: str, region: str) -> Optional[Tuple[float, float]]:
        """
        Geocode an address using multiple providers.
        
        Returns:
            Tuple of (latitude, longitude) or None if not found
        """
        # Check cache first
        cached = self.cache.get(address, commune, region)
        if cached:
            self.stats['cache_hits'] += 1
            return cached
        
        # Build full address for Chile
        full_address = self._build_address(address, commune, region)
        
        # Try Nominatim first (free)
        coords = self._geocode_nominatim(full_address)
        if coords:
            self.stats['nominatim_success'] += 1
            self.cache.set(address, commune, region, coords[0], coords[1])
            return coords
        
        # Try Google Maps as fallback
        if self.google:
            coords = self._geocode_google(full_address)
            if coords:
                self.stats['google_success'] += 1
                self.cache.set(address, commune, region, coords[0], coords[1])
                return coords
        
        self.stats['failures'] += 1
        return None
    
    def _build_address(self, address: str, commune: str, region: str) -> str:
        """Build full address string for geocoding."""
        parts = []
        
        if address and address.strip():
            parts.append(address.strip())
        
        if commune and commune.strip():
            parts.append(commune.strip())
        
        # Add region if not RM (Metropolitan Region is implicit for Santiago)
        if region and region.strip() and region.strip() != 'RM':
            parts.append(region.strip())
        
        parts.append("Chile")
        
        return ", ".join(parts)
    
    def _geocode_nominatim(self, address: str) -> Optional[Tuple[float, float]]:
        """Geocode using Nominatim (OpenStreetMap)."""
        try:
            time.sleep(DELAY_BETWEEN_REQUESTS)  # Rate limiting
            
            location = self.nominatim.geocode(
                address,
                country_codes='cl',  # Limit to Chile
                exactly_one=True
            )
            
            if location:
                return (location.latitude, location.longitude)
            
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            print(f"  ⚠️  Nominatim error: {str(e)[:50]}")
        except Exception as e:
            print(f"  ⚠️  Unexpected error: {str(e)[:50]}")
        
        return None
    
    def _geocode_google(self, address: str) -> Optional[Tuple[float, float]]:
        """Geocode using Google Maps."""
        try:
            time.sleep(0.1)  # Small delay
            
            location = self.google.geocode(
                address,
                components={'country': 'CL'}
            )
            
            if location:
                return (location.latitude, location.longitude)
            
        except Exception as e:
            print(f"  ⚠️  Google Maps error: {str(e)[:50]}")
        
        return None
    
    def print_stats(self):
        """Print geocoding statistics."""
        total = sum(self.stats.values())
        if total == 0:
            return
        
        print(f"\n📊 Estadísticas de Geocoding:")
        print(f"  ✅ Cache hits: {self.stats['cache_hits']}")
        print(f"  ✅ Nominatim: {self.stats['nominatim_success']}")
        if self.google:
            print(f"  ✅ Google Maps: {self.stats['google_success']}")
        print(f"  ❌ Fallos: {self.stats['failures']}")
        
        success_rate = ((total - self.stats['failures']) / total * 100) if total > 0 else 0
        print(f"  📈 Tasa de éxito: {success_rate:.1f}%")

def get_projects_without_coords(supabase: Client, limit: Optional[int] = None):
    """Get projects that don't have coordinates."""
    query = supabase.table('projects').select('id, name, address, commune, region, latitude, longitude')
    
    # Filter for projects without coordinates
    query = query.is_('latitude', 'null')
    
    if limit:
        query = query.limit(limit)
    
    result = query.execute()
    return result.data

def geocode_projects(dry_run: bool = True, limit: Optional[int] = None, preview_only: bool = False):
    """Main geocoding function."""
    print("🗺️  Geocoding de Proyectos sin Coordenadas")
    print(f"{'='*80}\n")
    
    supabase = get_supabase_client()
    
    # Get projects without coordinates
    print(f"📊 Buscando proyectos sin coordenadas...")
    projects = get_projects_without_coords(supabase, limit=limit)
    
    print(f"✅ Encontrados: {len(projects):,} proyectos sin coordenadas")
    
    if preview_only:
        print(f"\n📋 Muestra de proyectos:")
        for p in projects[:10]:
            print(f"  - {p['name'][:50]:50s} | {p.get('commune', 'N/A'):15s} | {p.get('address', 'Sin dirección')[:40]}")
        return
    
    if len(projects) == 0:
        print("\n✅ Todos los proyectos ya tienen coordenadas!")
        return
    
    # Initialize geocoding service
    cache = GeocodingCache(CACHE_FILE)
    geocoder = GeocodingService(cache)
    
    print(f"\n🔄 Iniciando geocoding...")
    if dry_run:
        print(f"⚠️  Modo DRY RUN - No se actualizará la base de datos\n")
    
    geocoded_count = 0
    failed_count = 0
    updates_batch = []
    
    for idx, project in enumerate(projects, 1):
        project_id = project['id']
        name = project['name']
        address = project.get('address', '')
        commune = project.get('commune', '')
        region = project.get('region', 'RM')
        
        # Skip if no address info
        if not address and not commune:
            print(f"  ⚠️  [{idx}/{len(projects)}] {name[:40]:40s} - Sin dirección")
            failed_count += 1
            continue
        
        # Geocode
        coords = geocoder.geocode(address or '', commune or '', region or '')
        
        if coords:
            lat, lon = coords
            print(f"  ✅ [{idx}/{len(projects)}] {name[:40]:40s} → ({lat:.6f}, {lon:.6f})")
            
            geocoded_count += 1
            
            if not dry_run:
                updates_batch.append({
                    'id': project_id,
                    'latitude': lat,
                    'longitude': lon
                })
                
                # Update in batches
                if len(updates_batch) >= BATCH_SIZE:
                    try:
                        for update in updates_batch:
                            supabase.table('projects').update({
                                'latitude': update['latitude'],
                                'longitude': update['longitude']
                            }).eq('id', update['id']).execute()
                        print(f"  💾 Actualizados {len(updates_batch)} proyectos en BD")
                        updates_batch = []
                    except Exception as e:
                        print(f"  ⚠️  Error actualizando BD: {e}")
        else:
            print(f"  ❌ [{idx}/{len(projects)}] {name[:40]:40s} - No encontrado")
            failed_count += 1
    
    # Update remaining batch
    if not dry_run and updates_batch:
        try:
            for update in updates_batch:
                supabase.table('projects').update({
                    'latitude': update['latitude'],
                    'longitude': update['longitude']
                }).eq('id', update['id']).execute()
            print(f"  💾 Actualizados {len(updates_batch)} proyectos en BD")
        except Exception as e:
            print(f"  ⚠️  Error actualizando BD: {e}")
    
    # Print summary
    print(f"\n{'='*80}")
    print(f"📊 RESUMEN")
    print(f"{'='*80}")
    print(f"✅ Geocodificados: {geocoded_count:,}")
    print(f"❌ Fallidos: {failed_count:,}")
    
    geocoder.print_stats()
    
    if dry_run:
        print(f"\n💡 Para actualizar la base de datos:")
        print(f"   python -m app.etl.geocode_projects --limit {limit if limit else 'all'}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Geocodificar proyectos sin coordenadas")
    parser.add_argument("--dry-run", action="store_true", help="Modo dry-run (no actualizar BD)")
    parser.add_argument("--preview", action="store_true", help="Solo mostrar proyectos sin coordenadas")
    parser.add_argument("--limit", type=int, help="Limitar número de proyectos a procesar")
    
    args = parser.parse_args()
    
    # Default to dry-run unless explicitly running for real
    dry_run = args.dry_run or not any([args.limit is not None and not args.dry_run])
    
    geocode_projects(
        dry_run=dry_run,
        limit=args.limit,
        preview_only=args.preview
    )
