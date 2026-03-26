# backend/routers/vision.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.vision_service import extract_contact_from_image, analyze_screenshot

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg": "image/jpeg",
    "image/jpg":  "image/jpeg",
    "image/png":  "image/png",
    "image/webp": "image/webp",
    "image/gif":  "image/gif",
}

@router.post("/scan-card")
async def scan_business_card(file: UploadFile = File(...)):
    mime = file.content_type or ""
    if mime not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {mime}. Use JPG, PNG or WEBP.")

    image_bytes = await file.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image too large. Max 10MB.")

    result = extract_contact_from_image(image_bytes, ALLOWED_TYPES[mime])
    return {"extracted": result, "filename": file.filename}

@router.post("/analyze-screenshot")
async def analyze_image_screenshot(file: UploadFile = File(...)):
    mime = file.content_type or ""
    if mime not in ALLOWED_TYPES:
        raise HTTPException(400, "Unsupported file type.")

    image_bytes = await file.read()
    summary = analyze_screenshot(image_bytes, ALLOWED_TYPES[mime])
    return {"summary": summary}