# backend/services/agent_service.py
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
import os
from dotenv import load_dotenv
load_dotenv()

def get_llm():
    return ChatGroq(
        api_key=os.environ["GROQ_API_KEY"],
        model_name="llama-3.3-70b-versatile",
        temperature=0.3
    )

@tool
def draft_followup_email(contact_name: str, company: str, deal_title: str, days_stale: int) -> str:
    """Draft a personalized follow-up email for a stale deal."""
    llm = get_llm()
    prompt = f"""Write a short, professional follow-up email for:
- Contact: {contact_name} at {company}
- Deal: {deal_title}
- Days since last contact: {days_stale}

Keep it under 100 words. Be warm but concise. Don't mention the days stale.
Return only the email body, no subject line."""
    result = llm.invoke([HumanMessage(content=prompt)])
    return result.content

@tool
def research_company(company_name: str) -> str:
    """Research a company and return key business information."""
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY",""))
        result = client.search(
            query=f"{company_name} company overview industry size revenue",
            max_results=3
        )
        summaries = [r.get("content","") for r in result.get("results",[])]
        return "\n".join(summaries[:3])
    except Exception:
        return f"Could not research {company_name}. Check TAVILY_API_KEY in .env"

@tool
def summarize_pipeline(deals_json: str) -> str:
    """Generate a pipeline digest summary from deals data."""
    llm = get_llm()
    prompt = f"""Generate a concise weekly pipeline digest from this deals data:
{deals_json}

Format as:
- Total deals and total value
- Breakdown by stage
- Top 3 deals to focus on this week
- Any deals that need urgent attention

Keep it under 200 words."""
    result = llm.invoke([HumanMessage(content=prompt)])
    return result.content

@tool
def suggest_next_action(deal_title: str, stage: str, days_stale: int, contact_name: str) -> str:
    """Suggest the best next action for a specific deal."""
    llm = get_llm()
    prompt = f"""For a CRM deal, suggest the single best next action:
- Deal: {deal_title}
- Stage: {stage}
- Contact: {contact_name}
- Days since last touch: {days_stale}

Give one specific, actionable recommendation in 1-2 sentences."""
    result = llm.invoke([HumanMessage(content=prompt)])
    return result.content

TOOLS = [draft_followup_email, research_company, summarize_pipeline, suggest_next_action]

def run_agent(task: str) -> dict:
    agent = create_react_agent(get_llm(), TOOLS)
    result = agent.invoke({"messages": [HumanMessage(content=task)]})
    messages = result.get("messages", [])
    final = messages[-1].content if messages else "No response"
    return {"result": final, "steps": len(messages)}