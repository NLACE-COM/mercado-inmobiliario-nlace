
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from brain.agent import query_brain_with_rag
import traceback

router = APIRouter(prefix="/brain", tags=["brain"])


class AskRequest(BaseModel):
    question: str
    use_rag: bool = True
    filters: Dict[str, Any] = {}


class ToolExecution(BaseModel):
    tool: str
    input: Dict[str, Any]
    output: str


class AskResponse(BaseModel):
    answer: str
    context_used: List[Dict[str, Any]] = []
    tools_used: List[ToolExecution] = []
    success: bool = True
    error: Optional[str] = None


@router.post("/ask", response_model=AskResponse)
async def ask_brain(request: AskRequest):
    """
    Endpoint principal del Analista IA.
    
    Usa un agente LangChain con herramientas (tools) para consultar
    datos reales del mercado inmobiliario y proporcionar análisis inteligentes.
    
    El agente puede:
    - Buscar proyectos específicos
    - Calcular estadísticas del mercado
    - Comparar regiones
    - Identificar tendencias
    - Proporcionar insights basados en datos reales
    """
    try:
        # Query agent with RAG
        result = await query_brain_with_rag(
            question=request.question,
            use_rag=request.use_rag
        )
        
        # Extract tool executions from intermediate steps
        tools_used = []
        for step in result.get("intermediate_steps", []):
            if len(step) >= 2:
                action, output = step[0], step[1]
                tools_used.append(ToolExecution(
                    tool=action.tool,
                    input=action.tool_input,
                    output=str(output)[:500]  # Limit output length
                ))
        
        return AskResponse(
            answer=result.get("answer", "No pude generar una respuesta."),
            context_used=result.get("context_used", []),
            tools_used=tools_used,
            success=result.get("success", True),
            error=result.get("error")
        )
        
    except Exception as e:
        print(f"Error in Brain API: {e}")
        traceback.print_exc()
        
        return AskResponse(
            answer=f"Lo siento, ocurrió un error al procesar tu pregunta. Por favor, intenta reformularla o contacta al administrador.",
            context_used=[],
            tools_used=[],
            success=False,
            error=str(e)
        )


@router.get("/health")
async def health_check():
    """
    Verifica que el servicio del cerebro AI esté funcionando.
    """
    try:
        from brain.tools import ALL_TOOLS
        
        return {
            "status": "healthy",
            "tools_available": len(ALL_TOOLS),
            "tool_names": [tool.name for tool in ALL_TOOLS]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Brain service unhealthy: {str(e)}")
