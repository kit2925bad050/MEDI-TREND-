import math
import re
from typing import Dict, List, Optional, Tuple, Any
from ..models.schemas import ParameterComparison, ParameterData

<<<<<<< HEAD
# ==================== UNIT NORMALIZATION ====================
UNIT_NORMALIZATION: Dict[str, str] = {
    "mg/dl": "mg/dL",
    "g/dl": "g/dL",
    "percent": "%",
    "per cent": "%",
    "u/l": "U/L",
    "iu/l": "IU/L",
    "mmol/l": "mmol/L",
    "umol/l": "μmol/L",
    "ng/ml": "ng/mL",
    "ug/dl": "μg/dL",
    "meq/l": "mEq/L",
    "cells/cu mm": "cells/μL",
    "cu mm": "cells/μL",
    "mm/hr": "mm/hr",
    "mm/h": "mm/hr",
    "mmhg": "mmHg",
    "fl": "fL",
    "pg": "pg",
    "pmol/l": "pmol/L",
    "nmol/l": "nmol/L",
    "microu/ml": "IU/L",
}


def normalize_unit(unit: str) -> str:
    """Normalize unit string to canonical form for comparison."""
    if not unit:
        return ""
    cleaned = unit.strip().lower()
    cleaned = " ".join(cleaned.split())
    return UNIT_NORMALIZATION.get(cleaned, unit.strip())


def units_are_compatible(u1: str, u2: str) -> bool:
    """Check if two units are compatible after normalization."""
    n1 = normalize_unit(u1)
    n2 = normalize_unit(u2)
    if not n1 or not n2:
        return True
    return n1 == n2


