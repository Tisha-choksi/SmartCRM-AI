# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import contacts, deals

app = FastAPI(title="SmartCRM API")
app.add_middleware(CORSMiddleware,
  allow_origins=["http://localhost:3000"],
  allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(deals.router,    prefix="/deals",    tags=["deals"])

@app.get("/health")
def health(): return {"status": "ok"}