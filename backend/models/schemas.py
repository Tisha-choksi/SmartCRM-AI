from pydantic import BaseModel
from typing import Optional


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


class DealUpdate(BaseModel):
    title: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    contact_id: Optional[str] = None
    last_touch: Optional[str] = None
