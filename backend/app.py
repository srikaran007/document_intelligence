"""
AI-Powered Document Intelligence Platform — Flask Backend
Author: IBEE Analytics Assessment
"""

import os
import json
import tempfile
import traceback
from datetime import datetime, timezone

import fitz  # PyMuPDF
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import google api core exceptions for ServiceUnavailable handling
try:
    from google.api_core import exceptions as google_exceptions
except ImportError:
    # Minimal fallback definition if library not installed
    class _ServiceUnavailable(Exception):
        pass
    google_exceptions = type('google_exceptions', (), {'ServiceUnavailable': _ServiceUnavailable})

load_dotenv()

app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]}})

# ── Config ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MAX_FILE_BYTES = 10 * 1024 * 1024        # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".txt"}

# ── Gemini client (lazy) ──────────────────────────────────────────────────────
_gemini_client = None


def get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
            return None
        try:
            from google import genai
            _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        except Exception as exc:
            app.logger.error("Failed to create Gemini client: %s", exc)
            return None
    return _gemini_client


# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_text_from_file(filepath: str, ext: str) -> str:
    """Return plain text from a PDF or TXT file."""
    if ext == ".pdf":
        doc = fitz.open(filepath)
        pages = [page.get_text() for page in doc]
        doc.close()
        text = "\n".join(pages).strip()
        if not text:
            raise ValueError("PDF appears to be empty or image-only — no extractable text found.")
        return text
    else:  # .txt
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            text = f.read().strip()
        if not text:
            raise ValueError("Text file is empty.")
        return text



def _call_gemini(prompt: str) -> str:
    """Call Gemini with robust handling for transient 503 errors.
    - Attempts up to 3 times with exponential backoff for ServiceUnavailable (HTTP 503).
    - If the primary model (`gemini-3.8-flash`) keeps failing, it falls back to `gemini-3.6-flash`.
    - Logs each failure and raises a clear RuntimeError on final failure.
    - Uses the SDK's default timeout (the installed version does not expose a timeout argument).
    """
    import time



    client = get_gemini_client()
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    primary_model = "gemini-3.8-flash"
    fallback_model = "gemini-3.6-flash"
    max_attempts = 3
    backoff = 1  # initial seconds

    def attempt_call(model_name: str) -> str:
        for attempt in range(1, max_attempts + 1):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                if hasattr(response, "text") and response.text:
                    return response.text.strip()
                # Fallback for multipart response
                parts = []
                try:
                    candidates = response.candidates
                    if candidates:
                        for part in candidates[0].content.parts:
                            if hasattr(part, "text"):
                                parts.append(part.text)
                except Exception:
                    pass
                return "".join(parts).strip()
            except google_exceptions.ServiceUnavailable as exc:
                # 503 – transient service error
                app.logger.error("Gemini ServiceUnavailable (503) on attempt %d for model %s: %s", attempt, model_name, exc)
                if attempt == max_attempts:
                    raise
                time.sleep(backoff)
                backoff *= 2
            except Exception as exc:
                # Non‑retryable errors (e.g., invalid key, bad request)
                app.logger.error("Gemini non‑retryable error on model %s: %s", model_name, exc)
                raise
        # Should never reach here
        raise RuntimeError("Gemini call exhausted without returning a response.")

    try:
        return attempt_call(primary_model)
    except google_exceptions.ServiceUnavailable:
        # Primary model unavailable after retries – try fallback once (with its own retries)
        app.logger.warning("Primary model %s unavailable, switching to fallback model %s.", primary_model, fallback_model)
        # Reset backoff for fallback attempts
        backoff = 1
        return attempt_call(fallback_model)
    except Exception as exc:
        # Propagate other errors
        raise RuntimeError(f"Gemini API error: {exc}")

    """Call Gemini with retries and timeout.
    - Uses the updated model `gemini-3.8-flash`.
    - Retries up to 3 times with exponential backoff for transient network errors.
    - Applies a 30‑second request timeout.
    - Logs each failure and raises a clean RuntimeError on final failure.
    """
    import time
    client = get_gemini_client()
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    max_attempts = 3
    backoff = 1  # seconds
    for attempt in range(1, max_attempts + 1):
        try:
            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=prompt,
            )
            # Normalise response to plain text
            if hasattr(response, "text") and response.text:
                return response.text.strip()
            # Fallback for multi‑part responses
            parts = []
            try:
                candidates = response.candidates
                if candidates:
                    for part in candidates[0].content.parts:
                        if hasattr(part, "text"):
                            parts.append(part.text)
            except Exception:
                pass
            return "".join(parts).strip()
        except Exception as exc:
            app.logger.error("Gemini API call attempt %d failed: %s", attempt, exc)
            if attempt == max_attempts:
                # After final attempt, raise a generic error for callers
                raise RuntimeError(f"Gemini API error after {max_attempts} attempts: {exc}")
            time.sleep(backoff)
            backoff *= 2  # exponential backoff
    """Call Gemini and return raw text, or raise RuntimeError.
    Handles API errors gracefully and uses the Interactions API via the client.
    """
    client = get_gemini_client()
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    try:
        # Using the Interactions API (client.models.generate_content) with the updated model name.
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
        )
        # The GenerationResponse may contain a 'text' attribute or a list of parts.
        if hasattr(response, "text"):
            return response.text.strip()
        # Fallback: concatenate all string parts.
        return "".join(part.text for part in response.candidates[0].content.parts if hasattr(part, "text")).strip()
    except Exception as exc:
        # Log the error for debugging but raise a clean RuntimeError for callers.
        app.logger.error("Gemini API call failed: %s", exc)
        raise RuntimeError(f"Gemini API error: {exc}")

    """Call Gemini and return raw text, or raise RuntimeError."""
    client = get_gemini_client()
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
    )
    return response.text.strip()


