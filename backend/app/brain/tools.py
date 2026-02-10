"""
LangChain Tools para el Analista IA

Estas herramientas permiten al agente consultar y analizar
datos reales del mercado inmobiliario.
"""

from langchain.tools import tool
from typing import Optional, List, Dict, Any
from app.db import get_supabase_client
from pydantic import BaseModel, Field
from app.utils.cache import stats_cache, projects_cache


class ProjectSearchInput(BaseModel):
    """Input para búsqueda de proyectos."""
    commune: Optional[str] = Field(None, description="Comuna a filtrar (ej: 'SANTIAGO', 'IQUIQUE')")
    region: Optional[str] = Field(None, description="Región a filtrar (ej: 'RM', 'I', 'II')")
    min_price: Optional[float] = Field(None, description="Precio mínimo en UF")
    max_price: Optional[float] = Field(None, description="Precio máximo en UF")
    property_type: Optional[str] = Field(None, description="Tipo de propiedad (ej: 'DEPARTAMENTO', 'CASA')")
    min_units: Optional[int] = Field(None, description="Mínimo de unidades totales")
    limit: int = Field(10, description="Número máximo de resultados")


class StatsInput(BaseModel):
    """Input para estadísticas."""
    commune: Optional[str] = Field(None, description="Comuna a analizar")
    region: Optional[str] = Field(None, description="Región a analizar")
    property_type: Optional[str] = Field(None, description="Tipo de propiedad")


class CompareRegionsInput(BaseModel):
    """Input para comparar regiones."""
    regions: List[str] = Field(..., description="Lista de regiones a comparar (ej: ['RM', 'V', 'VIII'])")


@tool("search_projects", args_schema=ProjectSearchInput)
def search_projects(
    commune: Optional[str] = None,
    region: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    property_type: Optional[str] = None,
    min_units: Optional[int] = None,
    limit: int = 10
) -> str:
    """
    Busca proyectos inmobiliarios según filtros específicos.
    
    Retorna información detallada de proyectos que coincidan con los criterios.
    Útil para responder preguntas como:
    - "¿Qué proyectos hay en Santiago?"
    - "Muéstrame departamentos en Iquique"
    - "Proyectos con más de 100 unidades"
    """
    try:
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table("projects").select(
            "name, developer, commune, region, address, "
            "total_units, sold_units, available_units, "
            "avg_price_uf, avg_price_m2_uf, min_price_uf, max_price_uf, "
            "property_type, project_status, sales_speed_monthly"
        )
        
        # Apply filters
        if commune:
            query = query.ilike("commune", f"%{commune}%")
        if region:
            query = query.eq("region", region.upper())
        if min_price:
            query = query.gte("avg_price_uf", min_price)
        if max_price:
            query = query.lte("avg_price_uf", max_price)
        if property_type:
            query = query.ilike("property_type", f"%{property_type}%")
        if min_units:
            query = query.gte("total_units", min_units)
        
        # Execute with limit
        query = query.limit(limit)
        result = query.execute()
        
        if not result.data:
            return f"No se encontraron proyectos con los filtros especificados."
        
        # Format results
        projects = result.data
        output = f"Se encontraron {len(projects)} proyectos:\n\n"
        
        for i, p in enumerate(projects, 1):
            output += f"{i}. **{p['name']}**\n"
            if p.get('developer'):
                output += f"   - Inmobiliaria: {p['developer']}\n"
            output += f"   - Ubicación: {p.get('commune', 'N/A')}, Región {p.get('region', 'N/A')}\n"
            if p.get('address'):
                output += f"   - Dirección: {p['address']}\n"
            output += f"   - Unidades: {p.get('total_units', 0)} totales, {p.get('sold_units', 0)} vendidas, {p.get('available_units', 0)} disponibles\n"
            if p.get('avg_price_uf'):
                output += f"   - Precio promedio: {p['avg_price_uf']:,.0f} UF\n"
            if p.get('avg_price_m2_uf'):
                output += f"   - Precio por m²: {p['avg_price_m2_uf']:,.1f} UF/m²\n"
            if p.get('sales_speed_monthly'):
                output += f"   - Velocidad de venta: {p['sales_speed_monthly']:.1f} unidades/mes\n"
            output += "\n"
        
        return output
        
    except Exception as e:
        return f"Error al buscar proyectos: {str(e)}"


