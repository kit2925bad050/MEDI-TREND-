import re
import difflib
import unicodedata
from typing import Dict, Any, List, Optional, Tuple

TITLES = {
    "mr", "mrs", "ms", "miss", "dr", "doctor", "shri", "smt", "kumari",
    "master", "baby", "selvi", "thiru", "prof"
}

TRANSLITERATION_MAP = [
    (r"oo", "u"),
    (r"ee", "i"),
    (r"th", "t"),
    (r"dh", "d"),
    (r"ph", "f"),
    (r"kh", "k"),
    (r"sh", "s"),
    (r"zh", "l"),
    (r"aa", "a"),
    (r"ii", "i"),
    (r"uu", "u"),
]


def normalize_person_name(raw_name: str) -> str:
    """
    Safely normalizes a person's name:
    - Normalizes Unicode (NFKC) and collapses non-breaking spaces
    - Separates attached initials (e.g. 'S.Gurumurthy' -> 'S. Gurumurthy')
    - Strips titles and honorifics (Dr., Mr., Mrs., Shri, etc.)
    - Removes punctuation safe for human names (. , - _ / ' ")
    - Trims and collapses whitespace, returning lowercase canonical tokens
    """
    if not raw_name:
        return ""

    # 1. Unicode normalization (NFKC)
    text = unicodedata.normalize("NFKC", str(raw_name))
    text = text.replace("\u00a0", " ").replace("\u200b", "").strip()

    # 2. Separate attached initials: "S.Gurumurthy" -> "S. Gurumurthy"
    text = re.sub(r"([A-Za-z])\.([A-Za-z])", r"\1. \2", text)

    # 3. Strip leading/contained titles
    text = re.sub(
        r"\b(?:dr|doctor|mr|mrs|ms|miss|shri|smt|kumari|master|baby|selvi|thiru|prof)\.?\s+",
        " ",
        text,
        flags=re.IGNORECASE
    )

    # 4. Remove punctuation
    text = re.sub(r"[,\-_/()\[\]\.\'\"]", " ", text)

    # 5. Extract non-empty tokens excluding leftover titles
    tokens = [t.lower() for t in text.split() if len(t) > 0 and t.lower() not in TITLES]
    return " ".join(tokens)


def clean_patient_name(raw_name: str) -> str:
    """Cleans titles, punctuation, and extra whitespace from a person's name for display."""
    norm = normalize_person_name(raw_name)
    if not norm:
        return ""
    return " ".join(t.capitalize() for t in norm.split())


def phonetic_normalize(name: str) -> str:
    """Normalizes phonetic transliteration variations common between Tamil & English."""
    cleaned = normalize_person_name(name)
    for pattern, replacement in TRANSLITERATION_MAP:
        cleaned = re.sub(pattern, replacement, cleaned)
    # Remove single initials for phonetic core comparison
    parts = [p for p in cleaned.split() if len(p) > 1]
    return " ".join(parts) if parts else cleaned


def extract_name_from_document_text(text: str) -> Optional[str]:
    """Extracts the patient's name from laboratory document text using medical header regex patterns."""
    if not text:
        return None

    # Priority patterns for medical reports with word boundaries
    patterns = [
        r"\b(?:patient\s*name|name\s*of\s*(?:the\s*)?patient|pt\.?\s*name)\b[\s\:\-]+([A-Za-z\s\.\,\-]+?)(?:\s*(?:age|sex|gender|dob|uhid|mrn|id|ref|date|bill|\n|$))",
        r"\b(?:patient)\b[\s\:\-]+([A-Za-z\s\.\,\-]+?)(?:\s*(?:age|sex|gender|dob|uhid|mrn|id|ref|date|bill|\n|$))",
        r"\b(?:mr\.|mrs\.|ms\.|shri|smt\.)\s+([A-Za-z\s\.\,\-]+?)(?:\s*(?:age|sex|gender|dob|uhid|mrn|id|ref|date|bill|\n|$))"
    ]

    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            cand = clean_patient_name(m.group(1))
            cand_first_line = cand.split("\n")[0].split("|")[0].strip()
            # Must look like a real human name: 3-40 chars, not just numbers or common headers
            if 3 <= len(cand_first_line) <= 40:
                lower_cand = cand_first_line.lower()
                if not any(h in lower_cand for h in ["laboratory", "hospital", "clinic", "diagnostic", "report", "sample", "test"]):
                    return cand_first_line

    return None


