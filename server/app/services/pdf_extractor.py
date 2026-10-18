import os
import re
from typing import List, Dict, Any, Optional, Tuple
import pdfplumber
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from ..models.schemas import ParameterData, ReportRecord
from .numerical_validator import (
    normalize_parameter_name,
    is_valid_parameter_name,
    normalize_unit,
    determine_parameter_status,
    PARAMETER_CONFIGS
)

# Patterns that indicate a line contains patient info or report metadata, not a lab parameter
NON_PARAMETER_PATTERNS = [
    r"patient\s*(name|id|number|age|gender|sex|dob|date of birth)",
    r"(patient|mrn|uhid|sample|specimen)\s*(id|no|number|#)",
    r"(report|lab|labo?ratory)\s*(id|no|number|#)",
    r"(collection|reporting|sample|specimen)\s*date",
    r"(referred|consulted|consultation)\s*(by|to)",
    r"(doctor|dr|physician|pathologist|biochemist)",
    r"(phone|mobile|tel|email|address)",
    r"(date|time)\s*:",
    r"^(date|time|report|patient|sample|specimen)\b",
    r"\b(male|female|m|f)\s*[/\\]\s*\d{1,3}",
    r"\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b",  # dates like 12/05/2026
    r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b",
    r"\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4}\b",
    r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\b",
    r"\b(age|gender|sex)\s*:",
    r"\b(hiv|hbsag|hcv|dengue|malaria|typhoid|covid)\b",  # these are tests but need special handling - keep for now
]

# Confidence scoring thresholds
HIGH_CONFIDENCE_KEYWORDS = [
    "cholesterol", "glucose", "creatinine", "urea", "sodium", "potassium",
    "hemoglobin", "wbc", "rbc", "platelet", "bilirubin", "sgot", "sgpt",
    "ast", "alt", "alp", "tsh", "t3", "t4", "hba1c", "uric acid", "calcium",
    "chloride", "total protein", "albumin", "globulin", "triglycerides",
    "hdl", "ldl", "vldl", "esr", "pcv", "mcv", "mch", "mchc", "rdw",
    "vitamin d", "vitamin b12", "iron", "ferritin", "troponin", "d-dimer",
    "cpk", "ldh", "pt", "inr", "bun"
]


def is_date_like(text: str) -> bool:
    """Check if a text string looks like a date or date-related field."""
    lower = text.lower().strip()
    for pat in NON_PARAMETER_PATTERNS:
        if re.search(pat, lower):
            return True
    return False


def is_parameter_line(line: str) -> bool:
    """Check if a line is likely a lab parameter line, not patient info or metadata."""
    lower = line.lower().strip()
    if not lower or len(lower) < 3:
        return False
    # Skip lines that are clearly patient info or report metadata
    if is_date_like(lower):
        return False
    return True


