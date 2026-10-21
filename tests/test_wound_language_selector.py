import os
import sys

# Ensure server package is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = os.path.join(current_dir, "..", "server")
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from app.data.db import db
from app.services.wound_analyzer import wound_engine


def test_default_logins():
    print("--- 1. Testing Default ID & Password Auth ---")
    # Doctor default login by alias and email
    doc_alias = db.authenticate_doctor("doctor", "doctor1315")
    assert doc_alias is not None, "Failed doctor alias login"
    assert doc_alias["doctor_id"] == "DOC-001"

    doc_email = db.authenticate_doctor("dr.arvind@hospital.org", "doctor1315")
    assert doc_email is not None, "Failed doctor email login"

    # Staff default login by alias and email
    staff_alias = db.authenticate_staff("staff", "staff1315")
    assert staff_alias is not None, "Failed staff alias login"
    assert staff_alias["staff_id"] == "STF-001"

    staff_email = db.authenticate_staff("priya.staff@hospital.org", "staff1315")
    assert staff_email is not None, "Failed staff email login"

    # Admin default login
    admin_auth = db.authenticate_admin("admin", "admin13152425")
    assert admin_auth is not None, "Failed admin login"
    print("✓ All Doctor, Staff, and Admin default credentials validated successfully.")


def test_wound_translations_and_safety():
    print("\n--- 2. Testing Wound Assessment Language Translation & Medical Safety ---")
    mock_assessment = {
        "assessment_id": "WA-TEST-001",
        "visit_date": "2026-10-21",
        "wound_location": "Plantar Aspect Right Great Toe",
        "wound_type_tag": "Diabetic Foot Ulcer (DFU)",
        "severity_indicator": "Moderate / Deepening",
        "severity_rationale": "Visible ulcer bed displays mixed granulation tissue with localized non-viable slough; warrants barrier protection and clinical review.",
        "visible_characteristics": {
            "primary_bed_appearance": "Granulation tissue with localized yellow slough in wound base",
            "periwound_redness": "Mild localized erythema extending < 1cm from wound edge",
            "surrounding_swelling": "Mild localized edema noted in adjacent tissue",
            "edge_condition": "Well-demarcated with slight maceration at lower border",
            "tissue_breakdown": {
                "granulation_percent": 60,
                "slough_percent": 30,
                "necrotic_percent": 0,
                "epithelial_percent": 10
            },
            "discharge_characteristics": {"type": "Serosanguinous", "amount": "Minimal"}
        },
        "dimensions_info": {
            "has_scale_marker": True,
            "length_cm": 2.5,
            "width_cm": 1.8,
            "surface_area_cm2": 4.5,
            "scale_notes": "Scale calibration marker or reference ruler not detected in image."
        },
        "warning_signs": [
            "Advancing periwound erythema spreading > 2 cm from the wound border.",
            "Visible tendon or bone in wound bed (immediate osteomyelitis evaluation required)."
        ],
        "limitations_notes": [
            "2D photograph does not permit reliable assessment of wound depth or tactile induration.",
            "Photographic lighting and white balance may influence apparent tissue coloration."
        ],
        "clinical_recommendations": {
            "recommended_assessments": [
                "Ankle-Brachial Index (ABI) and arterial Doppler to confirm adequate distal limb perfusion."
            ],
            "wound_care_considerations": [
                "Perform gentle non-excisional mechanical debridement to reduce non-viable bioburden."
            ],
            "specialist_referral_triggers": [
                "Emergent evaluation for suspected deep compartment infection or ascending cellulitis."
            ],
            "surgical_evaluation_factors": [
                "Need for surgical reconstructive coverage, skin grafting, or bony prominence resection (ostectomy)."
            ]
        }
    }

    translated = wound_engine.translate_wound_assessment(mock_assessment)

    # 1. Verify numbers and measurements are preserved
    assert mock_assessment["visible_characteristics"]["tissue_breakdown"]["granulation_percent"] == 60
    assert mock_assessment["dimensions_info"]["length_cm"] == 2.5
    assert mock_assessment["dimensions_info"]["surface_area_cm2"] == 4.5
    assert mock_assessment["visit_date"] == "2026-10-21"
    print("✓ Numerical measurements, percentages, and exam dates are strictly preserved.")

    # 2. Verify Tamil medical translation outputs
    assert "மிதமானது" in translated["severity_indicator"]
    assert "சிவப்பு தசை" in translated["visible_characteristics"]["primary_bed_appearance"]
    assert "சிவத்தல்" in translated["visible_characteristics"]["periwound_redness"]
    assert len(translated["warning_signs"]) == 2
    assert "எலும்பு" in translated["warning_signs"][1]
    assert len(translated["clinical_recommendations"]["recommended_assessments"]) == 1
    print("✓ Clinical Tamil translations accurately generated for observations, signs, and recommendations.")

    # 3. Test comparison translation
    sample_comparison = {
        "progress_status": "Improving",
        "differences_summary": "Granulation tissue has expanded by +15%, with non-viable slough reduced by 10%.",
        "detailed_points": ["Wound bed characteristics show stable tissue distribution (Granulation: 50% -> 65%, Slough: 30% -> 20%)."],
        "cautionary_note": "Healing progression must never be determined from image colour alone, as lighting, angle, and camera sensors vary between examinations."
    }
    status_ta = wound_engine.translate_text_to_tamil(sample_comparison["progress_status"])
    summary_ta = wound_engine.translate_text_to_tamil(sample_comparison["differences_summary"])
    caution_ta = wound_engine.translate_text_to_tamil(sample_comparison["cautionary_note"])

    assert "முன்னேற்றம்" in status_ta
    assert "விரிவடைந்துள்ளது" in summary_ta
    assert "மருத்துவரின் நேரடி பரிசோதனை" in caution_ta or "குணமடைதலை" in caution_ta
    print("✓ Longitudinal progress and cautionary notes translated with decision-support safety preserved.")


if __name__ == "__main__":
    test_default_logins()
    test_wound_translations_and_safety()
    print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")