def generate_summary(text: str, style: str) -> str:
    style_instructions = {
        "brief": (
            "Write a concise 2-3 sentence summary of the document below. "
            "Focus only on the most essential points. "
            "Do NOT invent any information that is not in the document."
        ),
        "detailed": (
            "Write a thorough, multi-paragraph summary of the document below. "
            "Cover all major topics and details present in the text. "
            "Do NOT invent any information that is not in the document."
        ),
        "bullet": (
            "Summarise the document below as a list of clear bullet points. "
            "Each bullet must represent a distinct key point from the document. "
            "Do NOT invent any information that is not in the document."
        ),
    }
    instruction = style_instructions.get(style, style_instructions["brief"])
    prompt = f"""{instruction}

DOCUMENT:
\"\"\"
{text[:8000]}
\"\"\"

SUMMARY:"""
    return _call_gemini(prompt)


EXTRACT_SCHEMA = """{
  "name": "<full name or null>",
  "email": "<email address or null>",
  "phone": "<phone number or null>",
  "skills": ["<skill>", ...],
  "education": [
    {"degree": "...", "institution": "...", "year": "..."}
  ],
  "experience": [
    {"title": "...", "company": "...", "duration": "...", "description": "..."}
  ],
  "certifications": ["..."],
  "summary_profile": "<professional summary if present, else null>"
}"""


def extract_resume_fields(text: str) -> dict:
    prompt = f"""You are a precise resume parser. Extract structured information from the resume below.
Return ONLY valid JSON matching this schema exactly:
{EXTRACT_SCHEMA}

Rules:
- Use null for missing scalar fields.
- Use empty arrays [] for missing list fields.
- Do NOT invent or infer information not explicitly written in the resume.
- Skills must be individual technology/tool/language names, not sentences.
- For education and experience, include only entries clearly stated in the resume.

RESUME:
\"\"\"
{text[:8000]}
\"\"\"

JSON (no markdown fences):"""
    raw = _call_gemini(prompt)
    # Strip any markdown code fences if Gemini wraps its response
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    return json.loads(raw)


def validate_extracted(data: dict) -> dict:
    """Ensure the extracted dict has all required keys with correct types."""
    defaults = {
        "name": None,
        "email": None,
        "phone": None,
        "skills": [],
        "education": [],
        "experience": [],
        "certifications": [],
        "summary_profile": None,
    }
    result = {**defaults, **data}
    # Coerce types
    for list_key in ("skills", "education", "experience", "certifications"):
        if not isinstance(result[list_key], list):
            result[list_key] = []
    for scalar in ("name", "email", "phone", "summary_profile"):
        if not isinstance(result[scalar], (str, type(None))):
            result[scalar] = str(result[scalar])
    return result


