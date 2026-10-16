import os
import io
import time
import requests
from PIL import Image, ImageDraw
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

BASE_URL = "http://127.0.0.1:8000"
TEST_DIR = "test_artifacts_audit"
os.makedirs(TEST_DIR, exist_ok=True)

# 1. Get or create test patient
res = requests.get(f"{BASE_URL}/api/patients")
patients = res.json()
if not patients:
    p_res = requests.post(f"{BASE_URL}/api/patients", json={
        "full_name": "Audit Test Patient",
        "age": 45,
        "gender": "Female",
        "phone": "+91 98840 11223",
        "email": "audit.test@hospital.org"
    })
    patient_id = p_res.json()["patient_id"]
else:
    patient_id = patients[0].get("patient_id") or patients[0].get("id")

print(f"Using Patient ID: {patient_id}")

def get_report_count():
    r = requests.get(f"{BASE_URL}/api/patients/{patient_id}/reports")
    return len(r.json())

# ==================== GENERATE ALL 12 TEST FILES ====================

styles = getSampleStyleSheet()

# 1. Genuine Medical PDF
path_1 = os.path.join(TEST_DIR, "1_genuine_medical_lipid_panel.pdf")
doc1 = SimpleDocTemplate(path_1, pagesize=letter)
elements1 = [
    Paragraph("<b>APOLLO DIAGNOSTICS - CLINICAL BIOCHEMISTRY REPORT</b>", styles["Heading1"]),
    Paragraph("Patient Name: S. Gurumurthy | Age: 58 | Sex: Male | Date: 15 Jan 2026", styles["Normal"]),
    Spacer(1, 12),
    Table([
        ["Investigation", "Observed Value", "Unit", "Biological Reference Interval"],
        ["Total Cholesterol", "220.0", "mg/dL", "< 200.0"],
        ["HDL Cholesterol", "38.0", "mg/dL", "> 40.0"],
        ["LDL Cholesterol", "145.0", "mg/dL", "< 100.0"],
        ["Triglycerides", "185.0", "mg/dL", "< 150.0"],
        ["Fasting Blood Sugar", "110.0", "mg/dL", "70.0 - 100.0"],
        ["Serum Creatinine", "1.1", "mg/dL", "0.7 - 1.2"]
    ], style=[
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#004b87')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey)
    ])
]
doc1.build(elements1)

# 2. Scanned Medical PDF (Image-based PDF containing clinical lab report scan)
path_2 = os.path.join(TEST_DIR, "2_scanned_medical_lab_report.pdf")
img_scan = Image.new("RGB", (600, 400), color=(255, 255, 255))
d = ImageDraw.Draw(img_scan)
d.text((20, 20), "METROPOLIS HEALTHCARE - CLINICAL PATHOLOGY", fill=(0, 50, 150))
d.text((20, 50), "Patient: S. Gurumurthy | Age: 58 | Date: 10 Feb 2026", fill=(0, 0, 0))
d.text((20, 90), "Total Cholesterol: 210.0 mg/dL (Ref: < 200)", fill=(0, 0, 0))
d.text((20, 120), "HDL Cholesterol: 42.0 mg/dL (Ref: > 40)", fill=(0, 0, 0))
d.text((20, 150), "LDL Cholesterol: 130.0 mg/dL (Ref: < 100)", fill=(0, 0, 0))
d.text((20, 180), "Triglycerides: 165.0 mg/dL (Ref: < 150)", fill=(0, 0, 0))
d.text((20, 210), "Fasting Blood Sugar: 98.0 mg/dL (Ref: 70 - 100)", fill=(0, 0, 0))
img_scan.save(path_2, "PDF", resolution=100.0)

# 3. Academic PDF
path_3 = os.path.join(TEST_DIR, "3_academic_calendar_even_semester.pdf")
doc3 = SimpleDocTemplate(path_3, pagesize=letter)
elements3 = [
    Paragraph("<b>ANNA UNIVERSITY - ACADEMIC CALENDAR 2025-2026</b>", styles["Heading1"]),
    Paragraph("Even Semester Schedule for II Year & III Year (UG & PG)", styles["Normal"]),
    Spacer(1, 12),
    Table([
        ["Event / Milestone", "Date", "Remarks"],
        ["Commencement of Classes", "05-01-2026", "All Departments"],
        ["Internal Assessment Test 1", "16-02-2026", "Theory Courses"],
        ["Last Working Day", "24-04-2026", "Semester End"],
        ["Theory Semester Exams", "04-05-2026", "University Exam Center"]
    ], style=[
        ('BACKGROUND', (0,0), (-1,0), colors.darkblue),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey)
    ])
]
doc3.build(elements3)

