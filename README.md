# DocIntel — AI-Powered Document Intelligence Platform

> **IBEE Analytics Developer Assessment** — A full-stack platform for extracting structured insights from PDF and TXT documents using Google Gemini AI.

---

## 📋 Project Overview

DocIntel lets users upload a resume or document, configure analysis settings, and receive:
- An **AI-generated summary** (Brief / Detailed / Bullet-point styles)
- **Structured extraction** of name, email, skills, education, and work experience
- A **skills visualisation** chart (Chart.js horizontal bar)
- A **completeness score** based on field presence rules (not an AI confidence metric)
- An **adaptive analysis** at Basic / Standard / Detailed depth

The system uses Google Gemini (`gemini-2.0-flash`) for all AI tasks and falls back to a clearly labelled **demo mode** when no API key is configured.

---

## 🛠 Technologies Used

| Layer       | Technology |
|-------------|-----------|
| Frontend    | React 18 + Vite 5 + JavaScript |
| Styling     | Vanilla CSS (custom dark design system) |
| Charts      | Chart.js 4 + react-chartjs-2 |
| Backend     | Python 3.10+ + Flask 3 |
| AI          | Google Gemini API (`google-genai` SDK) |
| PDF parsing | PyMuPDF (`fitz`) |
| Config      | python-dotenv |
| CORS        | flask-cors |

---

## 📂 Project Structure

```
document-intelligence/
├── backend/
│   ├── app.py              # Flask API
│   ├── requirements.txt
│   ├── .env.example        # Template — copy to .env
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadSection.jsx
│   │   │   ├── SummaryPanel.jsx
│   │   │   ├── ExtractedInfoPanel.jsx
│   │   │   ├── SkillsChart.jsx
│   │   │   ├── CompletenessIndicator.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api.js
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Execution

### Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)
- A **Google Gemini API key** (obtainable at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone / extract the project

```bash
cd document-intelligence
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env          # Windows
# cp .env.example .env          # macOS/Linux

# Edit .env and set your API key (see Environment Variables section)
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate         # Windows
python app.py
```
Backend starts at `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Frontend starts at `http://localhost:5173`

Open `http://localhost:5173` in your browser.

---

## 🔑 Environment Variable Configuration

Create `backend/.env` from the template:

```env
GEMINI_API_KEY=your_actual_api_key_here
FLASK_ENV=development
FLASK_PORT=5000
```

| Variable        | Required | Description |
|-----------------|----------|-------------|
| `GEMINI_API_KEY`| **Yes** (for AI) | Your Google Gemini API key |
| `FLASK_ENV`     | No       | `development` enables Flask debug mode |
| `FLASK_PORT`    | No       | Port to run Flask on (default: `5000`) |

> ⚠️ **Never commit `.env` to source control.** It is in `.gitignore`.

Without a valid key, the app runs in **Demo Mode** with pre-generated sample data clearly labeled.

Frontend environment variable (optional, for production deployment):
```env
VITE_API_BASE_URL=https://your-backend-url.com
```
In development, Vite proxies `/api/*` to `localhost:5000` automatically.

---

## 🔌 API Endpoints