def compute_completeness(data: dict) -> dict:
    """
    Calculate a completeness percentage based on predefined rules.
    This is NOT an AI confidence score — it simply checks field presence.
    """
    rules = [
        ("name",        bool(data.get("name")),            15, "Candidate name"),
        ("email",       bool(data.get("email")),           10, "Email address"),
        ("phone",       bool(data.get("phone")),            5, "Phone number"),
        ("skills",      len(data.get("skills", [])) > 0,   20, "Skills list"),
        ("education",   len(data.get("education", [])) > 0, 20, "Education details"),
        ("experience",  len(data.get("experience", [])) > 0, 25, "Work experience"),
        ("summary_profile", bool(data.get("summary_profile")), 5, "Professional summary"),
    ]
    total_weight = sum(w for _, _, w, _ in rules)
    earned = sum(w for _, present, w, _ in rules if present)
    missing = [label for _, present, _, label in rules if not present]
    present_fields = [label for _, present, _, label in rules if present]
    return {
        "percentage": round(earned / total_weight * 100),
        "missing_fields": missing,
        "present_fields": present_fields,
        "note": "Completeness is calculated by checking which standard resume fields are present. It is not an AI confidence score.",
    }


def generate_adaptive_analysis(text: str, level: str, fields: list) -> str:
    level_map = {
        "basic": "Provide a short, high-level overview (2-3 sentences per aspect).",
        "standard": "Provide a balanced analysis with specific observations and brief reasoning.",
        "detailed": "Provide an in-depth, structured analysis with evidence from the document, strengths, gaps, and recommendations.",
    }
    depth = level_map.get(level, level_map["standard"])
    if fields:
        aspect_list = ", ".join(fields)
        aspect_instruction = f"Focus your analysis only on these aspects: {aspect_list}."
    else:
        aspect_instruction = "Analyse all relevant aspects of the document."

    prompt = f"""You are an expert resume and document analyst.
{depth}
{aspect_instruction}
Ground every observation in the document text. Do NOT invent information.

DOCUMENT:
\"\"\"
{text[:8000]}
\"\"\"

ANALYSIS:"""
    return _call_gemini(prompt)


# ── Demo mode (no Gemini key) ─────────────────────────────────────────────────

DEMO_EXTRACTED = {
    "name": "Alex Johnson",
    "email": "alex.johnson@email.com",
    "phone": "+1 (555) 123-4567",
    "skills": ["Python", "JavaScript", "React", "Flask", "SQL", "Machine Learning",
               "Docker", "AWS", "Git", "REST APIs"],
    "education": [
        {"degree": "B.Sc. Computer Science", "institution": "State University", "year": "2019"},
        {"degree": "M.Sc. Data Science",     "institution": "Tech Institute",    "year": "2021"},
    ],
    "experience": [
        {
            "title": "Senior Software Engineer",
            "company": "Tech Corp",
            "duration": "Jan 2022 – Present",
            "description": "Led development of microservices architecture serving 1M+ users.",
        },
        {
            "title": "Software Engineer",
            "company": "StartupXYZ",
            "duration": "Jun 2019 – Dec 2021",
            "description": "Built full-stack web applications using React and Django.",
        },
    ],
    "certifications": ["AWS Certified Developer", "Google Professional Data Engineer"],
    "summary_profile": "Results-driven software engineer with 5+ years of experience building scalable web applications.",
}

DEMO_SUMMARY = {
    "brief": "⚠️ DEMO MODE — Gemini API key not configured.\n\nAlex Johnson is a results-driven software engineer with 5+ years of experience building scalable web applications using Python, JavaScript, and React. He holds a Master's in Data Science and has led projects serving over one million users.",
    "detailed": "⚠️ DEMO MODE — Gemini API key not configured.\n\nAlex Johnson is an experienced software engineer specialising in full-stack development and data engineering. His academic background includes a B.Sc. in Computer Science and an M.Sc. in Data Science. Professionally, he has progressed from building full-stack applications at StartupXYZ to leading microservices architecture at Tech Corp, where his systems now serve over one million users. His technical skill set is broad, spanning Python, JavaScript, React, Flask, SQL, Machine Learning, Docker, and AWS. He also holds industry certifications from AWS and Google.",
    "bullet": "⚠️ DEMO MODE — Gemini API key not configured.\n\n• Senior Software Engineer at Tech Corp (2022–Present) — microservices for 1M+ users\n• Software Engineer at StartupXYZ (2019–2021) — React + Django full-stack applications\n• M.Sc. Data Science, Tech Institute (2021)\n• B.Sc. Computer Science, State University (2019)\n• Skills: Python, JavaScript, React, Flask, SQL, ML, Docker, AWS\n• Certifications: AWS Developer, Google Professional Data Engineer",
}


