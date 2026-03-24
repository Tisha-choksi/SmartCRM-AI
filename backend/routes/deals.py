from fastapi import APIRouter
from models.schemas import DealCreate
from db.supabase import get_client

router = APIRouter()

@router.get("/")
def list_deals():
    return get_client().table("deals").select("*").execute().data

@router.post("/")
def create_deal(body: DealCreate):
    return get_client().table("deals").insert(body.dict()).execute().data[0]