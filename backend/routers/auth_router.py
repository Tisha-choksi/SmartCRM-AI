from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.database import get_db
from db.models import User
from auth import hash_password, verify_password, create_access_token, get_current_user
from uuid import uuid4

router = APIRouter()


class AuthRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
async def signup(body: AuthRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(id=uuid4(), email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "access_token": create_access_token(str(user.id)),
        "token_type": "bearer",
        "email": user.email,
    }


@router.post("/login")
async def login(body: AuthRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")

    return {
        "access_token": create_access_token(str(user.id)),
        "token_type": "bearer",
        "email": user.email,
    }


@router.get("/me")
async def me(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return {"id": str(user.id), "email": user.email}
