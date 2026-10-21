import os
import io
import sys
import json
import pytest
from PIL import Image

# Ensure server package is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = os.path.join(current_dir, "..", "server")
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from app.data.db import db
from app.services.wound_analyzer import (
    wound_engine,
    validate_wound_image_file,
    analyze_image_heuristics,
    SUPPORTED_EXTENSIONS
)


def create_dummy_wound_image(filename: str, color=(200, 50, 50), size=(300, 300)) -> str:
    """Create a temporary real image file with realistic test dimensions."""
    storage_dir = db.storage_dir()
    os.makedirs(storage_dir, exist_ok=True)
    file_path = os.path.join(storage_dir, filename)
    img = Image.new("RGB", size, color=color)
    img.save(file_path)
    return file_path


@pytest.fixture
def test_patient():
    """Ensure a grounded patient exists for testing."""
    p_id = "PT-WOUND-TEST-001"
    existing = db.get_patient(p_id)
    if not existing:
        db.create_patient({
            "patient_id": p_id,
            "full_name": "R. Ramanathan",
            "age": 64,
            "gender": "Male",
            "phone": "+91 98401 99999",
            "blood_group": "A+",
            "status": "Active"
        })
    return p_id


class TestWoundImageValidation:
    """Tests for file validation, MIME types, signatures, and corrupted files."""

    def test_valid_image_formats(self, tmp_path):
        for ext in [".jpg", ".png", ".webp"]:
            fname = f"valid_sample{ext}"
            fpath = str(tmp_path / fname)
            img = Image.new("RGB", (200, 200), color=(180, 40, 40))
            img.save(fpath)

            res = validate_wound_image_file(fpath, fname)
            assert res["is_valid"] is True
            assert res["width"] == 200
            assert res["height"] == 200

    def test_reject_unsupported_extension(self, tmp_path):
        fpath = str(tmp_path / "wound_doc.pdf")
        with open(fpath, "wb") as f:
            f.write(b"%PDF-1.4 dummy content")

        res = validate_wound_image_file(fpath, "wound_doc.pdf")
        assert res["is_valid"] is False
        assert "Unsupported file extension" in res["reason"]

    def test_reject_fake_extension_corrupted_header(self, tmp_path):
        # File has .jpg extension but content is plain text
        fpath = str(tmp_path / "fake_wound.jpg")
        with open(fpath, "w") as f:
            f.write("This is a text document renamed to .jpg")

        res = validate_wound_image_file(fpath, "fake_wound.jpg")
        assert res["is_valid"] is False
        assert "File signature check failed" in res["reason"] or "Corrupted" in res["reason"]

    def test_reject_empty_file(self, tmp_path):
        fpath = str(tmp_path / "empty.jpg")
        with open(fpath, "wb") as f:
            pass
        res = validate_wound_image_file(fpath, "empty.jpg")
        assert res["is_valid"] is False
        assert "empty" in res["reason"].lower()


