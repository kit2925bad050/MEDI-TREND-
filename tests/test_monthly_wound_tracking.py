import os
import io
import sys
import uuid
import unittest
import hashlib
from unittest.mock import patch
from PIL import Image
from fastapi.testclient import TestClient

# Ensure server package is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = os.path.join(current_dir, "..", "server")
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from app.main import app
from app.data.db import db


def create_test_image_bytes(color=(180, 50, 50), size=(200, 200), format="JPEG") -> bytes:
    """Generate in-memory image bytes for test uploads."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()


class TestMonthlyWoundTracking(unittest.TestCase):
    """Comprehensive test suite for Monthly Wound Photo Tracking & Comparison."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.doctor_name = "Dr. S. K. Narayanan"
        cls.test_doctor = db.create_doctor({
            "full_name": cls.doctor_name,
            "email": f"wound.tester.{uuid.uuid4().hex[:8]}@meditrend.org",
            "password": "Password123!",
            "specialization": "Vascular Surgery",
        })
        cls.session_token = db.create_session(
            cls.test_doctor["doctor_id"], "DOCTOR", cls.doctor_name
        )
        cls.headers = {
            "Authorization": f"Bearer {cls.session_token}",
            "x-user-role": "DOCTOR",
            "x-user-name": cls.doctor_name,
            "x-user-id": cls.test_doctor["doctor_id"],
        }

        # Create two test patients
        cls.patient_a_id = f"PT-WOUND-A-{uuid.uuid4().hex[:6].upper()}"
        cls.patient_b_id = f"PT-WOUND-B-{uuid.uuid4().hex[:6].upper()}"

        db.create_patient({
            "patient_id": cls.patient_a_id,
            "full_name": "Kavitha Sundaram",
            "age": 58,
            "gender": "Female",
            "phone": "+91 94441 22334",
            "blood_group": "B+",
            "status": "Active"
        })

        db.create_patient({
            "patient_id": cls.patient_b_id,
            "full_name": "Arun Kumar",
            "age": 45,
            "gender": "Male",
            "phone": "+91 98840 55667",
            "blood_group": "O+",
            "status": "Active"
        })

    @classmethod
    def tearDownClass(cls):
        try:
            db.revoke_session(cls.session_token)
            db.delete_doctor(cls.test_doctor["doctor_id"])
        except Exception:
            pass

    def test_00_login_returns_a_persistent_authenticated_session(self):
        response = self.client.post(
            "/api/auth/login",
            json={
                "username_or_email": self.test_doctor["email"],
                "password": "Password123!",
            },
        )
        assert response.status_code == 200, response.text
        login = response.json()
        assert login["success"] is True
        assert login["role"] == "DOCTOR"
        assert login["token"]

        visits_url = f"/api/wounds/{self.patient_a_id}/visits"
        authenticated = self.client.get(
            visits_url,
            headers={"Authorization": f"Bearer {login['token']}"},
        )
        assert authenticated.status_code == 200, authenticated.text

        logout = self.client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {login['token']}"},
        )
        assert logout.status_code == 200, logout.text
        assert db.validate_session(login["token"]) is None
        revoked = self.client.get(
            visits_url,
            headers={"Authorization": f"Bearer {login['token']}"},
        )
        assert revoked.status_code == 401

    def test_01_create_monthly_visit(self):
        """1. Create a monthly visit record linked to Patient A."""
        res = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits",
            headers=self.headers,
            json={
                "visit_date": "2026-10-15",
                "visit_month": "October 2026",
                "wound_location": "Left Lower Extremity - Medial Malleolus",
                "clinical_notes": "Post-op venous ulcer routine monthly checkup."
            }
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["patient_id"] == self.patient_a_id
        assert data["visit_month"] == "October 2026"
        assert data["status"] == "PENDING"
        assert data["photos"] == []
        assert "visit_id" in data
        TestMonthlyWoundTracking.visit_oct_id = data["visit_id"]

    def test_02_upload_photos_remain_pending_no_auto_analysis(self):
        """2. Upload multiple photos (1-10); verify photos stay PENDING without auto-analysis."""
        visit_id = self.visit_oct_id
        img1 = create_test_image_bytes((190, 45, 45), (250, 250))
        img2 = create_test_image_bytes((175, 40, 50), (250, 250))
        img3 = create_test_image_bytes((160, 35, 55), (250, 250))

        files = [
            ("files", ("oct_wound_1.jpg", img1, "image/jpeg")),
            ("files", ("oct_wound_2.jpg", img2, "image/jpeg")),
            ("files", ("oct_wound_3.jpg", img3, "image/jpeg")),
        ]

        res = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_id}/photos",
            headers=self.headers,
            files=files
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["status"] == "PENDING"
        assert len(data["photos"]) == 3
        assert data["analysis_result"] is None, "Analysis MUST NOT trigger automatically upon upload"
        TestMonthlyWoundTracking.oct_photo_ids = [p["photo_id"] for p in data["photos"]]

    def test_03_remove_individual_photo_before_analysis(self):
        """3. Remove an individual photo before analysis."""
        visit_id = self.visit_oct_id
        photo_to_remove = self.oct_photo_ids[0]

        res = self.client.delete(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_id}/photos/{photo_to_remove}",
            headers=self.headers
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert len(data["photos"]) == 2
        assert all(p["photo_id"] != photo_to_remove for p in data["photos"])
        assert data["status"] == "PENDING"

    def test_04_add_more_photos_to_same_visit(self):
        """4. Add more photos to the same visit before starting analysis."""
        visit_id = self.visit_oct_id
        img4 = create_test_image_bytes((200, 60, 60), (300, 300))
        img5 = create_test_image_bytes((180, 50, 50), (300, 300))

        files = [
            ("files", ("oct_wound_extra_1.jpg", img4, "image/jpeg")),
            ("files", ("oct_wound_extra_2.jpg", img5, "image/jpeg")),
        ]

        res = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_id}/photos",
            headers=self.headers,
            files=files
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert len(data["photos"]) == 4
        assert data["status"] == "PENDING"

    def test_05_enforce_photo_limits_and_validation(self):
        """5. Enforce photo count limit (max 10) and reject invalid files."""
        visit_id = self.visit_oct_id
        # Current count is 4. Trying to add 7 more (4 + 7 = 11 > 10) should fail with 400
        extra_files = [
            ("files", (f"img_{i}.jpg", create_test_image_bytes(), "image/jpeg"))
            for i in range(7)
        ]
        res = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_id}/photos",
            headers=self.headers,
            files=extra_files
        )
        assert res.status_code == 400, "Should reject uploads that exceed maximum 10 photos"

        # Reject non-image file
        bad_files = [
            ("files", ("malicious.txt", b"plain text is not an image", "text/plain"))
        ]
        res_bad = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_id}/photos",
            headers=self.headers,
            files=bad_files
        )
        assert res_bad.status_code == 400, "Should reject non-image files"

    def test_06_explicit_photo_analysis(self):
        """6. Trigger explicit analysis on-demand; verify status transitions to ANALYZED."""
        visit_id = self.visit_oct_id
        res = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_id}/analyze",
            headers=self.headers
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["status"] == "ANALYZED"
        assert data["analyzed_at"] is not None

        analysis = data["analysis_result"]
        assert analysis is not None
        assert "visible_wound_characteristics" in analysis
        assert "tissue_composition" in analysis
        assert "approximate_dimensions" in analysis
        assert "image_quality_warnings" in analysis
        assert "clinical_summary" in analysis
        assert "analysis_tamil" in analysis
        assert analysis.get("photos_analyzed_count") == 4

        repeated_analysis = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_id}/analyze",
            headers=self.headers,
        )
        assert repeated_analysis.status_code == 409
        preserved_visit = self.client.get(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_id}",
            headers=self.headers,
        )
        assert preserved_visit.json()["analysis_result"] == analysis

    def test_07_monthly_visit_management_second_visit_preserved(self):
        """7. Create a subsequent month visit (Nov 2026) and verify historical visits are preserved."""
        # Create November visit
        res_nov = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits",
            headers=self.headers,
            json={
                "visit_date": "2026-11-18",
                "visit_month": "November 2026",
                "wound_location": "Left Lower Extremity - Medial Malleolus",
                "clinical_notes": "4-week follow-up. Wound dressing change."
            }
        )
        assert res_nov.status_code == 200, res_nov.text
        nov_data = res_nov.json()
        visit_nov_id = nov_data["visit_id"]
        TestMonthlyWoundTracking.visit_nov_id = visit_nov_id

        # Upload 3 photos for November
        files_nov = [
            ("files", ("nov_wound_1.jpg", create_test_image_bytes((160, 70, 70)), "image/jpeg")),
            ("files", ("nov_wound_2.jpg", create_test_image_bytes((150, 75, 75)), "image/jpeg")),
            ("files", ("nov_wound_3.jpg", create_test_image_bytes((140, 80, 80)), "image/jpeg")),
        ]
        res_upload = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_nov_id}/photos",
            headers=self.headers,
            files=files_nov
        )
        assert res_upload.status_code == 200

        # Analyze November visit
        res_analyze_nov = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_nov_id}/analyze",
            headers=self.headers
        )
        assert res_analyze_nov.status_code == 200

        # Query all visits for patient A: both October and November must be intact
        res_all = self.client.get(
            f"/api/wounds/{self.patient_a_id}/visits",
            headers=self.headers
        )
        assert res_all.status_code == 200
        visits = res_all.json()
        assert len(visits) >= 2
        oct_v = next((v for v in visits if v["visit_id"] == self.visit_oct_id), None)
        nov_v = next((v for v in visits if v["visit_id"] == visit_nov_id), None)
        assert oct_v is not None, "October visit must not be overwritten or deleted"
        assert nov_v is not None, "November visit must exist"
        assert oct_v["status"] == "ANALYZED"
        assert nov_v["status"] == "ANALYZED"
        assert len(oct_v["photos"]) == 4
        assert len(nov_v["photos"]) == 3

    def test_08_compare_monthly_visits(self):
        """8. Compare October and November visits side-by-side."""
        res = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/compare",
            headers=self.headers,
            json={
                "visit_id_a": self.visit_oct_id,
                "visit_id_b": self.visit_nov_id
            }
        )
        assert res.status_code == 200, res.text
        comp = res.json()
        assert comp["patient_id"] == self.patient_a_id
        assert comp["visit_a"]["visit_id"] == self.visit_oct_id
        assert comp["visit_b"]["visit_id"] == self.visit_nov_id
        assert comp["trajectory"].upper() in ["IMPROVED", "WORSENED", "UNCHANGED", "INCONCLUSIVE", "IMPROVING", "WORSENING", "NO CLEAR CHANGE", "MIXED / NEEDS MONITORING"]
        assert "tissue_deltas" in comp
        assert "comparison_summary" in comp
        assert "comparison_tamil" in comp
        assert len(comp["visit_a"]["photos"]) == 4
        assert len(comp["visit_b"]["photos"]) == 3
        assert comp["visit_a"]["analysis_result"] is not None
        assert comp["visit_b"]["analysis_result"] is not None
        assert "comparison_reliable" in comp
        if not comp["comparison_reliable"]:
            assert comp["trajectory"] == "INCONCLUSIVE"
            assert comp["tissue_deltas"]["granulation_delta"] is None

        same_visit = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/compare",
            headers=self.headers,
            json={"visit_id_a": self.visit_oct_id, "visit_id_b": self.visit_oct_id},
        )
        assert same_visit.status_code == 400

    def test_09_reject_cross_patient_comparison(self):
        """9. Reject comparison between visits belonging to different patients."""
        # Create a visit for patient B
        res_b = self.client.post(
            f"/api/wounds/{self.patient_b_id}/visits",
            headers=self.headers,
            json={
                "visit_date": "2026-10-20",
                "visit_month": "October 2026",
                "wound_location": "Right Forearm",
            }
        )
        assert res_b.status_code == 200
        visit_b_id = res_b.json()["visit_id"]

        # Attempt to compare Patient A's visit with Patient B's visit
        res_cross = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/compare",
            headers=self.headers,
            json={
                "visit_id_a": self.visit_oct_id,
                "visit_id_b": visit_b_id
            }
        )
        assert res_cross.status_code == 400, "Must reject cross-patient comparisons"
        assert "belong to different patients" in res_cross.json().get("detail", "")

    def test_10_reject_comparison_of_unanalyzed_visit(self):
        """10. Reject comparison if either visit is still PENDING analysis."""
        # Create unanalyzed visit for Patient A
        res_pending = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits",
            headers=self.headers,
            json={
                "visit_date": "2026-12-05",
                "visit_month": "December 2026",
            }
        )
        assert res_pending.status_code == 200
        pending_id = res_pending.json()["visit_id"]

        res_comp = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/compare",
            headers=self.headers,
            json={
                "visit_id_a": self.visit_oct_id,
                "visit_id_b": pending_id
            }
        )
        assert res_comp.status_code == 400, "Must reject comparison when visit is not yet analyzed"
        assert "must be analyzed" in res_comp.json().get("detail", "")

    def test_11_verify_existing_functionality_preserved(self):
        """11. Verify existing patient APIs and system endpoints remain 100% operational."""
        # Check patient listing
        res_pts = self.client.get("/api/patients", headers=self.headers)
        assert res_pts.status_code == 200
        assert any(p["patient_id"] == self.patient_a_id for p in res_pts.json())

        # Check single patient get
        res_pt = self.client.get(f"/api/patients/{self.patient_a_id}", headers=self.headers)
        assert res_pt.status_code == 200
        assert res_pt.json()["full_name"] == "Kavitha Sundaram"

        # Check existing wound assessments legacy endpoint
        res_legacy = self.client.get(f"/api/wounds/{self.patient_a_id}/assessments", headers=self.headers)
        assert res_legacy.status_code == 200

    def test_12_upload_retry_is_idempotent_and_ten_photo_limit(self):
        """Repeated multipart requests must not duplicate a photo; up to 10 photos remain pending."""
        created = self.client.post(
            f"/api/wounds/{self.patient_b_id}/visits",
            headers=self.headers,
            json={
                "visit_date": "2026-12-15",
                "wound_location": "Right Heel",
                "wound_type_tag": "Diabetic Foot Ulcer (DFU)",
            },
        )
        assert created.status_code == 200, created.text
        visit_id = created.json()["visit_id"]

        first_two = [
            ("files", ("one.jpg", create_test_image_bytes(format="JPEG"), "image/jpeg")),
            ("files", ("two.png", create_test_image_bytes(format="PNG"), "image/png")),
        ]
        upload_url = f"/api/wounds/{self.patient_b_id}/visits/{visit_id}/photos"
        first_upload = self.client.post(upload_url, headers=self.headers, files=first_two)
        assert first_upload.status_code == 200, first_upload.text
        assert len(first_upload.json()["photos"]) == 2

        retry_upload = self.client.post(upload_url, headers=self.headers, files=first_two)
        assert retry_upload.status_code == 200, retry_upload.text
        assert len(retry_upload.json()["photos"]) == 2
        assert retry_upload.json()["status"] == "PENDING"

        remaining = [
            ("files", (f"extra_{i}.webp", create_test_image_bytes(color=(i * 10, 80, 90), format="WEBP"), "image/webp"))
            for i in range(8)
        ]
        final_upload = self.client.post(upload_url, headers=self.headers, files=remaining)
        assert final_upload.status_code == 200, final_upload.text
        assert len(final_upload.json()["photos"]) == 10
        assert final_upload.json()["status"] == "PENDING"
        assert final_upload.json()["analysis_result"] is None

    def test_13_analyzed_same_date_creates_a_new_visit(self):
        """A new visit on an analyzed visit's date must never reuse or overwrite its report."""
        created = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits",
            headers=self.headers,
            json={
                "visit_date": "2026-10-15",
                "wound_location": "Left Lower Extremity - Medial Malleolus",
            },
        )
        assert created.status_code == 200, created.text
        new_visit = created.json()
        assert new_visit["visit_id"] != self.visit_oct_id
        assert new_visit["status"] == "PENDING"
        old_visit = self.client.get(
            f"/api/wounds/{self.patient_a_id}/visits/{self.visit_oct_id}",
            headers=self.headers,
        )
        assert old_visit.status_code == 200
        assert old_visit.json()["status"] == "ANALYZED"
        assert len(old_visit.json()["photos"]) == 4

    def test_14_three_month_visit_history_is_retained(self):
        """October, November, and December visits remain independently available."""
        december = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits",
            headers=self.headers,
            json={
                "visit_date": "2026-12-21",
                "wound_location": "Left Lower Extremity - Medial Malleolus",
            },
        )
        assert december.status_code == 200, december.text
        visit_id = december.json()["visit_id"]
        upload = self.client.post(
            f"/api/wounds/{self.patient_a_id}/visits/{visit_id}/photos",
            headers=self.headers,
            files=[
                ("files", ("december.webp", create_test_image_bytes(format="WEBP"), "image/webp")),
            ],
        )
        assert upload.status_code == 200, upload.text

        visits = self.client.get(
            f"/api/wounds/{self.patient_a_id}/visits",
            headers=self.headers,
        )
        assert visits.status_code == 200
        data = visits.json()
        assert any(v["visit_id"] == self.visit_oct_id and v["photo_count"] == 4 for v in data)
        assert any(v["visit_id"] == self.visit_nov_id and v["photo_count"] == 3 for v in data)
        assert any(v["visit_id"] == visit_id and v["photo_count"] == 1 for v in data)

    def test_15_signed_storage_ticket_and_finalize_are_authenticated_and_idempotent(self):
        """The production direct-upload flow only records verified image bytes once."""
        created = self.client.post(
            f"/api/wounds/{self.patient_b_id}/visits",
            headers=self.headers,
            json={"visit_date": "2027-01-11", "wound_location": "Right Heel"},
        )
        assert created.status_code == 200, created.text
        visit_id = created.json()["visit_id"]
        image_bytes = create_test_image_bytes(format="JPEG")
        metadata = {
            "filename": "signed-photo.jpg",
            "mime_type": "image/jpeg",
            "size_bytes": len(image_bytes),
            "sha256": hashlib.sha256(image_bytes).hexdigest(),
        }
        base_url = f"/api/wounds/{self.patient_b_id}/visits/{visit_id}/photos"

        unauthorized_ticket = self.client.post(
            f"{base_url}/upload-url",
            json=metadata,
        )
        assert unauthorized_ticket.status_code == 401

        with patch.object(db, "wound_photo_storage_ready", return_value=True), \
             patch.object(db, "has_stored_file", return_value=False), \
             patch.object(db, "create_signed_upload_url", return_value={
                 "bucket": "wound-photos",
                 "path": "signed-object.jpg",
                 "token": "short-lived-test-token",
             }):
            ticket = self.client.post(
                f"{base_url}/upload-url",
                headers=self.headers,
                json=metadata,
            )
        assert ticket.status_code == 200, ticket.text
        assert ticket.json()["mode"] == "signed"
        assert ticket.json()["bucket"] == "wound-photos"
        assert ticket.json()["token"] == "short-lived-test-token"

        def write_uploaded_image(_filename, path):
            with open(path, "wb") as image_file:
                image_file.write(image_bytes)
            return True

        try:
            with patch.object(db, "wound_photo_storage_ready", return_value=True), \
                 patch.object(db, "retrieve_uploaded_file", side_effect=write_uploaded_image):
                completed = self.client.post(
                    f"{base_url}/complete",
                    headers=self.headers,
                    json=metadata,
                )
                retry = self.client.post(
                    f"{base_url}/complete",
                    headers=self.headers,
                    json=metadata,
                )
            assert completed.status_code == 200, completed.text
            assert completed.json()["status"] == "PENDING"
            assert len(completed.json()["photos"]) == 1
            assert retry.status_code == 200, retry.text
            assert len(retry.json()["photos"]) == 1

            invalid_metadata = {
                "filename": "invalid.jpg",
                "mime_type": "image/jpeg",
                "size_bytes": len(b"not-an-image"),
                "sha256": hashlib.sha256(b"not-an-image").hexdigest(),
            }

            def write_invalid_image(_filename, path):
                with open(path, "wb") as image_file:
                    image_file.write(b"not-an-image")
                return True

            with patch.object(db, "wound_photo_storage_ready", return_value=True), \
                 patch.object(db, "retrieve_uploaded_file", side_effect=write_invalid_image), \
                 patch.object(db, "delete_uploaded_file", return_value=True):
                invalid = self.client.post(
                    f"{base_url}/complete",
                    headers=self.headers,
                    json=invalid_metadata,
                )
            assert invalid.status_code == 400
            assert "not a valid JPG" in invalid.json()["detail"]
            assert len(self.client.get(base_url.rsplit("/photos", 1)[0], headers=self.headers).json()["photos"]) == 1
        finally:
            db.delete_wound_visit(visit_id)


if __name__ == "__main__":
    unittest.main(verbosity=2)