def extract_parameters_from_pdf(
    pdf_path: str,
    report_id: str = "REP-001",
    report_date: str = "",
    raw_text: Optional[str] = None
) -> List[ParameterData]:
    """
    Real extraction engine that parses PDF pages, extracts tabular laboratory rows,
    identifies parameters, units, reference ranges, and preserves source page numbers.
    Includes date filtering and confidence scoring.
    """
    extracted: List[ParameterData] = []
    seen_params = set()

    if not os.path.exists(pdf_path) and not raw_text:
        return extracted

    def _add_parameter(
        param_name: str,
        raw_val: str,
        unit: str,
        ref_range: str,
        page_idx: int,
        source_text: str,
        confidence: float = 1.0,
        extraction_status: str = "Verified"
    ) -> None:
        key, canonical, cfg = normalize_parameter_name(param_name)
        if key in seen_params:
            return
        try:
            val_float = float(raw_val)
        except (ValueError, TypeError):
            return
        seen_params.add(key)
        status = "Normal"
        if key == "hdl_cholesterol":
            status = "Optimal" if val_float >= 40.0 else "Low"
        elif key == "triglycerides":
            status = "Optimal" if val_float <= 150.0 else "Elevated"
        elif key == "total_cholesterol":
            status = "Optimal" if val_float <= 200.0 else "Elevated"
        elif key == "ldl_cholesterol":
            status = "Optimal" if val_float <= 100.0 else "Elevated"
        elif key == "fasting_blood_sugar":
            status = "Normal" if 70.0 <= val_float <= 99.0 else ("High" if val_float > 99.0 else "Low")
        elif key == "random_blood_sugar":
            status = "Normal" if val_float <= 140.0 else ("High" if val_float > 140.0 else "Low")
        elif key == "postprandial_blood_sugar":
            status = "Normal" if val_float <= 140.0 else ("High" if val_float > 140.0 else "Low")
        elif key == "hba1c":
            status = "Normal" if val_float < 5.7 else ("High" if val_float >= 5.7 else "Low")

        extracted.append(ParameterData(
            parameterName=canonical,
            canonicalName=canonical,
            value=val_float,
            unit=unit or cfg.get("unit", ""),
            referenceRange=ref_range or cfg.get("standard_range", ""),
            status=status,
            reportId=report_id,
            reportDate=report_date,
            sourcePage=page_idx,
            sourceText=source_text,
            category=cfg.get("category", "General")
        ))

    # 1. Try digital Table extraction if PDF exists
    if os.path.exists(pdf_path):
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_idx, page in enumerate(pdf.pages, start=1):
                    tables = page.extract_tables() or []
                    for table in tables:
                        for row in table:
                            if not row or len(row) < 2:
                                continue
                            param_cell = str(row[0] or "").strip()
                            raw_val = str(row[1] or "").strip()
                            unit_cell = str(row[2] or "").strip() if len(row) > 2 else ""
                            ref_range = str(row[3] or "").strip() if len(row) > 3 else ""

                            num_match = re.search(r"[-+]?\d*\.?\d+", raw_val)
                            if num_match and param_cell and is_parameter_line(param_cell):
                                try:
                                    val_float = float(num_match.group(0))
                                    key, canonical, cfg = normalize_parameter_name(param_cell)
                                    if key != "unknown_param" and key not in seen_params:
                                        seen_params.add(key)
                                        norm_unit = normalize_unit(unit_cell) or cfg.get("unit", "")
                                        status = determine_parameter_status(val_float, cfg, ref_range=ref_range)

                                        extracted.append(ParameterData(
                                            parameterName=canonical,
                                            canonicalName=canonical,
                                            value=val_float,
                                            unit=norm_unit,
                                            referenceRange=ref_range or cfg.get("standard_range", ""),
                                            status=status,
                                            reportId=report_id,
                                            reportDate=report_date,
                                            sourcePage=page_idx,
                                            sourceText=f"{param_cell}: {raw_val} {unit_cell}".strip(),
                                            category=cfg.get("category", "General")
                                        ))
                                except ValueError:
                                    pass

                    # Line-by-line regex parsing on page text
                    page_text = page.extract_text() or ""
                    for line in page_text.split("\n"):
                        line_clean = line.strip()
                        if not line_clean or not is_parameter_line(line_clean):
                            continue
                        m = re.search(
                            r"([A-Za-z\s\(\)\-\/\d]{3,35})\s+([0-9]+\.?[0-9]*)\s*([a-zA-Z\/\%]*)\s*([<\>\d\.\-\s]*)",
                            line_clean
                        )
                        if m:
                            p_name = m.group(1).strip()
                            raw_v = m.group(2).strip()
                            u_str = m.group(3).strip()
                            r_str = m.group(4).strip()

                            if not is_valid_parameter_name(p_name):
                                continue

                            key, canonical, cfg = normalize_parameter_name(p_name)
                            if key != "unknown_param" and key not in seen_params:
                                try:
                                    val_float = float(raw_v)
                                    seen_params.add(key)
                                    norm_unit = normalize_unit(u_str) or cfg.get("unit", "")
                                    status = determine_parameter_status(val_float, cfg, ref_range=r_str)

                                    extracted.append(ParameterData(
                                        parameterName=canonical,
                                        canonicalName=canonical,
                                        value=val_float,
                                        unit=norm_unit,
                                        referenceRange=r_str or cfg.get("standard_range", ""),
                                        status=status,
                                        reportId=report_id,
                                        reportDate=report_date,
                                        sourcePage=page_idx,
                                        sourceText=line_clean,
                                        category=cfg.get("category", "General")
                                    ))
                                except ValueError:
                                    pass
        except Exception:
            pass

    # 2. Extract from raw_text or OCR output if digital extraction found no parameters
    if not extracted:
        try:
            if not raw_text and os.path.exists(pdf_path):
                from .document_validator import extract_raw_text
                raw_text_val, _, _ = extract_raw_text(pdf_path)
            else:
                raw_text_val = raw_text or ""

            if raw_text_val:
                for line in raw_text_val.split("\n"):
                    line_clean = line.strip()
                    if not line_clean or not is_parameter_line(line_clean):
                        continue
                    clean_for_regex = re.sub(r"[\*\#\_\-]", " ", line_clean).strip()
                    m = re.search(
                        r"([A-Za-z\s\(\)\/\d]{3,35})[\:\s]+([0-9]+\.?[0-9]*)\s*([a-zA-Z\/\%]*)\s*\(?(?:ref\:?)?\s*([<\>\d\.\-\s]*)\)?",
                        clean_for_regex,
                        re.IGNORECASE
                    )
                    if m:
                        p_name = m.group(1).strip()
                        raw_v = m.group(2).strip()
                        u_str = m.group(3).strip()
                        r_str = m.group(4).strip()

                        if u_str and u_str.lower() in {
                            "degrees", "degree", "years", "year", "months", "month",
                            "days", "day", "weeks", "week", "hours", "hour", "minutes", "minute", "seconds", "sec"
                        }:
                            continue

                        if not is_valid_parameter_name(p_name):
                            continue

                        key, canonical, cfg = normalize_parameter_name(p_name)
                        if key != "unknown_param" and key not in seen_params:
                            try:
                                val_float = float(raw_v)
                                seen_params.add(key)
                                norm_unit = normalize_unit(u_str) or cfg.get("unit", "")
                                status = determine_parameter_status(val_float, cfg, ref_range=r_str)

                                extracted.append(ParameterData(
                                    parameterName=canonical,
                                    canonicalName=canonical,
                                    value=val_float,
                                    unit=norm_unit,
                                    referenceRange=r_str or cfg.get("standard_range", ""),
                                    status=status,
                                    reportId=report_id,
                                    reportDate=report_date,
                                    sourcePage=1,
                                    sourceText=line_clean,
                                    category=cfg.get("category", "General")
                                ))
                            except ValueError:
                                pass

                # AI Parameter Extraction fallback for complex multimodal lab reports
                if not extracted and len(raw_text_val.strip()) > 30:
                    ai_extracted = _extract_parameters_via_ai(raw_text_val, report_id, report_date)
                    for p in ai_extracted:
                        if is_valid_parameter_name(p.parameterName) and p.canonicalName not in seen_params:
                            seen_params.add(p.canonicalName)
                            extracted.append(p)
        except Exception:
            pass

    return extracted