def demo_response(style: str, level: str, fields: list) -> dict:
    extracted = validate_extracted(DEMO_EXTRACTED.copy())
    completeness = compute_completeness(extracted)
    field_filter = fields or []
    analysis_note = ""
    if level == "detailed":
        analysis_note = "\n\n⚠️ DEMO MODE: Detailed analysis is only available with a valid Gemini API key."
    elif level == "basic":
        analysis_note = "\n\n⚠️ DEMO MODE: This is a pre-generated sample response."
    else:
        analysis_note = "\n\n⚠️ DEMO MODE: Configure GEMINI_API_KEY for real AI-powered analysis."

    if field_filter:
        analysis_note += f"\n\nRequested fields: {', '.join(field_filter)}"

    return {
        "demo_mode": True,
        "demo_notice": "Gemini API key is not configured. This is pre-generated sample data — not AI output.",
        "summary": DEMO_SUMMARY.get(style, DEMO_SUMMARY["brief"]),
        "extracted": extracted,
        "completeness": completeness,
        "analysis": f"Sample analysis at '{level}' level.{analysis_note}",
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    gemini_configured = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_configured": gemini_configured,
        "version": "1.0.0",
    })


@app.route("/api/upload", methods=["POST"])
def upload_document():
    # ── 1. Validate file presence ─────────────────────────────────────────────
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    uploaded_file = request.files["file"]
    if not uploaded_file.filename:
        return jsonify({"error": "No file selected."}), 400

    filename = uploaded_file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": f"Unsupported file type '{ext}'. Please upload a PDF or TXT file."
        }), 400

    # ── 2. Read & size-check ──────────────────────────────────────────────────
    file_bytes = uploaded_file.read()
    if len(file_bytes) > MAX_FILE_BYTES:
        mb = MAX_FILE_BYTES // (1024 * 1024)
        return jsonify({"error": f"File is too large. Maximum allowed size is {mb} MB."}), 413

    if len(file_bytes) == 0:
        return jsonify({"error": "The uploaded file is empty."}), 400

    # ── 3. Extract options ────────────────────────────────────────────────────
    style = request.form.get("summary_style", "brief").lower()
    if style not in ("brief", "detailed", "bullet"):
        style = "brief"

    level = request.form.get("analysis_level", "standard").lower()
    if level not in ("basic", "standard", "detailed"):
        level = "standard"

    raw_fields = request.form.get("fields", "")
    fields = [f.strip() for f in raw_fields.split(",") if f.strip()] if raw_fields else []

    # ── 4. Extract text ───────────────────────────────────────────────────────
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            text = extract_text_from_file(tmp_path, ext)
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 422
        except Exception as exc:
            app.logger.error("Text extraction failed: %s", exc)
            return jsonify({"error": "Could not read the document. It may be corrupted or password-protected."}), 422

        # ── 5. AI or demo ─────────────────────────────────────────────────────
        gemini_configured = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")
        if not gemini_configured:
            result = demo_response(style, level, fields)
            result["filename"] = filename
            result["char_count"] = len(text)
            return jsonify(result), 200

        try:
            summary      = generate_summary(text, style)
            raw_extract  = extract_resume_fields(text)
            extracted    = validate_extracted(raw_extract)
            completeness = compute_completeness(extracted)
            analysis     = generate_adaptive_analysis(text, level, fields)
        except RuntimeError as re:
            return jsonify({"error": str(re)}), 503
        except json.JSONDecodeError:
            # Gemini returned malformed JSON — fall back to demo extraction
            extracted    = validate_extracted({})
            completeness = compute_completeness(extracted)
            summary      = generate_summary(text, style)   # still try summary
            analysis     = generate_adaptive_analysis(text, level, fields)
            extracted["_parse_warning"] = "Structured extraction failed; showing partial results."
        except Exception as exc:
            app.logger.error("Gemini call failed: %s\n%s", exc, traceback.format_exc())
            return jsonify({"error": f"AI processing failed: {str(exc)}"}), 503

        return jsonify({
            "demo_mode": False,
            "filename": filename,
            "char_count": len(text),
            "summary": summary,
            "extracted": extracted,
            "completeness": completeness,
            "analysis": analysis,
        }), 200

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "development") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
