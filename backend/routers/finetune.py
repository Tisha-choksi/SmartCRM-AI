# backend/routers/finetune.py
from fastapi import APIRouter
from pydantic import BaseModel
import httpx, os
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
load_dotenv()

router = APIRouter()
OLLAMA_URL = "http://localhost:11434"

class EmailRequest(BaseModel):
    instruction: str

@router.post("/generate-base")
async def generate_base(body: EmailRequest):
    """Generate email using base Groq model (for comparison)"""
    llm = ChatGroq(
        api_key=os.environ["GROQ_API_KEY"],
        model_name="llama-3.3-70b-versatile",
        temperature=0.7
    )
    result = llm.invoke([HumanMessage(content=body.instruction)])
    return {"email": result.content, "model": "Groq LLaMA-3 (base)"}

@router.post("/generate-finetuned")
async def generate_finetuned(body: EmailRequest):
    """Generate email using fine-tuned Ollama model"""
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": "smartcrm-email",
                    "prompt": f"### Instruction:\n{body.instruction}\n\n### Response:\n",
                    "stream": False
                }
            )
            data = res.json()
            return {"email": data.get("response",""), "model": "Fine-tuned Mistral-7B"}
    except Exception as e:
        return {"email": f"Ollama not running: {str(e)}", "model": "Fine-tuned Mistral-7B"}

@router.get("/ollama-status")
async def ollama_status():
    """Check if Ollama is running"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(f"{OLLAMA_URL}/api/tags")
            models = [m["name"] for m in res.json().get("models",[])]
            return {"running": True, "models": models}
    except:
        return {"running": False, "models": []}