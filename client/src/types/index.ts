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
<<<<<<< HEAD
  identityVerificationStatus?: string; // "VERIFIED" | "MISMATCH" | "UNVERIFIED" | "REVIEW_REQUIRED"
  identityMatchScore?: number;
  identityDetails?: string;
  extractedPatientName?: string;
=======
  identityStatus?: 'IDENTITY_VERIFIED' | 'IDENTITY_MISMATCH' | 'IDENTITY_UNVERIFIED' | 'MANUAL_REVIEW_REQUIRED' | string;
  patientNameOnReport?: string;
  identityMismatchReason?: string;
>>>>>>> origin/main
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