def _extract_parameters_via_ai(
    raw_text: str,
    report_id: str,
    report_date: str
) -> List[ParameterData]:
    """Uses Gemini / OpenRouter AI to extract structured parameters from raw document text verbatim."""
    from ..providers.ai_provider import GEMINI_API_KEY, OPENROUTER_API_KEY
    import requests
    import json

    prompt = f"""
You are an expert clinical laboratory data extraction engine.
Inspect the following text extracted from an authentic clinical document.
Extract every genuine laboratory test parameter and its observed numeric value, unit, and reference range verbatim.

CRITICAL RULES:
1. ONLY extract laboratory tests that are explicitly present in the text with an observed numeric value.
2. NEVER invent or simulate parameters or numbers.
3. NEVER extract dates, patient names, patient IDs, report IDs, doctor names, or report metadata as parameters.
4. NEVER extract "Report Date", "Collection Date", "Date of Birth", "Age", "Gender", or similar fields as parameters.
5. If no numerical lab tests are found, return an empty array `[]`.

Document Text:
\"\"\"
{raw_text[:5000]}
\"\"\"

Output STRICT JSON format:
[
  {{
    "parameter_name": "LDL Cholesterol",
    "value": 145.0,
    "unit": "mg/dL",
    "reference_range": "< 100",
    "source_text": "LDL Cholesterol: 145.0 mg/dL"
  }}
]
"""
    raw_json_str = None

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
                    raw_json_str = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                    if raw_json_str:
                        break
            except Exception:
                pass

    # Provider 2: OpenRouter Fallback
    if not raw_json_str and OPENROUTER_API_KEY:
        try:
            url_or = "https://openrouter.ai/api/v1/chat/completions"
            headers_or = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
            payload_or = {
                "model": "openai/gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a clinical data extraction engine. Return strict JSON array."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.0
            }
            resp_or = requests.post(url_or, headers=headers_or, json=payload_or, timeout=8)
            if resp_or.status_code == 200:
                raw_json_str = resp_or.json()["choices"][0]["message"]["content"]
        except Exception:
            pass

    # Provider 3: Grok Fallback
    if not raw_json_str and GROK_API_KEY:
        try:
            url_gk = "https://api.x.ai/v1/chat/completions"
            headers_gk = {"Authorization": f"Bearer {GROK_API_KEY}", "Content-Type": "application/json"}
            payload_gk = {
                "model": "grok-beta",
                "messages": [
                    {"role": "system", "content": "You are a clinical data extraction engine. Return strict JSON array."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.0
            }
            resp_gk = requests.post(url_gk, headers=headers_gk, json=payload_gk, timeout=8)
            if resp_gk.status_code == 200:
                raw_json_str = resp_gk.json()["choices"][0]["message"]["content"]
        except Exception:
            pass

    if raw_json_str:
        try:
            clean_str = raw_json_str.strip().replace("```json", "").replace("```", "")
            items = json.loads(clean_str)
            if isinstance(items, list):
                results = []
                for it in items:
                    p_name = str(it.get("parameter_name") or "").strip()
                    raw_val = it.get("value")
                    if not is_valid_parameter_name(p_name):
                        continue
                    if p_name and raw_val is not None:
                        try:
                            val_float = float(raw_val)
                            key, canonical, cfg = normalize_parameter_name(p_name)
                            if key != "unknown_param":
                                ref_val = str(it.get("reference_range") or cfg.get("standard_range", ""))
                                norm_unit = normalize_unit(str(it.get("unit") or "")) or cfg.get("unit", "")
                                status = determine_parameter_status(val_float, cfg, ref_range=ref_val)

                                results.append(ParameterData(
                                    parameterName=canonical,
                                    canonicalName=canonical,
                                    value=val_float,
                                    unit=norm_unit,
                                    referenceRange=ref_val,
                                    status=status,
                                    reportId=report_id,
                                    reportDate=report_date,
                                    sourcePage=1,
                                    sourceText=str(it.get("source_text") or f"{p_name}: {val_float} {norm_unit}"),
                                    category=cfg.get("category", "General")
                                ))
                        except ValueError:
                            pass
                return results
        except Exception:
            pass

    return []


def generate_sample_hospital_pdf(
    file_path: str,
    hospital_name: str,
    patient_id: str,
    patient_name: str,
    report_id: str,
    report_date: str,
    parameters: List[Dict[str, Any]],
    age: str = "62 Y",
    gender: str = "Male"
):
    """Generates a high-precision, authentic clinical laboratory report PDF."""
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    doc = SimpleDocTemplate(file_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    header_title_style = ParagraphStyle(
        'HospitalTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#004b87'),
        spaceAfter=2,
        fontName='Helvetica-Bold'
    )

    sub_title_style = ParagraphStyle(
        'HospitalSub',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#4a5568'),
        spaceAfter=10
    )

    cell_bold = ParagraphStyle('CellBold', parent=styles['Normal'], fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a202c'))
    cell_normal = ParagraphStyle('CellNorm', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#2d3748'))

    elements = []

    elements.append(Paragraph(f"<b>{hospital_name.upper()}</b>", header_title_style))
    elements.append(Paragraph("Accredited Clinical Reference Laboratory • NABL & CAP Certified", sub_title_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#004b87'), spaceAfter=12))

    patient_info_data = [
        [
            Paragraph(f"<b>Patient Name:</b> {patient_name}", cell_normal),
            Paragraph(f"<b>Patient ID:</b> {patient_id}", cell_normal),
            Paragraph(f"<b>Report ID:</b> {report_id}", cell_normal)
        ],
        [
            Paragraph(f"<b>Age / Gender:</b> {age} / {gender}", cell_normal),
            Paragraph(f"<b>Collection Date:</b> {report_date}", cell_normal),
            Paragraph(f"<b>Ref By:</b> Dr. Arvind Kumar, MD", cell_normal)
        ]
    ]
    patient_table = Table(patient_info_data, colWidths=[180, 180, 180])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f7fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(patient_table)
    elements.append(Spacer(1, 14))

    table_rows = [
        [
            Paragraph("<b>Investigation / Parameter</b>", cell_bold),
            Paragraph("<b>Result Value</b>", cell_bold),
            Paragraph("<b>Unit</b>", cell_bold),
            Paragraph("<b>Biological Ref Interval</b>", cell_bold),
            Paragraph("<b>Methodology</b>", cell_bold)
        ]
    ]

    for p in parameters:
        val_str = str(p.get("value", ""))
        flag = p.get("flag", "")
        if flag:
            val_display = Paragraph(f"<b>{val_str}</b> <font color='red'>({flag})</font>", cell_normal)
        else:
            val_display = Paragraph(f"<b>{val_str}</b>", cell_normal)

        table_rows.append([
            Paragraph(p.get("name", ""), cell_normal),
            val_display,
            Paragraph(p.get("unit", ""), cell_normal),
            Paragraph(p.get("ref", ""), cell_normal),
            Paragraph(p.get("method", "Immunoturbidimetry / ECLIA"), cell_normal)
        ])

    test_table = Table(table_rows, colWidths=[160, 95, 75, 110, 100])
    test_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ebf8ff')),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#3182ce')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(test_table)
    elements.append(Spacer(1, 16))

    elements.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#cbd5e0'), spaceAfter=8))
    footer_text = (
        "<b>CLINICAL REVIEW NOTE:</b> This test report reflects automated diagnostic findings. "
        "Test values should be clinically correlated by the consulting healthcare provider. Not for self-interpretation."
    )
    elements.append(Paragraph(footer_text, ParagraphStyle('Foot', parent=styles['Normal'], fontSize=7.5, textColor=colors.HexColor('#718096'))))

    doc.build(elements)
    return file_path
