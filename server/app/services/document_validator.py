import os
import re
import json
import hashlib
import requests
from typing import Dict, Any, List, Optional, Tuple

class DocumentValidationError(Exception):
    def __init__(self, message: str, error_code: str, status: str = "REJECTED", details: Dict[str, Any] = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status = status
        self.details = details or {}

# Unsupported file extensions (Audio, Video, Executables, Archives, Office Docs)
UNSUPPORTED_EXTENSIONS = {
    ".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg", ".wma",
    ".mp4", ".mov", ".avi", ".mkv", ".wmv", ".webm",
    ".exe", ".bat", ".sh", ".cmd", ".dll", ".bin",
    ".zip", ".rar", ".7z", ".tar", ".gz",
    ".doc", ".docx", ".odt", ".rtf", ".psd", ".ai", ".eps",
    ".xls", ".xlsx", ".ppt", ".pptx"
}

# Supported file extensions
SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

# Magic byte signatures
MAGIC_BYTES = {
    b"%PDF": "PDF",
    b"\xFF\xD8\xFF": "JPEG",
    b"\x89PNG\r\n\x1a\n": "PNG",
}

# Strict Non-Medical Patterns (Academic, Invoices, Resumes, Media, etc.)
ACADEMIC_AND_NON_MEDICAL_PATTERNS = [
    # Academic & University signals
    r"academic\s*calendar", r"academic\s*year", r"semester", r"college\s*timetable",
    r"examination\s*schedule", r"university", r"syllabus", r"ug\s*&\s*pg",
    r"bachelor\s*of", r"master\s*of", r"degree\s*program", r"lecture\s*schedule",
    r"course\s*registration", r"curriculum", r"hall\s*ticket", r"internal\s*marks",
    r"grade\s*card", r"transcript", r"department\s*of\s*computer", r"faculty\s*of",
    r"regulations\s*20\d\d", r"reopening\s*date", r"commencement\s*of\s*classes",
    r"last\s*working\s*day", r"practical\s*exams", r"theory\s*exams", r"attendance",
    r"holiday\s*list", r"hostel\s*fees", r"tuition\s*fees", r"anna\s*university",
    
    # Financial & Commercial Invoices
    r"tax\s*invoice", r"billing\s*address", r"shipping\s*address", r"subtotal",
    r"gstin", r"receipt\s*number", r"purchase\s*order", r"invoice\s*amount",
    r"payment\s*method", r"debit\s*card", r"credit\s*card", r"bank\s*statement",
    r"amazon\s*retail", r"item\s*description", r"total\s*amount\s*payable",
    
    # Resumes & IT Profiles
    r"curriculum\s*vitae", r"resume", r"work\s*experience", r"education\s*history",
    r"technical\s*skills", r"software\s*engineer", r"full\s*stack\s*developer",
    r"github\s*repository", r"programming\s*languages", r"microservices",
    
    # Novels, Media, Travel, Art
    r"novel", r"chapter\s*\d+", r"prologue", r"epilogue", r"fiction", r"poetry",
    r"boarding\s*pass", r"flight\s*ticket", r"hotel\s*booking", r"pnr\s*status",
    r"song\s*lyrics", r"track\s*\d+", r"album\s*credits", r"painting\s*by",
    r"gallery\s*exhibition", r"landscape\s*art"
]

# Genuine Clinical Test & Parameter Patterns
CLINICAL_TEST_PATTERNS = [
    r"cholesterol", r"triglycerides", r"\bhdl\b", r"\bldl\b", r"\bvldl\b", r"lipid\s*profile",
    r"glucose", r"fasting\s*blood\s*sugar", r"post\s*prandial", r"\bppbs\b", r"\bfbs\b", r"\bhba1c\b", r"glycated\s*hemoglobin",
    r"creatinine", r"urea", r"blood\s*urea\s*nitrogen", r"\bbun\b", r"uric\s*acid", r"renal\s*function", r"\bkft\b", r"\brft\b",
    r"hemoglobin", r"\bhb\b", r"\bwbc\b", r"\brbc\b", r"platelet\s*count", r"complete\s*blood\s*count", r"\bcbc\b",
    r"neutrophils", r"lymphocytes", r"monocytes", r"eosinophils", r"basophils", r"\bpcv\b", r"\bmcv\b", r"\bmch\b", r"\bmchc\b", r"\brdw\b", r"\besr\b",
    r"c-reactive\s*protein", r"\bcrp\b", r"hs-crp", r"bilirubin", r"sgot", r"sgpt", r"\bast\b", r"\balt\b", r"alkaline\s*phosphatase", r"\balp\b",
    r"total\s*protein", r"albumin", r"globulin", r"liver\s*function", r"\blft\b",
    r"\btsh\b", r"\bt3\b", r"\bt4\b", r"free\s*t3", r"free\s*t4", r"thyroid\s*profile",
    r"calcium", r"sodium", r"potassium", r"chloride", r"serum\s*electrolytes",
    r"vitamin\s*d", r"vitamin\s*b12", r"iron", r"ferritin", r"total\s*iron\s*binding\s*capacity",
    r"troponin", r"d-dimer", r"\bcpk\b", r"cpk-mb", r"\bldh\b", r"prothrombin\s*time", r"\binr\b"
]

# Clinical Consultation, Prescription & Diagnostic Narrative Patterns
CLINICAL_NARRATIVE_PATTERNS = [
    r"consultation\s*note", r"clinical\s*impression", r"narrative\s*assessment",
    r"physical\s*examination", r"blood\s*pressure", r"heart\s*sounds", r"s1\s*and\s*s2",
    r"murmurs", r"cardiovascular", r"consultant", r"prescription", r"rx",
    r"medications?", r"dosage", r"mg\s*once\s*daily", r"tab\.", r"cap\.",
    r"discharge\s*summary", r"history\s*of\s*present\s*illness", r"chief\s*complaint",
    r"treatment\s*plan", r"follow\s*up\s*in", r"attending\s*physician", r"vital\s*signs"
]

# Clinical Header & Provider Patterns
CLINICAL_HEADER_PATTERNS = [
    r"patient\s*name", r"patient\s*id", r"uhid", r"mrn", r"sample\s*id", r"barcode",
    r"specimen", r"sample\s*type", r"collection\s*date", r"reporting\s*date", r"registered\s*on",
    r"referred\s*by", r"dr\.", r"consultant", r"pathologist", r"biochemist",
    r"observed\s*value", r"test\s*result", r"biological\s*reference\s*interval", r"reference\s*range", r"units",
    r"nabl\s*&?\s*cap", r"clinical\s*reference\s*laboratory"
]

CLINICAL_UNITS = [
    "mg/dl", "mmol/l", "g/dl", "fl", "pg", "cu mm", "iu/l", "u/l", "ng/ml",
    "ug/dl", "microu/ml", "%", "cells/cu mm", "mm/hr", "meq/l", "pmol/l", "nmol/l",
    "mmhg", "bpm"
]

def calculate_sha256(file_path: str) -> str:
    """Computes cryptographic SHA-256 hash of the uploaded document."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def validate_file_security(file_path: str, filename: str) -> Dict[str, Any]:
    """
    Gate 1: File Validation & Security Verification
    Checks MIME type, extension, magic bytes, readability, file size, and file corruption.
    """
    if not os.path.exists(file_path):
        raise DocumentValidationError(
            message="Document file not found or corrupted during upload.",
            error_code="FILE_NOT_FOUND"
        )

    file_size = os.path.getsize(file_path)
    if file_size == 0:
        raise DocumentValidationError(
            message="The uploaded file is empty (0 bytes). Please upload a valid medical report.",
            error_code="EMPTY_FILE"
        )
    if file_size > 25 * 1024 * 1024:
        raise DocumentValidationError(
            message="Document exceeds the 25MB clinical file size limit.",
            error_code="FILE_TOO_LARGE"
        )

    ext = os.path.splitext(filename.lower())[1]

    # Rejection of audio, video, executable, archive, and unsupported files
    if ext in UNSUPPORTED_EXTENSIONS:
        raise DocumentValidationError(
            message=f"This file ({ext.upper()}) is not a supported medical document. Please upload a medical PDF or supported medical scan.",
            error_code="UNSUPPORTED_MEDIA_TYPE",
            details={"extension": ext, "status": "REJECTED"}
        )

    if ext not in SUPPORTED_EXTENSIONS:
        raise DocumentValidationError(
            message=f"Unsupported file format ({ext}). Only PDF reports and medical scans (.pdf, .png, .jpg, .jpeg) are supported.",
            error_code="UNSUPPORTED_EXTENSION",
            details={"extension": ext, "status": "REJECTED"}
        )

    # Validate Magic Bytes / File Signatures
    with open(file_path, "rb") as f:
        header = f.read(32)

    is_valid_signature = False
    detected_format = None
    for magic, fmt in MAGIC_BYTES.items():
        if header.startswith(magic) or (fmt == "PDF" and b"%PDF" in header[:1024]):
            is_valid_signature = True
            detected_format = fmt
            break

    if not is_valid_signature:
        raise DocumentValidationError(
            message="Invalid document. File signature verification failed. The file contents do not match a supported medical PDF or image.",
            error_code="INVALID_MAGIC_BYTES",
            details={"header_bytes": header[:8].hex()}
        )

    # PDF Structure Integrity Check
    if detected_format == "PDF":
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                if len(pdf.pages) == 0:
                    raise DocumentValidationError(
                        message="Invalid or unreadable document. The PDF contains zero pages.",
                        error_code="EMPTY_PDF"
                    )
                _ = pdf.pages[0].extract_text()
        except DocumentValidationError:
            raise
        except Exception as e:
            # Check pypdfium2 fallback
            try:
                import pypdfium2 as pdfium
                doc = pdfium.PdfDocument(file_path)
                try:
                    if len(doc) == 0:
                        raise DocumentValidationError(
                            message="Invalid or unreadable document. The PDF structure is corrupted.",
                            error_code="CORRUPTED_DOCUMENT"
                        )
                finally:
                    doc.close()
            except DocumentValidationError:
                raise
            except Exception:
                raise DocumentValidationError(
                    message="Invalid or unreadable document. The PDF structure is malformed or corrupted.",
                    error_code="CORRUPTED_DOCUMENT",
                    details={"error": str(e)}
                )

    doc_hash = calculate_sha256(file_path)

    return {
        "is_valid": True,
        "format": detected_format,
        "file_size": file_size,
        "extension": ext,
        "document_hash": doc_hash
    }

def _perform_vision_ocr(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """Uses multimodal AI Vision (Gemini / OpenRouter GPT-4o-mini) to OCR scanned PDFs and images."""
    import base64
    from ..providers.ai_provider import GEMINI_API_KEY, OPENROUTER_API_KEY

    b64_img = base64.b64encode(image_bytes).decode('utf-8')

    # Provider 1: Gemini Vision (fast attempt)
    if GEMINI_API_KEY:
        for model in ["gemini-flash-latest", "gemini-flash-lite-latest"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": "Extract all textual content, clinical observations, and tabular laboratory values from this image verbatim."},
                            {"inlineData": {"mimeType": mime_type, "data": b64_img}}
                        ]
                    }],
                    "generationConfig": {"temperature": 0.0}
                }
                resp = requests.post(url, json=payload, timeout=3.5)
                if resp.status_code == 200:
                    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if text:
                        return text
            except Exception:
                pass

    # Provider 2: OpenRouter GPT-4o-mini Vision Fallback
    if OPENROUTER_API_KEY:
        try:
            url_or = "https://openrouter.ai/api/v1/chat/completions"
            headers_or = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
            payload_or = {
                "model": "openai/gpt-4o-mini",
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all textual content, clinical observations, and tabular laboratory values from this image verbatim."},
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_img}"}}
                    ]
                }],
                "temperature": 0.0
            }
            resp_or = requests.post(url_or, headers=headers_or, json=payload_or, timeout=6)
            if resp_or.status_code == 200:
                return resp_or.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass

    return ""

def extract_raw_text(file_path: str, extension: Optional[str] = None) -> Tuple[str, int, bool]:
    """
    Gate 2 & Gate 3: Document Content Extraction & Multimodal OCR
    Extracts embedded digital text or runs OCR / vision extraction on scanned PDFs and images.
    Returns: (extracted_text, page_count, ocr_performed)
    """
    ext = (extension or os.path.splitext(file_path.lower())[1]).lower()
    extracted_text = ""
    page_count = 1
    ocr_performed = False

    # Case A: Direct Image Files (.png, .jpg, .jpeg)
    if ext in [".png", ".jpg", ".jpeg"]:
        ocr_performed = True
        try:
            with open(file_path, "rb") as f:
                img_data = f.read()
            mime = "image/png" if ext == ".png" else "image/jpeg"
            extracted_text = _perform_vision_ocr(img_data, mime)
            return extracted_text.strip(), 1, True
        except Exception:
            return "", 1, True

    # Case B: PDF Files - First attempt digital text extraction
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                t = page.extract_text() or ""
                extracted_text += "\n" + t
    except Exception:
        pass

    # Fallback to PyMuPDF / fitz if pdfplumber extracted nothing
    if len(extracted_text.strip()) < 20:
        try:
            import fitz
            doc = fitz.open(file_path)
            page_count = len(doc)
            fitz_text = ""
            for p in doc:
                fitz_text += "\n" + p.get_text()
            doc.close()
            if fitz_text.strip():
                extracted_text = fitz_text
        except Exception:
            pass

    # Case C: Scanned PDF OCR (if digital text is missing or < 25 chars)
    if len(extracted_text.strip()) < 25:
        ocr_performed = True
        try:
            import pypdfium2 as pdfium
            import io
            pdf = pdfium.PdfDocument(file_path)
            try:
                page_count = len(pdf)
                ocr_text = ""
                for page_idx in range(min(page_count, 3)): # OCR first 3 pages
                    page = pdf[page_idx]
                    image = page.render(scale=2.0).to_pil()
                    img_byte_arr = io.BytesIO()
                    image.save(img_byte_arr, format='JPEG', quality=85)
                    page_ocr = _perform_vision_ocr(img_byte_arr.getvalue(), "image/jpeg")
                    ocr_text += "\n" + page_ocr
                if ocr_text.strip():
                    extracted_text = ocr_text
            finally:
                pdf.close()
        except Exception:
            pass

    return extracted_text.strip(), page_count, ocr_performed

def _classify_with_ai_model(text_sample: str) -> Optional[Dict[str, Any]]:
    """
    Gate 4: AI-Powered Medical Document Understanding & Verification
    Analyzes actual extracted content with Multi-Provider Fallback (Gemini -> OpenRouter -> Grok).
    """
    from ..providers.ai_provider import GEMINI_API_KEY, GROK_API_KEY, OPENROUTER_API_KEY

    prompt = f"""
You are an expert hospital clinical document validation engine for MEDI-TREND AI.
Inspect the following text extracted from an uploaded document.
Determine STRICTLY whether this document is an authentic clinical / medical document OR a non-medical document.

CRITICAL CLASSIFICATION RULES:
1. Genuine Medical Document Types:
   - LAB_REPORT (blood tests, biochemistry, hematology, lipid panel, urine tests, pathology)
   - CONSULTATION_NOTE (clinical consultation, doctor examination, patient assessment, clinical notes)
   - PRESCRIPTION (medical Rx, pharmaceutical medications, dosage instructions)
   - DISCHARGE_SUMMARY (hospital discharge note, admission history, clinical course)
   - DIAGNOSTIC_REPORT (ECG, radiology, ultrasound, imaging findings)
2. Non-Medical Document Types (MUST BE CLASSIFIED AS NON_MEDICAL):
   - Academic calendars, college timetables, exam schedules, university syllabi, semester circulars
   - Resumes, CVs, software engineering profiles, technical portfolios
   - Commercial invoices, tax receipts, purchase bills, bank statements
   - Novels, poetry, song lyrics, flight tickets, hotel reservations, art exhibition flyers
   - Random, generic, or non-medical text
3. NEVER assume a document is medical based on filename, user input, or claimed provider. The classification MUST be grounded strictly in the actual document content below.

Extracted Document Content:
\"\"\"
{text_sample[:4000]}
\"\"\"

Output STRICT JSON schema:
{{
  "is_medical_document": true | false,
  "document_type": "LAB_REPORT" | "CONSULTATION_NOTE" | "PRESCRIPTION" | "DISCHARGE_SUMMARY" | "DIAGNOSTIC_REPORT" | "NON_MEDICAL" | "UNREADABLE",
  "confidence": 0.99,
  "medical_evidence": ["list of explicit medical terms, lab parameters, findings, or diagnoses detected"],
  "detected_content": ["1-sentence description of what this document actually contains, e.g. 'Anna University Academic Calendar 2025-2026' or 'Apollo Diagnostics Lipid Panel'"],
  "detected_category": "Biochemistry & Lipid Profile" | "Cardiology Consultation" | "General Medicine" | null,
  "detected_provider": "Exact provider name explicitly present in document text or null",
  "detected_report_date": "Exact date explicitly present in document text or null",
  "detected_patient_name": "Exact patient name explicitly present in document text or null",
  "reason": "Clear explanation of the verification decision grounded in document content."
}}
"""

    # Provider 1: Gemini
    if GEMINI_API_KEY:
        for model in ["gemini-flash-lite-latest", "gemini-flash-latest"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.0}
                }
                resp = requests.post(url, json=payload, timeout=8)
                if resp.status_code == 200:
                    raw_json = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(raw_json)
            except Exception:
                pass

    # Provider 2: OpenRouter GPT-4o-mini Fallback
    if OPENROUTER_API_KEY:
        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": "openai/gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a hospital clinical document classifier. Output strict JSON only."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.0
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=8)
            if resp.status_code == 200:
                raw = resp.json()["choices"][0]["message"]["content"]
                return json.loads(raw.strip().replace("```json", "").replace("```", ""))
        except Exception:
            pass

    # Provider 3: Grok Fallback
    if GROK_API_KEY:
        try:
            url = "https://api.x.ai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {GROK_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": "grok-beta",
                "messages": [
                    {"role": "system", "content": "You are a hospital clinical document classifier. Output strict JSON only."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.0
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=8)
            if resp.status_code == 200:
                raw = resp.json()["choices"][0]["message"]["content"]
                return json.loads(raw.strip().replace("```json", "").replace("```", ""))
        except Exception:
            pass

    return None

def classify_medical_document(text: str = "", filename: str = "", ocr_used: bool = False, file_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Gate 4 & Gate 5: Medical Content Verification, Document Classification & Non-Medical Rejection
    Flexible and robust: handles text, file paths, or reversed parameter orders seamlessly.
    """
    # Auto-detect if arguments were swapped or if text is a tuple/list from extract_raw_text
    actual_text = ""
    if isinstance(text, (tuple, list)):
        actual_text = str(text[0]) if len(text) > 0 else ""
    elif isinstance(text, str):
        actual_text = text
    else:
        actual_text = str(text or "")

    actual_filename = str(filename or "")

    try:
        if len(actual_text) < 400 and (os.path.exists(actual_text) or actual_text.endswith(".pdf") or actual_text.endswith(".png") or actual_text.endswith(".jpg")):
            target_path = actual_text
            if filename and len(str(filename)) > 30 and not os.path.exists(str(filename)):
                actual_text = str(filename)
                actual_filename = os.path.basename(target_path)
            else:
                ext_t = os.path.splitext(target_path)[1]
                extracted_res = extract_raw_text(target_path, ext_t)
                actual_text = extracted_res[0] if isinstance(extracted_res, (tuple, list)) else str(extracted_res)
                actual_filename = os.path.basename(target_path)
    except Exception:
        pass

    if len(actual_text.strip()) < 10:
        raise DocumentValidationError(
            message="Unable to verify document content. The uploaded document contains insufficient or unreadable text. Please upload a clear medical document.",
            error_code="UNREADABLE_OR_BLANK",
            status="REJECTED",
            details={"document_type": "UNREADABLE"}
        )

    lower_text = actual_text.lower()

    # 1. Non-Medical Pattern Detection
    matched_non_medical = []
    for pat in ACADEMIC_AND_NON_MEDICAL_PATTERNS:
        if re.search(pat, lower_text):
            matched_non_medical.append(pat.replace(r"\s*", " ").replace("\\", ""))

    # 2. Clinical Laboratory Test Patterns
    matched_clinical_tests = []
    for pat in CLINICAL_TEST_PATTERNS:
        if re.search(pat, lower_text):
            matched_clinical_tests.append(pat.replace(r"\s*", " ").replace("\\", ""))

    # 3. Clinical Narrative / Consultation Patterns
    matched_narrative = []
    for pat in CLINICAL_NARRATIVE_PATTERNS:
        if re.search(pat, lower_text):
            matched_narrative.append(pat.replace(r"\s*", " ").replace("\\", ""))

    # 4. Clinical Header Patterns
    matched_headers = []
    for pat in CLINICAL_HEADER_PATTERNS:
        if re.search(pat, lower_text):
            matched_headers.append(pat.replace(r"\s*", " ").replace("\\", ""))

    # 5. Clinical Units
    matched_units = []
    for u in CLINICAL_UNITS:
        if u == "%":
            if re.search(r"\d+\.?\d*\s*%", lower_text):
                matched_units.append("%")
        elif len(u) <= 3:
            if re.search(r"\b" + re.escape(u) + r"\b", lower_text):
                matched_units.append(u)
        else:
            if u in lower_text:
                matched_units.append(u)

    # Clinical & Non-Medical Evidence Scores
    clinical_score = (len(matched_clinical_tests) * 2) + (len(matched_narrative) * 2) + len(matched_headers) + len(matched_units)
    non_med_score = len(matched_non_medical)

    # Immediate Hard Rejection if Strong Non-Medical Signals
    if (non_med_score >= 2 and non_med_score >= clinical_score) or (non_med_score >= 3 and clinical_score < 4):
        reason = f"This document does not contain sufficient medical or clinical content for MEDI-TREND analysis. (Detected non-medical content: {', '.join(matched_non_medical[:3])})"
        raise DocumentValidationError(
            message=reason,
            error_code="NON_MEDICAL_DOCUMENT",
            status="REJECTED",
            details={
                "is_medical": False,
                "is_medical_document": False,
                "document_type": "NON_MEDICAL",
                "confidence": 0.99,
                "reason": reason,
                "detected_content": [f"Non-medical document ({', '.join(matched_non_medical[:2])})"],
                "matched_non_medical_terms": matched_non_medical
            }
        )

    # If completely 0 medical markers and non-medical score > 0
    if clinical_score == 0 and non_med_score > 0:
        reason = "This document does not contain sufficient medical or clinical content for MEDI-TREND analysis."
        raise DocumentValidationError(
            message=reason,
            error_code="NO_MEDICAL_CONTENT",
            status="REJECTED",
            details={
                "is_medical": False,
                "is_medical_document": False,
                "document_type": "NON_MEDICAL",
                "confidence": 0.95,
                "reason": reason,
                "detected_content": ["Unrecognized non-medical content"]
            }
        )

    # Call AI Document Classifier (Gemini / Multi-Provider)
    ai_decision = _classify_with_ai_model(actual_text)
    if ai_decision:
        is_med = bool(ai_decision.get("is_medical_document", ai_decision.get("is_medical", True)))
        doc_type = ai_decision.get("document_type", "LAB_REPORT")
        conf = ai_decision.get("confidence", 0.95)
        reason = ai_decision.get("reason", "Document classification completed.")
        detected_content = ai_decision.get("detected_content", [])

        if not is_med or doc_type == "NON_MEDICAL":
            # If AI classified as non-medical, reject unless strong clinical evidence AND zero non-medical signals
            if non_med_score > 0 or clinical_score < 6:
                detected_desc = detected_content[0] if detected_content else "Non-medical document"
                reason_msg = f"This document does not contain sufficient medical or clinical content for MEDI-TREND analysis. Detected: {detected_desc}."
                raise DocumentValidationError(
                    message=reason_msg,
                    error_code="NON_MEDICAL_DOCUMENT",
                    status="REJECTED",
                    details=ai_decision
                )
            else:
                doc_type = "LAB_REPORT"
                is_med = True

        if doc_type in ["UNREADABLE", "AMBIGUOUS"] and clinical_score < 3:
            raise DocumentValidationError(
                message="Unable to verify document content. Please upload a clear medical document.",
                error_code="UNREADABLE_OR_BLANK",
                status="REJECTED",
                details=ai_decision
            )

        # Build verified result from AI Decision
        return {
            "is_medical": True,
            "is_medical_document": True,
            "status": "VALIDATED",
            "document_type": doc_type if doc_type not in ["NON_MEDICAL", "UNREADABLE"] else "LAB_REPORT",
            "confidence": conf,
            "category": ai_decision.get("detected_category") or "Biochemistry & Hematology",
            "provider": ai_decision.get("detected_provider"),
            "report_date": ai_decision.get("detected_report_date"),
            "patient_name": ai_decision.get("detected_patient_name"),
            "medical_evidence": ai_decision.get("medical_evidence", matched_clinical_tests + matched_narrative),
            "detected_content": detected_content or ["Verified Clinical Document"],
            "reason": reason,
            "ocr_used": ocr_used
        }

    # Deterministic Classification (Guaranteed Offline Safety)
    doc_type = "LAB_REPORT" if len(matched_clinical_tests) >= 1 else ("CONSULTATION_NOTE" if len(matched_narrative) >= 1 else "LAB_REPORT")
    
    # Grounded category detection
    category = "General Clinical Report"
    if any(k in lower_text for k in ["cholesterol", "lipid", "triglycerides", "hdl", "ldl"]):
        category = "Lipid & Cardiovascular Panel"
    elif any(k in lower_text for k in ["glucose", "hba1c", "sugar", "fbs", "ppbs"]):
        category = "Diabetes & Glycemic Profile"
    elif any(k in lower_text for k in ["creatinine", "urea", "bun", "uric acid", "kft", "rft"]):
        category = "Renal & Kidney Function"
    elif any(k in lower_text for k in ["bilirubin", "sgot", "sgpt", "ast", "alt", "lft"]):
        category = "Hepatic & Liver Function"
    elif any(k in lower_text for k in ["hemoglobin", "wbc", "rbc", "platelet", "cbc", "esr"]):
        category = "Complete Blood Count & Hematology"
    elif any(k in lower_text for k in ["consultation", "impression", "examination", "prescription"]):
        category = "Clinical Consultation & Narrative"

    # Explicit provider detection from content
    provider = None
    if "apollo" in lower_text:
        provider = "Apollo Diagnostics"
    elif "metropolis" in lower_text:
        provider = "Metropolis Healthcare"
    elif "dr. lal" in lower_text or "lal path" in lower_text:
        provider = "Dr. Lal PathLabs"
    elif "thyrocare" in lower_text:
        provider = "Thyrocare Technologies"

    # Explicit date detection
    report_date = None
    date_match = re.search(r'(?:date|collection\s*date|reporting\s*date)[\s\:\-]+(\d{1,2}[\s\-\/][A-Za-z]{3,9}[\s\-\/]\d{2,4}|\d{1,2}[\s\-\/]\d{1,2}[\s\-\/]\d{2,4})', actual_text, re.IGNORECASE)
    if date_match:
        report_date = date_match.group(1).strip()

    # Explicit patient name detection
    patient_name = None
    name_match = re.search(r'(?:patient\s*name|name\s*of\s*patient|patient)[\s\:\-]+([A-Za-z\s\.]+)', actual_text, re.IGNORECASE)
    if name_match:
        cand = name_match.group(1).strip().split("\n")[0].split("|")[0].strip()
        if len(cand) > 2 and len(cand) < 40:
            patient_name = cand

    return {
        "is_medical": True,
        "is_medical_document": True,
        "status": "VALIDATED",
        "document_type": doc_type,
        "confidence": 0.96,
        "category": category,
        "provider": provider,
        "report_date": report_date,
        "patient_name": patient_name,
        "medical_evidence": matched_clinical_tests + matched_narrative,
        "detected_content": [f"Verified {doc_type.replace('_', ' ').title()}"],
        "reason": f"Verified as genuine clinical document with {len(matched_clinical_tests) + len(matched_narrative) + len(matched_headers)} medical markers.",
        "ocr_used": ocr_used
    }

def normalize_patient_name(name: str) -> str:
    """Normalize patient name for comparison: lowercase, strip titles, handle initials, collapse whitespace."""
    if not name:
        return ""
    n = name.strip().lower()
    # Remove common titles
    for title in ["dr.", "dr ", "mr.", "mr ", "mrs.", "mrs ", "ms.", "ms ", "miss ", "mr ", "sr.", "smt."]:
        n = re.sub(rf"^{re.escape(title)}\s*", "", n)
    # Remove punctuation except spaces
    n = re.sub(r"[^\w\s]", " ", n)
    # Collapse whitespace
    n = " ".join(n.split())
    return n


def get_name_signature(name: str) -> List[str]:
    """Get significant word parts (4+ chars) for fuzzy matching."""
    normalized = normalize_patient_name(name)
    parts = normalized.split()
    return [p for p in parts if len(p) >= 4]


def tamil_transliteration_variants(name: str) -> List[str]:
    """Generate common Tamil/English transliteration variant patterns."""
    variants = [name]
    # Common Tamil name spelling variations
    tamil_map = {
        "gurumoorthy": ["gurumurthy", "kurumurthy", "gurumorthy"],
        "gurumurthy": ["gurumoorthy", "kurumurthy", "gurumorthy"],
        "kurumurthy": ["gurumoorthy", "gurumurthy", "gurumorthy"],
        "gurumorthy": ["gurumoorthy", "gurumurthy", "kurumurthy"],
        "ramesh": ["ramesh", "ramasamy", "ramesh kumar"],
        "ramasamy": ["ramesh", "ramasamy"],
        "kumar": ["kumar", "gurukumar", "rameshkumar"],
        "aravind": ["aravind", "arvind", "arvind kumar"],
        "arvind": ["aravind", "arvind"],
        "priya": ["priya", "priya raman"],
        "raman": ["raman", "priya raman"],
    }
    lower = name.lower()
    if lower in tamil_map:
        variants.extend(tamil_map[lower])
    # Also check if any variant key is contained in the name
    for key, vals in tamil_map.items():
        if key in lower:
            for v in vals:
                if v not in variants:
                    variants.append(v)
    return variants


def compute_name_match_score(expected: str, detected: str) -> Tuple[float, str]:
    """
    Compute a cautious name match score between expected patient name and detected name from document.
    Returns (score, match_level) where match_level is one of:
    'EXACT', 'CLOSE', 'POSSIBLE', 'MISMATCH', 'NO_NAME'
    """
    if not expected or not detected:
        return 0.0, "NO_NAME"

    exp_norm = normalize_patient_name(expected)
    det_norm = normalize_patient_name(detected)

    if not exp_norm or not det_norm:
        return 0.0, "NO_NAME"

    # Exact match after normalization
    if exp_norm == det_norm:
        return 1.0, "EXACT"

    # Check Tamil transliteration variants
    exp_variants = tamil_transliteration_variants(exp_norm)
    for v in exp_variants:
        v_norm = normalize_patient_name(v)
        if v_norm == det_norm:
            return 0.95, "EXACT"

    # Significant word part matching
    exp_parts = set(get_name_signature(exp_norm))
    det_parts = set(get_name_signature(det_norm))

    if not exp_parts or not det_parts:
        return 0.0, "NO_NAME"

    common = exp_parts & det_parts
    if not common:
        return 0.0, "MISMATCH"

    # Calculate overlap ratio
    overlap_ratio = len(common) / max(len(exp_parts), len(det_parts))

    # If all significant parts match, it's likely the same person (minor spelling diff)
    if overlap_ratio >= 0.75:
        return 0.85, "CLOSE"
    # If at least half match, it's a possible match requiring review
    if overlap_ratio >= 0.5:
        return 0.6, "POSSIBLE"
    return 0.3, "MISMATCH"


def extract_patient_identifiers_from_text(text: str) -> Dict[str, Any]:
    """Extract patient identifiers from document text: name, ID, DOB, age, sex."""
    identifiers: Dict[str, Any] = {
        "patient_name": None,
        "patient_id": None,
        "date_of_birth": None,
        "age": None,
        "sex": None,
    }

    lower = text.lower()

    # Patient name
    name_patterns = [
        r"(?:patient\s*name|name\s*of\s*patient|patient)\s*[\:\-]\s*([A-Za-z][A-Za-z\s\.]{2,40})",
        r"(?:name)\s*[\:\-]\s*([A-Za-z][A-Za-z\s\.]{2,40})",
    ]
    for pat in name_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            cand = m.group(1).strip().split("\n")[0].split("|")[0].strip()
            # Filter out non-name words
            skip_words = {"report", "date", "id", "number", "sample", "specimen", "age", "gender", "sex", "phone", "email"}
            words = [w for w in cand.split() if w.lower() not in skip_words]
            if len(words) >= 1 and len(cand) >= 3 and len(cand) <= 50:
                identifiers["patient_name"] = cand
                break

    # Patient ID / MRN / UHID
    id_patterns = [
        r"(?:patient\s*(?:id|number)|mrn|uhid|sample\s*(?:id|no))\s*[\:\-]\s*([A-Za-z0-9\-]{3,20})",
        r"(?:patient\s*id)\s*[\:\-]\s*([A-Za-z0-9\-]{3,20})",
    ]
    for pat in id_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            identifiers["patient_id"] = m.group(1).strip()
            break

    # Date of birth
    dob_patterns = [
        r"(?:date\s*of\s*birth|dob|born)\s*[\:\-]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
        r"(?:dob)\s*[\:\-]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
    ]
    for pat in dob_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            identifiers["date_of_birth"] = m.group(1).strip()
            break

    # Age
    age_patterns = [
        r"(?:age)\s*[\:\-]\s*(\d{1,3})\s*(?:y|yr|years|year|old)?",
        r"(\d{1,3})\s*y\s*/\s*",
    ]
    for pat in age_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                age_val = int(m.group(1))
                if 0 < age_val < 130:
                    identifiers["age"] = age_val
                    break
            except ValueError:
                pass

    # Sex / Gender
    sex_patterns = [
        r"(?:gender|sex)\s*[\:\-]\s*(male|female|m|f)\b",
        r"\b(male|female)\b",
    ]
    for pat in sex_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = m.group(1).lower()
            if val in ("m", "male"):
                identifiers["sex"] = "Male"
            elif val in ("f", "female"):
                identifiers["sex"] = "Female"
            break

    return identifiers


def validate_patient_identity(
    expected_patient_name: str,
    expected_patient_id: Optional[str] = None,
    expected_dob: Optional[str] = None,
    expected_age: Optional[int] = None,
    expected_sex: Optional[str] = None,
    extracted_text: str = ""
) -> Dict[str, Any]:
    """
    Strict Patient Identity Verification.

    Returns a dict with:
      - status: "VERIFIED" | "MISMATCH" | "UNVERIFIED" | "REVIEW_REQUIRED"
      - match_score: float (0.0 to 1.0)
      - detected_name: str or None
      - detected_identifiers: dict of extracted identifiers
      - conflicts: list of conflicting identifiers
      - details: human-readable explanation
    """
    result: Dict[str, Any] = {
        "status": "UNVERIFIED",
        "match_score": 0.0,
        "detected_name": None,
        "detected_identifiers": {},
        "conflicts": [],
        "details": "",
    }

    if not expected_patient_name or len(expected_patient_name) < 3:
        result["status"] = "UNVERIFIED"
        result["details"] = "No registered patient name available for verification."
        return result

    if not extracted_text or len(extracted_text.strip()) < 15:
        result["status"] = "UNVERIFIED"
        result["details"] = "Document contains no readable patient information."
        return result

    # Extract identifiers from the document
    detected = extract_patient_identifiers_from_text(extracted_text)
    result["detected_identifiers"] = detected
    result["detected_name"] = detected.get("patient_name")

    if not detected.get("patient_name"):
        result["status"] = "UNVERIFIED"
        result["details"] = "No readable patient name found in the document. Identity Unverified."
        return result

    # Compute name match score
    score, match_level = compute_name_match_score(expected_patient_name, detected["patient_name"])
    result["match_score"] = score

    conflicts: List[str] = []

    # Check patient ID conflict
    if expected_patient_id and detected.get("patient_id"):
        if detected["patient_id"] != expected_patient_id:
            conflicts.append(f"Patient ID mismatch: expected {expected_patient_id}, found {detected['patient_id']}")

    # Check DOB conflict
    if expected_dob and detected.get("date_of_birth"):
        if detected["date_of_birth"] != expected_dob:
            conflicts.append(f"Date of birth mismatch: expected {expected_dob}, found {detected['date_of_birth']}")

    # Check age conflict (within 2 years tolerance)
    if expected_age is not None and detected.get("age") is not None:
        if abs(detected["age"] - expected_age) > 2:
            conflicts.append(f"Age mismatch: expected {expected_age}, found {detected['age']}")

    # Check sex conflict
    if expected_sex and detected.get("sex"):
        if detected["sex"].lower() != expected_sex.lower():
            conflicts.append(f"Sex mismatch: expected {expected_sex}, found {detected['sex']}")

    result["conflicts"] = conflicts

    # Determine status
    if conflicts:
        result["status"] = "MISMATCH"
        result["error_code"] = "PATIENT_IDENTITY_MISMATCH"
        result["details"] = (
            f"PATIENT IDENTITY MISMATCH — INVALID DOCUMENT FOR THIS PATIENT. "
            f"Registered patient: {expected_patient_name}. "
            f"Report patient: {detected['patient_name']}. "
            f"Conflicts: {'; '.join(conflicts)}."
        )
    elif match_level == "EXACT":
        result["status"] = "VERIFIED"
        result["details"] = (
            f"Identity verified. Registered: {expected_patient_name}, "
            f"Report: {detected['patient_name']}."
        )
    elif match_level == "CLOSE":
        result["status"] = "VERIFIED"
        result["details"] = (
            f"Identity verified (minor spelling variation). "
            f"Registered: {expected_patient_name}, Report: {detected['patient_name']}."
        )
    elif match_level == "POSSIBLE":
        result["status"] = "REVIEW_REQUIRED"
        result["details"] = (
            f"Identity ambiguous — possible match requiring manual review. "
            f"Registered: {expected_patient_name}, Report: {detected['patient_name']}."
        )
    else:
        result["status"] = "MISMATCH"
        result["error_code"] = "PATIENT_NAME_MISMATCH"
        result["details"] = (
            f"PATIENT IDENTITY MISMATCH — INVALID DOCUMENT FOR THIS PATIENT. "
            f"Registered patient: {expected_patient_name}. "
            f"Report patient: {detected['patient_name']}."
        )

    return result