class TestWoundAssessmentLogic:
    """Tests for visible characteristics, scale calibration rules, and warning signs."""

    def test_scale_marker_rule_without_calibrator(self, test_patient):
        img_path = create_dummy_wound_image("wound_uncalibrated.jpg", color=(190, 60, 60))
        patient_ctx = {"patientId": test_patient, "age": 64, "gender": "Male"}

        assessment = wound_engine.analyze_wound_image(
            image_path=img_path,
            patient_context=patient_ctx,
            wound_location="Right Plantar First Metatarsal",
            wound_type_tag="Diabetic Foot Ulcer",
            visit_date="2026-05-01"
        )

        dim_info = assessment["dimensions_info"]
        assert dim_info["has_scale_marker"] is False
        assert dim_info["length_cm"] is None
        assert dim_info["width_cm"] is None
        assert dim_info["surface_area_cm2"] is None
        assert "Scale calibration marker" in dim_info["scale_notes"]

    def test_clinical_safety_and_limitations_stated(self, test_patient):
        img_path = create_dummy_wound_image("wound_safety.jpg")
        patient_ctx = {"patientId": test_patient, "age": 64, "gender": "Male"}

        assessment = wound_engine.analyze_wound_image(
            image_path=img_path,
            patient_context=patient_ctx,
            wound_location="Left Lower Leg",
            wound_type_tag="Venous Leg Ulcer"
        )

        # Characteristics present
        chars = assessment["visible_characteristics"]
        assert "tissue_breakdown" in chars
        assert "granulation_percent" in chars["tissue_breakdown"]
        assert "slough_percent" in chars["tissue_breakdown"]
        assert "necrotic_percent" in chars["tissue_breakdown"]

        # Limitations present
        limits = assessment["limitations_notes"]
        assert len(limits) > 0
        limit_text = " ".join(limits).lower()
        assert "depth" in limit_text or "photograph" in limit_text
        assert "probe" in limit_text or "pulse" in limit_text or "tactile" in limit_text

        # Clinical warning signs present
        warnings = assessment["warning_signs"]
        assert len(warnings) > 0
        warn_text = " ".join(warnings).lower()
        assert "erythema" in warn_text or "fever" in warn_text or "infection" in warn_text

        # Decision support recommendations
        recs = assessment["clinical_recommendations"]
        assert "recommended_assessments" in recs
        assert "wound_care_considerations" in recs
        assert "specialist_referral_triggers" in recs
        assert "surgical_evaluation_factors" in recs
        assert "urgent_warning_signs" in recs

        # Medical disclaimer present
        assert "medical_disclaimer" in assessment


class TestLongitudinalWoundComparison:
    """Tests for multi-image comparison, patient isolation, and progress status."""

    def test_progress_comparison_improving(self, test_patient):
        baseline_record = {
            "patient_id": test_patient,
            "assessment_id": "WA-BASE-01",
            "visit_date": "2026-05-01",
            "image_filename": "wound_base.jpg",
            "visible_characteristics": {
                "tissue_breakdown": {
                    "granulation_percent": 35,
                    "slough_percent": 50,
                    "necrotic_percent": 15
                },
                "periwound_redness": "Moderate erythema"
            },
            "dimensions_info": {"has_scale_marker": False}
        }

        followup_record = {
            "patient_id": test_patient,
            "assessment_id": "WA-FOLL-02",
            "visit_date": "2026-05-20",
            "image_filename": "wound_foll.jpg",
            "visible_characteristics": {
                "tissue_breakdown": {
                    "granulation_percent": 75,
                    "slough_percent": 20,
                    "necrotic_percent": 0
                },
                "periwound_redness": "Mild erythema"
            },
            "dimensions_info": {"has_scale_marker": False}
        }

        comparison = wound_engine.compare_wounds([baseline_record, followup_record])
        assert comparison["progress_status"] == "Improving"
        assert comparison["tissue_changes"]["granulation_delta"] == 40
        assert comparison["tissue_changes"]["slough_delta"] == -30
        assert comparison["tissue_changes"]["necrotic_delta"] == -15
        assert "cautionary_note" in comparison

    def test_progress_comparison_worsening(self, test_patient):
        baseline_record = {
            "patient_id": test_patient,
            "assessment_id": "WA-BASE-01",
            "visit_date": "2026-05-01",
            "image_filename": "wound_base.jpg",
            "visible_characteristics": {
                "tissue_breakdown": {
                    "granulation_percent": 60,
                    "slough_percent": 30,
                    "necrotic_percent": 10
                }
            },
            "dimensions_info": {"has_scale_marker": False}
        }

        followup_record = {
            "patient_id": test_patient,
            "assessment_id": "WA-FOLL-02",
            "visit_date": "2026-05-15",
            "image_filename": "wound_foll.jpg",
            "visible_characteristics": {
                "tissue_breakdown": {
                    "granulation_percent": 30,
                    "slough_percent": 40,
                    "necrotic_percent": 30
                }
            },
            "dimensions_info": {"has_scale_marker": False}
        }

        comparison = wound_engine.compare_wounds([baseline_record, followup_record])
        assert comparison["progress_status"] == "Worsening"

    def test_cross_patient_comparison_strictly_prohibited(self, test_patient):
        p1_record = {
            "patient_id": test_patient,
            "assessment_id": "WA-001",
            "visit_date": "2026-05-01"
        }
        p2_record = {
            "patient_id": "PT-OTHER-999",
            "assessment_id": "WA-002",
            "visit_date": "2026-05-10"
        }

        with pytest.raises(ValueError, match="Cross-patient wound comparison is strictly prohibited"):
            wound_engine.compare_wounds([p1_record, p2_record])


