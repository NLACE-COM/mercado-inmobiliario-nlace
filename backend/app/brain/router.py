
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from app.db import get_supabase_client
from app.brain.knowledge_base import get_vector_store
import os
from pathlib import Path
import json

router = APIRouter(prefix="/brain", tags=["brain"])

class AskRequest(BaseModel):
    question: str
    filters: Dict[str, Any] = {}

class AskResponse(BaseModel):
    answer: str
    context_used: List[Dict[str, Any]]
    data_points: List[Dict[str, Any]]

def get_default_template():
    return """
    Eres el "Cerebro Inmobiliario", un experto analista de mercado con acceso a datos históricos y actuales.
    
    CONTEXTO HISTÓRICO Y NORMATIVO RELEVANTE (RAG):
    {context_text}
    
    DATOS ACTUALES DEL MERCADO (MUESTRA SQL):
    {data_text}
    
    PREGUNTA DEL USUARIO:
    {question}
    
    Responde de manera ejecutiva y analítica. Cita el contexto histórico si explica la situación actual. 
    Si los datos muestran tendencias claras, menciónalas.
    """

@router.post("/ask", response_model=AskResponse)
async def ask_brain(request: AskRequest):
    try:
        # 1. Retrieve Context from Knowledge Base (RAG)
        vector_store = get_vector_store()
        docs = vector_store.similarity_search(request.question, k=3)
        context_text = "\n".join([f"- {d.page_content} (Fuente: {d.metadata.get('topic', 'N/A')})" for d in docs])
        context_meta = [d.metadata for d in docs]

        # 2. Retrieve Hard Data from SQL (Simplified for MVP: global overview or filtered)
        # TODO: Dynamically build SQL based on question intent (Text-to-SQL)
        supabase = get_supabase_client()
        
        # Use simple select for MVP
        res = supabase.table("projects").select("name, total_units, sold_units, avg_price_uf").limit(5).execute()
        projects_data = res.data if res.data else []
        
        data_text = str(projects_data) 
        
        # 3. Construct Prompt with Context + Data
        llm = ChatOpenAI(temperature=0, model="gpt-4-turbo-preview", openai_api_key=os.environ.get("OPENAI_API_KEY"))
        
        # 3. Get System Prompt from DB or File
        try:
            prompt_res = supabase.table("system_prompts").select("content").eq("is_active", True).limit(1).execute()
            if prompt_res.data and len(prompt_res.data) > 0:
                template = prompt_res.data[0]['content']
            else:
                # Try file fallback
                prompts_file = Path("system_prompts.json")
                if prompts_file.exists():
                    with open(prompts_file, "r") as f:
                        prompts = json.load(f)
                    active_prompt = next((p for p in prompts if p.get('is_active')), None)
                    if active_prompt:
                        template = active_prompt['content']
                    else:
                        template = get_default_template()
                else:
                    template = get_default_template()
        except Exception as e:
            print(f"Error fetching prompt: {e}, using default.")
            template = get_default_template()
        
        prompt = PromptTemplate(template=template, input_variables=["context_text", "data_text", "question"])
        chain = prompt | llm 
        
        response = await chain.ainvoke({
            "context_text": context_text,
            "data_text": data_text,
            "question": request.question
        })
        
        return AskResponse(
            answer=response.content,
            context_used=context_meta,
            data_points=projects_data
        )

    except Exception as e:
        print(f"Error in Brain: {e}")
        raise HTTPException(status_code=500, detail=str(e))
