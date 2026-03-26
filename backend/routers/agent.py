# backend/routers/agent.py
from fastapi import APIRouter
from pydantic import BaseModel
from services.agent_service import (
    run_agent, draft_followup_email,
    summarize_pipeline, suggest_next_action,
    research_company
)
import json

router = APIRouter()

class AgentRequest(BaseModel):
    task: str

class FollowupRequest(BaseModel):
    contact_name: str
    company: str
    deal_title: str
    days_stale: int

class DigestRequest(BaseModel):
    deals: list

class ResearchRequest(BaseModel):
    company_name: str

class NextActionRequest(BaseModel):
    deal_title: str
    stage: str
    days_stale: int
    contact_name: str

@router.post("/run")
def run_agent_task(body: AgentRequest):
    result = run_agent(body.task)
    return result

@router.post("/draft-email")
def draft_email(body: FollowupRequest):
    email = draft_followup_email.invoke({
        "contact_name": body.contact_name,
        "company":      body.company,
        "deal_title":   body.deal_title,
        "days_stale":   body.days_stale
    })
    return {"email": email}

@router.post("/pipeline-digest")
def pipeline_digest(body: DigestRequest):
    digest = summarize_pipeline.invoke({
        "deals_json": json.dumps(body.deals, indent=2)
    })
    return {"digest": digest}

@router.post("/research")
def research(body: ResearchRequest):
    info = research_company.invoke({"company_name": body.company_name})
    return {"info": info}

@router.post("/next-action")
def next_action(body: NextActionRequest):
    suggestion = suggest_next_action.invoke({
        "deal_title":   body.deal_title,
        "stage":        body.stage,
        "days_stale":   body.days_stale,
        "contact_name": body.contact_name
    })
    return {"suggestion": suggestion}