class TestApprovedMedicalReportIntegration:
    """Tests for biomarker correlation (HbA1c, hs-CRP, Albumin, eGFR)."""

    def test_report_biomarker_correlation(self):
        sample_reports = [
            {
                "reportId": "REP-01",
                "reportDate": "2026-04-20",
                "extractedParameters": [
                    {"canonicalName": "HbA1c", "value": 8.4, "unit": "%", "status": "High"},
                    {"canonicalName": "hs-CRP", "value": 5.2, "unit": "mg/L", "status": "High"},
                    {"canonicalName": "Serum Albumin", "value": 3.1, "unit": "g/dL", "status": "Low"}
                ]
            }
        ]

        summary = wound_engine._summarize_approved_reports(sample_reports)
        assert summary["approved_report_count"] == 1
        assert len(summary["correlated_parameters"]) >= 3
        # Check that clinical correlation notes discuss healing impairment
        note = summary["clinical_correlation_note"]
        assert "HbA1c" in note
        assert "hs-CRP" in note


class TestDatabasePersistence:
    """Tests for persistent storage, retrieval, doctor notes update, and deletion."""

    def test_save_and_retrieve_wound_assessment(self, test_patient):
        img_file = "test_persist.jpg"
        img_path = create_dummy_wound_image(img_file)

        assessment_data = {
            "assessment_id": "WA-TEST-PERSIST-1",
            "patient_id": test_patient,
            "image_path": img_path,
            "image_filename": img_file,
            "image_mime_type": "image/jpeg",
            "image_size_bytes": 1024,
            "visit_date": "2026-05-05",
            "upload_date": "2026-05-05 10:00:00",
            "uploaded_by": "Dr. Arvind Kumar",
            "wound_location": "Right Heel",
            "wound_type_tag": "Pressure Injury",
            "visible_characteristics": {"primary_bed_appearance": "Granulation 70%"},
            "severity_indicator": "Mild / Superficial",
            "dimensions_info": {"has_scale_marker": False},
            "categories_considered": [{"category": "Pressure Injury", "confidence": "Probable"}],
            "limitations_notes": ["No ruler"],
            "warning_signs": ["None"],
            "clinical_recommendations": {"recommended_assessments": ["Offloading"]},
            "linked_report_summary": {"approved_report_count": 0},
            "doctor_notes": "Initial staging",
            "review_status": "PENDING"
        }

        saved = db.save_wound_assessment(assessment_data)
        assert saved["assessment_id"] == "WA-TEST-PERSIST-1"
        assert saved["patient_id"] == test_patient
        assert isinstance(saved["visible_characteristics"], dict)

        # Retrieve
        fetched = db.get_wound_assessment("WA-TEST-PERSIST-1")
        assert fetched is not None
        assert fetched["wound_location"] == "Right Heel"

        # Update notes
        updated = db.update_wound_doctor_notes(
            "WA-TEST-PERSIST-1",
            doctor_notes="Reviewed and confirmed Stage 2. Hydrocolloid dressing prescribed.",
            review_status="VALIDATED",
            doctor_name="Dr. Arvind Kumar"
        )
        assert updated is True

        re_fetched = db.get_wound_assessment("WA-TEST-PERSIST-1")
        assert re_fetched["review_status"] == "VALIDATED"
        assert "Hydrocolloid" in re_fetched["doctor_notes"]

        # Clean up
        db.delete_wound_assessment("WA-TEST-PERSIST-1")
        assert db.get_wound_assessment("WA-TEST-PERSIST-1") is None
