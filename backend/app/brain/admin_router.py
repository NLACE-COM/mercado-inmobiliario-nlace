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
    id: Optional[str] = None
    content: str
    is_active: bool = False
    label: str
    created_at: Optional[str] = None

@router.get("/prompts", response_model=List[SystemPrompt])
async def get_prompts():
    if check_table_exists("system_prompts"):
        supabase = get_supabase_client()
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
async def create_prompt(prompt: SystemPrompt):
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
async def activate_prompt(prompt_id: str):
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
    id: Optional[str] = None
    content: str
    metadata: Dict[str, Any]

@router.get("/knowledge", response_model=List[KnowledgeItem])
async def get_knowledge():
    supabase = get_supabase_client()
    # Assuming 'knowledge_docs' table exists from vector store
    res = supabase.table("knowledge_docs").select("id, content, metadata").limit(100).execute() 
    return res.data

@router.post("/knowledge")
async def add_knowledge(item: KnowledgeItem):
    # We use the vector store logic to add, to ensure embeddings are generated
    from app.brain.knowledge_base import ingest_text
    
    try:
        ingest_text(item.content, item.metadata)
        return {"status": "success", "message": "Item queued for ingestion"}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.delete("/knowledge/{item_id}")
async def delete_knowledge(item_id: str):
    supabase = get_supabase_client()
    res = supabase.table("knowledge_docs").delete().eq("id", item_id).execute()
    return res.data
