import os
import json
import tempfile
import pdfplumber
from groq import Groq

_client = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def extract_text_from_pdf(file_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(file_bytes)
        tmp_path = f.name

    text = ""
    try:
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    finally:
        os.unlink(tmp_path)

    return text.strip()


SYSTEM_PROMPT = """You are a CV/resume parser. Extract structured information from the CV text and return ONLY a valid JSON object with these fields (omit fields not found in the CV):

{
  "full_name": "string",
  "headline": "string (current role/title, max 100 chars)",
  "bio": "string (professional summary, max 400 chars)",
  "skills": ["skill1", "skill2"],
  "major": "string (field of study / ixtisas)",
  "github_url": "string (full URL)",
  "linkedin_url": "string (full URL)",
  "website_url": "string (full URL)",
  "certificates": [
    {"name": "string", "issuer": "string", "issue_date": "YYYY-MM-DD or YYYY-MM or null"}
  ],
  "projects": [
    {"title": "string", "description": "string (max 300 chars)", "github_url": "string or null", "technologies": "tech1, tech2, tech3"}
  ]
}

Rules:
- Return ONLY the JSON object, no markdown, no explanation
- skills must be an array of strings
- dates must be ISO format or null
- If a URL is not a real URL, omit it
- Keep descriptions concise"""


def parse_cv(file_bytes: bytes) -> dict:
    text = extract_text_from_pdf(file_bytes)
    if not text:
        raise ValueError("PDF-dən mətn çıxarıla bilmədi")
    if len(text) > 12000:
        text = text[:12000]

    client = _get_client()
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Parse this CV:\n\n{text}"},
        ],
        temperature=0.1,
        max_tokens=2048,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code fences if model wraps in ```json ... ```
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError("AI cavabı parse edilə bilmədi")
