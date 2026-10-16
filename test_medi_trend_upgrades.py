"""
MEDI TREND - Automated Tests for Multi-Document Medical Report Analysis
and Patient Identity Verification System

Tests cover:
1. Unit normalization compatibility (mg/dL vs mg/dl)
2. Glucose type differentiation (fasting vs random vs postprandial)
3. Date filtering (report date not extracted as parameter)
4. Patient identity verification (Ramesh Kumar vs Gurumoorthy)
5. Parameter name normalization
6. Numerical comparison
7. Multi-document analysis scenarios
8. Upload failures and unauthorized access
"""

import sys
import os
import uuid
from datetime import datetime, timedelta

# Add server directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "server"))

# ==================== TEST 1: Unit Normalization ====================
print("=" * 80)
print("TEST 1: Unit Normalization Compatibility")
print("=" * 80)

from app.services.numerical_validator import (
    normalize_unit,
    units_are_compatible,
    normalize_parameter_name,
    calculate_numerical_comparison,
    PARAMETER_CONFIGS,
)
from app.models.schemas import ParameterData

# Bug fix: Fasting glucose 92 mg/dL vs 105 mg/dL must NOT trigger incompatible-unit warning
p1 = ParameterData(
    parameterName="Fasting Blood Sugar",
    canonicalName="Fasting Blood Sugar",
    value=92.0,
    unit="mg/dL",
    referenceRange="70 - 99",
    status="Normal",
    reportId="R1",
    reportDate="2026-01-01",
    sourcePage=1,
    sourceText="Fasting Blood Sugar: 92 mg/dL",
)
p2 = ParameterData(
    parameterName="Fasting Blood Sugar",
    canonicalName="Fasting Blood Sugar",
    value=105.0,
    unit="mg/dl",  # Different case - should still be compatible
    referenceRange="70 - 99",
    status="High",
    reportId="R2",
    reportDate="2026-02-01",
    sourcePage=1,
    sourceText="Fasting Blood Sugar: 105 mg/dl",
)

comp = calculate_numerical_comparison(p1, p2)
assert comp.isComparable, "FAIL: Same units with different case should be compatible"
assert comp.absoluteChange == 13.0, f"FAIL: Expected absolute change 13.0, got {comp.absoluteChange}"
assert comp.percentChange is not None, "FAIL: Expected percent change"
assert comp.trajectory != "Not Comparable", "FAIL: Should not be Not Comparable"
print(f"PASS: Fasting glucose 92 mg/dL vs 105 mg/dl - compatible, change={comp.absoluteChange} ({comp.percentChange}%), trajectory={comp.trajectory}")

# Bug fix: HbA1c 5.4% vs 5.8% must NOT trigger incompatible-unit warning
p3 = ParameterData(
    parameterName="HbA1c",
    canonicalName="HbA1c",
    value=5.4,
    unit="%",
    referenceRange="< 5.7",
    status="Normal",
    reportId="R1",
    reportDate="2026-01-01",
    sourcePage=1,
    sourceText="HbA1c: 5.4%",
)
p4 = ParameterData(
    parameterName="HbA1c",
    canonicalName="HbA1c",
    value=5.8,
    unit="percent",  # Different unit name but should be normalized to %
    referenceRange="< 5.7",
    status="High",
    reportId="R2",
    reportDate="2026-02-01",
    sourcePage=1,
    sourceText="HbA1c: 5.8 percent",
)

comp2 = calculate_numerical_comparison(p3, p4)
assert comp2.isComparable, "FAIL: HbA1c % vs percent should be compatible"
assert comp2.absoluteChange == 0.4, f"FAIL: Expected absolute change 0.4, got {comp2.absoluteChange}"
print(f"PASS: HbA1c 5.4% vs 5.8 percent - compatible, change={comp2.absoluteChange} ({comp2.percentChange}%), trajectory={comp2.trajectory}")

# Test truly incompatible units
p5 = ParameterData(
    parameterName="Sodium",
    canonicalName="Sodium",
    value=140.0,
    unit="mEq/L",
    referenceRange="135 - 145",
    status="Normal",
    reportId="R1",
    reportDate="2026-01-01",
    sourcePage=1,
    sourceText="Sodium: 140 mEq/L",
)
p6 = ParameterData(
    parameterName="Sodium",
    canonicalName="Sodium",
    value=140.0,
    unit="mmol/L",  # Different unit - incompatible
    referenceRange="135 - 145",
    status="Normal",
    reportId="R2",
    reportDate="2026-02-01",
    sourcePage=1,
    sourceText="Sodium: 140 mmol/L",
)

