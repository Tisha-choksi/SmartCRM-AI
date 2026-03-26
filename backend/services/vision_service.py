# backend/services/vision_service.py
import google.generativeai as genai
import os, json, base64
from dotenv import load_dotenv
load_dotenv()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def extract_contact_from_image(image_bytes: bytes, mime_type: str) -> dict:
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = """You are extracting contact information from a business card image.
Extract the following fields and return ONLY a valid JSON object with no extra text:
{
  "name": "full name or null",
  "company": "company name or null",
  "title": "job title or null",
  "email": "email address or null",
  "phone": "phone number or null",
  "website": "website or null",
  "address": "address or null"
}
If a field is not visible or unclear, use null.
Return ONLY the JSON object, no markdown, no explanation."""

    image_part = {
        "mime_type": mime_type,
        "data": base64.b64encode(image_bytes).decode("utf-8")
    }

    response = model.generate_content([prompt, image_part])
    text = response.text.strip()

    # Clean up markdown code blocks if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "name": None, "company": None, "title": None,
            "email": None, "phone": None, "website": None, "address": None,
            "error": "Could not parse response"
        }

def analyze_screenshot(image_bytes: bytes, mime_type: str) -> str:
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = """Analyze this screenshot and provide a concise summary
of the key information shown. Focus on: pricing, features, company info,
or any relevant business data. Keep it under 200 words."""

    image_part = {
        "mime_type": mime_type,
        "data": base64.b64encode(image_bytes).decode("utf-8")
    }

    response = model.generate_content([prompt, image_part])
    return response.text.strip()