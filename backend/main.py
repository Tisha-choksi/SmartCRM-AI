# backend/main.py — updated
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import contacts, deals, rag, vision

app = FastAPI(title="SmartCRM API")

app.add_middleware(CORSMiddleware,
  allow_origins=["http://localhost:3000",
                 "https://smartcrmai.vercel.app"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"]
)

app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(deals.router,    prefix="/deals",    tags=["deals"])
app.include_router(rag.router,      prefix="/rag",      tags=["rag"])
app.include_router(vision.router,   prefix="/vision",   tags=["vision"])

@app.get("/health")
def health(): return {"status": "ok"}