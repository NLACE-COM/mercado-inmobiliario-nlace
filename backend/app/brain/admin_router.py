from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.db import get_supabase_client
from app.brain.knowledge_base import get_vector_store
import uuid

router = APIRouter(prefix="/brain/admin", tags=["Brain Admin"])

# --- System Prompts ---

import json
import os
from pathlib import Path

PROMPTS_FILE = Path("system_prompts.json")

def check_table_exists(table_name: str):
    try:
        supabase = get_supabase_client()
        supabase.table(table_name).select("id").limit(1).execute()
        return True
    except:
        return False

# --- System Prompts ---

class SystemPrompt(BaseModel):
    id: Optional[Any] = None
    content: str
    is_active: bool = False
    label: Optional[str] = "Version"
    created_at: Optional[Any] = None

@router.get("/prompts", response_model=List[SystemPrompt])
def get_prompts():
    supabase = get_supabase_client()
    if supabase and check_table_exists("system_prompts"):
        res = supabase.table("system_prompts").select("*").order("created_at", desc=True).execute()
        return res.data
    else:
        # Fallback to file
        if not PROMPTS_FILE.exists():
            return []
        try:
            with open(PROMPTS_FILE, "r") as f:
                prompts = json.load(f)
            return sorted(prompts, key=lambda x: x.get('created_at', ''), reverse=True)
        except:
            return []

@router.post("/prompts", response_model=SystemPrompt)
def create_prompt(prompt: SystemPrompt):
    import datetime
    
    if check_table_exists("system_prompts"):
        supabase = get_supabase_client()
        
        # Deactivate others if needed
        if prompt.is_active:
            active = supabase.table("system_prompts").select("id").eq("is_active", True).execute()
            for row in active.data:
                supabase.table("system_prompts").update({"is_active": False}).eq("id", row['id']).execute()

        data = {
            "content": prompt.content,
            "is_active": prompt.is_active,
            "label": prompt.label
        }
        
        res = supabase.table("system_prompts").insert(data).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to insert prompt")
            
        return res.data[0]
    else:
        # File fallback
        if PROMPTS_FILE.exists():
            with open(PROMPTS_FILE, "r") as f:
                prompts = json.load(f)
        else:
            prompts = []
            
        if prompt.is_active:
            for p in prompts:
                p['is_active'] = False
                
        new_prompt = {
            "id": str(uuid.uuid4()),
            "content": prompt.content,
            "is_active": prompt.is_active,
            "label": prompt.label,
            "created_at": datetime.datetime.now().isoformat()
        }
        prompts.append(new_prompt)
        
        with open(PROMPTS_FILE, "w") as f:
            json.dump(prompts, f)
            
        return new_prompt



@router.put("/prompts/{prompt_id}/activate")
def activate_prompt(prompt_id: str):
    if check_table_exists("system_prompts"):
        supabase = get_supabase_client()
        
        # Deactivate all
        active = supabase.table("system_prompts").select("id").eq("is_active", True).execute()
        for row in active.data:
            supabase.table("system_prompts").update({"is_active": False}).eq("id", row['id']).execute()
            
        # Activate target
        res = supabase.table("system_prompts").update({"is_active": True}).eq("id", prompt_id).execute()
        return res.data
    else:
        # File fallback
        if not PROMPTS_FILE.exists():
            raise HTTPException(status_code=404, detail="No prompts found")
            
        with open(PROMPTS_FILE, "r") as f:
            prompts = json.load(f)
            
        for p in prompts:
            p['is_active'] = (p['id'] == prompt_id)
            
        with open(PROMPTS_FILE, "w") as f:
            json.dump(prompts, f, indent=2)
            
        return [p for p in prompts if p['id'] == prompt_id]


# --- Knowledge Base ---

class KnowledgeItem(BaseModel):
    id: Optional[Any] = None
    content: str
    metadata: Optional[Dict[str, Any]] = {}

@router.get("/knowledge", response_model=List[KnowledgeItem])
def get_knowledge():
    try:
        supabase = get_supabase_client()
        if not supabase:
            return []
        # Check if table exists manually to avoid error 500
        res = supabase.table("knowledge_docs").select("id, content, metadata").limit(100).execute() 
        return res.data
    except Exception as e:
        print(f"Error fetching knowledge: {e}")
        return []

@router.post("/knowledge")
def add_knowledge(item: KnowledgeItem):
    # We use the vector store logic to add, to ensure embeddings are generated
    from app.brain.knowledge_base import ingest_text
    
    try:
        ingest_text(item.content, item.metadata)
        return {"status": "success", "message": "Item queued for ingestion"}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.delete("/knowledge/{item_id}")
def delete_knowledge(item_id: str):
    supabase = get_supabase_client()
    res = supabase.table("knowledge_docs").delete().eq("id", item_id).execute()
    return res.data

# --- File Processing ---

from fastapi import UploadFile, File
import pandas as pd
from io import BytesIO

@router.post("/knowledge/upload")
async def upload_knowledge_file(file: UploadFile = File(...), metadata: str = None):
    """
    Sube y procesa archivos (Excel, CSV, DOCX, TXT) para la base de conocimientos.
    """
    from app.brain.knowledge_base import ingest_text
    import json
    
    try:
        content = ""
        filename = file.filename.lower()
        meta = json.loads(metadata) if metadata else {}
        meta["source_file"] = file.filename
        
        # Read file content
        file_content = await file.read()
        
        # Process based on file type
        if filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(file_content))
            content = df.to_markdown(index=False)
            meta["file_type"] = "csv"
            
        elif filename.endswith(('.xls', '.xlsx')):
            # Read all sheets
            xls = pd.ExcelFile(BytesIO(file_content))
            parts = []
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(xls, sheet_name=sheet_name)
                parts.append(f"## Sheet: {sheet_name}\n" + df.to_markdown(index=False))
            content = "\n\n".join(parts)
            meta["file_type"] = "excel"
            
        elif filename.endswith('.docx'):
            from docx import Document
            doc = Document(BytesIO(file_content))
            content = "\n".join([para.text for para in doc.paragraphs])
            meta["file_type"] = "docx"
            
        elif filename.endswith('.txt') or filename.endswith('.md'):
            content = file_content.decode('utf-8')
            meta["file_type"] = "text"
            
        else:
            raise HTTPException(status_code=400, detail="Formato de archivo no soportado. Use CSV, Excel, Word o Texto.")
            
        if not content.strip():
            raise HTTPException(status_code=400, detail="El archivo está vacío o no se pudo extraer texto.")

        # Ingest content
        ingest_text(content, meta)
        
        return {"status": "success", "message": f"Archivo {file.filename} procesado e indexado correctamente.", "chars_extracted": len(content)}
        
    except Exception as e:
        print(f"Error processing file upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
