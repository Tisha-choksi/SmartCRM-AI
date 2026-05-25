from fastapi import APIRouter, Depends
from models.schemas import DealCreate
from db.supabase import get_client
from auth import get_current_user
from limiter import limiter

router = APIRouter(dependencies=[Depends(get_current_user), Depends(limiter.limit("30/minute"))])

@router.get("/")
def list_deals(user_id: str = Depends(get_current_user)):
    return get_client().table("deals").select("*").eq("user_id", user_id).execute().data

@router.post("/")
def create_deal(body: DealCreate, user_id: str = Depends(get_current_user)):
    data = body.dict()
    data["user_id"] = user_id
    return get_client().table("deals").insert(data).execute().data[0]