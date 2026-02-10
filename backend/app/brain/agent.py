"""
LangChain Agent para el Analista IA

Este agente usa herramientas (tools) para consultar datos reales
del mercado inmobiliario y proporcionar análisis inteligentes.
"""

from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from brain.tools import ALL_TOOLS
from brain.knowledge_base import get_vector_store
import os


def get_agent_prompt():
    """
    Crea el prompt del sistema para el agente.
    """
    system_message = """Eres el "Cerebro IA del Mercado Inmobiliario", un sistema avanzado de inteligencia diseñando para potenciar la toma de decisiones estratégicas.
Tu fortaleza es combinar datos duros en tiempo real con conocimiento estratégico documental.

**TUS FUENTES DE INFORMACIÓN:**

1. **BASE DE DATOS DE PROYECTOS (Herramientas):**
   - Tienes acceso a herramientas para consultar datos vivos: precios, stock, velocidades de venta, ubicaciones.
   - Úsalas para responder preguntas sobre cifras, rankings, comparativas y estado actual del mercado.
   - *Ejemplo:* "¿Cuál es el precio promedio en Ñuñoa?" -> Usa herramienta `get_market_summary`.

2. **BASE DE CONOCIMIENTOS (Contexto RAG):**
   - Recibirás fragmentos de documentos, leyes, informes y archivos cargados por el usuario en el contexto de la pregunta.
   - Usa esta información para análisis cualitativo, tendencias macro, normativas y explicaciones de fenómenos.
   - *Ejemplo:* "¿Cómo afecta la nueva ley de copropiedad?" -> Usa la información del contexto RAG proporcionado.

**TUS RESPONSABILIDADES:**
- **Analizar:** No solo entregues datos, interpreta qué significan para el negocio.
- **Conectar:** Cruza la información. Explica cómo una tendencia documental (RAG) se refleja en los números actuales (DB).
- **Citar:** Indica claramente el origen de tus afirmaciones ("Según los datos de ventas..." o "Basado en el documento 'Ley 21.442'...").
- **Veracidad:** NUNCA inventes datos. Si no tienes la información, indícalo y sugiere cómo obtenerla.

**FORMATO DE RESPUESTA:**
- Respuesta Ejecutiva: Comienza con la conclusión principal.
- Evidencia: Soporta tu conclusión con datos (tablas, listas, cifras).
- Estilo: Profesional, conciso, uso de Markdown para estructurar la lectura.

Estás listo para asistir al usuario como su Analista Senior de Mercado.
"""
    
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_message),
        MessagesPlaceholder(variable_name="chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])
    
    return prompt


def create_brain_agent():
    """
    Crea el agente del Analista IA con todas las herramientas.
    """
    # Initialize LLM
    llm = ChatOpenAI(
        temperature=0,
        model="gpt-4-turbo-preview",
        openai_api_key=os.environ.get("OPENAI_API_KEY")
    )
    
    # Get prompt
    prompt = get_agent_prompt()
    
    # Create agent
    agent = create_openai_functions_agent(
        llm=llm,
        tools=ALL_TOOLS,
        prompt=prompt
    )
    
    # Create executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=ALL_TOOLS,
        verbose=True,
        max_iterations=5,
        early_stopping_method="generate",
        handle_parsing_errors=True
    )
    
    return agent_executor


async def query_brain_agent(question: str, chat_history: list = None) -> dict:
    """
    Consulta al agente con una pregunta.
    
    Args:
        question: Pregunta del usuario
        chat_history: Historial de conversación (opcional)
    
    Returns:
        dict con 'answer' y 'intermediate_steps'
    """
    try:
        # Create agent
        agent_executor = create_brain_agent()
        
        # Prepare input
        agent_input = {
            "input": question,
        }
        
        if chat_history:
            agent_input["chat_history"] = chat_history
        
        # Execute
        result = await agent_executor.ainvoke(agent_input)
        
        return {
            "answer": result.get("output", "No pude generar una respuesta."),
            "intermediate_steps": result.get("intermediate_steps", []),
            "success": True
        }
        
    except Exception as e:
        print(f"Error in agent: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "answer": f"Lo siento, ocurrió un error al procesar tu pregunta: {str(e)}",
            "intermediate_steps": [],
            "success": False,
            "error": str(e)
        }


async def query_brain_with_rag(question: str, use_rag: bool = True) -> dict:
    """
    Consulta al agente con contexto RAG opcional.
    
    Args:
        question: Pregunta del usuario
        use_rag: Si debe usar RAG para contexto histórico
    
    Returns:
        dict con 'answer', 'context_used', 'intermediate_steps'
    """
    try:
        context_docs = []
        
        # Get RAG context if enabled
        if use_rag:
            try:
                vector_store = get_vector_store()
                docs = vector_store.similarity_search(question, k=3)
                context_docs = [
                    {
                        "content": d.page_content,
                        "metadata": d.metadata
                    }
                    for d in docs
                ]
                
                # Add context to question
                if context_docs:
                    context_text = "\n".join([
                        f"- {d['content']} (Fuente: {d['metadata'].get('topic', 'N/A')})"
                        for d in context_docs
                    ])
                    question = f"{question}\n\nCONTEXTO HISTÓRICO RELEVANTE:\n{context_text}"
                    
            except Exception as e:
                print(f"Error getting RAG context: {e}")
        
        # Query agent
        result = await query_brain_agent(question)
        
        # Add context to result
        result["context_used"] = context_docs
        
        return result
        
    except Exception as e:
        print(f"Error in query_brain_with_rag: {e}")
        return {
            "answer": f"Error: {str(e)}",
            "context_used": [],
            "intermediate_steps": [],
            "success": False,
            "error": str(e)
        }