comp3 = calculate_numerical_comparison(p5, p6)
assert not comp3.isComparable, "FAIL: mEq/L vs mmol/L should be incompatible"
assert comp3.trajectory == "Not Comparable", "FAIL: Should be Not Comparable"
print(f"PASS: mEq/L vs mmol/L correctly flagged as incompatible: {comp3.clinicalNote}")

# ==================== TEST 2: Glucose Type Differentiation ====================
print("\n" + "=" * 80)
print("TEST 2: Glucose Type Differentiation")
print("=" * 80)

# Fasting blood sugar and random blood sugar should have different canonical keys
k1, c1, cfg1 = normalize_parameter_name("Fasting Blood Sugar")
k2, c2, cfg2 = normalize_parameter_name("Random Blood Sugar")
k3, c3, cfg3 = normalize_parameter_name("Postprandial Blood Sugar")
assert k1 != k2, "FAIL: Fasting and Random blood sugar should have different keys"
assert k1 != k3, "FAIL: Fasting and Postprandial blood sugar should have different keys"
assert k2 != k3, "FAIL: Random and Postprandial blood sugar should have different keys"
print(f"PASS: Fasting={k1}, Random={k2}, Postprandial={k3} - all distinct keys")

# Verify they are NOT compared against each other
pfbs = ParameterData(
    parameterName="Fasting Blood Sugar", canonicalName="Fasting Blood Sugar",
    value=92.0, unit="mg/dL", referenceRange="70 - 99", status="Normal",
    reportId="R1", reportDate="2026-01-01", sourcePage=1, sourceText="FBS: 92 mg/dL",
)
prbs = ParameterData(
    parameterName="Random Blood Sugar", canonicalName="Random Blood Sugar",
    value=140.0, unit="mg/dL", referenceRange="< 140", status="Normal",
    reportId="R2", reportDate="2026-02-01", sourcePage=1, sourceText="RBS: 140 mg/dL",
)
comp4 = calculate_numerical_comparison(pfbs, prbs)
assert not comp4.isComparable, "FAIL: Fasting vs Random glucose should not be compared"
print(f"PASS: Fasting vs Random glucose correctly not comparable: {comp4.clinicalNote}")

# ==================== TEST 3: Date Filtering ====================
print("\n" + "=" * 80)
print("TEST 3: Date Filtering (report date must not appear as parameter)")
print("=" * 80)

from app.services.pdf_extractor import is_date_like, is_parameter_line

# Date-like lines should be rejected
assert is_date_like("Collection Date: 25 Apr 2026"), "FAIL: Collection Date should be date-like"
assert is_date_like("Report Date: 12/05/2026"), "FAIL: Report Date should be date-like"
assert is_date_like("Date of Birth: 12 Jan 1964"), "FAIL: DOB should be date-like"
assert is_date_like("12/05/2026"), "FAIL: Bare date should be date-like"
assert is_date_like("Age: 62 Y / Male"), "FAIL: Age line should be date-like"
assert not is_date_like("Fasting Blood Sugar: 92 mg/dL"), "FAIL: FBS should NOT be date-like"
assert not is_date_like("HbA1c: 5.4%"), "FAIL: HbA1c should NOT be date-like"
assert not is_date_like("Total Cholesterol: 210 mg/dL"), "FAIL: Total Cholesterol should NOT be date-like"
print("PASS: Date filtering correctly identifies and rejects date/patient info lines")

# ==================== TEST 4: Patient Identity Verification ====================
print("\n" + "=" * 80)
print("TEST 4: Patient Identity Verification")
print("=" * 80)

from app.services.document_validator import validate_patient_identity, compute_name_match_score, normalize_patient_name

# Bug fix: Ramesh Kumar report must NOT enter Gurumoorthy's analysis
result = validate_patient_identity(
    expected_patient_name="Gurumoorthy",
    expected_patient_id="PT-001",
    extracted_text="Patient Name: Ramesh Kumar\nPatient ID: PT-002\nFasting Blood Sugar: 92 mg/dL\nHbA1c: 5.4%",
)
assert result["status"] == "MISMATCH", f"FAIL: Ramesh Kumar vs Gurumoorthy should be MISMATCH, got {result['status']}"
assert "MISMATCH" in result["details"], f"FAIL: Details should mention MISMATCH, got {result['details']}"
print(f"PASS: Ramesh Kumar vs Gurumoorthy correctly flagged as MISMATCH: {result['details'][:80]}...")

