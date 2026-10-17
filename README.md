# DriveLens AI: Driving Licence Document Reader, Auto-Populator & Q&A Assistant

An AI-powered web application that reads driving licence documents (images and PDFs), extracts structured information with high fidelity, automatically populates an editable verification form, and provides a conversational AI interface strictly grounded in the document.

---

## 🚀 Key Features

### 1. Document Upload & Processing
- Supports **PNG, JPG, JPEG, WEBP, and PDF** documents.
- Includes **1-Click Preloaded Testing Samples**:
  - **Sample 1**: Maharashtra State Driving Licence (Rohan Anil Deshmukh)
  - **Sample 2**: National Capital Territory of Delhi Driving Licence (Priya Sharma)
  - **Combined Sheet**: Multi-licence composite image testing automatic multi-card detection.
- Multi-page PDF extraction with PyMuPDF rendering pages at 150 DPI for crystal clear OCR.

### 2. Document Reading & Structured Extraction
- Powered by **Google Gemini 2.5 Flash** multimodal vision engine.
- Extracts all essential identity and vehicle authorization attributes:
  - **Full Name**
  - **Driving Licence Number**
  - **Date of Birth**
  - **Date of Issue (DOI)**
  - **Date of Expiry / Valid Till**
  - **Full Registered Address & State**
  - **Authorized Vehicle / Licence Classes (COV)** (e.g. LMV, MCWG) with category descriptions
  - **Issuing Authority / RTO**
  - **S/D/W (Father/Spouse Name)**
  - **Blood Group**
  - **Restrictions & Conditions**
- Computes **visual bounding box coordinates** (percentage coordinates) for visual grounding.
- Built-in deterministic fallback engine ensures seamless testing even when offline.

### 3. Review & Edit Form
- Automatically populates a structured, clean review form.
- Real-time field validation (format check for dates, licence numbers, and required fields).
- Change tracking: clearly indicates which fields are **AI-Extracted** vs **User-Edited**.
- Interactive Vehicle Class tag manager (add/remove classes).
- **Export to JSON**, **Copy to Clipboard**, and **Save to Disk** actions.
- Revert changes anytime with **Reset to AI Extracted**.

### 4. Interactive Document & Data View (Split Workspace)
- Side-by-side view with responsive layout.
- High-resolution pan and zoom controls (Zoom In, Zoom Out, Fit, Reset).
- **Bidirectional Visual Grounding**:
  - Hovering over a form field on the right highlights the exact bounding box on the licence image.
  - Hovering over a bounding box on the image displays the field tag and brings attention to the form field.
  - Multi-card switcher for composite images containing multiple driving licences.

### 5. Grounded Document Q&A ("Ask the Document")
- Interactive conversational AI interface for asking questions about the uploaded document.
- Suggested prompt chips:
  - *"What is the licence expiry date?"*
  - *"What vehicles is this person authorised to drive?"*
  - *"What is the licence number?"*
  - *"What is the registered address?"*
  - *"Who is the issuing authority?"*
- **Strict Anti-Hallucination Guardrails**:
  - If a user asks for information not present on the document (e.g., phone number, email, salary, insurance, plate number), the AI explicitly responds:
    > *"The uploaded document does not contain this information."*
  - All valid answers include source citations pointing to the exact section of the driving licence.

---

## 🏗️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       Client (Browser)                      │
│     React 18 + Vite 5 + Tailwind CSS + Lucide Icons         │
│  - Split Document Viewer (Pan/Zoom & Grounding Overlays)   │
│  - Auto-Populated Form (Review, Edit & Validation)          │
│  - Document Q&A Chat (Grounded Citations & Prompt Chips)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON / Multipart
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Python)                 │
│  - Upload & File Security (Extension, MIME & Size limits)   │
│  - PyMuPDF (PDF -> High-DPI Page Image Conversion)          │
│  - Pillow (EXIF Normalization & Image Pre-processing)       │
│  - Gemini Multimodal Vision API (Extraction & Grounding)    │
│  - Anti-Hallucination RAG Document Q&A Service              │
│  - Deterministic Fallback & Validation Pipeline             │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 18, Vite 5.4, Tailwind CSS 3.4, Lucide React icons.
- **Backend**: FastAPI 0.143, Python 3.10, Pydantic v2, Uvicorn, PyMuPDF, Pillow.
- **AI/LLM**: Google Gemini 2.5 Flash multimodal vision & chat.

---

## 🛠️ AI Tools Used in Development

This project was built pair-programming with:
- **Google Antigravity Agentic AI (Gemini 3.8 Flash)**: Full-stack architecture design, schema design, backend API development, multimodal prompt engineering, frontend component development, and automated testing.
- **Google Gemini 2.5 Flash API**: Live multimodal document vision extraction and grounded conversational Q&A.

---

## 🚦 How to Run the Application

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Backend Setup & Startup
```powershell
cd C:\Users\prasa\.gemini\antigravity\scratch\driving-licence-ai\backend
python -m uvicorn main:app --port 8000 --host 127.0.0.1
```
The backend will run on `http://127.0.0.1:8000`. Swagger API docs are available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup & Startup
```powershell
cd C:\Users\prasa\.gemini\antigravity\scratch\driving-licence-ai\frontend
npm run dev
```
Open **`http://127.0.0.1:5173/`** in your browser.

---

## ☁️ Deployment Guide

The application is structured for **Unified Single-Service Deployment** where FastAPI serves both the React SPA and the API on a single port.

### Option 1: Render.com (Recommended Free / Low-Cost)
1. Push this project folder to a GitHub repository.
2. In [Render Dashboard](https://dashboard.render.com/), click **New** > **Web Service**.
3. Connect your GitHub repository.
4. Select **Docker** as the Environment (it automatically detects the provided [`Dockerfile`](file:///C:/Users/prasa/.gemini/antigravity/scratch/driving-licence-ai/Dockerfile)).
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *Your Gemini API key*
   - `GEMINI_MODEL`: `gemini-2.5-flash`
6. Click **Create Web Service**. Your app will be live on `https://your-app.onrender.com`.

### Option 2: Railway.app (Fastest 1-Click)
1. Push to GitHub.
2. In [Railway](https://railway.app/), click **New Project** > **Deploy from GitHub repo**.
3. Add the `GEMINI_API_KEY` variable under service settings.
4. Railway will automatically build the Dockerfile and generate a public HTTPS URL.

### Option 3: Hugging Face Spaces (100% Free AI Demo)
1. Create a new Space at [huggingface.co/spaces](https://huggingface.co/spaces) selecting the **Docker** SDK.
2. Push this repository to your Space.
3. Add your `GEMINI_API_KEY` in the Space **Repository Secrets**.

### Option 4: Docker / VPS / Cloud Run
```bash
# Build the unified image
docker build -t drivelens-ai .

# Run locally or on any server
docker run -p 8000:8000 -e GEMINI_API_KEY="your-api-key" drivelens-ai
```

---

## 🔒 Security & Quality Considerations
1. **File Type & Size Validation**: Enforces maximum upload size (15MB) and validates file extensions and MIME headers to prevent malicious file execution.
2. **Path Traversal Protection**: All uploaded files are stored in isolated UUID directories (`uploads/{uuid}/`).
3. **API Key Security**: The Gemini API key is managed server-side via environment variables (`.env`). The client UI masks sensitive key characters.
4. **Zero-Hallucination System Prompting**: Document Q&A prompts are conditioned on explicit visual facts and instruct the model to refuse queries for absent fields.

