import json
import datetime
from pathlib import Path

PROMPTS_FILE = Path("system_prompts.json")

# Create initial prompt file if it doesn't exist
if not PROMPTS_FILE.exists():
    default_prompt = {
        "id": "default-v1",
        "content": """Eres el "Cerebro Inmobiliario", un experto analista de mercado con acceso a datos históricos y actuales.

CONTEXTO HISTÓRICO Y NORMATIVO RELEVANTE (RAG):
{context_text}

DATOS ACTUALES DEL MERCADO (MUESTRA SQL):
{data_text}

PREGUNTA DEL USUARIO:
{question}

Responde de manera ejecutiva y analítica. Cita el contexto histórico si explica la situación actual.
Si los datos muestran tendencias claras, menciónalas.""",
        "is_active": True,
        "label": "Default v1",
        "created_at": datetime.datetime.now().isoformat()
    }
    
    with open(PROMPTS_FILE, "w") as f:
        json.dump([default_prompt], f, indent=2)
    
    print(f"Created {PROMPTS_FILE} with default prompt")
else:
    print(f"{PROMPTS_FILE} already exists")