# 4. Resume PDF
path_4 = os.path.join(TEST_DIR, "4_senior_software_engineer_resume.pdf")
doc4 = SimpleDocTemplate(path_4, pagesize=letter)
elements4 = [
    Paragraph("<b>CURRICULUM VITAE - SENIOR FULL STACK DEVELOPER</b>", styles["Heading1"]),
    Paragraph("John Doe | Email: john.dev@example.com | GitHub: github.com/johndoe", styles["Normal"]),
    Paragraph("Technical Skills: React, TypeScript, Python, FastAPI, Docker, Kubernetes, PostgreSQL", styles["Normal"]),
    Spacer(1, 12),
    Paragraph("Work Experience:", styles["Heading2"]),
    Paragraph("- Architected scalable microservices using Python FastAPI and AWS.", styles["Normal"]),
    Paragraph("- Built real-time analytics dashboard with React 19 and Tailwind CSS.", styles["Normal"])
]
doc4.build(elements4)

# 5. Commercial Tax Invoice PDF
path_5 = os.path.join(TEST_DIR, "5_commercial_tax_invoice.pdf")
doc5 = SimpleDocTemplate(path_5, pagesize=letter)
elements5 = [
    Paragraph("<b>AMAZON RETAIL INDIA - TAX INVOICE</b>", styles["Heading1"]),
    Paragraph("Invoice Number: INV-2026-99081 | GSTIN: 33AAAAA0000A1Z5", styles["Normal"]),
    Paragraph("Billing Address: Tech Park, Chennai | Payment Method: Credit Card", styles["Normal"]),
    Spacer(1, 12),
    Table([
        ["Item Description", "Qty", "Unit Price", "Subtotal (INR)"],
        ["Wireless Ergonomic Keyboard", "1", "3500.00", "3500.00"],
        ["USB-C Fast Charging Cable", "2", "450.00", "900.00"],
        ["Total Amount Payable", "", "", "4400.00"]
    ], style=[
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#232f3e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey)
    ])
]
doc5.build(elements5)

# 6. Random Non-Medical PDF (Literature Novel)
path_6 = os.path.join(TEST_DIR, "6_random_literature_novel.pdf")
doc6 = SimpleDocTemplate(path_6, pagesize=letter)
elements6 = [
    Paragraph("<b>THE SHADOW OVER INNSMOUTH - CHAPTER 1</b>", styles["Heading1"]),
    Paragraph("During the winter of 1927-28, officials of the Federal government made a strange investigation of the decayed seaport of Innsmouth in Massachusetts.", styles["Normal"]),
    Paragraph("The town had fallen into ruin, its ancient buildings leaning precariously over deserted streets.", styles["Normal"])
]
doc6.build(elements6)

# 7. Medical filename with Non-Medical Content
path_7 = os.path.join(TEST_DIR, "Apollo_Diagnostics_Blood_Panel_Report_2026.pdf")
doc7 = SimpleDocTemplate(path_7, pagesize=letter)
elements7 = [
    Paragraph("<b>CURRICULUM VITAE - SENIOR FULL STACK DEVELOPER</b>", styles["Heading1"]),
    Paragraph("John Doe | Email: john.dev@example.com | GitHub: github.com/johndoe", styles["Normal"]),
    Paragraph("Technical Skills: React, TypeScript, Python, FastAPI, Docker, Kubernetes, PostgreSQL", styles["Normal"])
]
doc7.build(elements7)

# 8. Random Non-Medical Image (.png)
path_8 = os.path.join(TEST_DIR, "8_random_landscape_art.png")
img_art = Image.new("RGB", (400, 300), color=(73, 109, 137))
d_art = ImageDraw.Draw(img_art)
d_art.text((40, 40), "Sunset Mountain Painting by Art Studio", fill=(255, 255, 0))
d_art.text((40, 80), "Gallery Exhibition 2026 - Modern Landscape", fill=(255, 255, 255))
img_art.save(path_8)