# ==================== PARAMETER CONFIGURATIONS ====================
=======
# Comprehensive clinical parameter registry covering routine, metabolic, endocrine,
# hematologic, hepatic, and renal laboratory panels.
>>>>>>> origin/main
PARAMETER_CONFIGS: Dict[str, Dict[str, Any]] = {
    # Glycemic Profile (Separated into Fasting, Postprandial, Random, and Glycated)
    "fasting_blood_glucose": {
        "canonical_name": "Fasting Blood Glucose",
        "aliases": [
            "fbs", "fbg", "fasting blood sugar", "fasting blood glucose",
            "fasting plasma glucose", "fasting glucose", "glucose fasting",
            "glucose (fasting)", "plasma glucose fasting"
        ],
        "unit": "mg/dL",
        "standard_range": "70.0 - 99.0",
        "ideal_min": 70.0,
        "ideal_max": 99.0,
        "type": "range_bounded",
        "category": "Glycemic Control"
    },
    "postprandial_blood_glucose": {
        "canonical_name": "Postprandial Blood Glucose",
        "aliases": [
            "ppbs", "ppbg", "post prandial blood sugar", "post prandial glucose",
            "post meal glucose", "glucose post prandial", "glucose pp",
            "glucose (post prandial)", "2hr post prandial glucose", "pp blood sugar"
        ],
        "unit": "mg/dL",
        "standard_range": "70.0 - 140.0",
        "ideal_min": 70.0,
        "ideal_max": 140.0,
        "type": "range_bounded",
        "category": "Glycemic Control"
    },
    "random_blood_glucose": {
        "canonical_name": "Random Blood Glucose",
        "aliases": [
            "rbs", "rbg", "random blood sugar", "random blood glucose",
            "glucose random", "random plasma glucose", "glucose (random)"
        ],
        "unit": "mg/dL",
        "standard_range": "70.0 - 140.0",
        "ideal_min": 70.0,
        "ideal_max": 140.0,
        "type": "range_bounded",
        "category": "Glycemic Control"
    },
    "hba1c": {
        "canonical_name": "HbA1c",
        "aliases": [
            "hba1c", "glycated hemoglobin", "glycosylated hemoglobin",
            "a1c", "hemoglobin a1c", "glycohemoglobin"
        ],
        "unit": "%",
        "standard_range": "< 5.7",
        "ideal_min": 4.0,
        "ideal_max": 5.6,
        "type": "lower_is_better",
        "category": "Glycemic Control"
    },

    # Lipid & Cardiovascular Profile
    "total_cholesterol": {
        "canonical_name": "Total Cholesterol",
        "aliases": ["total cholesterol", "cholesterol total", "serum cholesterol", "cholesterol"],
        "unit": "mg/dL",
        "standard_range": "< 200.0",
        "ideal_min": 125.0,
        "ideal_max": 200.0,
        "type": "lower_is_better",
        "category": "Lipid Profile"
    },
    "hdl_cholesterol": {
        "canonical_name": "HDL Cholesterol",
        "aliases": ["hdl", "hdl cholesterol", "high density lipoprotein", "hdl-c", "serum hdl"],
        "unit": "mg/dL",
        "standard_range": "> 40.0",
        "ideal_min": 40.0,
        "ideal_max": 60.0,
        "type": "higher_is_better",
        "category": "Lipid Profile"
    },
    "ldl_cholesterol": {
        "canonical_name": "LDL Cholesterol",
        "aliases": ["ldl", "ldl cholesterol", "low density lipoprotein", "ldl-c", "serum ldl"],
        "unit": "mg/dL",
        "standard_range": "< 100.0",
        "ideal_min": 50.0,
        "ideal_max": 100.0,
        "type": "lower_is_better",
        "category": "Lipid Profile"
    },
    "triglycerides": {
        "canonical_name": "Triglycerides",
        "aliases": ["triglycerides", "serum triglycerides", "tg", "trigs"],
        "unit": "mg/dL",
        "standard_range": "< 150.0",
        "ideal_min": 50.0,
        "ideal_max": 150.0,
        "type": "lower_is_better",
        "category": "Lipid Profile"
    },
    "vldl_cholesterol": {
        "canonical_name": "VLDL Cholesterol",
        "aliases": ["vldl", "vldl cholesterol", "very low density lipoprotein", "vldl-c"],
        "unit": "mg/dL",
        "standard_range": "< 30.0",
        "ideal_min": 5.0,
        "ideal_max": 30.0,
        "type": "lower_is_better",
        "category": "Lipid Profile"
    },

    # Inflammatory & Cardiac Markers
    "hs_crp": {
        "canonical_name": "hs-CRP",
        "aliases": ["hscrp", "hs-crp", "high sensitivity crp", "high-sensitivity c-reactive protein", "c-reactive protein (hs)"],
        "unit": "mg/L",
        "standard_range": "< 1.0",
        "ideal_min": 0.0,
        "ideal_max": 1.0,
        "type": "lower_is_better",
        "category": "Cardiac & Inflammation"
    },
    "crp": {
        "canonical_name": "C-Reactive Protein",
        "aliases": ["crp", "c-reactive protein", "c reactive protein"],
        "unit": "mg/L",
        "standard_range": "< 5.0",
        "ideal_min": 0.0,
        "ideal_max": 5.0,
        "type": "lower_is_better",
        "category": "Cardiac & Inflammation"
    },
    "homocysteine": {
        "canonical_name": "Homocysteine",
        "aliases": ["homocysteine", "serum homocysteine", "total homocysteine", "hcy"],
        "unit": "μmol/L",
        "standard_range": "< 15.0",
        "ideal_min": 5.0,
        "ideal_max": 15.0,
        "type": "lower_is_better",
        "category": "Cardiovascular"
    },

    # Renal & Metabolic Function
    "serum_creatinine": {
        "canonical_name": "Serum Creatinine",
        "aliases": ["creatinine", "serum creatinine", "creat", "s.creatinine"],
        "unit": "mg/dL",
        "standard_range": "0.7 - 1.3",
        "ideal_min": 0.7,
        "ideal_max": 1.3,
        "type": "lower_is_better",
        "category": "Renal Function"
    },
    "blood_urea": {
        "canonical_name": "Blood Urea",
        "aliases": ["urea", "blood urea", "serum urea"],
        "unit": "mg/dL",
        "standard_range": "15.0 - 45.0",
        "ideal_min": 15.0,
        "ideal_max": 45.0,
        "type": "lower_is_better",
        "category": "Renal Function"
    },
    "bun": {
        "canonical_name": "Blood Urea Nitrogen (BUN)",
        "aliases": ["bun", "blood urea nitrogen"],
        "unit": "mg/dL",
        "standard_range": "7.0 - 20.0",
        "ideal_min": 7.0,
        "ideal_max": 20.0,
        "type": "lower_is_better",
        "category": "Renal Function"
    },
<<<<<<< HEAD
    "total_cholesterol": {
        "canonical_name": "Total Cholesterol",
        "aliases": ["total cholesterol", "cholesterol total", "serum cholesterol", "cholesterol"],
        "unit": "mg/dL",
        "standard_range": "< 200.0",
        "ideal_min": 120.0,
        "ideal_max": 200.0,
        "type": "lower_is_better",
        "category": "Lipid Profile"
    },
    "vldl_cholesterol": {
        "canonical_name": "VLDL Cholesterol",
        "aliases": ["vldl", "vldl cholesterol", "very low density lipoprotein"],
        "unit": "mg/dL",
        "standard_range": "< 30.0",
        "ideal_min": 5.0,
        "ideal_max": 30.0,
        "type": "lower_is_better",
        "category": "Lipid Profile"
    },
    "hba1c": {
        "canonical_name": "HbA1c",
        "aliases": ["hba1c", "glycated hemoglobin", "glycosylated hemoglobin", "a1c", "hb a1c"],
        "unit": "%",
        "standard_range": "< 5.7",
        "ideal_min": 4.0,
        "ideal_max": 5.6,
        "type": "lower_is_better",
        "category": "Glycemic Control"
    },
    "fasting_blood_sugar": {
        "canonical_name": "Fasting Blood Sugar",
        "aliases": ["fbs", "fasting blood glucose", "fasting sugar", "fbg", "fasting plasma glucose", "fasting glucose"],
        "unit": "mg/dL",
        "standard_range": "70.0 - 99.0",
        "ideal_min": 70.0,
        "ideal_max": 99.0,
=======
    "uric_acid": {
        "canonical_name": "Uric Acid",
        "aliases": ["uric acid", "serum uric acid", "s.uric acid"],
        "unit": "mg/dL",
        "standard_range": "3.5 - 7.2",
        "ideal_min": 3.5,
        "ideal_max": 7.2,
        "type": "lower_is_better",
        "category": "Renal & Metabolic"
    },
    "egfr": {
        "canonical_name": "eGFR",
        "aliases": ["egfr", "estimated gfr", "glomerular filtration rate", "egfr (ckd-epi)"],
        "unit": "mL/min",
        "standard_range": "> 90.0",
        "ideal_min": 90.0,
        "ideal_max": 120.0,
        "type": "higher_is_better",
        "category": "Renal Function"
    },

    # Complete Blood Count (CBC) & Hematology
    "hemoglobin": {
        "canonical_name": "Hemoglobin",
        "aliases": ["hemoglobin", "haemoglobin", "hb", "hgb"],
        "unit": "g/dL",
        "standard_range": "12.0 - 17.5",
        "ideal_min": 12.0,
        "ideal_max": 17.5,
>>>>>>> origin/main
        "type": "range_bounded",
        "category": "Complete Blood Count"
    },
<<<<<<< HEAD
    "random_blood_sugar": {
        "canonical_name": "Random Blood Sugar",
        "aliases": ["rbs", "random blood glucose", "random sugar", "random plasma glucose", "random glucose"],
        "unit": "mg/dL",
        "standard_range": "< 140.0",
        "ideal_min": 70.0,
        "ideal_max": 140.0,
        "type": "range_bounded",
        "category": "Glycemic Control"
    },
    "postprandial_blood_sugar": {
        "canonical_name": "Postprandial Blood Sugar",
        "aliases": ["ppbs", "postprandial blood glucose", "postprandial sugar", "pp glucose", "post meal glucose", "2h postprandial", "postprandial glucose"],
        "unit": "mg/dL",
        "standard_range": "< 140.0",
        "ideal_min": 70.0,
        "ideal_max": 140.0,
        "type": "range_bounded",
        "category": "Glycemic Control"
    },
    "oral_glucose_tolerance_test": {
        "canonical_name": "Oral Glucose Tolerance Test",
        "aliases": ["ogtt", "oral glucose tolerance", "glucose tolerance test"],
        "unit": "mg/dL",
        "standard_range": "< 140.0",
        "ideal_min": 70.0,
        "ideal_max": 140.0,
        "type": "range_bounded",
        "category": "Glycemic Control"
    },
    "serum_creatinine": {
        "canonical_name": "Serum Creatinine",
        "aliases": ["creatinine", "serum creatinine", "creat"],
        "unit": "mg/dL",
        "standard_range": "0.7 - 1.3",
        "ideal_min": 0.7,
        "ideal_max": 1.3,
        "type": "lower_is_better",
        "category": "Renal Function"
    },
    "blood_urea_nitrogen": {
        "canonical_name": "Blood Urea Nitrogen",
        "aliases": ["bun", "blood urea nitrogen", "serum bun", "urea"],
        "unit": "mg/dL",
        "standard_range": "7.0 - 20.0",
        "ideal_min": 7.0,
        "ideal_max": 20.0,
        "type": "range_bounded",
        "category": "Renal Function"
    },
    "urea": {
        "canonical_name": "Urea",
        "aliases": ["urea", "serum urea", "blood urea"],
        "unit": "mg/dL",
        "standard_range": "15.0 - 45.0",
        "ideal_min": 15.0,
        "ideal_max": 45.0,
        "type": "range_bounded",
        "category": "Renal Function"
    },
    "uric_acid": {
        "canonical_name": "Uric Acid",
        "aliases": ["uric acid", "serum uric acid"],
        "unit": "mg/dL",
        "standard_range": "3.5 - 7.2",
        "ideal_min": 3.5,
        "ideal_max": 7.2,
=======
    "total_wbc": {
        "canonical_name": "Total WBC Count",
        "aliases": ["wbc", "total wbc", "wbc count", "total leukocyte count", "tlc", "white blood cells"],
        "unit": "cells/μL",
        "standard_range": "4000 - 11000",
        "ideal_min": 4000.0,
        "ideal_max": 11000.0,
        "type": "range_bounded",
        "category": "Complete Blood Count"
    },
    "rbc_count": {
        "canonical_name": "RBC Count",
        "aliases": ["rbc", "total rbc", "rbc count", "red blood cell count", "erythrocyte count"],
        "unit": "10^6/μL",
        "standard_range": "4.5 - 5.9",
        "ideal_min": 4.5,
        "ideal_max": 5.9,
        "type": "range_bounded",
        "category": "Complete Blood Count"
    },
    "platelet_count": {
        "canonical_name": "Platelet Count",
        "aliases": ["platelet count", "platelets", "plt", "total platelet count"],
        "unit": "10^3/μL",
        "standard_range": "150 - 450",
        "ideal_min": 150.0,
        "ideal_max": 450.0,
        "type": "range_bounded",
        "category": "Complete Blood Count"
    },
    "hematocrit_pcv": {
        "canonical_name": "Packed Cell Volume (PCV)",
        "aliases": ["pcv", "hematocrit", "hct", "packed cell volume"],
        "unit": "%",
        "standard_range": "36.0 - 50.0",
        "ideal_min": 36.0,
        "ideal_max": 50.0,
        "type": "range_bounded",
        "category": "Complete Blood Count"
    },
    "mcv": {
        "canonical_name": "MCV",
        "aliases": ["mcv", "mean corpuscular volume"],
        "unit": "fL",
        "standard_range": "80.0 - 100.0",
        "ideal_min": 80.0,
        "ideal_max": 100.0,
        "type": "range_bounded",
        "category": "Complete Blood Count"
    },
    "mch": {
        "canonical_name": "MCH",
        "aliases": ["mch", "mean corpuscular hemoglobin"],
        "unit": "pg",
        "standard_range": "27.0 - 33.0",
        "ideal_min": 27.0,
        "ideal_max": 33.0,
        "type": "range_bounded",
        "category": "Complete Blood Count"
    },
    "mchc": {
        "canonical_name": "MCHC",
        "aliases": ["mchc", "mean corpuscular hemoglobin concentration"],
        "unit": "g/dL",
        "standard_range": "32.0 - 36.0",
        "ideal_min": 32.0,
        "ideal_max": 36.0,
        "type": "range_bounded",
        "category": "Complete Blood Count"
    },
    "rdw": {
        "canonical_name": "RDW",
        "aliases": ["rdw", "red cell distribution width", "rdw-cv"],
        "unit": "%",
        "standard_range": "11.5 - 15.0",
        "ideal_min": 11.5,
        "ideal_max": 15.0,
        "type": "range_bounded",
        "category": "Complete Blood Count"
    },
    "esr": {
        "canonical_name": "ESR",
        "aliases": ["esr", "erythrocyte sedimentation rate"],
        "unit": "mm/hr",
        "standard_range": "< 20.0",
        "ideal_min": 0.0,
        "ideal_max": 20.0,
>>>>>>> origin/main
        "type": "lower_is_better",
        "category": "Complete Blood Count"
    },

    # Hepatic / Liver Function (LFT)
    "total_bilirubin": {
        "canonical_name": "Bilirubin (Total)",
        "aliases": ["total bilirubin", "bilirubin total", "serum bilirubin total", "s.bilirubin total"],
        "unit": "mg/dL",
        "standard_range": "0.2 - 1.2",
        "ideal_min": 0.2,
        "ideal_max": 1.2,
        "type": "lower_is_better",
        "category": "Liver Function"
    },
    "direct_bilirubin": {
        "canonical_name": "Bilirubin (Direct)",
        "aliases": ["direct bilirubin", "conjugated bilirubin", "bilirubin direct"],
        "unit": "mg/dL",
        "standard_range": "< 0.3",
        "ideal_min": 0.0,
        "ideal_max": 0.3,
        "type": "lower_is_better",
        "category": "Liver Function"
    },
    "egfr": {
        "canonical_name": "eGFR",
        "aliases": ["egfr", "estimated gfr", "glomerular filtration rate", "egfr (ckd-epi)"],
        "unit": "mL/min",
        "standard_range": "> 90.0",
        "ideal_min": 90.0,
        "ideal_max": 120.0,
        "type": "higher_is_better",
        "category": "Renal Function"
    },
    "sgot_ast": {
        "canonical_name": "SGOT / AST",
        "aliases": ["sgot", "ast", "aspartate aminotransferase", "aspartate transaminase", "sgot/ast"],
        "unit": "U/L",
        "standard_range": "< 40.0",
        "ideal_min": 10.0,
        "ideal_max": 40.0,
        "type": "lower_is_better",
        "category": "Liver Function"
    },
    "sgpt_alt": {
        "canonical_name": "SGPT / ALT",
        "aliases": ["sgpt", "alt", "alanine aminotransferase", "alanine transaminase", "sgpt/alt"],
        "unit": "U/L",
        "standard_range": "< 45.0",
        "ideal_min": 10.0,
        "ideal_max": 45.0,
        "type": "lower_is_better",
        "category": "Liver Function"
    },
    "alkaline_phosphatase": {
<<<<<<< HEAD
        "canonical_name": "Alkaline Phosphatase",
        "aliases": ["alp", "alkaline phosphatase", "alkaline phs"],
        "unit": "U/L",
        "standard_range": "30.0 - 120.0",
        "ideal_min": 30.0,
        "ideal_max": 120.0,
        "type": "range_bounded",
        "category": "Liver Function"
    },
    "bilirubin_total": {
        "canonical_name": "Total Bilirubin",
        "aliases": ["bilirubin", "total bilirubin", "serum bilirubin", "t bili", "tbili"],
        "unit": "mg/dL",
        "standard_range": "0.2 - 1.2",
        "ideal_min": 0.2,
        "ideal_max": 1.2,
        "type": "range_bounded",
        "category": "Liver Function"
    },
    "bilirubin_direct": {
        "canonical_name": "Direct Bilirubin",
        "aliases": ["direct bilirubin", "conjugated bilirubin", "dbil", "direct bili"],
        "unit": "mg/dL",
        "standard_range": "< 0.3",
        "ideal_min": 0.0,
        "ideal_max": 0.3,
        "type": "lower_is_better",
        "category": "Liver Function"
    },
    "total_protein": {
        "canonical_name": "Total Protein",
        "aliases": ["total protein", "serum protein"],
=======
        "canonical_name": "Alkaline Phosphatase (ALP)",
        "aliases": ["alp", "alkaline phosphatase", "alk phos"],
        "unit": "U/L",
        "standard_range": "44.0 - 147.0",
        "ideal_min": 44.0,
        "ideal_max": 147.0,
        "type": "range_bounded",
        "category": "Liver Function"
    },
    "total_protein": {
        "canonical_name": "Total Protein",
        "aliases": ["total protein", "serum total protein", "protein total"],
>>>>>>> origin/main
        "unit": "g/dL",
        "standard_range": "6.0 - 8.3",
        "ideal_min": 6.0,
        "ideal_max": 8.3,
        "type": "range_bounded",
        "category": "Liver Function"
    },
<<<<<<< HEAD
    "albumin": {
        "canonical_name": "Albumin",
        "aliases": ["albumin", "serum albumin", "alb"],
        "unit": "g/dL",
        "standard_range": "3.5 - 5.0",
        "ideal_min": 3.5,
        "ideal_max": 5.0,
        "type": "range_bounded",
        "category": "Liver Function"
    },
    "globulin": {
        "canonical_name": "Globulin",
=======
    "serum_albumin": {
        "canonical_name": "Serum Albumin",
        "aliases": ["albumin", "serum albumin", "s.albumin"],
        "unit": "g/dL",
        "standard_range": "3.5 - 5.5",
        "ideal_min": 3.5,
        "ideal_max": 5.5,
        "type": "range_bounded",
        "category": "Liver Function"
    },
    "serum_globulin": {
        "canonical_name": "Serum Globulin",
>>>>>>> origin/main
        "aliases": ["globulin", "serum globulin"],
        "unit": "g/dL",
        "standard_range": "2.0 - 3.5",
        "ideal_min": 2.0,
        "ideal_max": 3.5,
        "type": "range_bounded",
        "category": "Liver Function"
    },
<<<<<<< HEAD
    "hemoglobin": {
        "canonical_name": "Hemoglobin",
        "aliases": ["hemoglobin", "hb", "hgb", "hb (hemoglobin)"],
        "unit": "g/dL",
        "standard_range": "12.0 - 16.0",
        "ideal_min": 12.0,
        "ideal_max": 16.0,
        "type": "range_bounded",
        "category": "Hematology"
    },
    "wbc": {
        "canonical_name": "White Blood Cell Count",
        "aliases": ["wbc", "white blood cell", "white blood count", "leukocyte", "total leukocyte count", "tlc"],
        "unit": "cells/μL",
        "standard_range": "4000 - 11000",
        "ideal_min": 4000.0,
        "ideal_max": 11000.0,
        "type": "range_bounded",
        "category": "Hematology"
    },
    "rbc": {
        "canonical_name": "Red Blood Cell Count",
        "aliases": ["rbc", "red blood cell", "red blood count", "erythrocyte"],
        "unit": "cells/μL",
        "standard_range": "4.0 - 5.5",
        "ideal_min": 4.0,
        "ideal_max": 5.5,
        "type": "range_bounded",
        "category": "Hematology"
    },
    "platelet_count": {
        "canonical_name": "Platelet Count",
        "aliases": ["platelet", "platelet count", "thrombocyte", "plt"],
        "unit": "cells/μL",
        "standard_range": "150000 - 450000",
        "ideal_min": 150000.0,
        "ideal_max": 450000.0,
        "type": "range_bounded",
        "category": "Hematology"
    },
    "esr": {
        "canonical_name": "Erythrocyte Sedimentation Rate",
        "aliases": ["esr", "erythrocyte sedimentation rate", "sed rate"],
        "unit": "mm/hr",
        "standard_range": "< 20.0",
        "ideal_min": 0.0,
        "ideal_max": 20.0,
        "type": "lower_is_better",
        "category": "Hematology"
    },
    "pcv": {
        "canonical_name": "Packed Cell Volume",
        "aliases": ["pcv", "packed cell volume", "hematocrit", "hct"],
        "unit": "%",
        "standard_range": "40.0 - 50.0",
        "ideal_min": 40.0,
        "ideal_max": 50.0,
        "type": "range_bounded",
        "category": "Hematology"
    },
    "mcv": {
        "canonical_name": "Mean Corpuscular Volume",
        "aliases": ["mcv", "mean corpuscular volume"],
        "unit": "fL",
        "standard_range": "80.0 - 100.0",
        "ideal_min": 80.0,
        "ideal_max": 100.0,
        "type": "range_bounded",
        "category": "Hematology"
    },
    "mch": {
        "canonical_name": "Mean Corpuscular Hemoglobin",
        "aliases": ["mch", "mean corpuscular hemoglobin"],
        "unit": "pg",
        "standard_range": "27.0 - 31.0",
        "ideal_min": 27.0,
        "ideal_max": 31.0,
        "type": "range_bounded",
        "category": "Hematology"
    },
    "mchc": {
        "canonical_name": "Mean Corpuscular Hemoglobin Concentration",
        "aliases": ["mchc", "mean corpuscular hemoglobin concentration"],
        "unit": "g/dL",
        "standard_range": "32.0 - 36.0",
        "ideal_min": 32.0,
        "ideal_max": 36.0,
        "type": "range_bounded",
        "category": "Hematology"
    },
    "rdw": {
        "canonical_name": "Red Cell Distribution Width",
        "aliases": ["rdw", "red cell distribution width"],
        "unit": "%",
        "standard_range": "11.0 - 14.5",
        "ideal_min": 11.0,
        "ideal_max": 14.5,
        "type": "range_bounded",
        "category": "Hematology"
    },
    "tsh": {
        "canonical_name": "TSH",
        "aliases": ["tsh", "thyroid stimulating hormone", "thyrotropin", "serum tsh"],
        "unit": "μIU/mL",
        "standard_range": "0.4 - 4.0",
        "ideal_min": 0.4,
        "ideal_max": 4.0,
        "type": "range_bounded",
        "category": "Thyroid Function"
    },
    "t3": {
        "canonical_name": "T3",
        "aliases": ["t3", "triiodothyronine", "total t3", "serum t3"],
=======

    # Thyroid Function Tests
    "tsh": {
        "canonical_name": "TSH",
        "aliases": ["tsh", "thyroid stimulating hormone", "ultrasensitive tsh"],
        "unit": "μIU/mL",
        "standard_range": "0.45 - 4.5",
        "ideal_min": 0.45,
        "ideal_max": 4.5,
        "type": "range_bounded",
        "category": "Thyroid Profile"
    },
    "total_t3": {
        "canonical_name": "Total T3",
        "aliases": ["t3", "total t3", "triiodothyronine"],
>>>>>>> origin/main
        "unit": "ng/dL",
        "standard_range": "80.0 - 200.0",
        "ideal_min": 80.0,
        "ideal_max": 200.0,
        "type": "range_bounded",
<<<<<<< HEAD
        "category": "Thyroid Function"
    },
    "t4": {
        "canonical_name": "T4",
        "aliases": ["t4", "thyroxine", "total t4", "serum t4"],
=======
        "category": "Thyroid Profile"
    },
    "total_t4": {
        "canonical_name": "Total T4",
        "aliases": ["t4", "total t4", "thyroxine"],
>>>>>>> origin/main
        "unit": "μg/dL",
        "standard_range": "5.0 - 12.0",
        "ideal_min": 5.0,
        "ideal_max": 12.0,
        "type": "range_bounded",
<<<<<<< HEAD
        "category": "Thyroid Function"
    },
    "free_t3": {
        "canonical_name": "Free T3",
        "aliases": ["free t3", "ft3", "free triiodothyronine"],
=======
        "category": "Thyroid Profile"
    },
    "free_t3": {
        "canonical_name": "Free T3",
        "aliases": ["ft3", "free t3"],
>>>>>>> origin/main
        "unit": "pg/mL",
        "standard_range": "2.0 - 4.4",
        "ideal_min": 2.0,
        "ideal_max": 4.4,
        "type": "range_bounded",
<<<<<<< HEAD
        "category": "Thyroid Function"
    },
    "free_t4": {
        "canonical_name": "Free T4",
        "aliases": ["free t4", "ft4", "free thyroxine"],
=======
        "category": "Thyroid Profile"
    },
    "free_t4": {
        "canonical_name": "Free T4",
        "aliases": ["ft4", "free t4"],
>>>>>>> origin/main
        "unit": "ng/dL",
        "standard_range": "0.8 - 1.8",
        "ideal_min": 0.8,
        "ideal_max": 1.8,
        "type": "range_bounded",
<<<<<<< HEAD
        "category": "Thyroid Function"
    },
    "sodium": {
        "canonical_name": "Sodium",
        "aliases": ["sodium", "serum sodium", "na+", "na"],
        "unit": "mEq/L",
        "standard_range": "135.0 - 145.0",
        "ideal_min": 135.0,
        "ideal_max": 145.0,
        "type": "range_bounded",
        "category": "Electrolytes"
    },
    "potassium": {
        "canonical_name": "Potassium",
        "aliases": ["potassium", "serum potassium", "k+", "k"],
        "unit": "mEq/L",
        "standard_range": "3.5 - 5.0",
        "ideal_min": 3.5,
        "ideal_max": 5.0,
        "type": "range_bounded",
        "category": "Electrolytes"
    },
    "chloride": {
        "canonical_name": "Chloride",
        "aliases": ["chloride", "serum chloride", "cl-", "cl"],
        "unit": "mEq/L",
        "standard_range": "98.0 - 106.0",
        "ideal_min": 98.0,
        "ideal_max": 106.0,
        "type": "range_bounded",
        "category": "Electrolytes"
    },
    "calcium": {
        "canonical_name": "Calcium",
        "aliases": ["calcium", "serum calcium", "ca++", "ca"],
        "unit": "mg/dL",
        "standard_range": "8.0 - 10.5",
        "ideal_min": 8.0,
        "ideal_max": 10.5,
        "type": "range_bounded",
        "category": "Vitamins & Minerals"
    },
    "vitamin_d": {
        "canonical_name": "Vitamin D",
        "aliases": ["vitamin d", "25-hydroxy vitamin d", "vit d", "25-oh vitamin d", "cholecalciferol", "25-ohd"],
=======
        "category": "Thyroid Profile"
    },

    # Serum Electrolytes
    "serum_sodium": {
        "canonical_name": "Serum Sodium",
        "aliases": ["sodium", "serum sodium", "na+", "s.sodium"],
        "unit": "mEq/L",
        "standard_range": "136.0 - 145.0",
        "ideal_min": 136.0,
        "ideal_max": 145.0,
        "type": "range_bounded",
        "category": "Serum Electrolytes"
    },
    "serum_potassium": {
        "canonical_name": "Serum Potassium",
        "aliases": ["potassium", "serum potassium", "k+", "s.potassium"],
        "unit": "mEq/L",
        "standard_range": "3.5 - 5.1",
        "ideal_min": 3.5,
        "ideal_max": 5.1,
        "type": "range_bounded",
        "category": "Serum Electrolytes"
    },
    "serum_chloride": {
        "canonical_name": "Serum Chloride",
        "aliases": ["chloride", "serum chloride", "cl-", "s.chloride"],
        "unit": "mEq/L",
        "standard_range": "96.0 - 106.0",
        "ideal_min": 96.0,
        "ideal_max": 106.0,
        "type": "range_bounded",
        "category": "Serum Electrolytes"
    },
    "serum_calcium": {
        "canonical_name": "Serum Calcium",
        "aliases": ["calcium", "serum calcium", "ca++", "s.calcium"],
        "unit": "mg/dL",
        "standard_range": "8.5 - 10.5",
        "ideal_min": 8.5,
        "ideal_max": 10.5,
        "type": "range_bounded",
        "category": "Serum Electrolytes"
    },

    # Vitamins & Essential Minerals
    "vitamin_d": {
        "canonical_name": "Vitamin D",
        "aliases": ["vitamin d", "25-hydroxy vitamin d", "vit d", "25-oh vitamin d", "cholecalciferol"],
>>>>>>> origin/main
        "unit": "ng/mL",
        "standard_range": "30.0 - 100.0",
        "ideal_min": 30.0,
        "ideal_max": 100.0,
        "type": "higher_is_better",
        "category": "Vitamins & Minerals"
    },
    "vitamin_b12": {
        "canonical_name": "Vitamin B12",
<<<<<<< HEAD
        "aliases": ["vitamin b12", "b12", "cobalamin", "serum b12"],
=======
        "aliases": ["vitamin b12", "b12", "cyanocobalamin", "vit b12"],
>>>>>>> origin/main
        "unit": "pg/mL",
        "standard_range": "200.0 - 900.0",
        "ideal_min": 200.0,
        "ideal_max": 900.0,
<<<<<<< HEAD
        "type": "range_bounded",
        "category": "Vitamins & Minerals"
    },
    "iron": {
        "canonical_name": "Serum Iron",
        "aliases": ["iron", "serum iron", "fe", "serum fe"],
=======
        "type": "higher_is_better",
        "category": "Vitamins & Minerals"
    },
    "serum_iron": {
        "canonical_name": "Serum Iron",
        "aliases": ["serum iron", "iron", "s.iron"],
>>>>>>> origin/main
        "unit": "μg/dL",
        "standard_range": "60.0 - 170.0",
        "ideal_min": 60.0,
        "ideal_max": 170.0,
        "type": "range_bounded",
<<<<<<< HEAD
        "category": "Vitamins & Minerals"
    },
    "ferritin": {
        "canonical_name": "Ferritin",
        "aliases": ["ferritin", "serum ferritin"],
        "unit": "ng/mL",
        "standard_range": "10.0 - 250.0",
        "ideal_min": 10.0,
        "ideal_max": 250.0,
        "type": "range_bounded",
        "category": "Vitamins & Minerals"
    },
    "troponin": {
        "canonical_name": "Troponin",
        "aliases": ["troponin", "troponin i", "troponin t", "hs troponin", "c-tn i"],
        "unit": "ng/mL",
        "standard_range": "< 0.04",
        "ideal_min": 0.0,
        "ideal_max": 0.04,
        "type": "lower_is_better",
        "category": "Cardiac"
    },
    "d_dimer": {
        "canonical_name": "D-Dimer",
        "aliases": ["d-dimer", "ddimer", "d dimer"],
        "unit": "μg/mL",
        "standard_range": "< 0.5",
        "ideal_min": 0.0,
        "ideal_max": 0.5,
        "type": "lower_is_better",
        "category": "Hematology"
    },
    "cpk": {
        "canonical_name": "Creatine Phosphokinase",
        "aliases": ["cpk", "creatine kinase", "ck", "creatine phosphokinase"],
        "unit": "U/L",
        "standard_range": "20.0 - 200.0",
        "ideal_min": 20.0,
        "ideal_max": 200.0,
        "type": "range_bounded",
        "category": "Cardiac & Muscular"
    },
    "cpk_mb": {
        "canonical_name": "CK-MB",
        "aliases": ["ck-mb", "cpk-mb", "mb fraction", "ck mb"],
        "unit": "ng/mL",
        "standard_range": "< 5.0",
        "ideal_min": 0.0,
        "ideal_max": 5.0,
        "type": "lower_is_better",
        "category": "Cardiac"
    },
    "ldh": {
        "canonical_name": "Lactate Dehydrogenase",
        "aliases": ["ldh", "lactate dehydrogenase"],
        "unit": "U/L",
        "standard_range": "100.0 - 200.0",
        "ideal_min": 100.0,
        "ideal_max": 200.0,
        "type": "range_bounded",
        "category": "General"
    },
    "prothrombin_time": {
        "canonical_name": "Prothrombin Time",
        "aliases": ["pt", "prothrombin time", "inr"],
        "unit": "seconds",
        "standard_range": "11.0 - 13.5",
        "ideal_min": 11.0,
        "ideal_max": 13.5,
        "type": "range_bounded",
        "category": "Hematology"
    },
}


def normalize_parameter_name(raw_name: str) -> Tuple[str, str, Dict[str, Any]]:
    """
    Maps a raw parameter string to its canonical representation.
    Uses scoring by alias length to avoid misclassification.
    """
    cleaned = raw_name.strip().lower()
    if not cleaned:
        return "unknown_param", raw_name.strip(), {
            "canonical_name": raw_name.strip(),
            "unit": "",
            "standard_range": "Ref Range",
            "type": "range_bounded",
            "category": "General"
        }

    # First pass: exact match
=======
        "category": "Iron Profile"
    },
    "serum_ferritin": {
        "canonical_name": "Serum Ferritin",
        "aliases": ["ferritin", "serum ferritin", "s.ferritin"],
        "unit": "ng/mL",
        "standard_range": "24.0 - 336.0",
        "ideal_min": 24.0,
        "ideal_max": 336.0,
        "type": "range_bounded",
        "category": "Iron Profile"
    }
}

# Strict blacklist of words/tokens that must NEVER be extracted as medical parameters
METADATA_AND_DATE_BLACKLIST = {
    "date", "dated", "reporting date", "collection date", "report date",
    "received date", "print date", "registration date", "specimen date",
    "dob", "d.o.b", "d.o.b.", "birth date", "time", "sample time",
    "age", "sex", "gender", "patient", "patient name", "pt name",
    "doctor", "dr", "consultant", "referred by", "pathologist",
    "hospital", "clinic", "laboratory", "diagnostics", "lab",
    "phone", "mobile", "email", "address", "uhid", "mrn", "id",
    "barcode", "sample id", "specimen id", "barcode no", "token",
    "bill", "bill no", "invoice", "receipt", "gstin", "total amount",
    "page", "page no", "status", "test name", "investigation", "observed value",
    "biological reference", "ref range", "units", "method", "technology",
    "instrument", "analyzer", "signature", "verified by", "technician", "nabl"
}

def is_valid_parameter_name(raw_name: str) -> bool:
    """Checks whether a detected string is an actual clinical test rather than a date, metadata, or layout noise."""
    if not raw_name:
        return False
    name_clean = raw_name.strip().lower()

    # Reject if length is too short or too long
    if len(name_clean) < 2 or len(name_clean) > 50:
        return False

    # Reject if purely numeric or punctuation/date-like
    if re.match(r"^[\d\.\-\/\s]+$", name_clean):
        return False

    # Reject if containing date patterns like "12/05/2026", "12-05-2026", "12.05.2026", "2026-05-12"
    if re.search(r"\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b", name_clean):
        return False
    if re.search(r"\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b", name_clean):
        return False

    # Strip trailing/leading punctuation
    stripped_tokens = re.sub(r"[:\-–—\.]+$", "", name_clean).strip()
    if stripped_tokens in METADATA_AND_DATE_BLACKLIST:
        return False

    # Reject if starts with any blacklist item followed by colon, dash, or space
    for bl in METADATA_AND_DATE_BLACKLIST:
        if name_clean == bl or re.match(r"^" + re.escape(bl) + r"[\s:\-]", name_clean):
            return False
        if name_clean.endswith(f" {bl}"):
            return False

    # Reject phrases starting with "date of", "time of", "name of", "report of"
    if any(name_clean.startswith(prefix) for prefix in ["date of", "time of", "name of", "page ", "bill ", "report of"]):
        return False

    # Reject names ending in prepositions, conjunctions, or auxiliary verbs (sentence fragments)
    tokens = name_clean.split()
    if tokens and tokens[-1] in {
        "by", "of", "with", "for", "and", "in", "to", "at", "from", "on", "as",
        "than", "or", "is", "was", "are", "were", "has", "have", "had", "the", "a", "an"
    }:
        return False

    # Reject narrative clinical verbs and descriptors that indicate notes rather than lab tests
    narrative_words = {"restricted", "advised", "presented", "complaint", "complaints", "posture", "exercises", "strengthening", "cervical", "motion"}
    if any(nw in tokens for nw in narrative_words):
        return False

    return True

def normalize_unit(raw_unit: str) -> str:
    """Standardizes laboratory measurement units across differing laboratory conventions."""
    if not raw_unit:
        return ""
    u = raw_unit.strip().lower()
    u = re.sub(r"\s+", "", u)

    if u in ["mg/dl", "mg/100ml", "mg%", "mg/100cc", "milligrams/deciliter"]:
        return "mg/dL"
    if u in ["g/dl", "gm/dl", "g%", "grams/deciliter"]:
        return "g/dL"
    if u in ["%", "%hba1c", "percent", "percentage", "%totalhb"]:
        return "%"
    if u in ["u/l", "iu/l", "units/l", "u/litre"]:
        return "U/L"
    if u in ["miu/l", "μiu/ml", "uiu/ml", "miu/ml", "ui/l", "uiu/l"]:
        return "μIU/mL"
    if u in ["ng/ml", "ng/milliliter"]:
        return "ng/mL"
    if u in ["pg/ml", "pg/milliliter"]:
        return "pg/mL"
    if u in ["μg/dl", "ug/dl", "mcg/dl"]:
        return "μg/dL"
    if u in ["mmol/l", "millimoles/liter"]:
        return "mmol/L"
    if u in ["umol/l", "μmol/l", "micromoles/liter"]:
        return "μmol/L"
    if u in ["meq/l", "milliequivalents/liter"]:
        return "mEq/L"
    if u in ["cells/cumm", "cells/mcl", "/cumm", "/mcl", "percumm", "cells/mm3", "cells/μl"]:
        return "cells/μL"
    if u in ["10^3/ul", "x10^3/ul", "10^3/cumm", "k/ul", "thou/cumm", "10*3/ul"]:
        return "10^3/μL"
    if u in ["10^6/ul", "x10^6/ul", "10^6/cumm", "m/ul", "mil/cumm", "10*6/ul"]:
        return "10^6/μL"
    if u in ["fl", "femtoliters"]:
        return "fL"
    if u in ["pg", "picograms"]:
        return "pg"
    if u in ["mm/hr", "mm/1sthr", "mm/hour", "mm/hr(westergren)"]:
        return "mm/hr"
    if u in ["mg/l"]:
        return "mg/L"

    return raw_unit.strip()

def are_units_compatible(unit1: str, unit2: str, canonical_unit: str = "") -> Tuple[bool, str]:
    """
    Evaluates unit compatibility and returns (is_compatible, normalized_display_unit).
    Ensures that identical or compatible units (e.g. mg/dL vs mg/dL, % vs %) NEVER produce an incompatible error.
    """
    u1 = normalize_unit(unit1)
    u2 = normalize_unit(unit2)
    c_unit = normalize_unit(canonical_unit)

    # 1. Exact match after normalization
    if u1 and u2 and u1.lower() == u2.lower():
        return True, u2

    # 2. One unit is missing or empty; infer from the present unit or canonical config
    if not u1 and u2:
        return True, u2
    if u1 and not u2:
        return True, u1
    if not u1 and not u2:
        return True, c_unit

    # 3. Both match the canonical unit after cleaning
    if u1.lower() == c_unit.lower() and u2.lower() == c_unit.lower():
        return True, c_unit

    # 4. Genuinely different physical dimensions (e.g. % vs mg/dL, or seconds vs g/dL)
    return False, f"{unit1} vs {unit2}"

def parse_reference_range(ref_str: str) -> Tuple[Optional[float], Optional[float]]:
    """Extracts min and max bounds from a reference interval string like '70 - 100', '< 200', '> 40'."""
    if not ref_str:
        return None, None
    s = ref_str.strip()
    m_less = re.search(r"^[<≤]=?\s*([0-9]+\.?[0-9]*)", s)
    if m_less:
        return None, float(m_less.group(1))
    m_greater = re.search(r"^[>≥]=?\s*([0-9]+\.?[0-9]*)", s)
    if m_greater:
        return float(m_greater.group(1)), None
    m_range = re.search(r"([0-9]+\.?[0-9]*)\s*(?:-|–|—|to)\s*([0-9]+\.?[0-9]*)", s)
    if m_range:
        return float(m_range.group(1)), float(m_range.group(2))
    return None, None

def determine_parameter_status(val: float, cfg: Optional[Dict[str, Any]] = None, ref_range: str = "") -> str:
    """
    Computes clinical status (Normal, Elevated, Low, Optimal) using config bounds
    or by parsing the actual reported reference range from the document.
    """
    cfg = cfg or {}
    ideal_min = cfg.get("ideal_min")
    ideal_max = cfg.get("ideal_max")
    rule_type = cfg.get("type", "range_bounded")

    if ideal_min is None and ideal_max is None and ref_range:
        parsed_min, parsed_max = parse_reference_range(ref_range)
        if parsed_min is not None and parsed_max is not None:
            ideal_min, ideal_max = parsed_min, parsed_max
            rule_type = "range_bounded"
        elif parsed_max is not None:
            ideal_max = parsed_max
            rule_type = "lower_is_better"
        elif parsed_min is not None:
            ideal_min = parsed_min
            rule_type = "higher_is_better"

    if rule_type == "lower_is_better":
        if ideal_max is not None and val > ideal_max:
            return "Elevated"
        return "Optimal"
    elif rule_type == "higher_is_better":
        if ideal_min is not None and val < ideal_min:
            return "Low"
        return "Optimal"
    else:
        if ideal_min is not None and val < ideal_min:
            return "Low"
        elif ideal_max is not None and val > ideal_max:
            return "Elevated"
        return "Normal"

def infer_parameter_category(name: str) -> str:
    n = name.lower()
    if any(k in n for k in ["glucose", "sugar", "hba1c", "fbs", "ppbs", "rbs", "insulin"]):
        return "Glycemic Control"
    if any(k in n for k in ["cholesterol", "lipid", "triglyceride", "hdl", "ldl", "vldl"]):
        return "Lipid Profile"
    if any(k in n for k in ["hemoglobin", "wbc", "rbc", "platelet", "mcv", "mch", "mchc", "rdw", "pcv", "hematocrit", "esr", "cbc", "neutrophil", "lymphocyte", "monocyte", "eosinophil", "basophil"]):
        return "Complete Blood Count & Hematology"
    if any(k in n for k in ["creatinine", "urea", "bun", "uric acid", "egfr", "kidney", "renal"]):
        return "Renal Function"
    if any(k in n for k in ["bilirubin", "sgot", "sgpt", "ast", "alt", "alp", "phosphatase", "protein", "albumin", "globulin", "liver", "hepatic", "ggt"]):
        return "Liver Function"
    if any(k in n for k in ["tsh", "t3", "t4", "thyroid"]):
        return "Thyroid Function"
    if any(k in n for k in ["troponin", "ck-mb", "cpk", "bnp", "d-dimer", "cardiac"]):
        return "Cardiac Markers"
    if any(k in n for k in ["crp", "hs-crp", "inflammatory", "procalcitonin", "ferritin"]):
        return "Inflammatory & Acute Phase"
    if any(k in n for k in ["vitamin", "iron", "calcium", "electrolyte", "sodium", "potassium", "chloride", "magnesium", "phosphorus"]):
        return "Electrolytes & Micronutrients"
    if any(k in n for k in ["urine", "urinalysis"]):
        return "Urinalysis"
    return "Clinical Pathology"

def normalize_parameter_name(raw_name: str) -> Tuple[str, str, Dict[str, Any]]:
    """Maps a raw parameter string to its canonical clinical representation."""
    if not is_valid_parameter_name(raw_name):
        return "unknown_param", raw_name.strip(), {
            "canonical_name": raw_name.strip(),
            "unit": "",
            "standard_range": "",
            "type": "range_bounded",
            "category": "General"
        }

    cleaned = raw_name.strip().lower()
    cleaned_simplified = re.sub(r"[,\-_/()\[\]]", " ", cleaned).strip()

    # Priority 1: Exact key or exact canonical match
>>>>>>> origin/main
    for key, cfg in PARAMETER_CONFIGS.items():
        if cleaned == key or cleaned == cfg["canonical_name"].lower():
            return key, cfg["canonical_name"], cfg

    # Priority 2: Exact alias match
    for key, cfg in PARAMETER_CONFIGS.items():
        for alias in cfg["aliases"]:
<<<<<<< HEAD
            if cleaned == alias:
                return key, cfg["canonical_name"], cfg

    # Second pass: score by longest matching alias
    best_key = None
    best_score = 0
    best_cfg = None

    for key, cfg in PARAMETER_CONFIGS.items():
        for alias in cfg["aliases"]:
            if alias in cleaned:
                score = len(alias)
                if score > best_score:
                    best_score = score
                    best_key = key
                    best_cfg = cfg

    if best_key:
        return best_key, best_cfg["canonical_name"], best_cfg

    # Fallback to direct cleaned name
    canonical = raw_name.strip()
    return cleaned.replace(" ", "_"), canonical, {
=======
            if cleaned == alias or cleaned_simplified == alias:
                return key, cfg["canonical_name"], cfg

    # Priority 3: Word token boundary alias matching (to avoid false sub-word matching)
    for key, cfg in PARAMETER_CONFIGS.items():
        for alias in cfg["aliases"]:
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, cleaned):
                return key, cfg["canonical_name"], cfg

    # Fallback to direct cleaned name with dynamic clinical categorization
    canonical = " ".join(t.capitalize() if not t.isupper() else t for t in raw_name.strip().split())
    cat = infer_parameter_category(canonical)
    key_norm = re.sub(r"[^a-z0-9_]", "", cleaned.replace(" ", "_"))
    return key_norm, canonical, {
>>>>>>> origin/main
        "canonical_name": canonical,
        "unit": "",
        "standard_range": "Ref Range",
        "type": "range_bounded",
        "category": cat
    }


def calculate_numerical_comparison(
    param_before: ParameterData,
    param_after: ParameterData
) -> ParameterComparison:
    """
    Computes numerical delta, percentage change, and trajectory purely in backend code.
    Uses normalized unit comparison to avoid false incompatibility warnings.
    """
    _, canonical_name, cfg = normalize_parameter_name(param_before.parameterName)
<<<<<<< HEAD
    after_key, after_canonical, after_cfg = normalize_parameter_name(param_after.parameterName)

    # Check that both parameters are the same type (same canonical key)
    # Fasting glucose must NOT be compared against random glucose, etc.
    if after_key != normalize_parameter_name(param_before.parameterName)[0]:
=======

    # Check unit compatibility with normalized unit comparison
    is_compat, display_unit = are_units_compatible(
        param_before.unit,
        param_after.unit,
        cfg.get("unit", "")
    )

    if not is_compat:
>>>>>>> origin/main
        return ParameterComparison(
            name=canonical_name,
            canonicalName=canonical_name,
            unit=f"{param_before.unit} / {param_after.unit}",
            beforeValue=param_before.value,
            afterValue=param_after.value,
            baselineReportId=param_before.reportId,
            followUpReportId=param_after.reportId,
            baselineDate=param_before.reportDate,
            followUpDate=param_after.reportDate,
            absoluteChange=None,
            percentChange=None,
            trajectory="Not Comparable",
            status="Needs Monitoring",
            overallStatus="Needs Monitoring",
            referenceRange=param_after.referenceRange or cfg.get("standard_range", ""),
            sourcePages=[f"R:{param_before.reportId} p.{param_before.sourcePage}",
                         f"R:{param_after.reportId} p.{param_after.sourcePage}"],
            isComparable=False,
<<<<<<< HEAD
            clinicalNote=f"Different parameter types: '{param_before.parameterName}' vs '{param_after.parameterName}'"
        )

    # Check unit compatibility using normalized comparison
    unit_before = param_before.unit.strip().lower()
    unit_after = param_after.unit.strip().lower()

    if not units_are_compatible(unit_before, unit_after):
        return ParameterComparison(
            name=canonical_name,
            canonicalName=canonical_name,
            unit=param_after.unit,
            beforeValue=param_before.value,
            afterValue=param_after.value,
            baselineReportId=param_before.reportId,
            followUpReportId=param_after.reportId,
            baselineDate=param_before.reportDate,
            followUpDate=param_after.reportDate,
            absoluteChange=None,
            percentChange=None,
            trajectory="Not Comparable",
            status="Needs Monitoring",
            referenceRange=param_after.referenceRange or cfg.get("standard_range", ""),
            sourcePages=[f"R:{param_before.reportId} p.{param_before.sourcePage}",
                         f"R:{param_after.reportId} p.{param_after.sourcePage}"],
            isComparable=False,
            clinicalNote=f"Incompatible units: '{param_before.unit}' vs '{param_after.unit}'"
        )

    v_before = param_before.value
    v_after = param_after.value

    # Zero baseline handling
    if v_before == 0:
        abs_change = round(v_after - v_before, 2)
        pct_change = None
    else:
        abs_change = round(v_after - v_before, 2)
        pct_change = round(((v_after - v_before) / v_before) * 100.0, 1)
=======
            clinicalNote=f"Incompatible measurement units ({param_before.unit} vs {param_after.unit})"
        )

    v_before = param_before.value
    v_after = param_after.value

    # Compute deltas
    abs_change = round(v_after - v_before, 2)
    pct_change = round(((v_after - v_before) / v_before) * 100.0, 1) if v_before != 0 else None
>>>>>>> origin/main

    # Trajectory determination based on clinical rules
    rule_type = cfg.get("type", "range_bounded")
    ideal_min = cfg.get("ideal_min", 0.0)
    ideal_max = cfg.get("ideal_max", 100.0)

<<<<<<< HEAD
    trajectory = "Stable"
    status = "Stable"

=======
    # Absolute stability threshold: less than 1.5% delta
>>>>>>> origin/main
    if pct_change is not None and abs(pct_change) < 1.5:
        trajectory = "Stable"
        status = "Stable"
    elif rule_type == "lower_is_better":
        if abs_change < 0:
<<<<<<< HEAD
=======
            # Value decreased (beneficial for inflammatory / cholesterol / homocysteine / HbA1c)
>>>>>>> origin/main
            trajectory = "Improved"
            status = "Improved"
        else:
            if v_after > ideal_max:
                trajectory = "Worsened"
                status = "Worsened"
            else:
                trajectory = "Needs Monitoring"
                status = "Needs Monitoring"
    elif rule_type == "higher_is_better":
        if abs_change > 0:
            trajectory = "Improved"
            status = "Improved"
        else:
            if v_after < ideal_min:
                trajectory = "Worsened"
                status = "Worsened"
            else:
                trajectory = "Needs Monitoring"
                status = "Needs Monitoring"
    else:
<<<<<<< HEAD
=======
        # Range bounded (e.g. Glucose, Hemoglobin, Sodium, Potassium)
>>>>>>> origin/main
        if ideal_min <= v_after <= ideal_max:
            if ideal_min <= v_before <= ideal_max:
                trajectory = "Stable"
                status = "Stable"
            else:
                trajectory = "Improved"
                status = "Improved"
        else:
            if abs(v_after - ((ideal_min + ideal_max) / 2)) > abs(v_before - ((ideal_min + ideal_max) / 2)):
                trajectory = "Worsened"
                status = "Worsened"
            else:
                trajectory = "Needs Monitoring"
                status = "Needs Monitoring"

    return ParameterComparison(
        name=canonical_name,
        canonicalName=canonical_name,
        unit=display_unit or cfg.get("unit", ""),
        beforeValue=v_before,
        afterValue=v_after,
        baselineReportId=param_before.reportId,
        followUpReportId=param_after.reportId,
        baselineDate=param_before.reportDate,
        followUpDate=param_after.reportDate,
        absoluteChange=abs_change,
        percentChange=pct_change,
        trajectory=trajectory,
        status=status,
        overallStatus=status,
        referenceRange=param_after.referenceRange or cfg.get("standard_range", ""),
        sourcePages=[f"R:{param_before.reportId} p.{param_before.sourcePage}",
                     f"R:{param_after.reportId} p.{param_after.sourcePage}"],
        isComparable=True
    )
