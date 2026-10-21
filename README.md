# MEDI-TREND AI – Longitudinal Patient Report Intelligence Platform

> **Clinical Decision Support System (CDSS) • Document-Grounded Longitudinal Medical Intelligence**  
> *Non-Diagnostic • Decision-Support Only • Grounded in Source Documents*

---

## 🏥 Overview

**MEDI-TREND AI** is an enterprise hospital-grade web platform designed for clinicians, cardiologists, and healthcare institutions to ingest, validate, extract, and longitudinally compare multi-period medical laboratory reports for patients over time.

The platform provides deterministic mathematical delta verification, multi-report timeline navigation, dynamic parameter trend graphing, bilingual clinical summaries (**English & தமிழ்**), and a **futuristic medical holographic biometric animation** featuring an anatomically synchronized rhythmic heartbeat, vascular pulse waves, and live Lead-II ECG traces.

---

## 🌟 Key Capabilities

### 1. 🫀 Advanced Medical Holographic Visualization
- **Rhythmic Cardiac Pumping**: Realistic lub-dub contraction-expansion cycle at ~68 BPM (~0.9s loop).
- **Luminous Vascular Pulse Waves**: Sequential light waves traveling along the carotid arteries, subclavian/brachial pathways, and descending aorta.
- **Thoracic Respiration Motion**: Gentle, organic breathing expansion across the pulmonary fields.
- **Synchronized Lead-II ECG**: Live electrocardiogram trace synchronized with the cardiac cycle.
- **Layer Controls**: Full Body, Cardiac Focus, and Vascular Wave modes.

### 2. 📊 Selective Longitudinal Report Analysis
- Arbitrary N-way report selection (Report 1 & 2, 1+3+5, 1..5).
- Chronological pairwise step comparisons ($R_1 \rightarrow R_2, R_2 \rightarrow R_3, \dots$) plus overall longitudinal delta ($R_1 \rightarrow R_N$).
- 100% deterministic backend calculation of percentage and absolute changes ($\Delta\% = \frac{\text{After} - \text{Before}}{\text{Before}} \times 100$).
- Automatic trajectory classification: `Improved`, `Stable`, `Needs Monitoring`, `Worsened`, `Not Comparable`.

### 3. 🌐 Bilingual Clinical Summaries (English & Tamil)
- **English Summary**: Grounded, concise clinical observations per finding.
- **தமிழ் சுருக்கம் (Tamil Summary)**: High-precision medical Tamil terminology for regional clinical clarity.
- **AI Verified from Source Documents** badge and digital traceability.

### 4. 📄 Document Ingestion & Source Grounding
- Drag-and-drop PDF laboratory report parser (`pdfplumber` + OCR fallback).
- Canonical parameter mapping (`hs-CRP`, `Homocysteine`, `HDL Cholesterol`, `Triglycerides`, `LDL Cholesterol`, `HbA1c`, `Vitamin D`, `eGFR`, etc.).
- **View Source** modal displaying exact PDF page numbers, bounding lines, and raw extraction strings.

### 5. 🔒 Role-Based Access Control (RBAC) & Audit Logging
- Roles: `SUPER_ADMIN`, `DOCTOR`, `CLINICIAN`, `STAFF`, `PATIENT`.
- Immutable audit trail recording user identity, action, timestamps, provider fallback events, and latency.

### 6. 🖨️ Clinical PDF Export
- Export comprehensive, printable clinical review reports formatted with patient demographics, parameter comparison tables, trajectories, and physician review sign-off lines.

---

## 🏗️ Architecture & AI Orchestrator

```
[Uploaded Medical PDF]
        ↓
[Document Validation & Integrity]
        ↓
[Text & Table Extraction (pdfplumber)]
        ↓
[Canonical Normalization & Units Check]
        ↓
[Selected Reports Sub-Graph]
        ↓
[Deterministic Backend Numerical Calculation]
        ↓
[LangGraph AI Orchestrator Pipeline]
   ├── 1. Google Gemini 1.5 Pro (Primary Provider)
   ├── 2. OpenAI GPT-4o (Fallback)
   ├── 3. xAI Grok (Fallback)
   └── 4. Grounded Medical Intelligence Engine (Deterministic Fallback)
        ↓
[Schema & Strict JSON Validation]
        ↓
[Interactive Dashboard & Bilingual Summary Display]
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+

### 1. Start the FastAPI Backend
```powershell
# In the project root (first run only)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r server\requirements.txt

# Start the backend
python -m uvicorn app.main:app --app-dir server --port 8000 --reload
```
API runs at: `http://127.0.0.1:8000` (Docs at `http://127.0.0.1:8000/docs`)

### 2. Start the React Frontend
```powershell
npm --prefix client install
npm --prefix client run dev
```
Web Application opens at: `http://localhost:5173`

Local Vite development forwards `/api` requests to the backend on port 8000. Set `VITE_API_BASE_URL` only when the frontend and backend are hosted separately. SQLite records are stored in `server/app/data/medi_trend.db` and uploaded medical documents in `server/uploaded_reports`; both locations must use persistent storage in production. Set `CORS_ORIGINS` to a comma-separated list of trusted frontend origins for separate hosting.

### Deploying to Vercel

Import the repository into Vercel with **Root Directory set to the repository root**. Do not select `server/` as the project root: the checked-in root `vercel.json` builds the Vite client and routes `/api/*` to the FastAPI function in `api/index.py`.

Configure these environment variables in the Vercel project settings before deploying:

- `DATABASE_URL`: connection string for the existing persistent Supabase PostgreSQL database that contains your login accounts. The API intentionally does not start on Vercel without this setting, because serverless SQLite loses sessions between function invocations.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`: enable persistent uploaded-report storage. Keep the service-role key server-side; never use a `VITE_` prefix for it.
- `CORS_ORIGINS`: only needed when frontend and API use different origins; set it to the exact deployed frontend origin.
- `GEMINI_API_KEY` and/or `OPENROUTER_API_KEY` / `GROK_API_KEY`: AI-backed summaries and OCR; the deterministic analysis path remains available without AI credentials.

Leave `VITE_API_URL` and `VITE_API_BASE_URL` unset when the frontend and API are deployed in this same Vercel project; the frontend then calls the same-origin `/api` route. Set variables in every Vercel environment you use (Production and Preview), then redeploy. SQLite and local file storage are development fallbacks only; Vercel's filesystem is ephemeral, so production must use PostgreSQL and persistent object storage. See [server/DEPLOYMENT.md](./server/DEPLOYMENT.md) for login troubleshooting and the deployment checklist.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (optional, system has built-in verified fallbacks):

```env
# Primary AI Provider
AI_PRIMARY_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro

# Fallback AI Providers
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o

GROK_API_KEY=your_grok_api_key
GROK_MODEL=grok-beta
```

---

## 🛡️ Medical Safety Notice
This application is classified as a **Clinical Decision Support System (CDSS)**. It is intended for use by qualified medical professionals for data organization and longitudinal comparison. It does not provide automated diagnoses, clinical prescriptions, or substitute for physician evaluation.