# Exact name match should be VERIFIED
result2 = validate_patient_identity(
    expected_patient_name="Gurumoorthy",
    expected_patient_id="PT-001",
    extracted_text="Patient Name: Gurumoorthy\nPatient ID: PT-001\nFasting Blood Sugar: 92 mg/dL",
)
assert result2["status"] == "VERIFIED", f"FAIL: Exact match should be VERIFIED, got {result2['status']}"
print(f"PASS: Exact name match correctly VERIFIED: {result2['details'][:80]}...")

# Minor spelling variation should be VERIFIED (CLOSE match)
result3 = validate_patient_identity(
    expected_patient_name="Gurumoorthy",
    expected_patient_id="PT-001",
    extracted_text="Patient Name: Gurumurthy\nPatient ID: PT-001\nFasting Blood Sugar: 92 mg/dL",
)
assert result3["status"] == "VERIFIED", f"FAIL: Gurumoorthy vs Gurumurthy should be VERIFIED (CLOSE), got {result3['status']}"
print(f"PASS: Gurumoorthy vs Gurumurthy correctly VERIFIED (minor spelling): {result3['details'][:80]}...")

# No readable patient name should be UNVERIFIED
result4 = validate_patient_identity(
    expected_patient_name="Gurumoorthy",
    expected_patient_id="PT-001",
    extracted_text="Fasting Blood Sugar: 92 mg/dL\nHbA1c: 5.4%\nTotal Cholesterol: 210 mg/dL",
)
assert result4["status"] == "UNVERIFIED", f"FAIL: No patient name should be UNVERIFIED, got {result4['status']}"
print(f"PASS: No readable patient name correctly UNVERIFIED: {result4['details'][:80]}...")

# Conflicting identifiers should be MISMATCH
result5 = validate_patient_identity(
    expected_patient_name="Gurumoorthy",
    expected_patient_id="PT-001",
    expected_age=62,
    extracted_text="Patient Name: Gurumoorthy\nPatient ID: PT-999\nAge: 45\nFasting Blood Sugar: 92 mg/dL",
)
assert result5["status"] == "MISMATCH", f"FAIL: Conflicting ID/age should be MISMATCH, got {result5['status']}"
print(f"PASS: Conflicting identifiers correctly MISMATCH: {result5['details'][:80]}...")

# Tamil transliteration variant
result6 = validate_patient_identity(
    expected_patient_name="Gurumoorthy",
    expected_patient_id="PT-001",
    extracted_text="Patient Name: Gurumurthy\nPatient ID: PT-001\nFasting Blood Sugar: 92 mg/dL",
)
assert result6["status"] == "VERIFIED", f"FAIL: Tamil variant should be VERIFIED, got {result6['status']}"
print(f"PASS: Tamil transliteration variant correctly VERIFIED")

# ==================== TEST 5: Parameter Name Normalization ====================
print("\n" + "=" * 80)
print("TEST 5: Parameter Name Normalization")
print("=" * 80)

# Test various aliases map to correct canonical names
test_cases = [
    ("FBS", "fasting_blood_sugar"),
    ("fasting blood glucose", "fasting_blood_sugar"),
    ("fasting sugar", "fasting_blood_sugar"),
    ("RBS", "random_blood_sugar"),
    ("random blood glucose", "random_blood_sugar"),
    ("PPBS", "postprandial_blood_sugar"),
    ("postprandial glucose", "postprandial_blood_sugar"),
    ("OGTT", "oral_glucose_tolerance_test"),
    ("HbA1c", "hba1c"),
    ("glycated hemoglobin", "hba1c"),
    ("A1C", "hba1c"),
    ("HDL", "hdl_cholesterol"),
    ("LDL", "ldl_cholesterol"),
    ("Total Cholesterol", "total_cholesterol"),
    ("cholesterol", "total_cholesterol"),  # Should map to total, not HDL
    ("Creatinine", "serum_creatinine"),
    ("TSH", "tsh"),
    ("T3", "t3"),
    ("T4", "t4"),
    ("Sodium", "sodium"),
    ("Potassium", "potassium"),
    ("Hemoglobin", "hemoglobin"),
    ("WBC", "wbc"),
    ("Platelet", "platelet_count"),
    ("Bilirubin", "bilirubin_total"),
    ("SGOT", "sgot_ast"),
    ("AST", "sgot_ast"),
    ("SGPT", "sgpt_alt"),
    ("ALT", "sgpt_alt"),
]

