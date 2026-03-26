from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from services.vision_service import extract_contact_from_image, analyze_screenshot

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg": "image/jpeg",
    "image/jpg":  "image/jpeg",
    "image/png":  "image/png",
    "image/webp": "image/webp",
}

@router.post("/scan-card")
async def scan_business_card(file: UploadFile = File(...)):
    try:
        mime = file.content_type or ""
        if mime not in ALLOWED_TYPES:
            raise HTTPException(400, f"Unsupported file type: {mime}")

        image_bytes = await file.read()

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(400, "Image too large. Max 10MB.")

        result = extract_contact_from_image(image_bytes, ALLOWED_TYPES[mime])
        return {"extracted": result, "filename": file.filename}

    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=200,  # return 200 so CORS headers are included
            content={
                "extracted": {
                    "name": None, "company": None, "title": None,
                    "email": None, "phone": None, "website": None,
                    "error": str(e)
                },
                "filename": file.filename
            }
        )