import os
import sys
import unittest
import json

# Add server to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'server'))

from app.data.db import db
from app.main import app
from fastapi.testclient import TestClient

class PatientIsolationRegressionTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_a_empty_patient(self):
        """Test A: An empty patient must have 0 reports, 0 analyses, 0 improvements."""
        p = db.create_patient({
            "full_name": "Empty Test Patient",
            "age": 35,
            "gender": "Female",
            "phone": "+91 91111 22222",
            "email": "empty.patient@test.org"
        })
        pid = p["patient_id"]
        try:
            # Query reports endpoint
            res = self.client.get(f"/api/patients/{pid}/reports")
            self.assertEqual(res.status_code, 200)
            reports = res.json()
            self.assertEqual(len(reports), 0, "Empty patient must have 0 reports")

            # Try to analyze with no reports - must fail cleanly with 400
            analyze_res = self.client.post("/api/analyze", json={
                "patientId": pid,
                "selectedReportIds": []
            })
            self.assertEqual(analyze_res.status_code, 400)
        finally:
            db.delete_patient(pid)

    def test_b_patient_isolation(self):
        """Test B: Patient A's reports and metrics must NEVER appear in Patient B's dashboard/endpoints."""
        pat_a = db.create_patient({
            "full_name": "Patient Alpha",
            "age": 50,
            "gender": "Male",
            "phone": "+91 93333 44444",
            "email": "alpha@test.org"
        })
        pid_a = pat_a["patient_id"]

        pat_b = db.create_patient({
            "full_name": "Patient Beta",
            "age": 28,
            "gender": "Female",
            "phone": "+91 95555 66666",
            "email": "beta@test.org"
        })
        pid_b = pat_b["patient_id"]

        try:
            # Add 2 reports to Patient A
            rep1 = {
                "report_id": "REP-ALPHA-001",
                "patient_id": pid_a,
                "report_date": "2026-01-10",
                "upload_date": "2026-01-10 10:00:00",
                "provider": "Alpha Diagnostic Lab",
                "file_path": "/static/reports/alpha1.pdf",
                "category": "Biochemistry",
                "parameter_count": 2,
                "extraction_status": "Verified",
                "uploaded_by": "Dr. Arvind Kumar"
            }
            params1 = [
                {"parameter_name": "Total Cholesterol", "canonical_name": "Total Cholesterol", "value": 240.0, "unit": "mg/dL", "reference_range": "< 200", "status": "Elevated"},
                {"parameter_name": "HbA1c", "canonical_name": "HbA1c", "value": 7.0, "unit": "%", "reference_range": "< 5.7", "status": "Elevated"}
            ]
            db.save_report_with_parameters(rep1, params1)

            rep2 = {
                "report_id": "REP-ALPHA-002",
                "patient_id": pid_a,
                "report_date": "2026-03-10",
                "upload_date": "2026-03-10 10:00:00",
                "provider": "Alpha Diagnostic Lab",
                "file_path": "/static/reports/alpha2.pdf",
                "category": "Biochemistry",
                "parameter_count": 2,
                "extraction_status": "Verified",
                "uploaded_by": "Dr. Arvind Kumar"
            }
            params2 = [
                {"parameter_name": "Total Cholesterol", "canonical_name": "Total Cholesterol", "value": 190.0, "unit": "mg/dL", "reference_range": "< 200", "status": "Normal"},
                {"parameter_name": "HbA1c", "canonical_name": "HbA1c", "value": 5.8, "unit": "%", "reference_range": "< 5.7", "status": "Normal"}
            ]
            db.save_report_with_parameters(rep2, params2)

            # Patient A should have 2 reports
            res_a = self.client.get(f"/api/patients/{pid_a}/reports")
            self.assertEqual(res_a.status_code, 200)
            self.assertEqual(len(res_a.json()), 2)

            # Patient B must have ZERO reports
            res_b = self.client.get(f"/api/patients/{pid_b}/reports")
            self.assertEqual(res_b.status_code, 200)
            self.assertEqual(len(res_b.json()), 0, "Patient B must see 0 reports, not Patient A's reports")

            # Patient A can analyze their reports with camelCase
            res_analysis_a = self.client.post("/api/analyze", json={
                "patientId": pid_a,
                "selectedReportIds": ["REP-ALPHA-001", "REP-ALPHA-002"]
            })
            self.assertEqual(res_analysis_a.status_code, 200)
            data_a = res_analysis_a.json()
            self.assertEqual(data_a["patientId"], pid_a)
            self.assertEqual(data_a["comparisonSummary"]["improved"], 2)

            # Patient A can also analyze with snake_case
            res_analysis_snake = self.client.post("/api/analyze", json={
                "patient_id": pid_a,
                "selected_report_ids": ["REP-ALPHA-001", "REP-ALPHA-002"]
            })
            self.assertEqual(res_analysis_snake.status_code, 200)

        finally:
            db.delete_patient(pid_a)
            db.delete_patient(pid_b)

    def test_c_auth_login_endpoints(self):
        """Test C: Login endpoint must authenticate valid credentials and reject invalid credentials with 401."""
        # Test Doctor Login
        res_doc = self.client.post("/api/auth/login", json={
            "username_or_email": "dr.arvind@hospital.org",
            "password": "doctor1315"
        })
        self.assertEqual(res_doc.status_code, 200)
        self.assertEqual(res_doc.json()["role"], "DOCTOR")

        # Test Staff Login
        res_stf = self.client.post("/api/auth/login", json={
            "username": "priya.staff@hospital.org",
            "password": "staff1315"
        })
        self.assertEqual(res_stf.status_code, 200)
        self.assertEqual(res_stf.json()["role"], "STAFF")

        # Test Invalid Login (wrong password) -> must return 401
        res_bad = self.client.post("/api/auth/login", json={
            "username_or_email": "dr.arvind@hospital.org",
            "password": "wrong_password_123"
        })
        self.assertEqual(res_bad.status_code, 401)

    def test_d_cross_patient_comparison_rejection(self):
        """Test D: Attempting to compare a report from Patient A with a report from Patient B must be rejected."""
        pat_a = db.create_patient({"full_name": "Patient Alpha 2", "age": 40, "gender": "Male", "phone": "9000000001", "email": "a2@test.org"})
        pat_b = db.create_patient({"full_name": "Patient Beta 2", "age": 40, "gender": "Female", "phone": "9000000002", "email": "b2@test.org"})
        pid_a = pat_a["patient_id"]
        pid_b = pat_b["patient_id"]

        try:
            db.save_report_with_parameters({
                "report_id": "REP-CROSS-A",
                "patient_id": pid_a,
                "report_date": "2026-01-01",
                "upload_date": "2026-01-01",
                "provider": "Lab A",
                "file_path": "/static/a.pdf",
                "category": "Lab",
                "parameter_count": 1,
                "extraction_status": "Verified",
                "uploaded_by": "Doctor"
            }, [{"parameter_name": "Glucose", "canonical_name": "Glucose", "value": 100, "unit": "mg/dL", "reference_range": "70-100", "status": "Normal"}])

            db.save_report_with_parameters({
                "report_id": "REP-CROSS-B",
                "patient_id": pid_b,
                "report_date": "2026-02-01",
                "upload_date": "2026-02-01",
                "provider": "Lab B",
                "file_path": "/static/b.pdf",
                "category": "Lab",
                "parameter_count": 1,
                "extraction_status": "Verified",
                "uploaded_by": "Doctor"
            }, [{"parameter_name": "Glucose", "canonical_name": "Glucose", "value": 120, "unit": "mg/dL", "reference_range": "70-100", "status": "Elevated"}])

            # Attempt comparison using patient A with reports from A and B
            res = self.client.post("/api/analyze", json={
                "patientId": pid_a,
                "selectedReportIds": ["REP-CROSS-A", "REP-CROSS-B"]
            })
            self.assertEqual(res.status_code, 400)
            self.assertIn("Cross-patient", res.json().get("detail", ""))

        finally:
            db.delete_patient(pid_a)
            db.delete_patient(pid_b)

    def test_e_new_report_isolation(self):
        """Test E: Uploading a new report for Patient B modifies ONLY Patient B; Patient A remains unchanged."""
        pat_a = db.create_patient({"full_name": "Patient Alpha 3", "age": 45, "gender": "Male", "phone": "9111111111", "email": "a3@test.org"})
        pat_b = db.create_patient({"full_name": "Patient Beta 3", "age": 45, "gender": "Female", "phone": "9222222222", "email": "b3@test.org"})
        pid_a = pat_a["patient_id"]
        pid_b = pat_b["patient_id"]

        try:
            # Patient A has 1 report
            db.save_report_with_parameters({
                "report_id": "REP-A3-001",
                "patient_id": pid_a,
                "report_date": "2026-01-01",
                "upload_date": "2026-01-01",
                "provider": "Lab A",
                "file_path": "/static/a3.pdf",
                "category": "Lab",
                "parameter_count": 1,
                "extraction_status": "Verified",
                "uploaded_by": "Doctor"
            }, [{"parameter_name": "HbA1c", "canonical_name": "HbA1c", "value": 6.5, "unit": "%", "reference_range": "< 5.7", "status": "Elevated"}])

            # Now add 1 report to Patient B
            db.save_report_with_parameters({
                "report_id": "REP-B3-001",
                "patient_id": pid_b,
                "report_date": "2026-02-01",
                "upload_date": "2026-02-01",
                "provider": "Lab B",
                "file_path": "/static/b3.pdf",
                "category": "Lab",
                "parameter_count": 1,
                "extraction_status": "Verified",
                "uploaded_by": "Doctor"
            }, [{"parameter_name": "HbA1c", "canonical_name": "HbA1c", "value": 5.4, "unit": "%", "reference_range": "< 5.7", "status": "Normal"}])

            # Verify Patient A still has exactly 1 report (REP-A3-001)
            reps_a = self.client.get(f"/api/patients/{pid_a}/reports").json()
            self.assertEqual(len(reps_a), 1)
            self.assertEqual(reps_a[0]["report_id"], "REP-A3-001")

            # Verify Patient B has exactly 1 report (REP-B3-001)
            reps_b = self.client.get(f"/api/patients/{pid_b}/reports").json()
            self.assertEqual(len(reps_b), 1)
            self.assertEqual(reps_b[0]["report_id"], "REP-B3-001")

        finally:
            db.delete_patient(pid_a)
            db.delete_patient(pid_b)

    def test_f_single_report_does_not_produce_comparison(self):
        """Test F: A single report or missing second report cannot produce fabricated comparison metrics."""
        pat = db.create_patient({"full_name": "Patient Single", "age": 33, "gender": "Male", "phone": "9333333333", "email": "single@test.org"})
        pid = pat["patient_id"]
        try:
            db.save_report_with_parameters({
                "report_id": "REP-SINGLE-001",
                "patient_id": pid,
                "report_date": "2026-01-01",
                "upload_date": "2026-01-01",
                "provider": "Lab S",
                "file_path": "/static/s.pdf",
                "category": "Lab",
                "parameter_count": 1,
                "extraction_status": "Verified",
                "uploaded_by": "Doctor"
            }, [{"parameter_name": "Glucose", "canonical_name": "Glucose", "value": 95, "unit": "mg/dL", "reference_range": "70-100", "status": "Normal"}])

            # Calling analyze with 0 reports must fail with 400
            res_zero = self.client.post("/api/analyze", json={
                "patientId": pid,
                "selectedReportIds": []
            })
            self.assertEqual(res_zero.status_code, 400)

            # Calling analyze with 1 report performs single-report evaluation and does NOT fabricate comparison metrics
            res = self.client.post("/api/analyze", json={
                "patientId": pid,
                "selectedReportIds": ["REP-SINGLE-001"]
            })
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data.get("isSingleReport") or data.get("is_single_report", False))
            self.assertEqual(len(data.get("comparisons", [])), 0, "Single report must have 0 comparison deltas")
            self.assertTrue(bool(data.get("englishSummary") or data.get("summary")))

        finally:
            db.delete_patient(pid)

if __name__ == '__main__':
    unittest.main()
