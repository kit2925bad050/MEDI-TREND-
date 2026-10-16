import os
import sys
import unittest
import io
import json
import tempfile
import uuid
from unittest.mock import patch, MagicMock

# Add server to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'server'))

from app.data.db import db
from app.main import app
from app.services.pdf_extractor import extract_parameters_from_pdf
from app.services.document_validator import (
    validate_file_security,
    extract_raw_text,
    classify_medical_document,
    DocumentValidationError,
    _classify_with_ai_model
)
from app.services.numerical_validator import (
    determine_parameter_status,
    parse_reference_range,
    infer_parameter_category,
    normalize_parameter_name
)
from fastapi.testclient import TestClient
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet
from PIL import Image, ImageDraw


def generate_pdf_bytes(title: str, text_lines: list, table_data: list = None) -> bytes:
    """Helper to generate well-formed in-memory PDF documents for testing."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [Paragraph(f"<b>{title}</b>", styles['Heading1']), Spacer(1, 8)]
    for line in text_lines:
        story.append(Paragraph(line, styles['Normal']))
        story.append(Spacer(1, 4))
    if table_data:
        story.append(Spacer(1, 6))
        story.append(Table(table_data))
    doc.build(story)
    return buf.getvalue()


def generate_png_bytes(text_lines: list) -> bytes:
    """Helper to generate a PNG medical image."""
    img = Image.new('RGB', (700, 500), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    y = 25
    for line in text_lines:
        draw.text((30, y), line, fill=(0, 0, 0))
        y += 28
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


class MedicalDocumentVerificationSuite(unittest.TestCase):
    """
    Complete 18-Scenario Automated Test Suite for MEDI-TREND AI:
    Medical Document Upload, OCR, AI Verification, Dynamic Extraction,
    Security, Authorization, and DB Ingestion.
    """

    def setUp(self):
        self.client = TestClient(app)
        self.auth_headers = {
            "x-user-role": "DOCTOR",
            "x-user-name": "Dr. Arvind Kumar",
            "x-user-id": "DOC-001"
        }

    # =========================================================================
    # Scenario 1: Digital laboratory PDF with embedded text
    # =========================================================================
    def test_01_digital_laboratory_pdf_with_embedded_text(self):
        """Digital laboratory PDF with embedded text extracts and structures parameters."""
        pdf_bytes = generate_pdf_bytes(
            title="APOLLO DIAGNOSTICS LABORATORY REPORT",
            text_lines=[
                "Patient Name: Rajesh Raman",
                "Patient ID: PT-TST-001",
                "Collection Date: 2026-03-20",
                "Department: Biochemistry"
            ],
            table_data=[
                ["Test Name", "Result", "Unit", "Biological Reference Interval"],
                ["Fasting Blood Sugar", "110.0", "mg/dL", "70.0 - 99.0"],
                ["Postprandial Blood Sugar", "155.0", "mg/dL", "< 140.0"],
                ["HbA1c", "6.4", "%", "< 5.7"],
                ["Serum Creatinine", "1.0", "mg/dL", "0.7 - 1.3"]
            ]
        )

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(pdf_bytes)
            tmp_path = f.name

        try:
            # Check security and format
            sec = validate_file_security(tmp_path, "apollo_report.pdf")
            self.assertTrue(sec["is_valid"])
            self.assertEqual(sec["format"], "PDF")

            # Digital text extraction (without OCR)
            text, pages, ocr_performed = extract_raw_text(tmp_path, ".pdf")
            self.assertFalse(ocr_performed)
            self.assertIn("Rajesh Raman", text)
            self.assertIn("Fasting Blood Sugar", text)

            # Classify as medical
            classification = classify_medical_document(text, "apollo_report.pdf")
            self.assertTrue(classification.get("is_medical", classification.get("is_medical_document")))

            # Extract clinical parameters
            params = extract_parameters_from_pdf(tmp_path, raw_text=text)
            self.assertGreaterEqual(len(params), 3)

            param_names = [p.canonicalName for p in params]
            self.assertIn("Fasting Blood Glucose", param_names)
            self.assertIn("HbA1c", param_names)

            fbs = next(p for p in params if p.canonicalName == "Fasting Blood Glucose")
            self.assertEqual(fbs.value, 110.0)
            self.assertEqual(fbs.unit, "mg/dL")
            self.assertEqual(fbs.status, "Elevated")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    # =========================================================================
    # Scenario 2: Scanned laboratory PDF requiring OCR
    # =========================================================================
    def test_02_scanned_laboratory_pdf_requiring_ocr(self):
        """Scanned laboratory PDF requiring multimodal Vision OCR is successfully processed."""
        # A scanned PDF produces minimal or no digital text
        mock_ocr_text = (
            "METROPOLIS HEALTHCARE LIMITED - SCANNED LAB REPORT\n"
            "Patient Name: Meera Krishnan\n"
            "Patient ID: PT-SCN-002\n"
            "Complete Blood Count (CBC)\n"
            "Hemoglobin: 11.2 g/dL (Reference: 12.0 - 15.5)\n"
            "Total Leukocyte Count (WBC): 7200 /mcL (Reference: 4000 - 11000)\n"
            "Platelet Count: 240000 /mcL (Reference: 150000 - 450000)\n"
        )

        with patch("app.services.document_validator._perform_vision_ocr", return_value=mock_ocr_text):
            # Pass text or mock OCR
            classification = classify_medical_document(mock_ocr_text, "scanned_cbc.pdf", ocr_used=True)
            self.assertTrue(classification.get("is_medical", classification.get("is_medical_document")))
            self.assertEqual(classification.get("document_type"), "LAB_REPORT")

            # Parameter extraction using OCR text
            params = extract_parameters_from_pdf("dummy.pdf", raw_text=mock_ocr_text)
            self.assertGreaterEqual(len(params), 2)
            hb = next(p for p in params if "Hemoglobin" in p.canonicalName)
            self.assertEqual(hb.value, 11.2)
            self.assertEqual(hb.unit, "g/dL")

    # =========================================================================
    # Scenario 3: JPG/PNG medical report image
    # =========================================================================
    def test_03_jpg_png_medical_report_image(self):
        """Image medical reports (.png / .jpg) are recognized, OCR-processed, and validated."""
        img_bytes = generate_png_bytes([
            "CLINICAL LABORATORY REPORT",
            "Patient Name: Ananya Sundaram",
            "Serum Cholesterol: 215 mg/dL",
            "Triglycerides: 165 mg/dL",
            "Date: 2026-02-18"
        ])

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(img_bytes)
            tmp_path = f.name

        try:
            sec = validate_file_security(tmp_path, "lipid_scan.png")
            self.assertTrue(sec["is_valid"])
            self.assertEqual(sec["format"], "PNG")
            self.assertEqual(sec["extension"], ".png")

            # OCR hook returns extracted image text
            mock_img_text = (
                "CLINICAL LABORATORY REPORT\n"
                "Patient Name: Ananya Sundaram\n"
                "Serum Cholesterol: 215 mg/dL (Reference: < 200)\n"
                "Triglycerides: 165 mg/dL (Reference: < 150)\n"
            )
            with patch("app.services.document_validator._perform_vision_ocr", return_value=mock_img_text):
                text, pages, ocr_used = extract_raw_text(tmp_path, ".png")
                self.assertTrue(ocr_used)
                self.assertIn("Serum Cholesterol", text)

                classification = classify_medical_document(text, "lipid_scan.png", ocr_used=True)
                self.assertTrue(classification.get("is_medical", classification.get("is_medical_document")))
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    # =========================================================================
    # Scenario 4: Blood glucose and HbA1c report
    # =========================================================================
    def test_04_blood_glucose_and_hba1c_report(self):
        """Blood glucose and HbA1c tests evaluate reference ranges and assign abnormal flags."""
        report_text = (
            "DIABETES MONITORING PANEL\n"
            "Patient Name: Suresh Babu\n"
            "Fasting Blood Glucose: 135 mg/dL (Ref: 70 - 99)\n"
            "Postprandial Blood Glucose: 195 mg/dL (Ref: < 140)\n"
            "HbA1c: 7.8 % (Ref: < 5.7)\n"
        )

        params = extract_parameters_from_pdf("nonexistent.pdf", raw_text=report_text)
        self.assertGreaterEqual(len(params), 3)

        fbs = next(p for p in params if "Fasting" in p.parameterName or "Fasting" in p.canonicalName)
        self.assertEqual(fbs.value, 135.0)
        self.assertEqual(fbs.unit, "mg/dL")
        self.assertIn(fbs.status, ["Elevated", "Critical High"])
        self.assertEqual(fbs.category, "Glycemic Control")

        hba1c = next(p for p in params if "HbA1c" in p.canonicalName)
        self.assertEqual(hba1c.value, 7.8)
        self.assertEqual(hba1c.unit, "%")
        self.assertEqual(hba1c.status, "Elevated")
        self.assertEqual(hba1c.category, "Glycemic Control")

    # =========================================================================
    # Scenario 5: Cholesterol and lipid profile report
    # =========================================================================
    def test_05_cholesterol_and_lipid_profile_report(self):
        """Lipid panel parameters are normalized with clinical units, categories and ranges."""
        lipid_text = (
            "LIPID PROFILE REPORT\n"
            "Patient Name: Karthik Raja\n"
            "Total Cholesterol: 245 mg/dL (Desirable: < 200)\n"
            "HDL Cholesterol: 38 mg/dL (Normal: > 40)\n"
            "LDL Cholesterol: 162 mg/dL (Optimal: < 100)\n"
            "Triglycerides: 220 mg/dL (Normal: < 150)\n"
            "VLDL Cholesterol: 45 mg/dL (Normal: 10 - 30)\n"
        )

        params = extract_parameters_from_pdf("dummy.pdf", raw_text=lipid_text)
        param_map = {p.canonicalName: p for p in params}

        self.assertIn("Total Cholesterol", param_map)
        self.assertIn("HDL Cholesterol", param_map)
        self.assertIn("LDL Cholesterol", param_map)
        self.assertIn("Triglycerides", param_map)

        tc = param_map["Total Cholesterol"]
        self.assertEqual(tc.value, 245.0)
        self.assertEqual(tc.unit, "mg/dL")
        self.assertEqual(tc.status, "Elevated")
        self.assertEqual(tc.category, "Lipid Profile")

        hdl = param_map["HDL Cholesterol"]
        self.assertEqual(hdl.value, 38.0)
        self.assertEqual(hdl.status, "Low")

    # =========================================================================
    # Scenario 6: CBC, kidney, and liver function reports
    # =========================================================================
    def test_06_cbc_kidney_and_liver_function_reports(self):
        """Comprehensive multi-panel lab report extracts Hematology, Renal, and Liver parameters."""
        multi_panel_text = (
            "COMPREHENSIVE METABOLIC & HEMATOLOGY PANEL\n"
            "Patient Name: Lakshmi Narayanan\n"
            "Hemoglobin: 13.8 g/dL (12.0 - 16.0)\n"
            "Platelet Count: 280000 /mcL (150000 - 450000)\n"
            "Serum Creatinine: 1.1 mg/dL (0.7 - 1.3)\n"
            "Blood Urea Nitrogen: 16 mg/dL (7 - 20)\n"
            "SGOT (AST): 28 U/L (10 - 40)\n"
            "SGPT (ALT): 32 U/L (7 - 56)\n"
            "Total Bilirubin: 0.8 mg/dL (0.2 - 1.2)\n"
        )

        params = extract_parameters_from_pdf("dummy.pdf", raw_text=multi_panel_text)
        self.assertGreaterEqual(len(params), 5)

        names = [p.canonicalName for p in params]
        self.assertTrue(any("Hemoglobin" in n for n in names))
        self.assertTrue(any("Creatinine" in n for n in names))
        self.assertTrue(any("AST" in n or "SGOT" in n for n in names))
        self.assertTrue(any("ALT" in n or "SGPT" in n for n in names))
        self.assertTrue(any("Bilirubin" in n for n in names))

    # =========================================================================
    # Scenario 7: Unfamiliar or unregistered test names
    # =========================================================================
    def test_07_medical_report_with_unfamiliar_or_unregistered_tests(self):
        """Unfamiliar / unregistered clinical tests are dynamically preserved and never dropped."""
        custom_tests_text = (
            "SPECIALIZED IMMUNOLOGY & BIOMARKER REPORT\n"
            "Patient Name: Deepa V\n"
            "Serum Calprotectin: 145 ug/g (Ref: < 50)\n"
            "Anti-Cyclic Citrullinated Peptide: 65 U/mL (Ref: < 20)\n"
            "Interleukin-6: 12.5 pg/mL (Ref: < 7.0)\n"
            "Homocysteine Ultra-Sensitive: 18.2 umol/L (Ref: 5.0 - 15.0)\n"
        )

        params = extract_parameters_from_pdf("dummy.pdf", raw_text=custom_tests_text)
        self.assertGreaterEqual(len(params), 3)

        for p in params:
            # Must NOT be dropped or marked unknown_param
            self.assertNotEqual(p.canonicalName, "unknown_param")
            self.assertIsNotNone(p.value)
            self.assertIn(p.status, ["Elevated", "Critical High"])
            self.assertIsNotNone(p.category)

    # =========================================================================
    # Scenario 8: Medical narrative or diagnostic consultation report
    # =========================================================================
    def test_08_medical_narrative_or_diagnostic_consultation_report(self):
        """Doctor consultation notes and diagnostic summaries are validated as medical documents."""
        consultation_text = (
            "DEPARTMENT OF CARDIOLOGY - CLINICAL CONSULTATION NOTE\n"
            "Consulting Physician: Dr. Arvind Kumar, MD DM Cardiology\n"
            "Patient Name: Ramesh Krishnan &nbsp;&nbsp; Age: 54 &nbsp;&nbsp; Gender: Male\n"
            "Date of Consultation: 2026-03-12\n"
            "Chief Complaints: Mild exertional dyspnea and intermittent chest tightness.\n"
            "Clinical Assessment: Patient has stage-1 essential hypertension with mild sinus tachycardia.\n"
            "Vitals Recorded: Blood Pressure 135/88 mmHg, Pulse Rate 78 bpm, SpO2 98% on room air.\n"
            "ECG Findings: Normal sinus rhythm, no acute ST-T segment elevation or depression.\n"
            "Treatment Plan: Continue Telmisartan 40mg once daily, lifestyle modification with salt restriction.\n"
            "Review in 4 weeks with lipid profile and ambulatory BP log.\n"
        )

        classification = classify_medical_document(consultation_text, "consultation_cardiology.pdf")
        self.assertTrue(classification.get("is_medical", classification.get("is_medical_document")))
        self.assertIn(classification.get("document_type"), ["CONSULTATION_NOTE", "DIAGNOSTIC_REPORT", "LAB_REPORT"])

    # =========================================================================
    # Scenario 9: Academic PDF and commercial invoice rejected
    # =========================================================================
    def test_09_academic_pdf_and_commercial_invoice_rejected(self):
        """Academic timetables and commercial invoices are rejected with NON_MEDICAL_DOCUMENT."""
        # 1. Academic Calendar
        academic_text = (
            "ANNA UNIVERSITY CHENNAI - ACADEMIC CALENDAR 2025-2026\n"
            "UG & PG Degree Programmes - Regulations 2021\n"
            "Semester Examination Schedule and Theory Exams Timetable\n"
            "Commencement of classes: 14-07-2025. Last working day: 22-10-2025.\n"
            "Practical exams begin: 25-10-2025. Attendance requirement: 75%.\n"
            "Tuition fees payment schedule and hostel fees deadline.\n"
        )
        with self.assertRaises(DocumentValidationError) as cm_acad:
            classify_medical_document(academic_text, "academic_calendar_2025.pdf")
        self.assertEqual(cm_acad.exception.error_code, "NON_MEDICAL_DOCUMENT")

        # 2. Commercial Invoice
        invoice_text = (
            "AMAZON SELLER SERVICES COMMERCIAL TAX INVOICE\n"
            "Invoice Number: INV-9876543210 &nbsp; Date: 10/01/2026\n"
            "GSTIN: 33AAAAA0000A1Z5 &nbsp; State Code: 33\n"
            "Billing Address: 404 Industrial Estate, Ambattur, Chennai\n"
            "Shipping Address: Same as billing\n"
            "Item Description: Ergonomic Office Chair &nbsp; Qty: 1 &nbsp; Price: 7,500.00\n"
            "Subtotal: 7,500.00 &nbsp; CGST 9%: 675.00 &nbsp; SGST 9%: 675.00\n"
            "Total Amount Payable: Rs. 8,850.00\n"
            "Payment Method: Corporate Credit Card\n"
        )
        with self.assertRaises(DocumentValidationError) as cm_inv:
            classify_medical_document(invoice_text, "amazon_tax_invoice.pdf")
        self.assertEqual(cm_inv.exception.error_code, "NON_MEDICAL_DOCUMENT")

    # =========================================================================
    # Scenario 10: Misleading filename with non-medical content
    # =========================================================================
    def test_10_misleading_filename_with_non_medical_content_rejected(self):
        """Document with a deceptive medical filename is rejected based on its actual content."""
        software_cv_text = (
            "CURRICULUM VITAE - JOHN DOE\n"
            "Lead Software Engineer & Full Stack Architect\n"
            "Technical Skills: Python, TypeScript, React, Docker, Kubernetes\n"
            "Work Experience: 8 years building distributed microservices\n"
            "Education History: Bachelor of Engineering in Computer Science\n"
            "GitHub Repository: https://github.com/johndoe/portfolio\n"
        )

        with self.assertRaises(DocumentValidationError) as cm:
            classify_medical_document(software_cv_text, "apollo_blood_test_results_urgent.pdf")
        self.assertEqual(cm.exception.error_code, "NON_MEDICAL_DOCUMENT")

    # =========================================================================
    # Scenario 11: Corrupted or unreadable document
    # =========================================================================
    def test_11_corrupted_or_unreadable_document_rejected(self):
        """Corrupted, zero-byte, or unreadable files are rejected with readability error codes."""
        # A. Empty / insufficient content
        blank_text = "   \n\t   "
        with self.assertRaises(DocumentValidationError) as cm_blank:
            classify_medical_document(blank_text, "blank_report.pdf")
        self.assertEqual(cm_blank.exception.error_code, "UNREADABLE_OR_BLANK")

        # B. Corrupted file upload via API
        corrupted_bytes = b"%PDF-1.4 truncated corrupted content without EOF marker\x00\xff"
        res = self.client.post(
            "/api/patients/PT-TEST-NONEXISTENT/upload",
            files={"file": ("corrupted_report.pdf", corrupted_bytes, "application/pdf")},
            headers=self.auth_headers
        )
        # Endpoint returns 400 or 422 with clear rejection
        self.assertIn(res.status_code, [400, 422])
        body = res.json()
        self.assertFalse(body.get("success", False))

    # =========================================================================
    # Scenario 12: Valid medical report with unmatched patient profile
    # =========================================================================
    def test_12_valid_medical_report_with_unmatched_patient_profile(self):
        """
        Valid medical report uploaded for non-existent patient profile is confirmed as medical,
        decoupled from patient profile lookup, and returns PATIENT_NOT_FOUND error with resolution.
        """
        valid_pdf_bytes = generate_pdf_bytes(
            title="METROPOLIS HEALTHCARE LAB REPORT",
            text_lines=[
                "Patient Name: Unknown Person",
                "Patient ID: PT-NOT-IN-DB",
                "Date: 2026-03-10",
                "Fasting Blood Sugar: 95 mg/dL (70 - 99)",
                "Total Cholesterol: 180 mg/dL (< 200)"
            ]
        )

        res = self.client.post(
            "/api/patients/PT-NONEXISTENT-PROFILE-999/upload",
            files={"file": ("metropolis_blood_test.pdf", valid_pdf_bytes, "application/pdf")},
            headers=self.auth_headers
        )

        self.assertEqual(res.status_code, 422)
        body = res.json()
        self.assertFalse(body["success"])
        # CRITICAL ASSERTIONS:
        self.assertEqual(body["error_code"], "PATIENT_NOT_FOUND")
        self.assertEqual(body["validation_status"], "PATIENT_NOT_FOUND")
        self.assertTrue(body["is_medical"], "Document must be classified as medical despite missing profile")
        self.assertEqual(body["document_type"], "LAB_REPORT")
        self.assertIn("resolution", body)

    # =========================================================================
    # Scenario 13: Duplicate report upload rejection
    # =========================================================================
    def test_13_duplicate_report_upload_rejected(self):
        """Duplicate medical report uploads for the same patient are rejected with 409 Conflict."""
        p = db.create_patient({
            "full_name": "Duplicate Test Patient",
            "age": 40,
            "gender": "Male",
            "phone": "+91 97777 11111",
            "email": "dup.test@example.com"
        })
        pid = p["patient_id"]

        try:
            pdf_bytes = generate_pdf_bytes(
                title="DIAGNOSTIC CLINICAL LAB",
                text_lines=[
                    f"Patient Name: Duplicate Test Patient",
                    f"Patient ID: {pid}",
                    "Date: 2026-03-15",
                    "Fasting Blood Glucose: 105 mg/dL (70 - 99)",
                    "HbA1c: 6.0 % (< 5.7)"
                ]
            )

            # Upload 1: Must succeed
            res1 = self.client.post(
                f"/api/patients/{pid}/upload",
                files={"file": ("first_upload.pdf", pdf_bytes, "application/pdf")},
                headers=self.auth_headers
            )
            self.assertEqual(res1.status_code, 200, f"Upload 1 failed: {res1.text}")
            self.assertTrue(res1.json()["success"])

            # Upload 2: Exact duplicate submission must be rejected with 409 Conflict
            res2 = self.client.post(
                f"/api/patients/{pid}/upload",
                files={"file": ("second_upload_same_file.pdf", pdf_bytes, "application/pdf")},
                headers=self.auth_headers
            )
            self.assertEqual(res2.status_code, 409)
            body2 = res2.json()
            self.assertEqual(body2["error_code"], "DUPLICATE_REPORT")
            self.assertEqual(body2["validation_status"], "DUPLICATE_REPORT")
        finally:
            db.delete_patient(pid)

    # =========================================================================
    # Scenario 14: AI provider failure and fallback mechanism
    # =========================================================================
    def test_14_ai_provider_failure_and_fallback_mechanism(self):
        """When primary AI provider (Gemini) encounters failure, secondary fallback operates cleanly."""
        medical_text = (
            "SRI RAMACHANDRA MEDICAL CENTRE - BIOCHEMISTRY LAB\n"
            "Patient Name: Anantharaman K\n"
            "Serum Creatinine: 1.2 mg/dL (Ref: 0.7 - 1.3)\n"
            "Blood Urea: 25 mg/dL (Ref: 15 - 40)\n"
        )

        # Mock requests.post so Gemini fails with a timeout / 500 error
        def failing_gemini_request(*args, **kwargs):
            url = args[0] if args else kwargs.get("url", "")
            if "generativelanguage.googleapis.com" in url:
                mock_resp = MagicMock()
                mock_resp.status_code = 503
                return mock_resp
            # OpenRouter fallback mock response
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "choices": [{
                    "message": {
                        "content": json.dumps({
                            "is_medical_document": True,
                            "document_type": "LAB_REPORT",
                            "confidence": 0.98,
                            "medical_evidence": ["Serum Creatinine", "Blood Urea"],
                            "detected_content": ["Biochemistry Lab Report"],
                            "reason": "Verified clinical laboratory report."
                        })
                    }
                }]
            }
            return mock_resp

        with patch("requests.post", side_effect=failing_gemini_request):
            classification = classify_medical_document(medical_text, "sri_ramachandra_lab.pdf")
            self.assertTrue(classification.get("is_medical", classification.get("is_medical_document")))
            self.assertEqual(classification.get("document_type"), "LAB_REPORT")

    # =========================================================================
    # Scenario 15: Missing values, units, or reference ranges handled safely
    # =========================================================================
    def test_15_missing_values_units_or_reference_ranges_handled_safely(self):
        """Partial or qualitative results are handled without numeric hallucination or synthetic ranges."""
        # 1. Dynamic range parsing with missing or unusual bounds
        min_v, max_v = parse_reference_range("< 100")
        self.assertIsNone(min_v)
        self.assertEqual(max_v, 100.0)

        min_v2, max_v2 = parse_reference_range("> 50")
        self.assertEqual(min_v2, 50.0)
        self.assertIsNone(max_v2)

        min_v3, max_v3 = parse_reference_range("Not Specified")
        self.assertIsNone(min_v3)
        self.assertIsNone(max_v3)

        # Status determination handles None reference bounds gracefully
        status_none = determine_parameter_status(120.0, None, "Not Available")
        self.assertEqual(status_none, "Normal")

        # 2. Text with qualitative entries doesn't fabricate numbers
        qual_text = (
            "MICROBIOLOGY CULTURE & SENSITIVITY\n"
            "Patient Name: Varun S\n"
            "Urine Protein: Negative\n"
            "Blood Culture: No growth after 48 hours\n"
        )
        params = extract_parameters_from_pdf("dummy.pdf", raw_text=qual_text)
        # Ensures no fake numeric parameters are fabricated from words like '48 hours'
        for p in params:
            self.assertNotIn(p.parameterName, ["48", "hours", "No growth"])

    # =========================================================================
    # Scenario 16: Unauthorized patient access blocked (403)
    # =========================================================================
    def test_16_unauthorized_patient_access_blocked(self):
        """Patient accounts attempting to upload documents to another patient profile are blocked with 403."""
        # User is authenticated as patient PT-USER-ALPHA
        patient_headers = {
            "x-user-role": "PATIENT",
            "x-user-name": "Alpha Patient",
            "x-user-id": "PT-USER-ALPHA"
        }

        dummy_pdf = generate_pdf_bytes("LAB", ["Patient Name: Beta Patient", "HbA1c: 6.5 %"])

        # Attempt to upload to PT-USER-BETA
        res = self.client.post(
            "/api/patients/PT-USER-BETA/upload",
            files={"file": ("lab.pdf", dummy_pdf, "application/pdf")},
            headers=patient_headers
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("Forbidden", res.text)

    # =========================================================================
    # Scenario 17: Extraction failure without fabricated success
    # =========================================================================
    def test_17_extraction_failure_without_fabricated_success(self):
        """Clinical document with no numerical lab tables reports 0 parameters honestly without hallucination."""
        narrative_only = (
            "PHYSIOTHERAPY CONSULTATION NOTES\n"
            "Patient Name: Ganesh Kumar\n"
            "Patient presented with cervical spondylosis and neck stiffness.\n"
            "Active cervical range of motion restricted by 20 degrees.\n"
            "Advised posture correction exercises and isometric neck strengthening.\n"
        )

        params = extract_parameters_from_pdf("nonexistent.pdf", raw_text=narrative_only)
        # Must report 0 parameters honestly; never fabricate fake Glucose or Hemoglobin
        self.assertEqual(len(params), 0)

    # =========================================================================
    # Scenario 18: End-to-end verification and database ingestion
    # =========================================================================
    def test_18_end_to_end_verification_and_database_ingestion(self):
        """End-to-end flow: upload valid document -> verify -> extract -> ingest into database -> retrieve via API."""
        test_uid = uuid.uuid4().hex[:6]
        p = db.create_patient({
            "full_name": f"Test Patient {test_uid.upper()}",
            "age": 52,
            "gender": "Male",
            "phone": f"+91 99999 {test_uid[:5]}",
            "email": f"testpatient_{test_uid}@testlab.org"
        })
        pid = p["patient_id"]

        try:
            pdf_bytes = generate_pdf_bytes(
                title="APOLLO HOSPITALS BIOCHEMISTRY & LIPID PROFILE",
                text_lines=[
                    f"Patient Name: Test Patient {test_uid.upper()}",
                    f"Patient ID: {pid}",
                    "Date: 2026-03-22",
                    "Doctor: Dr. Arvind Kumar",
                    "Department: Preventive Cardiology"
                ],
                table_data=[
                    ["Investigation", "Observed Value", "Units", "Reference Range"],
                    ["Fasting Blood Glucose", "118.0", "mg/dL", "70.0 - 99.0"],
                    ["HbA1c", "6.6", "%", "< 5.7"],
                    ["Total Cholesterol", "215.0", "mg/dL", "< 200.0"],
                    ["Serum Creatinine", "1.1", "mg/dL", "0.7 - 1.3"]
                ]
            )

            # 1. Upload Report via API
            upload_res = self.client.post(
                f"/api/patients/{pid}/upload",
                files={"file": ("apollo_gurumurthy_lipid.pdf", pdf_bytes, "application/pdf")},
                data={
                    "provider": "Apollo Hospitals",
                    "reportDate": "2026-03-22",
                    "reportCategory": "Biochemistry"
                },
                headers=self.auth_headers
            )
            self.assertEqual(upload_res.status_code, 200, f"Upload failed: {upload_res.text}")
            upload_data = upload_res.json()
            self.assertTrue(upload_data["success"])
            self.assertEqual(upload_data["validation_status"], "VERIFIED")
            self.assertIn("report", upload_data)
            rep = upload_data["report"]
            report_id = rep["report_id"]

            # 2. Verify Database Ingestion
            reports_in_db = db.get_patient_reports(pid)
            self.assertEqual(len(reports_in_db), 1)
            self.assertEqual(reports_in_db[0]["report_id"], report_id)
            self.assertIsNotNone(reports_in_db[0].get("document_hash"))

            # 3. Retrieve Reports via GET API Endpoint
            get_res = self.client.get(f"/api/patients/{pid}/reports")
            self.assertEqual(get_res.status_code, 200)
            retrieved_reports = get_res.json()
            self.assertEqual(len(retrieved_reports), 1)
            self.assertGreaterEqual(retrieved_reports[0]["parameter_count"], 3)

            # 4. Verify Parameters are in DB
            db_params = db.get_report_parameters(report_id)
            self.assertGreaterEqual(len(db_params), 3)
            p_names = [dp["canonical_name"] for dp in db_params]
            self.assertIn("Fasting Blood Glucose", p_names)
            self.assertIn("HbA1c", p_names)
            self.assertIn("Total Cholesterol", p_names)
        finally:
            db.delete_patient(pid)


if __name__ == "__main__":
    unittest.main()
