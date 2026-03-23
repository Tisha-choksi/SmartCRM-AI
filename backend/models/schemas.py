# backend/models/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None

class DealCreate(BaseModel):
    title: str
    value: float = 0
    stage: str = "lead"
    contact_id: Optional[str] = None