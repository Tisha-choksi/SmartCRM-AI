from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
from routers import contacts, deals, rag, vision, agent, finetune

app = FastAPI(title="SmartCRM API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://smartcrmai.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(deals.router,    prefix="/deals",    tags=["deals"])
app.include_router(rag.router,      prefix="/rag",      tags=["rag"])
app.include_router(vision.router,   prefix="/vision",   tags=["vision"])
app.include_router(agent.router,    prefix="/agent",    tags=["agent"])
app.include_router(finetune.router, prefix="/finetune", tags=["finetune"])

@app.get("/health")
def health():
    return {"status": "ok"}