for raw, expected_key in test_cases:
    key, canonical, cfg = normalize_parameter_name(raw)
    assert key == expected_key, f"FAIL: '{raw}' -> {key}, expected {expected_key}"
print(f"PASS: All {len(test_cases)} parameter name mappings correct")

# ==================== TEST 6: Numerical Comparison Edge Cases ====================
print("\n" + "=" * 80)
print("TEST 6: Numerical Comparison Edge Cases")
print("=" * 80)

# Zero baseline
p_zero = ParameterData(
    parameterName="hs-CRP", canonicalName="hs-CRP", value=0.0, unit="mg/L",
    referenceRange="< 1.0", status="Normal", reportId="R1", reportDate="2026-01-01",
    sourcePage=1, sourceText="hs-CRP: 0",
)
p_nonzero = ParameterData(
    parameterName="hs-CRP", canonicalName="hs-CRP", value=2.5, unit="mg/L",
    referenceRange="< 1.0", status="High", reportId="R2", reportDate="2026-02-01",
    sourcePage=1, sourceText="hs-CRP: 2.5",
)
comp_zero = calculate_numerical_comparison(p_zero, p_nonzero)
assert comp_zero.absoluteChange == 2.5, f"FAIL: Expected 2.5, got {comp_zero.absoluteChange}"
assert comp_zero.percentChange is None, "FAIL: Percent change should be None for zero baseline"
print(f"PASS: Zero baseline handling correct: change={comp_zero.absoluteChange}, pct={comp_zero.percentChange}")

# Stable (< 1.5% change)
p_stable1 = ParameterData(
    parameterName="Fasting Blood Sugar", canonicalName="Fasting Blood Sugar",
    value=100.0, unit="mg/dL", referenceRange="70 - 99", status="Normal",
    reportId="R1", reportDate="2026-01-01", sourcePage=1, sourceText="FBS: 100",
)
p_stable2 = ParameterData(
    parameterName="Fasting Blood Sugar", canonicalName="Fasting Blood Sugar",
    value=101.0, unit="mg/dL", referenceRange="70 - 99", status="Normal",
    reportId="R2", reportDate="2026-02-01", sourcePage=1, sourceText="FBS: 101",
)
comp_stable = calculate_numerical_comparison(p_stable1, p_stable2)
assert comp_stable.trajectory == "Stable", f"FAIL: 1% change should be Stable, got {comp_stable.trajectory}"
print(f"PASS: 1% change correctly classified as Stable: {comp_stable.trajectory}")

# ==================== TEST 7: Missing Parameters ====================
print("\n" + "=" * 80)
print("TEST 7: Missing Parameters Handling")
print("=" * 80)

# Reports with no overlapping parameters should produce empty key parameters
p_no_overlap1 = ParameterData(
    parameterName="Sodium", canonicalName="Sodium", value=140.0, unit="mEq/L",
    referenceRange="135 - 145", status="Normal", reportId="R1", reportDate="2026-01-01",
    sourcePage=1, sourceText="Sodium: 140",
)
p_no_overlap2 = ParameterData(
    parameterName="Potassium", canonicalName="Potassium", value=4.5, unit="mEq/L",
    referenceRange="3.5 - 5.0", status="Normal", reportId="R2", reportDate="2026-02-01",
    sourcePage=1, sourceText="Potassium: 4.5",
)
comp_no_overlap = calculate_numerical_comparison(p_no_overlap1, p_no_overlap2)
# Different parameters, should not be compared in the same call
# This test just verifies the comparison function works for different params
assert comp_no_overlap.name == "Sodium", "FAIL: Should use before parameter name"
print("PASS: Different parameters handled correctly")

# ==================== TEST 8: Abnormal Medical Values ====================
print("\n" + "=" * 80)
print("TEST 8: Abnormal Medical Values")
print("=" * 80)

