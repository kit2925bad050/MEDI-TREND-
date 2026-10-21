from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class ParameterData(BaseModel):
    parameterName: str
    canonicalName: str
    value: float
    unit: str = ""
    referenceRange: str = "Normal"
    status: str = "Normal"  # "Normal", "High", "Low", "Optimal", "Elevated", "Critical"
    reportId: str = ""
    reportDate: str = ""
    sourcePage: int = 1
    sourceText: Optional[str] = None
    category: Optional[str] = "General"

class ReportRecord(BaseModel):
    reportId: str
    patientId: str
    reportDate: str
    uploadDate: str
    provider: str
    originalPdfPath: Optional[str] = None
    extractedParameters: List[ParameterData] = []
    extractionStatus: str = "Verified"  # "Verified", "OCR Extracted", "Processing", "Failed"
    parameterCount: int = 0
    category: str = "Biochemistry & Lipid Profile"
    validationStatus: Optional[str] = None  # "VALIDATED", "REJECTED", "NEEDS_REVIEW"
    validationReason: Optional[str] = None
    identityVerificationStatus: Optional[str] = None  # "VERIFIED", "MISMATCH", "UNVERIFIED", "REVIEW_REQUIRED"
    identityMatchScore: Optional[float] = None
    identityDetails: Optional[str] = None

class PatientProfile(BaseModel):
    patientId: str
    name: str
    age: int
    gender: str
    phone: str
    activeStatus: str = "Active"
    doctorInCharge: str = "Dr. Arvind Kumar"
    specialty: str = "Cardiologist"
    totalReports: int = 0
    firstReportDate: Optional[str] = None
    latestReportDate: Optional[str] = None
    bloodGroup: Optional[str] = "O+"
    avatarUrl: Optional[str] = None

class ParameterComparison(BaseModel):
    name: str
    canonicalName: str
    unit: str
    beforeValue: Optional[float] = None
    afterValue: Optional[float] = None
    baselineReportId: str
    followUpReportId: str
    baselineDate: str
    followUpDate: str
    absoluteChange: Optional[float] = None
    percentChange: Optional[float] = None
    trajectory: str  # "Improved", "Stable", "Needs Monitoring", "Worsened", "Not Comparable"
    status: str  # "Improved", "Stable", "Needs Monitoring", "Worsened"
    overallStatus: Optional[str] = None
    referenceRange: str
    sourcePages: List[str] = []
    isComparable: bool = True
    clinicalNote: Optional[str] = None
    trendHistory: List[Dict[str, Any]] = []

class PairwiseComparison(BaseModel):
    fromReportId: str
    fromReportDate: str
    toReportId: str
    toReportDate: str
    parameters: List[ParameterComparison] = []
    improvedCount: int = 0
    stableCount: int = 0
    monitoringCount: int = 0
    worsenedCount: int = 0

class AIAnalysisResult(BaseModel):
    analysisId: str
    patientId: str
    patientName: str
    selectedReportIds: List[str]
    verifiedReportIds: List[str] = []
    analysisDate: str
    analysisStatus: str = "Analysis Complete"
    comparisonSummary: Dict[str, int] = {"improved": 0, "stable": 0, "monitoring": 0, "worsened": 0}
    comparisons: List[PairwiseComparison] = []
    keyParameters: List[ParameterComparison] = []
    overallFindings: List[str] = []
    englishSummary: List[str] = []
    tamilSummary: List[str] = []
    monitoringItems: List[Dict[str, Any]] = []
    notComparable: List[Dict[str, Any]] = []
    identityStatuses: Dict[str, Any] = {}
    completeness: Dict[str, Any] = {}
    providerUsed: str = "gemini-1.5-pro"
    fallbackTriggered: bool = False
    fallbackHistory: List[str] = []
    executionLatencyMs: float = 0.0
    auditLogId: str = ""
    isSingleReport: bool = False

class ComparisonRequest(BaseModel):
    patientId: Optional[str] = None
    patient_id: Optional[str] = None
    selectedReportIds: Optional[List[str]] = Field(default_factory=list)
    selected_report_ids: Optional[List[str]] = Field(default_factory=list)
    report_ids: Optional[List[str]] = Field(default_factory=list)

class AuditLogEntry(BaseModel):
    logId: str
    timestamp: str
    userId: str
    userRole: str
    action: str  # "REPORT_UPLOADED", "REPORT_VIEWED", "ANALYSIS_STARTED", "ANALYSIS_COMPLETED", "AI_FALLBACK_TRIGGERED", "REPORT_EXPORTED"
    patientId: Optional[str] = None
    reportId: Optional[str] = None
    analysisId: Optional[str] = None
    provider: Optional[str] = None
    status: str = "SUCCESS"
    details: Optional[str] = None

class WoundNotesUpdateRequest(BaseModel):
    doctor_notes: str = ""
    review_status: Optional[str] = "VALIDATED"

class WoundComparisonRequest(BaseModel):
    assessment_ids: List[str]

class WoundVisitCreateRequest(BaseModel):
    visit_date: str
    visit_month: Optional[str] = None
    wound_location: Optional[str] = "Unspecified"
    wound_type_tag: Optional[str] = "Unspecified"
    doctor_notes: Optional[str] = ""
    allow_duplicate_date: Optional[bool] = False

class WoundVisitCompareRequest(BaseModel):
    visit_id_1: Optional[str] = None
    visit_id_2: Optional[str] = None
    visit_id_a: Optional[str] = None
    visit_id_b: Optional[str] = None
