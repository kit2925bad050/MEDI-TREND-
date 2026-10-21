export interface ParameterData {
  parameterName: string;
  canonicalName: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: string; // "Normal" | "High" | "Low" | "Optimal" | "Elevated" | "Needs Monitoring"
  reportId: string;
  reportDate: string;
  sourcePage: number;
  sourceText?: string;
  category?: string;
}

export interface ReportRecord {
  reportId: string;
  patientId: string;
  reportDate: string;
  uploadDate: string;
  provider: string;
  file_path?: string;
  originalPdfPath?: string;
  extractedParameters: ParameterData[];
  extractionStatus: string;
  parameterCount: number;
  category: string;
  validationStatus?: string;
  validationReason?: string;
  identityStatus?: string;
  identityVerificationStatus?: string; // "VERIFIED" | "MISMATCH" | "UNVERIFIED" | "REVIEW_REQUIRED"
  patientNameOnReport?: string;
  identityMismatchReason?: string;
  identityMatchScore?: number;
  identityDetails?: string;
  extractedPatientName?: string;
}

export interface PatientProfile {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  activeStatus: string;
  doctorInCharge: string;
  assignedDoctorId?: string;
  specialty: string;
  totalReports?: number;
  firstReportDate?: string;
  latestReportDate?: string;
  bloodGroup?: string;
  avatarUrl?: string;
}

export interface TrendDataPoint {
  reportId: string;
  reportDate: string;
  provider: string;
  value: number;
  unit: string;
}

export interface ParameterComparison {
  name: string;
  canonicalName: string;
  unit: string;
  beforeValue: number | null;
  afterValue: number | null;
  baselineReportId: string;
  followUpReportId: string;
  baselineDate?: string;
  followUpDate?: string;
  absoluteChange?: number | null;
  percentageChange?: number | null;
  percentChange?: number | null;
  direction?: 'IMPROVED' | 'WORSENED' | 'STABLE' | 'NEEDS_MONITORING' | 'NO_CHANGE' | string;
  trajectory?: string;
  clinicalInterpretation?: string;
  referenceRange: string;
  history?: TrendDataPoint[];
  trendHistory?: TrendDataPoint[];
}

export interface AIAnalysisResult {
  analysisId: string;
  patientId: string;
  patientName: string;
  selectedReportIds: string[];
  verifiedReportIds: string[];
  analysisDate: string;
  analysisStatus: string; // "Analysis Complete" | "Analysis Partially Complete" | "Manual Review Required" | "Patient Identity Mismatch"
  comparisonSummary: {
    improved: number;
    stable: number;
    monitoring: number;
    worsened: number;
  };
  comparisons: ParameterComparison[];
  keyParameters: ParameterComparison[];
  overallFindings: string[];
  englishSummary: string[];
  tamilSummary: string[];
  monitoringItems: Array<{
    parameter: string;
    reason: string;
    action: string;
  }>;
  notComparable: any[];
  identityStatuses: any;
  completeness: any;
  providerUsed: string;
  fallbackTriggered: boolean;
  fallbackHistory: string[];
  executionLatencyMs: number;
  auditLogId: string;
}

export interface AuditLogEntry {
  logId: string;
  timestamp: string;
  userId: string;
  userRole: string;
  action: string;
  patientId?: string;
  reportId?: string;
  analysisId?: string;
  provider?: string;
  status: string;
  details?: string;
}

export type UserRole = 'ADMIN' | 'SUPER_ADMIN' | 'DOCTOR' | 'CLINICIAN' | 'STAFF' | 'PATIENT';