# 9. Unsupported Format (.mp3 audio)
path_9 = os.path.join(TEST_DIR, "9_hospital_audio_recording.mp3")
with open(path_9, "wb") as f:
    f.write(b"ID3\x03\x00\x00\x00\x00\x00\x20MPEG_AUDIO_STREAM_VOICE_MEMO_CLINICAL")

# 10. Corrupted / Malformed PDF
path_10 = os.path.join(TEST_DIR, "10_corrupted_malformed_report.pdf")
with open(path_10, "wb") as f:
    f.write(b"%PDF-1.4\n%CORRUPTED_BINARY_STREAM_EOF_INVALID\x00\xFF\xAA\xBB\xCC\xDD\xEE\xFF")

# 11. Genuine Consultation Note (Medical narrative)
path_11 = os.path.join(TEST_DIR, "11_cardiology_clinical_consultation_note.pdf")
doc11 = SimpleDocTemplate(path_11, pagesize=letter)
elements11 = [
    Paragraph("<b>APOLLO HOSPITALS - CARDIOLOGY CLINICAL CONSULTATION NOTE</b>", styles["Heading1"]),
    Paragraph("Consultant: Dr. Arvind Kumar, MD (Cardiology) | Date: 20 Feb 2026", styles["Normal"]),
    Paragraph("Patient Name: S. Gurumurthy | UHID: UHID-998811 | Age: 58 | Sex: Male", styles["Normal"]),
    Spacer(1, 12),
    Paragraph("<b>Clinical Impression & Narrative Assessment:</b>", styles["Heading2"]),
    Paragraph("Patient presented for routine annual cardiovascular follow-up. Blood pressure recorded at 120/80 mmHg in sitting position. Heart sounds S1 and S2 heard normally with no murmurs or gallops. Patient reports adherence to Mediterranean diet and 30 minutes daily brisk walking. Advised to continue current lifestyle regimen and repeat standard lipid panel in 6 months.", styles["Normal"])
]
doc11.build(elements11)

# 12. Genuine Prescription (Medical Rx)
path_12 = os.path.join(TEST_DIR, "12_clinical_rx_prescription.pdf")
doc12 = SimpleDocTemplate(path_12, pagesize=letter)
elements12 = [
    Paragraph("<b>APOLLO CLINICAL PHARMACY - MEDICAL PRESCRIPTION (Rx)</b>", styles["Heading1"]),
    Paragraph("Attending Physician: Dr. Arvind Kumar, MD | Reg No: MCI-2015-8890 | Date: 22 Feb 2026", styles["Normal"]),
    Paragraph("Patient Name: S. Gurumurthy | Age: 58 | Sex: Male | Diagnosis: Dyslipidemia & Essential Hypertension", styles["Normal"]),
    Spacer(1, 12),
    Table([
        ["Rx / Medication Name", "Dosage & Strength", "Frequency", "Duration", "Instructions"],
        ["Tab. Atorvastatin", "20 mg", "1 tablet at bedtime", "30 days", "Take after food"],
        ["Tab. Telmisartan", "40 mg", "1 tablet once daily morning", "30 days", "Take after breakfast"],
        ["Tab. Metformin HCl", "500 mg", "1 tablet twice daily", "30 days", "With meals"]
    ], style=[
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#004b87')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey)
    ]),
    Spacer(1, 12),
    Paragraph("<b>Clinical Instructions:</b> Maintain low sodium diet. Revisit in 4 weeks with fresh lipid profile.", styles["Normal"])
]
doc12.build(elements12)

# ==================== RUN AUDIT TEST SUITE (12 TESTS) ====================