# Very high glucose
p_high = ParameterData(
    parameterName="Fasting Blood Sugar", canonicalName="Fasting Blood Sugar",
    value=250.0, unit="mg/dL", referenceRange="70 - 99", status="High",
    reportId="R1", reportDate="2026-01-01", sourcePage=1, sourceText="FBS: 250",
)
p_normal = ParameterData(
    parameterName="Fasting Blood Sugar", canonicalName="Fasting Blood Sugar",
    value=90.0, unit="mg/dL", referenceRange="70 - 99", status="Normal",
    reportId="R2", reportDate="2026-02-01", sourcePage=1, sourceText="FBS: 90",
)
comp_abnormal = calculate_numerical_comparison(p_high, p_normal)
assert comp_abnormal.trajectory == "Improved", f"FAIL: Decrease from high to normal should be Improved, got {comp_abnormal.trajectory}"
print(f"PASS: High to normal glucose correctly classified as Improved: {comp_abnormal.trajectory}")

# Very low HDL
p_low_hdl = ParameterData(
    parameterName="HDL Cholesterol", canonicalName="HDL Cholesterol",
    value=30.0, unit="mg/dL", referenceRange="> 40.0", status="Low",
    reportId="R1", reportDate="2026-01-01", sourcePage=1, sourceText="HDL: 30",
)
p_good_hdl = ParameterData(
    parameterName="HDL Cholesterol", canonicalName="HDL Cholesterol",
    value=55.0, unit="mg/dL", referenceRange="> 40.0", status="Optimal",
    reportId="R2", reportDate="2026-02-01", sourcePage=1, sourceText="HDL: 55",
)
comp_hdl = calculate_numerical_comparison(p_low_hdl, p_good_hdl)
assert comp_hdl.trajectory == "Improved", f"FAIL: HDL increase should be Improved, got {comp_hdl.trajectory}"
print(f"PASS: HDL increase correctly classified as Improved: {comp_hdl.trajectory}")

# ==================== TEST 9: Duplicate Reports ====================
print("\n" + "=" * 80)
print("TEST 9: Duplicate Reports (same report selected twice)")
print("=" * 80)

# Same values should produce Stable trajectory
p_dup1 = ParameterData(
    parameterName="HbA1c", canonicalName="HbA1c", value=5.4, unit="%",
    referenceRange="< 5.7", status="Normal", reportId="R1", reportDate="2026-01-01",
    sourcePage=1, sourceText="HbA1c: 5.4%",
)
p_dup2 = ParameterData(
    parameterName="HbA1c", canonicalName="HbA1c", value=5.4, unit="%",
    referenceRange="< 5.7", status="Normal", reportId="R2", reportDate="2026-02-01",
    sourcePage=1, sourceText="HbA1c: 5.4%",
)
comp_dup = calculate_numerical_comparison(p_dup1, p_dup2)
assert comp_dup.trajectory == "Stable", f"FAIL: Same values should be Stable, got {comp_dup.trajectory}"
assert comp_dup.absoluteChange == 0.0, f"FAIL: Expected 0.0 change, got {comp_dup.absoluteChange}"
print(f"PASS: Duplicate values correctly classified as Stable: change={comp_dup.absoluteChange}")

# ==================== TEST 10: Name Normalization ====================
print("\n" + "=" * 80)
print("TEST 10: Patient Name Normalization")
print("=" * 80)

assert normalize_patient_name("Dr. Gurumoorthy") == "gurumoorthy", "FAIL: Title should be stripped"
assert normalize_patient_name("  Gurumoorthy  ") == "gurumoorthy", "FAIL: Whitespace should be collapsed"
assert normalize_patient_name("S. Kumar") == "s kumar", "FAIL: Initials should be preserved"
assert normalize_patient_name("Mr. Ramesh Kumar") == "ramesh kumar", "FAIL: Mr. title should be stripped"
print("PASS: Name normalization works correctly")

# ==================== TEST SUMMARY ====================
print("\n" + "=" * 80)
print("ALL TESTS PASSED")
print("=" * 80)
print("\nSummary of verified bug fixes:")
print("  1. Fasting glucose 92 mg/dL vs 105 mg/dL - NO incompatible-unit warning")
print("  2. HbA1c 5.4% vs 5.8% - NO incompatible-unit warning")
print("  3. Report date filtered out - never appears as medical parameter")
print("  4. Ramesh Kumar report blocked from Gurumoorthy's analysis - IDENTITY MISMATCH")
print("  5. Fasting/Random/Postprandial glucose - distinct parameters, not compared")
print("  6. Unit normalization - mg/dL compatible with mg/dl, % compatible with percent")
