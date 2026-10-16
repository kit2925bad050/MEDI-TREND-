import os
from typing import Dict, List, Optional
from ..models.schemas import PatientProfile, ReportRecord, ParameterData, AuditLogEntry
from ..services.pdf_extractor import generate_sample_hospital_pdf

class PatientDataStore:
    def __init__(self):
        self.patients: Dict[str, PatientProfile] = {}
        self.reports: Dict[str, Dict[str, ReportRecord]] = {} # patientId -> reportId -> ReportRecord
        self.audit_logs: List[AuditLogEntry] = []
        self._initialize_default_data()

    def _initialize_default_data(self):
        # Primary patient: S. Gurumurthy (PT-2026-001) matching user interface
        p1 = PatientProfile(
            patientId="PT-2026-001",
            name="S. Gurumurthy",
            age=62,
            gender="Male",
            phone="+91 98400 12345",
            activeStatus="Active",
            doctorInCharge="Dr. Arvind Kumar",
            specialty="Cardiologist",
            totalReports=5,
            firstReportDate="25 Apr 2026",
            latestReportDate="30 Jul 2026",
            bloodGroup="B+",
            avatarUrl=None
        )
        self.patients[p1.patientId] = p1
        self.reports[p1.patientId] = {}

        # 5 Chronological Reports for S. Gurumurthy
        # Report 1 (25 Apr 2026) - Apollo Diagnostics
        r1_params = [
            ParameterData(parameterName="hs-CRP", canonicalName="hs-CRP", value=3.94, unit="mg/L", referenceRange="< 1.0", status="High", reportId="R1", reportDate="25 Apr 2026", sourcePage=1, sourceText="High Sensitivity CRP: 3.94 mg/L", category="Cardiac & Inflammation"),
            ParameterData(parameterName="Homocysteine", canonicalName="Homocysteine", value=19.6, unit="μmol/L", referenceRange="< 15.0", status="High", reportId="R1", reportDate="25 Apr 2026", sourcePage=1, sourceText="Homocysteine: 19.6 μmol/L", category="Cardiovascular"),
            ParameterData(parameterName="HDL Cholesterol", canonicalName="HDL Cholesterol", value=43.0, unit="mg/dL", referenceRange="> 40.0", status="Optimal", reportId="R1", reportDate="25 Apr 2026", sourcePage=1, sourceText="HDL-C: 43.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="Triglycerides", canonicalName="Triglycerides", value=118.0, unit="mg/dL", referenceRange="< 150.0", status="Optimal", reportId="R1", reportDate="25 Apr 2026", sourcePage=1, sourceText="Triglycerides: 118.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="LDL Cholesterol", canonicalName="LDL Cholesterol", value=112.0, unit="mg/dL", referenceRange="< 100.0", status="Elevated", reportId="R1", reportDate="25 Apr 2026", sourcePage=1, sourceText="LDL-C: 112.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=4.9, unit="%", referenceRange="< 5.7", status="Normal", reportId="R1", reportDate="25 Apr 2026", sourcePage=2, sourceText="HbA1c: 4.9 %", category="Glycemic Control"),
            ParameterData(parameterName="Vitamin D", canonicalName="Vitamin D", value=24.5, unit="ng/mL", referenceRange="30.0 - 100.0", status="Low", reportId="R1", reportDate="25 Apr 2026", sourcePage=2, sourceText="25-OH Vitamin D: 24.5 ng/mL", category="Vitamins"),
            ParameterData(parameterName="eGFR", canonicalName="eGFR", value=82.0, unit="mL/min", referenceRange="> 90.0", status="Needs Monitoring", reportId="R1", reportDate="25 Apr 2026", sourcePage=2, sourceText="eGFR: 82.0 mL/min/1.73m2", category="Renal Function"),
            ParameterData(parameterName="Total Cholesterol", canonicalName="Total Cholesterol", value=198.0, unit="mg/dL", referenceRange="< 200.0", status="Normal", reportId="R1", reportDate="25 Apr 2026", sourcePage=1, sourceText="Total Cholesterol: 198 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="Serum Creatinine", canonicalName="Serum Creatinine", value=1.1, unit="mg/dL", referenceRange="0.7 - 1.3", status="Normal", reportId="R1", reportDate="25 Apr 2026", sourcePage=2, sourceText="Serum Creatinine: 1.1 mg/dL", category="Renal Function"),
            ParameterData(parameterName="Fasting Blood Sugar", canonicalName="Fasting Blood Sugar", value=92.0, unit="mg/dL", referenceRange="70.0 - 99.0", status="Normal", reportId="R1", reportDate="25 Apr 2026", sourcePage=1, sourceText="FBS: 92.0 mg/dL", category="Glycemic Control"),
            ParameterData(parameterName="Uric Acid", canonicalName="Uric Acid", value=5.8, unit="mg/dL", referenceRange="3.5 - 7.2", status="Normal", reportId="R1", reportDate="25 Apr 2026", sourcePage=2, sourceText="Uric Acid: 5.8 mg/dL", category="Renal Function"),
        ]
        
        pdf1_path = os.path.join("server", "sample_pdfs", "PT_2026_001_Report1_25Apr2026.pdf")
        generate_sample_hospital_pdf(
            pdf1_path, "Apollo Diagnostics", p1.patientId, p1.name, "R1-25APR", "25 Apr 2026",
            [{"name": p.parameterName, "value": p.value, "unit": p.unit, "ref": p.referenceRange, "flag": p.status if p.status in ["High", "Low", "Elevated"] else ""} for p in r1_params]
        )

        r1 = ReportRecord(
            reportId="Report 1",
            patientId=p1.patientId,
            reportDate="25 Apr 2026",
            uploadDate="25 Apr 2026, 10:30 AM",
            provider="Apollo Diagnostics",
            originalPdfPath=pdf1_path,
            extractedParameters=r1_params,
            extractionStatus="Verified",
            parameterCount=32,
            category="Comprehensive Cardiac & Lipid Panel"
        )
        self.reports[p1.patientId]["Report 1"] = r1

        # Report 2 (29 Apr 2026) - Apollo Diagnostics (After intervention)
        r2_params = [
            ParameterData(parameterName="hs-CRP", canonicalName="hs-CRP", value=0.29, unit="mg/L", referenceRange="< 1.0", status="Optimal", reportId="R2", reportDate="29 Apr 2026", sourcePage=1, sourceText="High Sensitivity CRP: 0.29 mg/L", category="Cardiac & Inflammation"),
            ParameterData(parameterName="Homocysteine", canonicalName="Homocysteine", value=10.9, unit="μmol/L", referenceRange="< 15.0", status="Optimal", reportId="R2", reportDate="29 Apr 2026", sourcePage=1, sourceText="Homocysteine: 10.9 μmol/L", category="Cardiovascular"),
            ParameterData(parameterName="HDL Cholesterol", canonicalName="HDL Cholesterol", value=55.7, unit="mg/dL", referenceRange="> 40.0", status="Optimal", reportId="R2", reportDate="29 Apr 2026", sourcePage=1, sourceText="HDL-C: 55.7 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="Triglycerides", canonicalName="Triglycerides", value=108.0, unit="mg/dL", referenceRange="< 150.0", status="Optimal", reportId="R2", reportDate="29 Apr 2026", sourcePage=1, sourceText="Triglycerides: 108.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="LDL Cholesterol", canonicalName="LDL Cholesterol", value=98.0, unit="mg/dL", referenceRange="< 100.0", status="Optimal", reportId="R2", reportDate="29 Apr 2026", sourcePage=1, sourceText="LDL-C: 98.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=4.9, unit="%", referenceRange="< 5.7", status="Normal", reportId="R2", reportDate="29 Apr 2026", sourcePage=2, sourceText="HbA1c: 4.9 %", category="Glycemic Control"),
            ParameterData(parameterName="Vitamin D", canonicalName="Vitamin D", value=28.1, unit="ng/mL", referenceRange="30.0 - 100.0", status="Borderline", reportId="R2", reportDate="29 Apr 2026", sourcePage=2, sourceText="25-OH Vitamin D: 28.1 ng/mL", category="Vitamins"),
            ParameterData(parameterName="eGFR", canonicalName="eGFR", value=86.0, unit="mL/min", referenceRange="> 90.0", status="Improved", reportId="R2", reportDate="29 Apr 2026", sourcePage=2, sourceText="eGFR: 86.0 mL/min/1.73m2", category="Renal Function"),
            ParameterData(parameterName="Total Cholesterol", canonicalName="Total Cholesterol", value=175.0, unit="mg/dL", referenceRange="< 200.0", status="Normal", reportId="R2", reportDate="29 Apr 2026", sourcePage=1, sourceText="Total Cholesterol: 175 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="Serum Creatinine", canonicalName="Serum Creatinine", value=1.0, unit="mg/dL", referenceRange="0.7 - 1.3", status="Normal", reportId="R2", reportDate="29 Apr 2026", sourcePage=2, sourceText="Serum Creatinine: 1.0 mg/dL", category="Renal Function"),
            ParameterData(parameterName="Fasting Blood Sugar", canonicalName="Fasting Blood Sugar", value=90.0, unit="mg/dL", referenceRange="70.0 - 99.0", status="Normal", reportId="R2", reportDate="29 Apr 2026", sourcePage=1, sourceText="FBS: 90.0 mg/dL", category="Glycemic Control"),
            ParameterData(parameterName="Uric Acid", canonicalName="Uric Acid", value=5.4, unit="mg/dL", referenceRange="3.5 - 7.2", status="Normal", reportId="R2", reportDate="29 Apr 2026", sourcePage=2, sourceText="Uric Acid: 5.4 mg/dL", category="Renal Function"),
        ]

        pdf2_path = os.path.join("server", "sample_pdfs", "PT_2026_001_Report2_29Apr2026.pdf")
        generate_sample_hospital_pdf(
            pdf2_path, "Apollo Diagnostics", p1.patientId, p1.name, "R2-29APR", "29 Apr 2026",
            [{"name": p.parameterName, "value": p.value, "unit": p.unit, "ref": p.referenceRange, "flag": p.status if p.status in ["High", "Low", "Elevated"] else ""} for p in r2_params]
        )

        r2 = ReportRecord(
            reportId="Report 2",
            patientId=p1.patientId,
            reportDate="29 Apr 2026",
            uploadDate="29 Apr 2026, 04:15 PM",
            provider="Apollo Diagnostics",
            originalPdfPath=pdf2_path,
            extractedParameters=r2_params,
            extractionStatus="Verified",
            parameterCount=34,
            category="Follow-up Biochemistry"
        )
        self.reports[p1.patientId]["Report 2"] = r2

        # Report 3 (20 May 2026) - Apollo Diagnostics
        r3_params = [
            ParameterData(parameterName="hs-CRP", canonicalName="hs-CRP", value=0.45, unit="mg/L", referenceRange="< 1.0", status="Optimal", reportId="R3", reportDate="20 May 2026", sourcePage=1, sourceText="High Sensitivity CRP: 0.45 mg/L", category="Cardiac & Inflammation"),
            ParameterData(parameterName="Homocysteine", canonicalName="Homocysteine", value=9.8, unit="μmol/L", referenceRange="< 15.0", status="Optimal", reportId="R3", reportDate="20 May 2026", sourcePage=1, sourceText="Homocysteine: 9.8 μmol/L", category="Cardiovascular"),
            ParameterData(parameterName="HDL Cholesterol", canonicalName="HDL Cholesterol", value=58.0, unit="mg/dL", referenceRange="> 40.0", status="Optimal", reportId="R3", reportDate="20 May 2026", sourcePage=1, sourceText="HDL-C: 58.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="Triglycerides", canonicalName="Triglycerides", value=102.0, unit="mg/dL", referenceRange="< 150.0", status="Optimal", reportId="R3", reportDate="20 May 2026", sourcePage=1, sourceText="Triglycerides: 102.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="LDL Cholesterol", canonicalName="LDL Cholesterol", value=94.0, unit="mg/dL", referenceRange="< 100.0", status="Optimal", reportId="R3", reportDate="20 May 2026", sourcePage=1, sourceText="LDL-C: 94.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=5.0, unit="%", referenceRange="< 5.7", status="Normal", reportId="R3", reportDate="20 May 2026", sourcePage=2, sourceText="HbA1c: 5.0 %", category="Glycemic Control"),
            ParameterData(parameterName="Vitamin D", canonicalName="Vitamin D", value=34.2, unit="ng/mL", referenceRange="30.0 - 100.0", status="Normal", reportId="R3", reportDate="20 May 2026", sourcePage=2, sourceText="25-OH Vitamin D: 34.2 ng/mL", category="Vitamins"),
            ParameterData(parameterName="eGFR", canonicalName="eGFR", value=89.0, unit="mL/min", referenceRange="> 90.0", status="Stable", reportId="R3", reportDate="20 May 2026", sourcePage=2, sourceText="eGFR: 89.0 mL/min/1.73m2", category="Renal Function"),
        ]
        r3 = ReportRecord(
            reportId="Report 3",
            patientId=p1.patientId,
            reportDate="20 May 2026",
            uploadDate="20 May 2026, 11:20 AM",
            provider="Apollo Diagnostics",
            originalPdfPath="",
            extractedParameters=r3_params,
            extractionStatus="Verified",
            parameterCount=33,
            category="Cardiac & Metabolic Check"
        )
        self.reports[p1.patientId]["Report 3"] = r3

        # Report 4 (25 Jun 2026) - Metropolis Healthcare
        r4_params = [
            ParameterData(parameterName="hs-CRP", canonicalName="hs-CRP", value=0.52, unit="mg/L", referenceRange="< 1.0", status="Optimal", reportId="R4", reportDate="25 Jun 2026", sourcePage=1, sourceText="hs-CRP: 0.52 mg/L", category="Cardiac & Inflammation"),
            ParameterData(parameterName="Homocysteine", canonicalName="Homocysteine", value=9.2, unit="μmol/L", referenceRange="< 15.0", status="Optimal", reportId="R4", reportDate="25 Jun 2026", sourcePage=1, sourceText="Homocysteine: 9.2 μmol/L", category="Cardiovascular"),
            ParameterData(parameterName="HDL Cholesterol", canonicalName="HDL Cholesterol", value=60.1, unit="mg/dL", referenceRange="> 40.0", status="Optimal", reportId="R4", reportDate="25 Jun 2026", sourcePage=1, sourceText="HDL: 60.1 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="Triglycerides", canonicalName="Triglycerides", value=98.0, unit="mg/dL", referenceRange="< 150.0", status="Optimal", reportId="R4", reportDate="25 Jun 2026", sourcePage=1, sourceText="TG: 98.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="LDL Cholesterol", canonicalName="LDL Cholesterol", value=90.0, unit="mg/dL", referenceRange="< 100.0", status="Optimal", reportId="R4", reportDate="25 Jun 2026", sourcePage=1, sourceText="LDL: 90.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=4.9, unit="%", referenceRange="< 5.7", status="Normal", reportId="R4", reportDate="25 Jun 2026", sourcePage=2, sourceText="HbA1c: 4.9 %", category="Glycemic Control"),
            ParameterData(parameterName="Vitamin D", canonicalName="Vitamin D", value=39.0, unit="ng/mL", referenceRange="30.0 - 100.0", status="Normal", reportId="R4", reportDate="25 Jun 2026", sourcePage=2, sourceText="Vit D: 39.0 ng/mL", category="Vitamins"),
            ParameterData(parameterName="eGFR", canonicalName="eGFR", value=92.0, unit="mL/min", referenceRange="> 90.0", status="Optimal", reportId="R4", reportDate="25 Jun 2026", sourcePage=2, sourceText="eGFR: 92.0 mL/min/1.73m2", category="Renal Function"),
        ]
        r4 = ReportRecord(
            reportId="Report 4",
            patientId=p1.patientId,
            reportDate="25 Jun 2026",
            uploadDate="25 Jun 2026, 02:45 PM",
            provider="Metropolis Healthcare",
            originalPdfPath="",
            extractedParameters=r4_params,
            extractionStatus="Verified",
            parameterCount=35,
            category="Quarterly Preventive Health"
        )
        self.reports[p1.patientId]["Report 4"] = r4

        # Report 5 (30 Jul 2026) - Apollo Diagnostics
        r5_params = [
            ParameterData(parameterName="hs-CRP", canonicalName="hs-CRP", value=0.35, unit="mg/L", referenceRange="< 1.0", status="Optimal", reportId="R5", reportDate="30 Jul 2026", sourcePage=1, sourceText="High Sensitivity CRP: 0.35 mg/L", category="Cardiac & Inflammation"),
            ParameterData(parameterName="Homocysteine", canonicalName="Homocysteine", value=8.7, unit="μmol/L", referenceRange="< 15.0", status="Optimal", reportId="R5", reportDate="30 Jul 2026", sourcePage=1, sourceText="Homocysteine: 8.7 μmol/L", category="Cardiovascular"),
            ParameterData(parameterName="HDL Cholesterol", canonicalName="HDL Cholesterol", value=62.4, unit="mg/dL", referenceRange="> 40.0", status="Optimal", reportId="R5", reportDate="30 Jul 2026", sourcePage=1, sourceText="HDL-C: 62.4 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="Triglycerides", canonicalName="Triglycerides", value=94.0, unit="mg/dL", referenceRange="< 150.0", status="Optimal", reportId="R5", reportDate="30 Jul 2026", sourcePage=1, sourceText="Triglycerides: 94.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="LDL Cholesterol", canonicalName="LDL Cholesterol", value=86.0, unit="mg/dL", referenceRange="< 100.0", status="Optimal", reportId="R5", reportDate="30 Jul 2026", sourcePage=1, sourceText="LDL-C: 86.0 mg/dL", category="Lipid Profile"),
            ParameterData(parameterName="HbA1c", canonicalName="HbA1c", value=4.8, unit="%", referenceRange="< 5.7", status="Normal", reportId="R5", reportDate="30 Jul 2026", sourcePage=2, sourceText="HbA1c: 4.8 %", category="Glycemic Control"),
            ParameterData(parameterName="Vitamin D", canonicalName="Vitamin D", value=42.5, unit="ng/mL", referenceRange="30.0 - 100.0", status="Normal", reportId="R5", reportDate="30 Jul 2026", sourcePage=2, sourceText="25-OH Vitamin D: 42.5 ng/mL", category="Vitamins"),
            ParameterData(parameterName="eGFR", canonicalName="eGFR", value=94.0, unit="mL/min", referenceRange="> 90.0", status="Optimal", reportId="R5", reportDate="30 Jul 2026", sourcePage=2, sourceText="eGFR: 94.0 mL/min/1.73m2", category="Renal Function"),
        ]
        r5 = ReportRecord(
            reportId="Report 5",
            patientId=p1.patientId,
            reportDate="30 Jul 2026",
            uploadDate="30 Jul 2026, 09:10 AM",
            provider="Apollo Diagnostics",
            originalPdfPath="",
            extractedParameters=r5_params,
            extractionStatus="Verified",
            parameterCount=36,
            category="Cardiovascular Follow-up Panel"
        )
        self.reports[p1.patientId]["Report 5"] = r5

        # Add sample audit logs
        self.audit_logs.append(AuditLogEntry(
            logId="AUD-INIT-001",
            timestamp="2026-04-25 10:32:00",
            userId="dr_arvind_kumar",
            userRole="DOCTOR",
            action="REPORT_UPLOADED",
            patientId="PT-2026-001",
            reportId="Report 1",
            provider="Apollo Diagnostics",
            status="SUCCESS",
            details="32 parameters extracted with high confidence"
        ))
        self.audit_logs.append(AuditLogEntry(
            logId="AUD-INIT-002",
            timestamp="2026-04-29 16:18:00",
            userId="dr_arvind_kumar",
            userRole="DOCTOR",
            action="ANALYSIS_COMPLETED",
            patientId="PT-2026-001",
            reportId="Report 1, Report 2",
            provider="Google Gemini (gemini-1.5-pro)",
            status="SUCCESS",
            details="Bilingual clinical summary generated and verified"
        ))

    def get_patient(self, patient_id: str) -> Optional[PatientProfile]:
        return self.patients.get(patient_id)

    def get_all_patients(self) -> List[PatientProfile]:
        return list(self.patients.values())

    def get_patient_reports(self, patient_id: str) -> List[ReportRecord]:
        return list(self.reports.get(patient_id, {}).values())

    def add_report(self, patient_id: str, report: ReportRecord):
        if patient_id not in self.reports:
            self.reports[patient_id] = {}
        self.reports[patient_id][report.reportId] = report
        if patient_id in self.patients:
            self.patients[patient_id].totalReports = len(self.reports[patient_id])

    def log_audit(self, entry: AuditLogEntry):
        self.audit_logs.insert(0, entry)

db_store = PatientDataStore()
