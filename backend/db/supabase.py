# backend/db/supabase.py
from supabase import create_client
import os
from dotenv import load_dotenv
load_dotenv()

def get_client():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )

# backend/routers/contacts.py
from fastapi import APIRouter, HTTPException
from models.schemas import ContactCreate
from db.supabase import get_client

router = APIRouter()

@router.get("/")
def list_contacts():
    return get_client().table("contacts").select("*").execute().data

@router.post("/")
def create_contact(body: ContactCreate):
    return get_client().table("contacts").insert(body.dict()).execute().data[0]

@router.get("/{contact_id}")
def get_contact(contact_id: str):
    res = get_client().table("contacts").select("*").eq("id", contact_id).single().execute()
    if not res.data: raise HTTPException(404, "Not found")
    return res.data

@router.delete("/{contact_id}")
def delete_contact(contact_id: str):
    get_client().table("contacts").delete().eq("id", contact_id).execute()
    return {"deleted": True}