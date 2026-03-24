# backend/routers/rag.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from services.chunker import extract_text_from_pdf, extract_text_from_txt, chunk_text
from services.embedder import add_documents
from services.rag_chain import ask_question

router = APIRouter()

class QuestionRequest(BaseModel):
    question: str
    contact_id: str

@router.post("/upload/{contact_id}")
async def upload_document(contact_id: str, file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "document"

    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
    elif filename.endswith(".txt"):
        text = extract_text_from_txt(content)
    else:
        raise HTTPException(400, "Only PDF and TXT files supported")

    if not text.strip():
        raise HTTPException(400, "Could not extract text from file")

    chunks = chunk_text(text)
    add_documents(
        collection_name=f"contact_{contact_id}",
        chunks=chunks,
        metadata={"filename": filename, "contact_id": contact_id}
    )

    return {
        "message": f"Uploaded and indexed {len(chunks)} chunks",
        "filename": filename,
        "chunks": len(chunks)
    }

@router.post("/ask")
async def ask(body: QuestionRequest):
    result = ask_question(
        collection_name=f"contact_{body.contact_id}",
        question=body.question
    )
    return result