@tool("get_project_stats", args_schema=StatsInput)
def get_project_stats(
    commune: Optional[str] = None,
    region: Optional[str] = None,
    property_type: Optional[str] = None
) -> str:
    """
    Obtiene estadísticas agregadas del mercado inmobiliario.
    Calcula promedios, totales y métricas clave para un área específica.
    """
    try:
        # Generate cache key
        cache_key = f"stats:{commune}:{region}:{property_type}"
        cached_result = stats_cache.get(cache_key)
        if cached_result:
            return cached_result

        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table("projects").select(
            "total_units, sold_units, available_units, "
            "avg_price_uf, avg_price_m2_uf, sales_speed_monthly"
        )
        
        # Apply filters
        if commune:
            query = query.ilike("commune", f"%{commune}%")
        if region:
            query = query.eq("region", region.upper())
        if property_type:
            query = query.ilike("property_type", f"%{property_type}%")
        
        result = query.execute()
        
        if not result.data:
            return "No se encontraron datos para calcular estadísticas."
        
        projects = result.data
        
        # Calculate stats
        total_projects = len(projects)
        total_units = sum(p.get('total_units', 0) or 0 for p in projects)
        total_sold = sum(p.get('sold_units', 0) or 0 for p in projects)
        total_available = sum(p.get('available_units', 0) or 0 for p in projects)
        
        # Average price (only non-null values)
        prices = [p.get('avg_price_uf') for p in projects if p.get('avg_price_uf')]
        avg_price = sum(prices) / len(prices) if prices else 0
        
        prices_m2 = [p.get('avg_price_m2_uf') for p in projects if p.get('avg_price_m2_uf')]
        avg_price_m2 = sum(prices_m2) / len(prices_m2) if prices_m2 else 0
        
        sales_speeds = [p.get('sales_speed_monthly') for p in projects if p.get('sales_speed_monthly')]
        avg_sales_speed = sum(sales_speeds) / len(sales_speeds) if sales_speeds else 0
        
        # Calculate sell-through rate
        sell_through = (total_sold / total_units * 100) if total_units > 0 else 0
        
        # Format output
        location = []
        if commune:
            location.append(f"Comuna: {commune}")
        if region:
            location.append(f"Región: {region}")
        if property_type:
            location.append(f"Tipo: {property_type}")
        
        location_str = ", ".join(location) if location else "Todo el mercado"
        
        output = f"📊 **Estadísticas del Mercado** ({location_str})\n\n"
        output += f"**Oferta:**\n"
        output += f"- Total de proyectos: {total_projects:,}\n"
        output += f"- Total de unidades: {total_units:,}\n"
        output += f"- Unidades vendidas: {total_sold:,}\n"
        output += f"- Unidades disponibles: {total_available:,}\n"
        output += f"- Tasa de venta: {sell_through:.1f}%\n\n"
        
        output += f"**Precios:**\n"
        output += f"- Precio promedio: {avg_price:,.0f} UF\n"
        output += f"- Precio promedio por m²: {avg_price_m2:,.1f} UF/m²\n\n"
        
        output += f"**Velocidad de Venta:**\n"
        output += f"- Promedio: {avg_sales_speed:.1f} unidades/mes\n"
        
        # Cache result
        stats_cache.set(cache_key, output)
        
        return output
        
    except Exception as e:
        return f"Error al calcular estadísticas: {str(e)}"


@tool("compare_regions", args_schema=CompareRegionsInput)
def compare_regions(regions: List[str]) -> str:
    """
    Compara métricas clave entre diferentes regiones.
    """
    try:
        # Cache key based on sorted regions
        regions_key = ",".join(sorted(regions))
        cache_key = f"compare:{regions_key}"
        cached_result = stats_cache.get(cache_key)
        if cached_result:
            return cached_result

        supabase = get_supabase_client()
        
        results = {}
        
        for region in regions:
            query = supabase.table("projects").select(
                "total_units, sold_units, available_units, avg_price_uf, avg_price_m2_uf"
            ).eq("region", region.upper())
            
            result = query.execute()
            
            if result.data:
                projects = result.data
                
                total_projects = len(projects)
                total_units = sum(p.get('total_units', 0) or 0 for p in projects)
                total_sold = sum(p.get('sold_units', 0) or 0 for p in projects)
                
                prices = [p.get('avg_price_uf') for p in projects if p.get('avg_price_uf')]
                avg_price = sum(prices) / len(prices) if prices else 0
                
                prices_m2 = [p.get('avg_price_m2_uf') for p in projects if p.get('avg_price_m2_uf')]
                avg_price_m2 = sum(prices_m2) / len(prices_m2) if prices_m2 else 0
                
                sell_through = (total_sold / total_units * 100) if total_units > 0 else 0
                
                results[region] = {
                    'projects': total_projects,
                    'units': total_units,
                    'sold': total_sold,
                    'avg_price': avg_price,
                    'avg_price_m2': avg_price_m2,
                    'sell_through': sell_through
                }
        
        if not results:
            return "No se encontraron datos para las regiones especificadas."
        
        # Format comparison
        output = f"📊 **Comparación entre Regiones**\n\n"
        
        for region, stats in results.items():
            output += f"**Región {region}:**\n"
            output += f"- Proyectos: {stats['projects']:,}\n"
            output += f"- Unidades totales: {stats['units']:,}\n"
            output += f"- Unidades vendidas: {stats['sold']:,}\n"
            output += f"- Tasa de venta: {stats['sell_through']:.1f}%\n"
            output += f"- Precio promedio: {stats['avg_price']:,.0f} UF\n"
            output += f"- Precio por m²: {stats['avg_price_m2']:,.1f} UF/m²\n\n"
        
        stats_cache.set(cache_key, output)
        return output
        
    except Exception as e:
        return f"Error al comparar regiones: {str(e)}"