### `GET /api/health`
Health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00+00:00",
  "gemini_configured": true,
  "version": "1.0.0"
}
```

---

### `POST /api/upload`
Upload and analyse a document.

**Request:** `multipart/form-data`

| Field            | Type   | Required | Values |
|-----------------|--------|----------|--------|
| `file`           | File   | ✅       | `.pdf` or `.txt`, max 10 MB |
| `summary_style`  | string | No       | `brief` (default), `detailed`, `bullet` |
| `analysis_level` | string | No       | `basic`, `standard` (default), `detailed` |
| `fields`         | string | No       | Comma-separated: `Skills,Education,Experience,...` |

**Success Response (200):**
```json
{
  "demo_mode": false,
  "filename": "resume.pdf",
  "char_count": 2847,
  "summary": "...",
  "extracted": {
    "name": "Alex Johnson",
    "email": "alex@email.com",
    "phone": "+1 555 123 4567",
    "skills": ["Python", "React", "..."],
    "education": [{ "degree": "...", "institution": "...", "year": "..." }],
    "experience": [{ "title": "...", "company": "...", "duration": "...", "description": "..." }],
    "certifications": ["..."],
    "summary_profile": "..."
  },
  "completeness": {
    "percentage": 86,
    "present_fields": ["Candidate name", "Email address", "..."],
    "missing_fields": ["Phone number"],
    "note": "Completeness is calculated by checking which standard resume fields are present..."
  },
  "analysis": "..."
}
```

**Error Responses:**

| Status | Meaning |
|--------|---------|
| 400    | No file, empty file, or missing `file` field |
| 413    | File exceeds 10 MB |
| 422    | Unreadable/empty document |
| 503    | Gemini API unavailable |

---

## 🧪 How to Test the Features

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Upload & Analyse (with curl)
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@/path/to/resume.pdf" \
  -F "summary_style=bullet" \
  -F "analysis_level=detailed" \
  -F "fields=Skills,Experience"
```

### UI Testing Flow
1. Open `http://localhost:5173`
2. Click **Load Sample** to pre-load the built-in sample resume
3. Choose **Bullet** summary and **Detailed** analysis
4. Select **Skills** and **Experience** fields
5. Click **Analyse Document**
6. Verify: Summary, Extracted Info, Skills Chart, Completeness score, Analysis panel all render
7. Test PDF upload by uploading any real resume PDF
8. Test error handling by uploading a `.jpg` file (should show validation error)

---

## 🤖 AI Extraction & Validation Logic

### Extraction Process
1. Text is extracted from PDF (PyMuPDF) or read from TXT
2. A structured prompt is sent to `gemini-2.0-flash` requesting JSON conforming to a fixed schema
3. The response is parsed and validated with `validate_extracted()`, which:
   - Ensures all required keys are present
   - Coerces incorrect types (e.g., non-list to empty list)
   - Adds a `_parse_warning` flag if JSON decoding fails

### Completeness Calculation
Completeness is **not** an AI confidence score. It is calculated deterministically:

| Field | Weight |
|-------|--------|
| Name | 15% |
| Email | 10% |
| Skills | 20% |
| Education | 20% |
| Experience | 25% |
| Phone | 5% |
| Summary Profile | 5% |

The percentage shown equals `sum(weights of present fields) / total weight × 100`.

### AI Grounding Rules
- All prompts explicitly instruct Gemini to use only information present in the document
- The phrase "Do NOT invent or infer information" appears in every prompt
- Missing fields return `null` (scalars) or `[]` (lists), never fabricated data

---

## ⚠️ Known Limitations

1. **Image-only PDFs**: If a PDF contains only scanned images (no embedded text), PyMuPDF cannot extract text. The API returns a clear error message. OCR is not implemented.
2. **Very long documents**: Text is truncated at 8,000 characters before sending to Gemini to avoid token limit errors.
3. **Gemini JSON reliability**: Occasionally Gemini may not return valid JSON. The backend catches `json.JSONDecodeError` and returns a partial result with a warning.
4. **No authentication**: The API has no auth layer — suitable for assessment/demo purposes only.
5. **Rate limiting**: Gemini free-tier limits apply. Heavy usage may trigger 429 errors.
6. **Non-English documents**: Extraction accuracy may be reduced for non-English resumes.

---

## 🚀 Deployment

### Backend — Render (recommended)

1. Push code to GitHub (ensure `.env` is in `.gitignore`)
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app:app`
   - **Root directory:** `backend`
4. Add environment variable: `GEMINI_API_KEY=<your_key>`
5. Note the deployed URL (e.g., `https://docintel-api.onrender.com`)

### Frontend — Vercel

1. Create a new project on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_BASE_URL=https://docintel-api.onrender.com`
4. Deploy

> **Note:** No public demo URL is claimed here because deployment has not been verified in this submission.

---

## 📄 License

Built for the IBEE Analytics developer assessment. Not for production use.