export interface Appointment {
  id?: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  appointmentDate: string;
  slotTime: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED' | 'COMPLETED' | 'PROPOSED';
  reason?: string;
  proposedNewDate?: string;
  proposedNewSlot?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface TimeSlotItem {
  slot_time: string;
  is_available: boolean;
  date: string;
  doctor_id: string;
}

export interface DoctorAvailability {
  doctorId: string;
  workingDays: string[];
  startTime: string;
  endTime: string;
  slotDurationMins: number;
  breakStart: string;
  breakEnd: string;
  blockedDates: string[];
  isAvailable: boolean;
}

export interface PatientReportLimit {
  patientId: string;
  maxReports: number;
  updatedBy?: string;
  updatedReason?: string;
  updatedAt?: string;
}

// ==================== WOUND ASSESSMENT MODULE TYPES ====================
export interface WoundTissueBreakdown {
  granulation_percent: number;
  slough_percent: number;
  necrotic_percent: number;
  epithelial_percent: number;
}

export interface WoundDischargeInfo {
  amount?: string;
  type?: string;
  odor_noted?: string;
}

export interface WoundCharacteristics {
  tissue_breakdown: WoundTissueBreakdown;
  primary_bed_appearance: string;
  periwound_redness: string;
  surrounding_swelling: string;
  discharge_characteristics: WoundDischargeInfo;
  edge_condition: string;
}

export interface WoundDimensionsInfo {
  has_scale_marker: boolean;
  length_cm?: number | null;
  width_cm?: number | null;
  surface_area_cm2?: number | null;
  scale_notes: string;
}

export interface WoundCategoryCandidate {
  category: string;
  confidence: string;
  rationale: string;
}

export interface WoundClinicalRecommendations {
  recommended_assessments: string[];
  wound_care_considerations: string[];
  specialist_referral_triggers: string[];
  urgent_warning_signs: string[];
  surgical_evaluation_factors: string[];
}

export interface CorrelatedBiomarker {
  parameter: string;
  latest_value: number;
  unit: string;
  status: string;
  report_date: string;
  trend_text?: string;
}

export interface WoundCorrelatedReportSummary {
  approved_report_count: number;
  correlated_parameters: CorrelatedBiomarker[];
  missing_key_parameters: string[];
  clinical_correlation_note: string;
}

export interface WoundAssessmentRecord {
  id: string;
  assessment_id: string;
  patient_id: string;
  image_path: string;
  image_filename: string;
  image_mime_type: string;
  image_size_bytes: number;
  visit_date: string;
  upload_date: string;
  uploaded_by: string;
  wound_location: string;
  wound_type_tag: string;
  visible_characteristics: WoundCharacteristics;
  severity_indicator: string;
  dimensions_info: WoundDimensionsInfo;
  categories_considered: WoundCategoryCandidate[];
  limitations_notes: string[];
  warning_signs: string[];
  clinical_recommendations: WoundClinicalRecommendations;
  linked_report_summary: WoundCorrelatedReportSummary;
  doctor_notes: string;
  review_status: 'PENDING' | 'VALIDATED' | 'FOLLOW_UP_REQUIRED' | string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  image_url?: string;
  created_at?: string;
}

export interface WoundComparisonResult {
  patient_id: string;
  baseline_assessment_id: string;
  baseline_date: string;
  baseline_image_filename: string;
  current_assessment_id: string;
  current_date: string;
  current_image_filename: string;
  total_assessments_compared: number;
  progress_status: 'Improving' | 'No Clear Change' | 'Worsening' | 'Unable to Assess' | string;
  tissue_changes: {
    granulation_delta: number;
    slough_delta: number;
    necrotic_delta: number;
    baseline_breakdown: WoundTissueBreakdown;
    current_breakdown: WoundTissueBreakdown;
  };
  dimensions_comparison: {
    has_calibrated_measurements: boolean;
    area_change_percent?: number | null;
    note: string;
  };
  differences_summary: string;
  detailed_points: string[];
  cautionary_note: string;
}

// ==================== MONTHLY WOUND PHOTO TRACKING & COMPARISON TYPES ====================
export interface WoundVisitPhoto {
  id: string;
  photo_id: string;
  visit_id: string;
  patient_id: string;
  image_path: string;
  image_filename: string;
  image_mime_type: string;
  image_size_bytes: number;
  order_index: number;
  image_url: string;
  created_at: string;
}

export interface WoundVisitRecord {
  id: string;
  visit_id: string;
  patient_id: string;
  visit_date: string;
  visit_month: string;
  wound_location: string;
  wound_type_tag: string;
  status: 'PENDING' | 'ANALYZED' | 'FAILED' | string;
  doctor_notes: string;
  uploaded_by: string;
  analysis_result?: any;
  analyzed_at?: string | null;
  photos: WoundVisitPhoto[];
  photo_count: number;
  created_at: string;
  updated_at: string;
}

export interface WoundVisitComparisonResult {
  patient_id: string;
  baseline_visit: {
    visit_id: string;
    visit_date: string;
    visit_month: string;
    wound_location: string;
    wound_type_tag: string;
    photo_count: number;
    photos: WoundVisitPhoto[];
    summary: string;
    severity_indicator: string;
    tissue_breakdown: WoundTissueBreakdown;
  };
  current_visit: {
    visit_id: string;
    visit_date: string;
    visit_month: string;
    wound_location: string;
    wound_type_tag: string;
    photo_count: number;
    photos: WoundVisitPhoto[];
    summary: string;
    severity_indicator: string;
    tissue_breakdown: WoundTissueBreakdown;
  };
  progress_status: 'Improving' | 'Worsening' | 'Mixed / Needs Monitoring' | 'No Clear Change' | 'Unable to Assess' | string;
  tissue_changes: {
    granulation_delta: number;
    slough_delta: number;
    necrotic_delta: number;
    epithelial_delta: number;
    baseline_breakdown: WoundTissueBreakdown;
    current_breakdown: WoundTissueBreakdown;
  };
  findings_trajectory: {
    improved_findings: string[];
    worsened_findings: string[];
    unchanged_findings: string[];
  };
  dimensions_comparison: {
    has_calibrated_measurements: boolean;
    area_change_percent?: number | null;
    note: string;
  };
  comparison_summary: string;
  quality_comparison_warning?: string;
  cautionary_note: string;
  tamil_translation?: {
    progress_status: string;
    comparison_summary: string;
    improved_findings: string[];
    worsened_findings: string[];
    unchanged_findings: string[];
  };
}
