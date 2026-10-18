import os
import sys
import unittest
import io
import json
import uuid
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from fastapi.testclient import TestClient

# Add server directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'server'))

from app.data.db import db
from app.main import app
from app.models.schemas import PatientProfile, ReportRecord, ParameterData
from app.orchestrator.langgraph_orchestrator import LangGraphMedicalOrchestrator
from app.services.identity_verifier import verify_patient_identity
from app.services.numerical_validator import (
    normalize_unit,
    are_units_compatible,
    is_valid_parameter_name,
    calculate_numerical_comparison,
    normalize_parameter_name
)
from app.services.pdf_extractor import extract_parameters_from_pdf
from app.services.document_validator import classify_medical_document


def generate_pdf_bytes(
    patient_name: str = "Gurumoorthy",
    report_date: str = "2026-05-12",
    age: int = 45,
    gender: str = "Male",
    lines: list = None,
    pages: int = 1
) -> bytes:
    """Generates authentic PDF bytes with clinical test metadata and results."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)

    for page_num in range(1, pages + 1):
        c.drawString(50, 750, f"METROPOLIS CLINICAL DIAGNOSTIC LABORATORY (PAGE {page_num})")
        if patient_name:
            c.drawString(50, 730, f"Patient Name: {patient_name}")
        c.drawString(50, 715, f"Age: {age} Yrs / Gender: {gender}")
        c.drawString(50, 700, f"Report Date: {report_date}")
        c.drawString(50, 680, "----------------------------------------------------------------------")
        c.drawString(50, 660, "INVESTIGATION                     RESULT     UNIT        REFERENCE")

        y = 635
        if lines:
            for line in lines:
                c.drawString(50, y, line)
                y -= 25
        else:
            if page_num == 1:
                c.drawString(50, y, "Fasting Blood Glucose             92.0       mg/dL       70 - 100")
                y -= 25
                c.drawString(50, y, "HbA1c (Glycated Hemoglobin)       5.4        %           4.0 - 5.6")
                y -= 25
                c.drawString(50, y, "Total Cholesterol                 185.0      mg/dL       125 - 200")
            elif page_num == 2:
                c.drawString(50, y, "Serum Creatinine                  0.9        mg/dL       0.7 - 1.3")
                y -= 25
                c.drawString(50, y, "Blood Urea Nitrogen               14.0       mg/dL       7 - 20")
        c.showPage()

    c.save()
    buffer.seek(0)
    return buffer.getvalue()


class AdvancedMedicalAnalysisTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.orchestrator = LangGraphMedicalOrchestrator()

    # =========================================================================
    # SPECIFIC REGRESSION BUG TESTS (4 BUGS OBSERVED PREVIOUSLY)
    # =========================================================================
    def test_bug_1_date_never_extracted_as_medical_parameter(self):
        """Bug 1: Date '12/05/2026' must NEVER be parsed into parameter name '12/05' or value '12.0'."""
        self.assertFalse(is_valid_parameter_name("12/05/2026"))
        self.assertFalse(is_valid_parameter_name("12/05"))
        self.assertFalse(is_valid_parameter_name("Report Date: 12/05/2026"))
        self.assertFalse(is_valid_parameter_name("Date"))

        # Test with synthetic PDF containing explicit dates in header and body
        pdf_bytes = generate_pdf_bytes(
            patient_name="Gurumoorthy",
            report_date="12/05/2026",
            lines=[
                "Collection Date: 12/05/2026",
                "Fasting Blood Glucose             92.0       mg/dL       70 - 100",
                "Reporting Date: 13/05/2026"
            ]
        )
        temp_file = "temp_bug1_test.pdf"
        try:
            with open(temp_file, "wb") as f:
                f.write(pdf_bytes)
            params = extract_parameters_from_pdf(temp_file, "REP-BUG1", "2026-05-12")
            param_names = [p.canonicalName.lower() for p in params]
            # Must contain Glucose, must NOT contain any date string or 12.0
            self.assertTrue(any("glucose" in name for name in param_names))
            self.assertFalse(any("date" in name or "12/05" in name for name in param_names))
            for p in params:
                self.assertNotIn("12/05", p.parameterName)
                self.assertNotIn("12/05", p.canonicalName)
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

    def test_bug_2_fasting_glucose_unit_compatibility(self):
        """Bug 2: Fasting glucose 92 mg/dL vs 105 mg/dL must NEVER be flagged as 'incompatible units'."""
        self.assertEqual(normalize_unit("mg/dL"), "mg/dL")
        self.assertEqual(normalize_unit("mg/dl"), "mg/dL")
        self.assertEqual(normalize_unit("MG/DL"), "mg/dL")
        self.assertTrue(are_units_compatible("mg/dL", "mg/dL")[0])
        self.assertTrue(are_units_compatible("mg/dL", "mg/dl")[0])

        p1 = ParameterData(parameterName="Fasting Blood Glucose", canonicalName="Fasting Blood Glucose", value=92.0, unit="mg/dL", reportId="R1", reportDate="2026-01-01")
        p2 = ParameterData(parameterName="Fasting Blood Glucose", canonicalName="Fasting Blood Glucose", value=105.0, unit="mg/dL", reportId="R2", reportDate="2026-02-01")
        res = calculate_numerical_comparison(p1, p2)
        self.assertTrue(res.isComparable, "92 mg/dL vs 105 mg/dL must be marked comparable")
        self.assertEqual(res.absoluteChange, 13.0)
        self.assertAlmostEqual(res.percentChange, 14.1, places=1)
        self.assertIsNone(res.clinicalNote)

    def test_bug_3_hba1c_unit_compatibility(self):
        """Bug 3: HbA1c 5.4% vs 5.8% must NEVER be flagged as 'incompatible units'."""
        self.assertEqual(normalize_unit("%"), "%")
        self.assertEqual(normalize_unit("percent"), "%")
        self.assertTrue(are_units_compatible("%", "%")[0])
        self.assertTrue(are_units_compatible("%", "percent")[0])

        p1 = ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=5.4, unit="%", reportId="R1", reportDate="2026-01-01")
        p2 = ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=5.8, unit="%", reportId="R2", reportDate="2026-02-01")
        res = calculate_numerical_comparison(p1, p2)
        self.assertTrue(res.isComparable, "HbA1c 5.4% vs 5.8% must be marked comparable")
        self.assertAlmostEqual(res.absoluteChange, 0.4, places=2)
        self.assertAlmostEqual(res.percentChange, 7.4, places=1)

    def test_bug_4_identity_mismatch_blocks_unauthorized_report(self):
        """Bug 4: Report belonging to different patient (Ramesh Kumar vs Gurumoorthy) must be rejected with IDENTITY_MISMATCH."""
        res = verify_patient_identity(
            registered_patient_name="Gurumoorthy",
            extracted_patient_name="Ramesh Kumar",
            registered_age=45,
            extracted_age=45,
            registered_gender="Male",
            extracted_gender="Male"
        )
        self.assertEqual(res["status"], "IDENTITY_MISMATCH")
        self.assertFalse(res["verified"])
        self.assertIn("Ramesh Kumar", res["extracted_patient"])
        self.assertEqual(res.get("failed_field"), "PATIENT_NAME")
        self.assertEqual(res.get("error_code"), "PATIENT_NAME_MISMATCH")

    # =========================================================================
    # REGRESSION TESTS: PATIENT IDENTITY NORMALIZATION & FIELD-SPECIFIC MISMATCH
    # =========================================================================
    def test_regression_exact_matching_patient_gurumurthy_with_id(self):
        """Exact matching registered patient S. Gurumurthy (PT-E77688) with report must verify cleanly."""
        registered_pat = {
            "id": "pat-root-001",
            "patient_id": "PT-E77688",
            "full_name": "S. Gurumurthy",
            "age": 58,
            "gender": "Male"
        }
        report_text = """
        APOLLO CLINICAL DIAGNOSTIC LABORATORY
        Patient Name: S. Gurumurthy
        Patient ID: PT-E77688
        Age/Sex: 58/M
        Date: 2026-09-01
        Investigation: Complete Blood Count
        Hemoglobin: 14.2 g/dL (13.0 - 17.0)
        """
        res = verify_patient_identity(registered_pat, report_text)
        self.assertEqual(res["status"], "IDENTITY_VERIFIED")
        self.assertTrue(res["verified"])
        self.assertTrue(res["is_match"])
        self.assertIsNone(res["error_code"])
        self.assertEqual(res["extracted_id"], "PT-E77688")

    def test_regression_whitespace_casing_punctuation_unicode(self):
        """Name normalization safely handles unicode NFKC, non-breaking spaces, and punctuation variations."""
        registered_pat = {
            "patient_id": "PT-E77688",
            "full_name": "S. Gurumurthy",
            "age": 58,
            "gender": "Male"
        }
        variations = [
            "s.  gurumurthy",
            "S.Gurumurthy",
            "S Gurumurthy\u00a0",
            "S. GURUMURTHY",
            "Mr. S. Gurumurthy"
        ]
        for name_var in variations:
            res = verify_patient_identity(registered_pat, extracted_patient_name=name_var)
            self.assertEqual(res["status"], "IDENTITY_VERIFIED", f"Failed for variation: {name_var!r}")
            self.assertTrue(res["verified"])

    def test_regression_initial_swap_safe_comparison(self):
        """Initial swap (S. Gurumurthy vs Gurumurthy S.) is safely recognized without rejection."""
        registered_pat = {
            "patient_id": "PT-E77688",
            "full_name": "S. Gurumurthy",
            "age": 58,
            "gender": "Male"
        }
        res = verify_patient_identity(registered_pat, extracted_patient_name="Gurumurthy S.")
        self.assertEqual(res["status"], "IDENTITY_VERIFIED")
        self.assertTrue(res["verified"])

    def test_regression_missing_patient_name_unverified(self):
        """Document missing a readable patient name returns IDENTITY_UNVERIFIED with failed_field=PATIENT_NAME."""
        registered_pat = {
            "patient_id": "PT-E77688",
            "full_name": "S. Gurumurthy",
            "age": 58,
            "gender": "Male"
        }
        res = verify_patient_identity(registered_pat, document_text="LAB REPORT\nDate: 2026-09-01\nGlucose: 95 mg/dL")
        self.assertEqual(res["status"], "IDENTITY_UNVERIFIED")
        self.assertFalse(res["verified"])
        self.assertEqual(res["failed_field"], "PATIENT_NAME")
        self.assertEqual(res["error_code"], "PATIENT_NAME_MISSING")

    def test_regression_conflicting_patient_id_mismatch(self):
        """Document containing conflicting Patient ID returns PATIENT_ID_MISMATCH with clear rejection details."""
        registered_pat = {
            "patient_id": "PT-E77688",
            "full_name": "S. Gurumurthy",
            "age": 58,
            "gender": "Male"
        }
        report_text = """
        APOLLO CLINICAL DIAGNOSTIC LABORATORY
        Patient Name: S. Gurumurthy
        Patient ID: PT-999999
        Age/Sex: 58/M
        Date: 2026-09-01
        """
        res = verify_patient_identity(registered_pat, report_text)
        self.assertEqual(res["status"], "IDENTITY_MISMATCH")
        self.assertFalse(res["verified"])
        self.assertEqual(res["failed_field"], "PATIENT_ID")
        self.assertEqual(res["error_code"], "PATIENT_ID_MISMATCH")
        self.assertIn("PT-999999", res["reason"])
        self.assertIn("PT-E77688", res["reason"])
        self.assertIn("PATIENT ID CONFLICT", res["title"])

    def test_regression_genuine_name_mismatch(self):
        """Different person document returns PATIENT_NAME_MISMATCH."""
        registered_pat = {
            "patient_id": "PT-E77688",
            "full_name": "S. Gurumurthy",
            "age": 58,
            "gender": "Male"
        }
        report_text = """
        METROPOLIS CLINICAL LAB
        Patient Name: Ramesh Kumar
        Patient ID: PT-E77688
        Age/Sex: 58/M
        Date: 2026-09-01
        """
        res = verify_patient_identity(registered_pat, report_text)
        self.assertEqual(res["status"], "IDENTITY_MISMATCH")
        self.assertFalse(res["verified"])
        self.assertEqual(res["failed_field"], "PATIENT_NAME")
        self.assertEqual(res["error_code"], "PATIENT_NAME_MISMATCH")

    def test_regression_conflicting_demographic_gender(self):
        """Contradictory gender returns DEMOGRAPHIC_GENDER_MISMATCH."""
        registered_pat = {
            "patient_id": "PT-E77688",
            "full_name": "S. Gurumurthy",
            "age": 58,
            "gender": "Male"
        }
        report_text = """
        APOLLO CLINICAL LAB
        Patient Name: S. Gurumurthy
        Patient ID: PT-E77688
        Gender: Female
        Age: 58
        Date: 2026-09-01
        """
        res = verify_patient_identity(registered_pat, report_text)
        self.assertEqual(res["status"], "IDENTITY_MISMATCH")
        self.assertFalse(res["verified"])
        self.assertEqual(res["failed_field"], "GENDER")
        self.assertEqual(res["error_code"], "DEMOGRAPHIC_GENDER_MISMATCH")

    def test_regression_demo_cbc_report_text_not_hijacked_by_specimen_reg_no(self):
        """Demo CBC report with specimen Lab Reg No: 2026-09-01 and Patient ID: PT-E77688 correctly resolves PT-E77688."""
        registered_pat = {
            "patient_id": "PT-E77688",
            "full_name": "S. Gurumurthy",
            "age": 58,
            "gender": "Male"
        }
        demo_cbc_text = """
        METROPOLIS HEALTHCARE DIAGNOSTIC SERVICES
        Patient Name: S. Gurumurthy
        Lab Reg No: 2026-09-01
        Patient ID: PT-E77688
        Age/Sex: 58/M
        Collection Date: 2026-09-01
        Reporting Date: 2026-09-01
        COMPLETE BLOOD COUNT (CBC)
        Hemoglobin: 14.5 g/dL
        RBC Count: 4.8 mill/cu.mm
        WBC Count: 7500 /cumm
        Platelet Count: 250000 /cumm
        """
        res = verify_patient_identity(registered_pat, demo_cbc_text)
        self.assertEqual(res["status"], "IDENTITY_VERIFIED")
        self.assertTrue(res["verified"])
        self.assertEqual(res["extracted_id"], "PT-E77688")

    # =========================================================================

    def test_scenario_01_two_reports_same_patient_longitudinal_comparison(self):
        """Scenario 1: Two reports belonging to same patient (Longitudinal comparison)."""
        patient = PatientProfile(
            patientId="PAT-SCEN-01",
            name="Gurumoorthy",
            age=45,
            gender="Male",
            phone="9876543210",
            activeStatus="ACTIVE"
        )
        r1 = ReportRecord(
            reportId="REP-S1-01",
            patientId=patient.patientId,
            reportDate="2026-01-10",
            uploadDate="2026-01-10",
            provider="Apollo Diagnostics",
            extractedParameters=[
                ParameterData(parameterName="Fasting Blood Glucose", canonicalName="Fasting Blood Glucose", value=115.0, unit="mg/dL", referenceRange="70-100", status="Elevated", reportId="REP-S1-01", reportDate="2026-01-10"),
                ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=6.2, unit="%", referenceRange="4.0-5.6", status="Elevated", reportId="REP-S1-01", reportDate="2026-01-10")
            ],
            parameterCount=2
        )
        r2 = ReportRecord(
            reportId="REP-S1-02",
            patientId=patient.patientId,
            reportDate="2026-05-12",
            uploadDate="2026-05-12",
            provider="Apollo Diagnostics",
            extractedParameters=[
                ParameterData(parameterName="Fasting Blood Glucose", canonicalName="Fasting Blood Glucose", value=94.0, unit="mg/dL", referenceRange="70-100", status="Normal", reportId="REP-S1-02", reportDate="2026-05-12"),
                ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=5.5, unit="%", referenceRange="4.0-5.6", status="Normal", reportId="REP-S1-02", reportDate="2026-05-12")
            ],
            parameterCount=2
        )
        result = self.orchestrator.run_analysis(patient, [r1, r2])
        self.assertEqual(len(result.comparisons), 1)
        self.assertFalse(result.isSingleReport)
        self.assertGreater(result.comparisonSummary["improved"], 0)
        self.assertTrue(len(result.englishSummary) > 0)
        self.assertTrue(len(result.tamilSummary) > 0)

    def test_scenario_02_five_reports_longitudinal_trend(self):
        """Scenario 2: Five reports belonging to same patient (Multi-point trend analysis)."""
        patient = PatientProfile(patientId="PAT-SCEN-02", name="Gurumoorthy", age=45, gender="Male", phone="9876543210")
        reports = []
        glucose_values = [140.0, 125.0, 110.0, 102.0, 92.0]
        for idx, val in enumerate(glucose_values):
            rep_id = f"REP-S2-{idx+1:02d}"
            rep_date = f"2026-0{idx+1}-15"
            reports.append(ReportRecord(
                reportId=rep_id,
                patientId=patient.patientId,
                reportDate=rep_date,
                uploadDate=rep_date,
                provider="Clinical Lab",
                extractedParameters=[
                    ParameterData(parameterName="Fasting Blood Glucose", canonicalName="Fasting Blood Glucose", value=val, unit="mg/dL", referenceRange="70-100", status="Normal" if val <= 100 else "Elevated", reportId=rep_id, reportDate=rep_date)
                ],
                parameterCount=1
            ))
        result = self.orchestrator.run_analysis(patient, reports)
        self.assertEqual(len(result.comparisons), 4)  # 4 pairwise transitions across 5 chronological reports
        glucose_param = next((p for p in result.keyParameters if "Glucose" in p.canonicalName), None)
        self.assertIsNotNone(glucose_param)
        self.assertEqual(len(glucose_param.trendHistory), 5)
        self.assertEqual(glucose_param.overallStatus, "Improved")

    def test_scenario_03_ten_reports_multiple_test_types(self):
        """Scenario 3: Ten reports containing multiple test types (Glycemic, Lipid, Renal, CBC, Thyroid)."""
        patient = PatientProfile(patientId="PAT-SCEN-03", name="Sridharan", age=52, gender="Male", phone="9876543210")
        reports = []
        for i in range(1, 11):
            rep_id = f"REP-S3-{i:02d}"
            rep_date = f"2025-{i:02d}-01" if i <= 9 else f"2025-{i}-01"
            params = [
                ParameterData(parameterName="Fasting Blood Glucose", canonicalName="Fasting Blood Glucose", value=90.0 + i, unit="mg/dL", referenceRange="70-100", reportId=rep_id, reportDate=rep_date, category="Glycemic"),
                ParameterData(parameterName="Total Cholesterol", canonicalName="Total Cholesterol", value=180.0 - i, unit="mg/dL", referenceRange="125-200", reportId=rep_id, reportDate=rep_date, category="Lipid Profile"),
                ParameterData(parameterName="Hemoglobin", canonicalName="Hemoglobin", value=14.5, unit="g/dL", referenceRange="13.5-17.5", reportId=rep_id, reportDate=rep_date, category="CBC"),
                ParameterData(parameterName="Serum Creatinine", canonicalName="Serum Creatinine", value=0.9, unit="mg/dL", referenceRange="0.7-1.3", reportId=rep_id, reportDate=rep_date, category="Renal"),
                ParameterData(parameterName="TSH", canonicalName="TSH", value=2.5, unit="uIU/mL", referenceRange="0.4-4.5", reportId=rep_id, reportDate=rep_date, category="Thyroid")
            ]
            reports.append(ReportRecord(
                reportId=rep_id,
                patientId=patient.patientId,
                reportDate=rep_date,
                uploadDate=rep_date,
                provider="Apex Hospital Labs",
                extractedParameters=params,
                parameterCount=len(params)
            ))
        result = self.orchestrator.run_analysis(patient, reports)
        self.assertEqual(len(result.comparisons), 9)
        self.assertGreaterEqual(len(result.keyParameters), 5)
        self.assertTrue(bool(result.englishSummary))
        self.assertTrue(bool(result.tamilSummary))

    def test_scenario_04_different_patient_mismatch_rejection(self):
        """Scenario 4: Report belonging to different patient flagged and rejected."""
        pat = db.create_patient({"full_name": "Gurumoorthy", "age": 45, "gender": "Male", "phone": "9444411111", "email": "g@test.org"})
        pid = pat["patient_id"]
        doctor = db.create_doctor({
            "full_name": "Upload Regression Doctor",
            "email": f"upload.regression.{uuid.uuid4().hex}@testlab.org",
        })
        token = db.create_session(doctor["doctor_id"], "DOCTOR", doctor["full_name"])
        try:
            pdf_bytes = generate_pdf_bytes(patient_name="Ramesh Kumar", report_date="2026-02-14")
            res = self.client.post(
                f"/api/patients/{pid}/reports/upload",
                files={"file": ("ramesh_report.pdf", pdf_bytes, "application/pdf")},
                data={"reportCategory": "Lab Report", "provider": "Central Diagnostics"},
                headers={"Authorization": f"Bearer {token}"},
            )
            # Gate 6 in upload rejects mismatch with 422 Unprocessable Entity and PATIENT_NAME_MISMATCH
            self.assertEqual(res.status_code, 422)
            data = res.json()
            self.assertIn("PATIENT_NAME_MISMATCH", data.get("error_code", "") or str(data))
        finally:
            db.revoke_session(token)
            db.delete_doctor(doctor["doctor_id"])
            db.delete_patient(pid)

    def test_scenario_05_report_without_readable_patient_name(self):
        """Scenario 5: Report without readable patient name -> IDENTITY_UNVERIFIED, doctor warning."""
        res = verify_patient_identity(
            registered_patient_name="Gurumoorthy",
            extracted_patient_name=None,
            registered_age=45,
            extracted_age=None,
            registered_gender="Male",
            extracted_gender=None
        )
        self.assertEqual(res["status"], "IDENTITY_UNVERIFIED")
        self.assertFalse(res["verified"])
        self.assertIn("Doctor verification required", res["reason"])

    def test_scenario_06_minor_spelling_variations_verified(self):
        """Scenario 6: Minor spelling variations (Gurumoorthy vs S. Gurumurthy, Sridharan vs P. Sridharan) -> IDENTITY_VERIFIED."""
        res1 = verify_patient_identity("Gurumoorthy", "S. Gurumurthy")
        self.assertEqual(res1["status"], "IDENTITY_VERIFIED")
        self.assertTrue(res1["verified"])

        res2 = verify_patient_identity("Sridharan", "P. Sridharan")
        self.assertEqual(res2["status"], "IDENTITY_VERIFIED")
        self.assertTrue(res2["verified"])

        res3 = verify_patient_identity("Elavarasan", "Mr. Elaverasan")
        self.assertEqual(res3["status"], "IDENTITY_VERIFIED")
        self.assertTrue(res3["verified"])

    def test_scenario_07_conflicting_patient_identifiers(self):
        """Scenario 7: Conflicting auxiliary identifiers (Gurumoorthy 45M vs Gurumoorthy 22F) flagged."""
        res = verify_patient_identity(
            registered_patient_name="Gurumoorthy",
            extracted_patient_name="Gurumoorthy",
            registered_age=45,
            extracted_age=22,
            registered_gender="Male",
            extracted_gender="Female"
        )
        self.assertEqual(res["status"], "IDENTITY_MISMATCH")
        self.assertIn("contradict", res["reason"].lower())

    def test_scenario_08_scanned_medical_reports(self):
        """Scenario 8: Scanned medical reports fallback parsing."""
        raw_scanned_ocr = """
        METROPOLIS CLINICAL LAB
        PATIENT: GURUMOORTHY AGE: 45
        DATE: 2026-03-01
        GLUCOSE FASTING 105 MG/DL
        CHOLESTEROL TOTAL 210 MG/DL
        """
        temp_file = "temp_scanned_test.pdf"
        try:
            with open(temp_file, "wb") as f:
                f.write(generate_pdf_bytes("Gurumoorthy"))
            params = extract_parameters_from_pdf(temp_file, "REP-SCAN-01", "2026-03-01", raw_text=raw_scanned_ocr)
            param_names = [p.canonicalName for p in params]
            self.assertTrue(any("Glucose" in n for n in param_names))
            self.assertTrue(any("Cholesterol" in n for n in param_names))
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

    def test_scenario_09_multipage_pdf_reports(self):
        """Scenario 9: Multi-page PDF reports extract parameters across multiple pages."""
        pdf_bytes = generate_pdf_bytes("Gurumoorthy", pages=2)
        temp_file = "temp_multipage_test.pdf"
        try:
            with open(temp_file, "wb") as f:
                f.write(pdf_bytes)
            params = extract_parameters_from_pdf(temp_file, "REP-MULTI-01", "2026-05-12")
            pages_found = set(p.sourcePage for p in params)
            self.assertIn(1, pages_found)
            self.assertIn(2, pages_found)
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

    def test_scenario_10_missing_parameters_gracefully_handled(self):
        """Scenario 10: Parameter present in report A but absent in report B handled without crashes."""
        patient = PatientProfile(patientId="PAT-SCEN-10", name="Gurumoorthy", age=45, gender="Male", phone="9876543210")
        r1 = ReportRecord(
            reportId="REP-S10-01", patientId=patient.patientId, reportDate="2026-01-01", uploadDate="2026-01-01", provider="Lab",
            extractedParameters=[
                ParameterData(parameterName="Glucose", canonicalName="Fasting Blood Glucose", value=100.0, unit="mg/dL", reportId="REP-S10-01", reportDate="2026-01-01"),
                ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=6.0, unit="%", reportId="REP-S10-01", reportDate="2026-01-01")
            ],
            parameterCount=2
        )
        r2 = ReportRecord(
            reportId="REP-S10-02", patientId=patient.patientId, reportDate="2026-02-01", uploadDate="2026-02-01", provider="Lab",
            extractedParameters=[
                ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=5.7, unit="%", reportId="REP-S10-02", reportDate="2026-02-01")
            ],
            parameterCount=1
        )
        result = self.orchestrator.run_analysis(patient, [r1, r2])
        self.assertEqual(len(result.comparisons), 1)
        hba1c_comp = next((p for p in result.comparisons[0].parameters if p.canonicalName == "HbA1c"), None)
        self.assertIsNotNone(hba1c_comp)
        self.assertEqual(hba1c_comp.overallStatus, "Improved")

    def test_scenario_11_missing_or_invalid_dates_fallback(self):
        """Scenario 11: Missing or invalid dates ordered gracefully without crashing."""
        patient = PatientProfile(patientId="PAT-SCEN-11", name="Gurumoorthy", age=45, gender="Male", phone="9876543210")
        r1 = ReportRecord(
            reportId="REP-S11-01", patientId=patient.patientId, reportDate="", uploadDate="2026-01-01", provider="Lab",
            extractedParameters=[ParameterData(parameterName="Glucose", canonicalName="Fasting Blood Glucose", value=100.0, unit="mg/dL", reportId="REP-S11-01", reportDate="")],
            parameterCount=1
        )
        r2 = ReportRecord(
            reportId="REP-S11-02", patientId=patient.patientId, reportDate="2026-03-01", uploadDate="2026-03-01", provider="Lab",
            extractedParameters=[ParameterData(parameterName="Glucose", canonicalName="Fasting Blood Glucose", value=95.0, unit="mg/dL", reportId="REP-S11-02", reportDate="2026-03-01")],
            parameterCount=1
        )
        result = self.orchestrator.run_analysis(patient, [r1, r2])
        self.assertEqual(len(result.comparisons), 1)

    def test_scenario_12_compatible_and_incompatible_units(self):
        """Scenario 12: Compatible units compare cleanly; incompatible units flagged isComparable: False."""
        p1 = ParameterData(parameterName="Fasting Blood Glucose", canonicalName="Fasting Blood Glucose", value=95.0, unit="mg/dL", reportId="R1", reportDate="2026-01-01")
        p2 = ParameterData(parameterName="Fasting Blood Glucose", canonicalName="Fasting Blood Glucose", value=110.0, unit="mg/dL", reportId="R2", reportDate="2026-02-01")
        comp = calculate_numerical_comparison(p1, p2)
        self.assertTrue(comp.isComparable)

        p3 = ParameterData(parameterName="Glucose", canonicalName="Fasting Blood Glucose", value=95.0, unit="mg/dL", reportId="R1", reportDate="2026-01-01")
        p4 = ParameterData(parameterName="Glucose", canonicalName="Fasting Blood Glucose", value=5.5, unit="%", reportId="R2", reportDate="2026-02-01")
        incomp = calculate_numerical_comparison(p3, p4)
        self.assertFalse(incomp.isComparable)
        self.assertIn("incompatible", incomp.clinicalNote.lower())

    def test_scenario_13_duplicate_reports_handled_cleanly(self):
        """Scenario 13: Duplicate reports with identical values handled without arithmetic errors."""
        patient = PatientProfile(patientId="PAT-SCEN-13", name="Gurumoorthy", age=45, gender="Male", phone="9876543210")
        r1 = ReportRecord(
            reportId="REP-S13-01", patientId=patient.patientId, reportDate="2026-01-01", uploadDate="2026-01-01", provider="Lab",
            extractedParameters=[ParameterData(parameterName="Glucose", canonicalName="Fasting Blood Glucose", value=95.0, unit="mg/dL", reportId="REP-S13-01", reportDate="2026-01-01")],
            parameterCount=1
        )
        r2 = ReportRecord(
            reportId="REP-S13-02", patientId=patient.patientId, reportDate="2026-01-01", uploadDate="2026-01-01", provider="Lab",
            extractedParameters=[ParameterData(parameterName="Glucose", canonicalName="Fasting Blood Glucose", value=95.0, unit="mg/dL", reportId="REP-S13-02", reportDate="2026-01-01")],
            parameterCount=1
        )
        result = self.orchestrator.run_analysis(patient, [r1, r2])
        self.assertEqual(len(result.comparisons), 1)
        self.assertEqual(result.comparisons[0].parameters[0].absoluteChange, 0.0)
        self.assertEqual(result.comparisons[0].parameters[0].percentChange, 0.0)

    def test_scenario_14_abnormal_medical_values_alerting(self):
        """Scenario 14: Markedly abnormal values trigger clinical monitoring items."""
        patient = PatientProfile(patientId="PAT-SCEN-14", name="Gurumoorthy", age=45, gender="Male", phone="9876543210")
        r1 = ReportRecord(
            reportId="REP-S14-01", patientId=patient.patientId, reportDate="2026-01-01", uploadDate="2026-01-01", provider="Lab",
            extractedParameters=[
                ParameterData(parameterName="Glucose", canonicalName="Fasting Blood Glucose", value=220.0, unit="mg/dL", referenceRange="70-100", status="Critical", reportId="REP-S14-01", reportDate="2026-01-01"),
                ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=10.5, unit="%", referenceRange="4.0-5.6", status="Critical", reportId="REP-S14-01", reportDate="2026-01-01")
            ],
            parameterCount=2
        )
        result = self.orchestrator.run_analysis(patient, [r1])
        self.assertTrue(result.isSingleReport)
        self.assertGreater(result.comparisonSummary["monitoring"], 0)
        self.assertGreater(len(result.monitoringItems), 0)

    def test_scenario_15_tamil_and_english_summary_consistency(self):
        """Scenario 15: Both English and Tamil clinical summaries are populated and non-empty."""
        patient = PatientProfile(patientId="PAT-SCEN-15", name="Gurumoorthy", age=45, gender="Male", phone="9876543210")
        r1 = ReportRecord(
            reportId="REP-S15-01", patientId=patient.patientId, reportDate="2026-01-01", uploadDate="2026-01-01", provider="Lab",
            extractedParameters=[ParameterData(parameterName="Glucose", canonicalName="Fasting Blood Glucose", value=95.0, unit="mg/dL", referenceRange="70-100", status="Normal", reportId="REP-S15-01", reportDate="2026-01-01")],
            parameterCount=1
        )
        result = self.orchestrator.run_analysis(patient, [r1])
        self.assertTrue(len(result.englishSummary) > 0)
        self.assertTrue(len(result.tamilSummary) > 0)
        self.assertTrue(any("குளுக்கோஸ்" in s or "சீரான" in s or "அளவு" in s for s in result.tamilSummary))

    def test_scenario_16_partially_unreadable_documents(self):
        """Scenario 16: Partially unreadable documents handled with degraded extraction warning."""
        doc_analysis = classify_medical_document(
            text="Patient: Gurumoorthy ... Fasting Blood Glucose 95 mg/dL ... Complete Blood Count ...",
            filename="lab_scan.pdf"
        )
        self.assertTrue(doc_analysis.get("is_medical") or doc_analysis.get("is_medical_document"))
        self.assertIn("document_type", doc_analysis)

    def test_scenario_17_cross_patient_unauthorized_isolation(self):
        """Scenario 17: Multi-tenancy isolation prevents comparing reports across different patients."""
        pat_a = db.create_patient({"full_name": "Patient Alpha", "age": 40, "gender": "Male", "phone": "9111111111", "email": "a@test.org"})
        pat_b = db.create_patient({"full_name": "Patient Beta", "age": 42, "gender": "Female", "phone": "9222222222", "email": "b@test.org"})
        pid_a = pat_a["patient_id"]
        pid_b = pat_b["patient_id"]

        try:
            # Save report under Patient A
            db.save_report_with_parameters({
                "report_id": "REP-ALPHA-01", "patient_id": pid_a, "report_date": "2026-01-01", "upload_date": "2026-01-01",
                "provider": "Lab A", "file_path": "/static/a.pdf", "category": "Lab", "parameter_count": 1,
                "extraction_status": "Verified", "uploaded_by": "Doctor"
            }, [{"parameter_name": "Glucose", "canonical_name": "Glucose", "value": 95, "unit": "mg/dL", "reference_range": "70-100", "status": "Normal"}])

            # Patient B tries to analyze Patient A's report ID -> Must fail with 400
            res = self.client.post("/api/analyze", json={
                "patientId": pid_b,
                "selectedReportIds": ["REP-ALPHA-01"]
            })
            self.assertEqual(res.status_code, 400)
            self.assertIn("Cross-patient", res.json().get("detail", ""))
        finally:
            db.delete_patient(pid_a)
            db.delete_patient(pid_b)


if __name__ == '__main__':
    unittest.main()
