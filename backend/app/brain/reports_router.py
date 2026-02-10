from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
from ..db import get_supabase_client

router = APIRouter(prefix="/brain/reports", tags=["reports"])

class ReportRequest(BaseModel):
    title: str
    report_type: str # 'COMMUNE_MARKET', 'PROJECT_BENCHMARK'
    parameters: Dict[str, Any] # e.g. {"commune": "Santiago"}

class ReportResponse(BaseModel):
    id: str
    status: str
    content: Optional[Dict[str, Any]]

# --- Endpoints ---

@router.post("/generate", response_model=ReportResponse)
def generate_report(request: ReportRequest):
    """
    Generates a new real-estate report using AI and DB data.
    This is a long-running process, so in a real app it should be async/background.
    For MVP, we do it synchronously but fast.
    """
    supabase = get_supabase_client()
    
    # 1. Create Report Draft in DB
    user_id = None # TODO: Get from auth context if available
    
    report_data = {
        "title": request.title,
        "report_type": request.report_type,
        "parameters": request.parameters,
        "status": "generating"
    }
    
    # Insert initial record
    res = supabase.table("generated_reports").insert(report_data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create report record")
    
    report_id = res.data[0]['id']
    
    try:
        # 2. Fetch Data based on Report Type
        if request.report_type == 'COMMUNE_MARKET':
            content = generate_commune_report(supabase, request.parameters)
        elif request.report_type == 'AREA_POLYGON':
            content = generate_area_report(supabase, request.parameters)
        elif request.report_type == 'PROJECT_BENCHMARK':
            content = generate_benchmark_report(supabase, request.parameters)
        else:
            raise ValueError(f"Unknown report type: {request.report_type}")
            
        # 3. Save Completed Report
        supabase.table("generated_reports").update({
            "status": "completed",
            "content": content
        }).eq("id", report_id).execute()
        
        return {
            "id": report_id,
            "status": "completed",
            "content": content
        }

    except Exception as e:
        # Log error and update status
        print(f"Error generating report: {e}")
        supabase.table("generated_reports").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", report_id).execute()
        
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[Dict])
def list_reports():
    supabase = get_supabase_client()
    res = supabase.table("generated_reports").select("id, title, report_type, status, created_at").order("created_at", desc=True).limit(20).execute()
    return res.data