@tool
def get_top_projects_by_sales() -> str:
    """
    Obtiene los proyectos con mejor desempeño de ventas.
    """
    try:
        # Cache for top projects
        cache_key = "top_sales_projects"
        cached_result = projects_cache.get(cache_key)
        if cached_result:
            return cached_result

        supabase = get_supabase_client()
        
        # Get projects with best sales speed - limit to top 20 to check valid data
        result = supabase.table("projects").select(
            "name, developer, commune, region, total_units, sold_units, "
            "sales_speed_monthly, avg_price_uf"
        ).not_("sales_speed_monthly", "is", None).order(
            "sales_speed_monthly", desc=True
        ).limit(10).execute()
        
        if not result.data:
            return "No hay datos de velocidad de venta disponibles."
        
        projects = result.data
        
        output = "🏆 **Top 10 Proyectos por Velocidad de Venta**\n\n"
        
        for i, p in enumerate(projects, 1):
            sell_through = (p.get('sold_units', 0) / p.get('total_units', 1) * 100) if p.get('total_units') else 0
            
            output += f"{i}. **{p['name']}**\n"
            output += f"   - Ubicación: {p.get('commune', 'N/A')}, Región {p.get('region', 'N/A')}\n"
            output += f"   - Inmobiliaria: {p.get('developer', 'N/A')}\n"
            output += f"   - Velocidad: {p.get('sales_speed_monthly', 0):.1f} unidades/mes\n"
            output += f"   - Avance: {sell_through:.1f}% vendido ({p.get('sold_units', 0)}/{p.get('total_units', 0)} unidades)\n"
            if p.get('avg_price_uf'):
                output += f"   - Precio: {p['avg_price_uf']:,.0f} UF\n"
            output += "\n"
        
        projects_cache.set(cache_key, output)
        return output
        
    except Exception as e:
        return f"Error al obtener top proyectos: {str(e)}"


@tool
def get_market_summary() -> str:
    """
    Obtiene un resumen ejecutivo del mercado inmobiliario completo.
    """
    try:
        # Cache for market summary (10 mins)
        cache_key = "market_summary_full"
        cached_result = stats_cache.get(cache_key)
        if cached_result:
            return cached_result

        supabase = get_supabase_client()
        
        # Get all projects - Optimized selection
        result = supabase.table("projects").select(
            "region, total_units, sold_units, available_units, avg_price_uf"
        ).execute()
        
        if not result.data:
            return "No hay datos disponibles en el sistema."
        
        projects = result.data
        
        # Overall stats
        total_projects = len(projects)
        total_units = sum(p.get('total_units', 0) or 0 for p in projects)
        total_sold = sum(p.get('sold_units', 0) or 0 for p in projects)
        total_available = sum(p.get('available_units', 0) or 0 for p in projects)
        
        sell_through = (total_sold / total_units * 100) if total_units > 0 else 0
        
        # By region
        regions = {}
        for p in projects:
            region = p.get('region', 'N/A')
            if region not in regions:
                regions[region] = {'count': 0, 'units': 0}
            regions[region]['count'] += 1
            regions[region]['units'] += p.get('total_units', 0) or 0
        
        # Top regions
        top_regions = sorted(regions.items(), key=lambda x: x[1]['count'], reverse=True)[:5]
        
        output = "📊 **Resumen Ejecutivo del Mercado Inmobiliario**\n\n"
        output += f"**Panorama General:**\n"
        output += f"- Total de proyectos: {total_projects:,}\n"
        output += f"- Total de unidades: {total_units:,}\n"
        output += f"- Unidades vendidas: {total_sold:,} ({sell_through:.1f}%)\n"
        output += f"- Unidades disponibles: {total_available:,}\n\n"
        
        output += f"**Top 5 Regiones por Número de Proyectos:**\n"
        for region, stats in top_regions:
            output += f"- Región {region}: {stats['count']:,} proyectos ({stats['units']:,} unidades)\n"
        
        stats_cache.set(cache_key, output)
        return output
        
    except Exception as e:
        return f"Error al generar resumen: {str(e)}"


# Export all tools
ALL_TOOLS = [
    search_projects,
    get_project_stats,
    compare_regions,
    get_top_projects_by_sales,
    get_market_summary
]
