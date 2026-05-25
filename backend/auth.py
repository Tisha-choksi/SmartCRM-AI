import os
from fastapi import Depends, HTTPException, Header
from supabase import create_client

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ.get("SUPABASE_ANON_KEY", os.environ["SUPABASE_SERVICE_KEY"])
)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    try:
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