test_cases = [
    ("1. Genuine medical PDF", path_1, "Biochemistry & Lipid Panel", "Apollo Diagnostics", True),
    ("2. Scanned medical PDF", path_2, "Biochemistry & Lipid Panel", "Metropolis Healthcare", True),
    ("3. Academic PDF", path_3, "Biochemistry & Lipid Panel", "Hospital Lab", False),
    ("4. Resume PDF", path_4, "Biochemistry & Lipid Panel", "Hospital Lab", False),
    ("5. Invoice PDF", path_5, "Biochemistry & Lipid Panel", "Hospital Lab", False),
    ("6. Random PDF", path_6, "Biochemistry & Lipid Panel", "Hospital Lab", False),
    ("7. Medical filename + non-medical content", path_7, "Biochemistry & Lipid Panel", "Apollo Diagnostics", False),
    ("8. Random image", path_8, "Biochemistry & Lipid Panel", "Hospital Lab", False),
    ("9. Music/audio", path_9, "Biochemistry & Lipid Panel", "Hospital Lab", False),
    ("10. Corrupted PDF", path_10, "Biochemistry & Lipid Panel", "Hospital Lab", False),
    ("11. Genuine consultation note", path_11, "Clinical Consultation", "Apollo Hospitals", True),
    ("12. Genuine prescription", path_12, "Clinical Prescription", "Apollo Clinical Pharmacy", True),
]

audit_results = []

print("\n" + "="*85)
print("MEDI-TREND AI — STRICT CONTENT-BASED MEDICAL DOCUMENT VALIDATION AUDIT (12 TESTS)")
print("="*85 + "\n")

initial_count = get_report_count()
print(f"Initial Total Reports Count in Database: {initial_count}\n")

for name, file_path, category_input, provider_input, expected_accept in test_cases:
    filename = os.path.basename(file_path)
    count_before = get_report_count()
    
    with open(file_path, "rb") as f:
        files = {"file": (filename, f)}
        data = {
            "provider": provider_input,
            "reportDate": "15 Jan 2026",
            "reportCategory": category_input
        }
        resp = requests.post(
            f"{BASE_URL}/api/patients/{patient_id}/reports/upload",
            files=files,
            data=data,
            headers={"x-user-name": "Dr. Arvind Kumar", "x-user-role": "DOCTOR"}
        )
    
    count_after = get_report_count()
    status_code = resp.status_code
    
    if status_code == 200:
        res_data = resp.json()
        rep = res_data.get("report", {})
        decision = "ACCEPTED"
        val_status = rep.get("validation_status", "VALIDATED")
        val_reason = rep.get("validation_reason", "Verified")
        param_count = rep.get("parameter_count", 0)
        detected_category = rep.get("category", "")
        detected_provider = rep.get("provider", "")
        doc_type = res_data.get("document_type", rep.get("category", "MEDICAL"))
    else:
        try:
            err_json = resp.json()
            err_detail = err_json.get("detail", resp.text)
        except:
            err_detail = resp.text
        decision = "REJECTED"
        val_status = "REJECTED"
        val_reason = err_detail
        param_count = 0
        detected_category = "N/A"
        detected_provider = "N/A"
        doc_type = "NON_MEDICAL / INVALID"

    count_changed = (count_after > count_before)
    is_correct = (decision == "ACCEPTED" and expected_accept) or (decision == "REJECTED" and not expected_accept)
    audit_pass = is_correct and (count_changed == expected_accept)

    result_item = {
        "test_name": name,
        "filename": filename,
        "http_status": status_code,
        "decision": decision,
        "expected": "ACCEPT" if expected_accept else "REJECT",
        "validation_status": val_status,
        "validation_reason": str(val_reason)[:120],
        "parameters_extracted": param_count,
        "doc_type": doc_type,
        "count_before": count_before,
        "count_after": count_after,
        "audit_pass": audit_pass
    }
    audit_results.append(result_item)
    
    print(f"[{'PASS' if audit_pass else 'FAIL'}] {name}")
    print(f"  HTTP: {status_code} | Decision: {decision} (Expected: {result_item['expected']}) | Doc Type: {doc_type}")
    print(f"  Validation Status: {val_status}")
    print(f"  Validation Reason: {result_item['validation_reason']}")
    print(f"  Parameters Extracted: {param_count} | Reports: Before={count_before}, After={count_after}")
    print("-" * 85)

final_count = get_report_count()
passed_count = sum(1 for r in audit_results if r["audit_pass"])
total_count = len(audit_results)

print(f"\nAUDIT SUMMARY: {passed_count}/{total_count} Tests Passed (100% Target)")
print(f"Initial Database Reports: {initial_count}, Final Database Reports: {final_count}")
print("="*85 + "\n")