def extract_patient_identifiers_from_text(text: str, expected_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Extracts auxiliary patient identifiers: ID, UHID, MRN, Age, Gender.
    Safely ignores date-based registration/accession numbers and specimen labels.
    """
    if not text:
        return {}

    info: Dict[str, Any] = {}

    # 1. Direct expected_id verification if provided
    if expected_id:
        clean_exp = expected_id.strip()
        escaped_exp = re.escape(clean_exp)
        # Support flexible punctuation: e.g. PT-E77688 or PT_E77688 or PT E77688
        flex_pat = re.sub(r'[\-_]', r'[\\-_\\s]?', escaped_exp)
        if re.search(rf'\b{flex_pat}\b', text, re.IGNORECASE):
            info["patient_id"] = clean_exp

    # 2. Explicit Patient ID patterns (prioritize explicit patient id / pid over secondary mrn/uhid)
    if "patient_id" not in info:
        id_pats = [
            r"\b(?:patient\s*(?:id|no|#)|pid)\b[\s\:\-]+([A-Za-z0-9\-_]{3,25})\b",
            r"\b(?:uhid|mrn)\b[\s\:\-]+([A-Za-z0-9\-_]{3,25})\b",
        ]
        for pat in id_pats:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                cand = m.group(1).strip()
                # Ensure candidate is not a date (e.g. 2026-09-01 or 12/05/2026)
                is_date = (
                    re.match(r"^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$", cand) or
                    re.match(r"^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$", cand)
                )
                if not is_date:
                    info["patient_id"] = cand
                    break

    # 3. Age & Gender extraction
    # Combined format: e.g. "Age/Sex: 58/M" or "Age / Gender : 58 Yrs / Male" or "Age & Sex: 58, Male"
    comb_match = re.search(
        r"\b(?:age\s*[\/\&\,]?\s*(?:sex|gender))\b[\s\:\-]+(\d{1,3})\s*(?:yrs?|years?)?\s*[\/\,\s]\s*(male|female|other|m|f)\b",
        text,
        re.IGNORECASE
    )
    if comb_match:
        try:
            info["age"] = int(comb_match.group(1))
        except ValueError:
            pass
        g = comb_match.group(2).lower()
        info["gender"] = "Male" if g in ["male", "m"] else ("Female" if g in ["female", "f"] else "Other")

    # If age not found yet, check standalone Age
    if "age" not in info:
        age_match = re.search(r"\bage\b[\s\:\-]+(\d{1,3})\s*(?:yrs?|years?)?\b", text, re.IGNORECASE)
        if age_match:
            try:
                info["age"] = int(age_match.group(1))
            except ValueError:
                pass

    # If gender not found yet, check standalone Gender
    if "gender" not in info:
        gender_match = re.search(r"\b(?:gender|sex)\b[\s\:\-]+(male|female|other|m|f)\b", text, re.IGNORECASE)
        if gender_match:
            g = gender_match.group(1).lower()
            info["gender"] = "Male" if g in ["male", "m"] else ("Female" if g in ["female", "f"] else "Other")

    return info


def compare_names(registered_name: str, extracted_name: str) -> Tuple[float, str]:
    """
    Carefully compares two patient names.
    Returns (similarity_score: 0.0 - 1.0, match_type: 'EXACT' | 'TRANSLITERATION' | 'INITIAL_SWAP' | 'FUZZY_CLOSE' | 'MISMATCH').
    """
    reg_norm = normalize_person_name(registered_name)
    ext_norm = normalize_person_name(extracted_name)

    if not reg_norm or not ext_norm:
        return 0.0, "MISMATCH"

    if reg_norm == ext_norm:
        return 1.0, "EXACT"

    # Token sets (initials swap, e.g. "S. Gurumurthy" vs "Gurumurthy S.")
    reg_tokens = set(reg_norm.split())
    ext_tokens = set(ext_norm.split())
    if reg_tokens == ext_tokens:
        return 0.99, "INITIAL_SWAP"

    # Phonetic transliteration check
    reg_ph = phonetic_normalize(registered_name)
    ext_ph = phonetic_normalize(extracted_name)
    if reg_ph and ext_ph and reg_ph == ext_ph:
        return 0.98, "TRANSLITERATION"

    # Check significant word overlap (tokens with length >= 3)
    reg_sig = {t for t in reg_tokens if len(t) >= 3}
    ext_sig = {t for t in ext_tokens if len(t) >= 3}

    # If both have significant words and they match completely
    if reg_sig and ext_sig and reg_sig == ext_sig:
        return 0.95, "INITIAL_SWAP"

    # Significant words with transliteration
    reg_sig_ph = {phonetic_normalize(t) for t in reg_sig}
    ext_sig_ph = {phonetic_normalize(t) for t in ext_sig}
    if reg_sig_ph and ext_sig_ph and reg_sig_ph == ext_sig_ph:
        return 0.93, "TRANSLITERATION"

    # Sequence matcher fuzzy ratio
    ratio = difflib.SequenceMatcher(None, reg_ph, ext_ph).ratio()

    # Check if one is a substring of the other with length >= 4 (e.g. Gurumurthy vs Gurumurthy S)
    if (reg_ph in ext_ph or ext_ph in reg_ph) and min(len(reg_ph), len(ext_ph)) >= 4:
        ratio = max(ratio, 0.88)

    if ratio >= 0.85:
        return ratio, "FUZZY_CLOSE"
    elif ratio >= 0.65:
        return ratio, "AMBIGUOUS"
    else:
        return ratio, "MISMATCH"


def verify_patient_identity(
    registered_patient: Any = None,
    document_text: str = "",
    extracted_patient_name: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    STRICT PATIENT IDENTITY VERIFICATION:
    Protects patient safety by ensuring that medical documents uploaded for Patient A
    are NEVER ingested or analyzed under Patient B.
    """
    if registered_patient is None:
        reg_name = kwargs.get("registered_patient_name", "")
        reg_id = kwargs.get("registered_id", "")
        reg_age = kwargs.get("registered_age")
        reg_gender = kwargs.get("registered_gender")
    elif isinstance(registered_patient, str):
        reg_name = registered_patient
        if document_text and not extracted_patient_name and "\n" not in document_text and len(document_text) < 60:
            extracted_patient_name = document_text
            document_text = ""
        reg_id = kwargs.get("registered_id", "")
        reg_age = kwargs.get("registered_age")
        reg_gender = kwargs.get("registered_gender")
    elif isinstance(registered_patient, dict):
        reg_name = registered_patient.get("full_name") or registered_patient.get("name") or ""
        reg_id = registered_patient.get("patient_id") or registered_patient.get("id") or ""
        reg_age = registered_patient.get("age")
        reg_gender = registered_patient.get("gender")
    else:
        reg_name = str(registered_patient)
        reg_id = ""
        reg_age = None
        reg_gender = None

    if not extracted_patient_name and "extracted_patient_name" in kwargs:
        extracted_patient_name = kwargs.get("extracted_patient_name")

    doc_name = extracted_patient_name or extract_name_from_document_text(document_text)
    doc_meta = extract_patient_identifiers_from_text(document_text, expected_id=reg_id or None)

    if "extracted_age" in kwargs and kwargs["extracted_age"] is not None:
        doc_meta["age"] = kwargs["extracted_age"]
    if "extracted_gender" in kwargs and kwargs["extracted_gender"] is not None:
        doc_meta["gender"] = kwargs["extracted_gender"]
    if "extracted_id" in kwargs and kwargs["extracted_id"] is not None:
        doc_meta["patient_id"] = kwargs["extracted_id"]

    matched_identifiers: List[str] = []
    conflicting_identifiers: List[str] = []

    # 1. No readable patient name on document
    if not doc_name:
        return {
            "status": "IDENTITY_UNVERIFIED",
            "is_match": False,
            "verified": False,
            "confidence": 0.5,
            "error_code": "PATIENT_NAME_MISSING",
            "failed_field": "PATIENT_NAME",
            "title": "PATIENT NAME NOT DETECTED - UNVERIFIED DOCUMENT",
            "status_label": "Name missing",
            "registered_patient": reg_name,
            "extracted_patient": None,
            "registered_id": reg_id,
            "extracted_id": doc_meta.get("patient_id"),
            "matched_identifiers": [],
            "conflicting_identifiers": ["Patient name not detected in document header"],
            "reason": "The uploaded medical document does not contain a readable patient name. Doctor verification required.",
            "action_required": "Please provide a medical document with clearly readable patient identification."
        }

    # 2. Check patient ID if present on both
    doc_id = doc_meta.get("patient_id")
    has_id_conflict = False
    if doc_id and reg_id:
        doc_id_clean = doc_id.lower().replace("-", "").replace("_", "")
        reg_id_clean = reg_id.lower().replace("-", "").replace("_", "")
        if doc_id_clean == reg_id_clean:
            matched_identifiers.append(f"Patient ID ({doc_id})")
        elif len(doc_id_clean) >= 4 and len(reg_id_clean) >= 4:
            if doc_id_clean != reg_id_clean and not (doc_id_clean in reg_id_clean or reg_id_clean in doc_id_clean):
                has_id_conflict = True
                conflicting_identifiers.append(f"Patient ID mismatch: Registered {reg_id} vs Report {doc_id}")

    # 3. Name comparison
    score, match_type = compare_names(reg_name, doc_name)

    if match_type in ["EXACT", "TRANSLITERATION", "INITIAL_SWAP", "FUZZY_CLOSE"]:
        matched_identifiers.append(f"Patient Name ({match_type.lower()}: {doc_name} matches {reg_name})")
    elif match_type == "MISMATCH":
        conflicting_identifiers.append(f"Patient Name Mismatch: Registered '{reg_name}' vs Document '{doc_name}'")
    else:  # AMBIGUOUS
        conflicting_identifiers.append(f"Spelling / Ambiguity variance: Registered '{reg_name}' vs Document '{doc_name}' ({score*100:.0f}%)")

    # 4. Age & Gender consistency check (secondary safety layer)
    doc_gender = doc_meta.get("gender")
    has_gender_conflict = False
    if doc_gender and reg_gender:
        if doc_gender.lower() == reg_gender.lower():
            matched_identifiers.append(f"Gender ({doc_gender})")
        else:
            has_gender_conflict = True
            conflicting_identifiers.append(f"Gender mismatch: Registered '{reg_gender}' vs Document '{doc_gender}'")

    doc_age = doc_meta.get("age")
    has_age_conflict = False
    if doc_age and reg_age:
        if abs(doc_age - reg_age) <= 2:
            matched_identifiers.append(f"Age (~{doc_age} yrs)")
        elif abs(doc_age - reg_age) >= 20:
            has_age_conflict = True
            conflicting_identifiers.append(f"Significant Age difference: Registered {reg_age} yrs vs Document {doc_age} yrs")

    # Priority 1: Conflicting Patient ID
    if has_id_conflict:
        return {
            "status": "IDENTITY_MISMATCH",
            "is_match": False,
            "verified": False,
            "confidence": 0.0,
            "error_code": "PATIENT_ID_MISMATCH",
            "failed_field": "PATIENT_ID",
            "title": "PATIENT ID CONFLICT - INVALID DOCUMENT FOR THIS PATIENT",
            "status_label": "Patient ID mismatch",
            "registered_patient": reg_name,
            "extracted_patient": doc_name,
            "registered_id": reg_id,
            "extracted_id": doc_id,
            "matched_identifiers": matched_identifiers,
            "conflicting_identifiers": conflicting_identifiers,
            "reason": f"Document contains patient ID '{doc_id}' which contradicts registered patient ID '{reg_id}'.",
            "action_required": "Review or upload the correct document belonging to this patient."
        }

    # Priority 2: Genuine Name Mismatch
    if match_type == "MISMATCH":
        return {
            "status": "IDENTITY_MISMATCH",
            "is_match": False,
            "verified": False,
            "confidence": 0.0,
            "error_code": "PATIENT_NAME_MISMATCH",
            "failed_field": "PATIENT_NAME",
            "title": "PATIENT NAME MISMATCH - INVALID DOCUMENT FOR THIS PATIENT",
            "status_label": "Name mismatch",
            "registered_patient": reg_name,
            "extracted_patient": doc_name,
            "registered_id": reg_id,
            "extracted_id": doc_id,
            "matched_identifiers": matched_identifiers,
            "conflicting_identifiers": conflicting_identifiers,
            "reason": f"Document patient name ('{doc_name}') contradicts registered patient ('{reg_name}').",
            "action_required": "Review or upload the correct document belonging to this patient."
        }

    # Priority 3: Demographic Gender Conflict
    if has_gender_conflict:
        return {
            "status": "IDENTITY_MISMATCH",
            "is_match": False,
            "verified": False,
            "confidence": score,
            "error_code": "DEMOGRAPHIC_GENDER_MISMATCH",
            "failed_field": "GENDER",
            "title": "DEMOGRAPHIC GENDER MISMATCH - INVALID DOCUMENT FOR THIS PATIENT",
            "status_label": "Gender mismatch",
            "registered_patient": reg_name,
            "extracted_patient": doc_name,
            "registered_id": reg_id,
            "extracted_id": doc_id,
            "matched_identifiers": matched_identifiers,
            "conflicting_identifiers": conflicting_identifiers,
            "reason": f"Document demographic gender ('{doc_gender}') contradicts registered patient gender ('{reg_gender}').",
            "action_required": "Verify patient demographic records before uploading."
        }

    # Priority 4: Demographic Age Conflict
    if has_age_conflict:
        return {
            "status": "IDENTITY_MISMATCH",
            "is_match": False,
            "verified": False,
            "confidence": score,
            "error_code": "DEMOGRAPHIC_AGE_MISMATCH",
            "failed_field": "AGE",
            "title": "DEMOGRAPHIC AGE CONFLICT - INVALID DOCUMENT FOR THIS PATIENT",
            "status_label": "Age mismatch",
            "registered_patient": reg_name,
            "extracted_patient": doc_name,
            "registered_id": reg_id,
            "extracted_id": doc_id,
            "matched_identifiers": matched_identifiers,
            "conflicting_identifiers": conflicting_identifiers,
            "reason": f"Document patient age ({doc_age} yrs) significantly contradicts registered patient age ({reg_age} yrs).",
            "action_required": "Verify patient demographic records before uploading."
        }

    # Ambiguous review
    if match_type == "AMBIGUOUS":
        return {
            "status": "MANUAL_REVIEW_REQUIRED",
            "is_match": False,
            "verified": False,
            "confidence": score,
            "error_code": "PATIENT_NAME_AMBIGUOUS",
            "failed_field": "PATIENT_NAME",
            "title": "PATIENT NAME SPELLING VARIATION - MANUAL REVIEW",
            "status_label": "Manual review required",
            "registered_patient": reg_name,
            "extracted_patient": doc_name,
            "registered_id": reg_id,
            "extracted_id": doc_id,
            "matched_identifiers": matched_identifiers,
            "conflicting_identifiers": conflicting_identifiers,
            "reason": f"Patient identity requires clinical review. Name spelling variation detected: '{doc_name}' vs registered '{reg_name}'.",
            "action_required": "Authorized physician manual review required before inclusion in clinical comparison."
        }

    return {
        "status": "IDENTITY_VERIFIED",
        "is_match": True,
        "verified": True,
        "confidence": score,
        "error_code": None,
        "failed_field": None,
        "title": "PATIENT IDENTITY CONFIRMED",
        "status_label": "Identity verified",
        "registered_patient": reg_name,
        "extracted_patient": doc_name,
        "registered_id": reg_id,
        "extracted_id": doc_id,
        "matched_identifiers": matched_identifiers,
        "conflicting_identifiers": [],
        "reason": f"Patient identity confirmed: '{doc_name}' matches registered patient '{reg_name}'.",
        "action_required": "None. Document approved for clinical ingestion and longitudinal analysis."
    }