@router.get("/{report_id}", response_model=Dict)
def get_report(report_id: str):
    supabase = get_supabase_client()
    res = supabase.table("generated_reports").select("*").eq("id", report_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Report not found")
    return res.data

# --- AI & Data Logic ---

def prepare_chart_data(projects: List[Dict]) -> Dict[str, Any]:
    import pandas as pd
    if not projects:
        return {}
        
    df = pd.DataFrame(projects)
    
    # 1. Scatter Plot Data: Price vs Sales Speed
    # Filter out outliers or zero values if needed
    if 'sales_speed' in df and 'avg_price_uf' in df:
        scatter_data = df[df['sales_speed'] > 0][['name', 'avg_price_uf', 'sales_speed', 'stock', 'developer']].to_dict(orient='records')
    else:
        scatter_data = []
    
    # 2. Stock Distribution by Developer (Top 10)
    if 'developer' in df and 'stock' in df:
        stock_by_dev = df.groupby('developer')['stock'].sum().sort_values(ascending=False).head(10).reset_index()
        bar_data = stock_by_dev.to_dict(orient='records')
    else:
        bar_data = []
    
    return {
        "scatter_price_speed": scatter_data,
        "bar_stock_developer": bar_data
    }

def calculate_kpis(projects: List[Dict]) -> Dict[str, Any]:
    if not projects:
        return {
            "total_projects": 0,
            "avg_price": 0,
            "avg_stock": 0,
            "total_stock": 0,
            "avg_sales_speed": 0,
            "avg_mao": 0
        }
    
    import pandas as pd
    df = pd.DataFrame(projects)
    
    # Calculate simple averages/sums
    total_projects = len(df)
    avg_price = float(df['avg_price_uf'].mean()) if 'avg_price_uf' in df and not df['avg_price_uf'].empty else 0
    avg_stock = float(df['stock'].mean()) if 'stock' in df and not df['stock'].empty else 0
    total_stock = int(df['stock'].sum()) if 'stock' in df and not df['stock'].empty else 0
    
    # Weighted averages could be better, but simple mean for now
    avg_speed = float(df['sales_speed'].mean()) if 'sales_speed' in df and not df['sales_speed'].empty else 0
    avg_mao = float(df['mao'].mean()) if 'mao' in df and not df['mao'].empty else 0
    
    return {
        "total_projects": total_projects,
        "avg_price": round(avg_price, 1),
        "avg_stock": round(avg_stock, 1),
        "total_stock": total_stock,
        "avg_sales_speed": round(avg_speed, 1),
        "avg_mao": round(avg_mao, 1)
    }

def generate_ai_analysis(commune: str, kpis: Dict, projects: List[Dict], area_context: str = "") -> Dict[str, str]:
    """
    Generates a narrative analysis using LLM directly.
    Returns a dict with 'executive_summary' and 'competitor_analysis'.
    """
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import SystemMessage, HumanMessage
    import os
    
    if not os.environ.get("OPENAI_API_KEY"):
        return {
            "executive_summary": "Análisis de IA no disponible (API Key faltante).",
            "competitor_analysis": "No disponible."
        }
        
    try:
        llm = ChatOpenAI(temperature=0.3, model="gpt-4-turbo-preview")
        
        # Prepare context data (summarized to save tokens)
        top_projects = sorted(projects, key=lambda x: x.get('sales_speed', 0), reverse=True)[:5]
        
        system_msg = """Eres un Analista Inmobiliario Senior experto en el mercado chileno. 
Tu objetivo es generar un reporte de alto valor estratégico.
Tus análisis deben ser profundos, citando datos específicos para respaldar tus afirmaciones.
Estructura tu respuesta en formato JSON con dos claves: 'executive_summary' and 'competitor_analysis'.
"""

        human_msg = f"""
Analiza el mercado en {commune if commune else 'Área dibujada personalizada'} {area_context}.

Datos Clave del Área:
- Proyectos: {kpis['total_projects']}
- Stock: {kpis['total_stock']}
- Precio Promedio: {kpis['avg_price']} UF
- Venta Promedio: {kpis['avg_sales_speed']} un/mes
- MAO: {kpis['avg_mao']}

Top 5 Proyectos (Líderes en esta zona):
{json.dumps(top_projects, indent=2)}

Genera un JSON con:
1. "executive_summary": Vision general del mercado en esta zona específica. ¿Es un polo de desarrollo, zona consolidada o saturada? (Máx 150 palabras)
2. "competitor_analysis": Análisis detallado de POR QUÉ los líderes están vendiendo bien en esta ubicación. Pattern matching de precios locales. (Máx 200 palabras)
"""
        
        # Force JSON output if possible or parsing
        response = llm.invoke([SystemMessage(content=system_msg), HumanMessage(content=human_msg)])
        content = response.content
        
        # Try to parse JSON from content
        try:
            # Clean markdown code blocks if any
            cleaned_content = content.replace("```json", "").replace("```", "").strip()
            analysis_dict = json.loads(cleaned_content)
            return analysis_dict
        except:
            # Fallback if AI didn't return valid JSON
            return {
                "executive_summary": content,
                "competitor_analysis": "No se pudo estructurar el análisis detallado."
            }
        
    except Exception as e:
        print(f"Error generating AI analysis: {e}")
        return {
            "executive_summary": f"Error al generar análisis: {str(e)}",
            "competitor_analysis": ""
        }

def generate_commune_report(supabase, params: Dict[str, Any]):
    commune = params.get("commune")
    if not commune:
        raise ValueError("Commune is required")

    # Normalize to Uppercase for DB
    commune_db = commune.upper()

    # 1. Fetch Projects (Benchmark)
    projects_res = supabase.rpc('get_project_benchmark', {'commune_filter': commune_db}).execute()
    projects = projects_res.data
    
    # 2. Calculate KPIs and Charts
    kpis = calculate_kpis(projects)
    charts = prepare_chart_data(projects)
    
    # 3. Generate AI Narrative
    ai_content = generate_ai_analysis(commune, kpis, projects)

    return build_report_structure(f"Reporte de Mercado: {commune}", kpis, charts, ai_content, projects)

def generate_area_report(supabase, params: Dict[str, Any]):
    polygon_wkt = params.get("polygon_wkt")
    if not polygon_wkt:
        raise ValueError("polygon_wkt is required for area reports")

    # 1. Fetch Projects in Polygon
    projects_res = supabase.rpc('get_projects_in_polygon', {'polygon_wkt': polygon_wkt}).execute()
    projects = projects_res.data
    
    # 2. Calculate KPIs and Charts
    kpis = calculate_kpis(projects)
    charts = prepare_chart_data(projects)
    
    # 3. Generate AI Narrative
    ai_content = generate_ai_analysis("Zona personalizada dibujada", kpis, projects)

    return build_report_structure("Reporte de Área Personalizada", kpis, charts, ai_content, projects)

def build_report_structure(title: str, kpis: Dict, charts: Dict, ai_content: Dict, projects: List):
    return {
        "title": title,
        "sections": [
            {
                "type": "summary",
                "title": "Visión Estratégica",
                "content": ai_content.get("executive_summary", "")
            },
            {
                "type": "kpi_grid",
                "data": kpis
            },
            {
                "type": "chart_scatter",
                "title": "Mapa de Oportunidades (Precio vs Velocidad)",
                "data": charts.get("scatter_price_speed", [])
            },
            {
                "type": "analysis_text",
                "title": "Análisis de Competencia",
                "content": ai_content.get("competitor_analysis", "")
            },
            {
                "type": "chart_bar",
                "title": "Participación de Mercado (Stock por Inmobiliaria)",
                "data": charts.get("bar_stock_developer", [])
            },
            {
                "type": "project_table",
                "title": "Detalle de Mercado (Benchmark)",
                "data": projects
            }
        ]
    }

def generate_benchmark_report(supabase, params):
    # Reuse commune logic for now, or customize later
    return generate_commune_report(supabase, params)
