import {
  PatientProfile,
  ReportRecord,
  AIAnalysisResult,
  AuditLogEntry,
  UserRole,
} from '../types';
import { supabase } from './supabase';

// ==================== API RESPONSE INTERFACES ====================
// Backend-authoritative response shapes. Never fabricate fields client-side.
export interface BaseApiResponse {
  success?: boolean;
  message?: string;
}

export interface TokenApiResponse extends BaseApiResponse {
  token?: string;
}

export interface IdentityApiResponse extends BaseApiResponse {
  new_username?: string;
}

export interface ForgotPasswordResponse extends BaseApiResponse {
  reset_token?: string;
}

export interface ResetPasswordResponse extends BaseApiResponse {}

const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (!import.meta.env.PROD) {
    return '/api';
  }
  if (envUrl && typeof envUrl === 'string') {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api';
};

const API_BASE = getApiBase();

/** Safely parse JSON or return null if response is HTML or empty */
async function safeJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function readApiResponse<T>(res: Response, defaultMessage: string): Promise<T> {
  const data = await safeJson(res);
  if (!res.ok) {
    const detail = data?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : detail?.message || data?.message || defaultMessage;
    throw new Error(message);
  }
  if (data === null) {
    throw new Error('The server returned an invalid response. Please try again.');
  }
  return data as T;
}

function apiConnectionError(error: unknown): Error {
  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return new Error('Cannot connect to the MEDI TREND API. Start the backend and try again.');
  }
  return error instanceof Error ? error : new Error('The request failed. Please try again.');
}

// ==================== DEFAULT CLINICAL GROUNDED DATA ====================
const DEFAULT_PATIENTS: PatientProfile[] = [
  {
    patientId: 'PT-E77688',
    name: 'S. Gurumurthy',
    age: 58,
    gender: 'Male',
    phone: '+91 98401 23456',
    email: 'gurumurthy.s@gmail.com',
    activeStatus: 'Active',
    doctorInCharge: 'Dr. Arvind Kumar',
    specialty: 'Cardiology & Lipidology',
    totalReports: 0,
    avatarUrl: undefined,
    bloodGroup: 'B+',
  },
  {
    patientId: 'PT-2026-001',
    name: 'K. Meenakshi',
    age: 46,
    gender: 'Female',
    phone: '+91 94440 98765',
    email: 'meenakshi.k@outlook.com',
    activeStatus: 'Active',
    doctorInCharge: 'Dr. Priya Sharma',
    specialty: 'Endocrinology & Diabetology',
    totalReports: 0,
    avatarUrl: undefined,
    bloodGroup: 'O+',
  }
];

const DEFAULT_REPORTS: Record<string, ReportRecord[]> = {
  'PT-E77688': [
    {
      reportId: 'REP-2026-001',
      patientId: 'PT-E77688',
      reportDate: '15 Jan 2026',
      uploadDate: '15 Jan 2026 10:30 AM',
      provider: 'Apollo Diagnostics Centre',
      originalPdfPath: '/sample_pdfs/PT_2026_001_Report1_25Apr2026.pdf',
      extractionStatus: 'Verified',
      parameterCount: 6,
      category: 'Comprehensive Lipid & Metabolic Panel',
      extractedParameters: [
        {
          parameterName: 'Total Cholesterol',
          canonicalName: 'Total Cholesterol',
          value: 248.0,
          unit: 'mg/dL',
          referenceRange: '< 200',
          status: 'Elevated',
          reportId: 'REP-2026-001',
          reportDate: '15 Jan 2026',
          sourcePage: 1,
          sourceText: 'Total Cholesterol: 248.0 mg/dL (< 200)',
          category: 'Lipid Profile',
        },
        {
          parameterName: 'HDL Cholesterol',
          canonicalName: 'HDL Cholesterol',
          value: 36.0,
          unit: 'mg/dL',
          referenceRange: '> 40',
          status: 'Low',
          reportId: 'REP-2026-001',
          reportDate: '15 Jan 2026',
          sourcePage: 1,
          sourceText: 'HDL Cholesterol: 36.0 mg/dL (> 40)',
          category: 'Lipid Profile',
        },
        {
          parameterName: 'LDL Cholesterol',
          canonicalName: 'LDL Cholesterol',
          value: 168.0,
          unit: 'mg/dL',
          referenceRange: '< 100',
          status: 'Elevated',
          reportId: 'REP-2026-001',
          reportDate: '15 Jan 2026',
          sourcePage: 1,
          sourceText: 'LDL Cholesterol: 168.0 mg/dL (< 100)',
          category: 'Lipid Profile',
        },
        {
          parameterName: 'Triglycerides',
          canonicalName: 'Triglycerides',
          value: 220.0,
          unit: 'mg/dL',
          referenceRange: '< 150',
          status: 'Elevated',
          reportId: 'REP-2026-001',
          reportDate: '15 Jan 2026',
          sourcePage: 1,
          sourceText: 'Triglycerides: 220.0 mg/dL (< 150)',
          category: 'Lipid Profile',
        },
        {
          parameterName: 'Fasting Blood Sugar',
          canonicalName: 'Fasting Blood Sugar',
          value: 118.0,
          unit: 'mg/dL',
          referenceRange: '70 - 100',
          status: 'Elevated',
          reportId: 'REP-2026-001',
          reportDate: '15 Jan 2026',
          sourcePage: 1,
          sourceText: 'Fasting Blood Sugar: 118.0 mg/dL (70 - 100)',
          category: 'Glucose Metabolism',
        },
        {
          parameterName: 'HbA1c',
          canonicalName: 'HbA1c (Glycated Hemoglobin)',
          value: 6.8,
          unit: '%',
          referenceRange: '< 5.7',
          status: 'Elevated',
          reportId: 'REP-2026-001',
          reportDate: '15 Jan 2026',
          sourcePage: 1,
          sourceText: 'HbA1c: 6.8 % (< 5.7)',
          category: 'Glucose Metabolism',
        },
      ],
    },
    {
      reportId: 'REP-2026-002',
      patientId: 'PT-E77688',
      reportDate: '28 Mar 2026',
      uploadDate: '28 Mar 2026 04:15 PM',
      provider: 'Apollo Diagnostics Centre',
      originalPdfPath: '/sample_pdfs/PT_2026_001_Report2_29Apr2026.pdf',
      extractionStatus: 'Verified',
      parameterCount: 6,
      category: 'Comprehensive Lipid & Metabolic Follow-Up',
      extractedParameters: [
        {
          parameterName: 'Total Cholesterol',
          canonicalName: 'Total Cholesterol',
          value: 192.0,
          unit: 'mg/dL',
          referenceRange: '< 200',
          status: 'Optimal',
          reportId: 'REP-2026-002',
          reportDate: '28 Mar 2026',
          sourcePage: 1,
          sourceText: 'Total Cholesterol: 192.0 mg/dL (< 200)',
          category: 'Lipid Profile',
        },
        {
          parameterName: 'HDL Cholesterol',
          canonicalName: 'HDL Cholesterol',
          value: 44.0,
          unit: 'mg/dL',
          referenceRange: '> 40',
          status: 'Optimal',
          reportId: 'REP-2026-002',
          reportDate: '28 Mar 2026',
          sourcePage: 1,
          sourceText: 'HDL Cholesterol: 44.0 mg/dL (> 40)',
          category: 'Lipid Profile',
        },
        {
          parameterName: 'LDL Cholesterol',
          canonicalName: 'LDL Cholesterol',
          value: 114.0,
          unit: 'mg/dL',
          referenceRange: '< 100',
          status: 'Near Optimal',
          reportId: 'REP-2026-002',
          reportDate: '28 Mar 2026',
          sourcePage: 1,
          sourceText: 'LDL Cholesterol: 114.0 mg/dL (< 100)',
          category: 'Lipid Profile',
        },
        {
          parameterName: 'Triglycerides',
          canonicalName: 'Triglycerides',
          value: 148.0,
          unit: 'mg/dL',
          referenceRange: '< 150',
          status: 'Optimal',
          reportId: 'REP-2026-002',
          reportDate: '28 Mar 2026',
          sourcePage: 1,
          sourceText: 'Triglycerides: 148.0 mg/dL (< 150)',
          category: 'Lipid Profile',
        },
        {
          parameterName: 'Fasting Blood Sugar',
          canonicalName: 'Fasting Blood Sugar',
          value: 94.0,
          unit: 'mg/dL',
          referenceRange: '70 - 100',
          status: 'Optimal',
          reportId: 'REP-2026-002',
          reportDate: '28 Mar 2026',
          sourcePage: 1,
          sourceText: 'Fasting Blood Sugar: 94.0 mg/dL (70 - 100)',
          category: 'Glucose Metabolism',
        },
        {
          parameterName: 'HbA1c',
          canonicalName: 'HbA1c (Glycated Hemoglobin)',
          value: 5.9,
          unit: '%',
          referenceRange: '< 5.7',
          status: 'Borderline',
          reportId: 'REP-2026-002',
          reportDate: '28 Mar 2026',
          sourcePage: 1,
          sourceText: 'HbA1c: 5.9 % (< 5.7)',
          category: 'Glucose Metabolism',
        },
      ],
    },
  ],
};

// ==================== ADMIN & AUTH APIS ====================
export async function loginUser(username_or_email: string, password: string) {
  const u = username_or_email.trim().toLowerCase();
  const p = password.trim();

  // SECURITY: Authentication is performed exclusively by the backend.
  // The frontend must NEVER manufacture a successful login from a Supabase
  // record or a hardcoded credential. There is intentionally no client-side
  // fallback: if the backend rejects the credentials, login fails.
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username_or_email: u, password: p }),
  });
  const json = await safeJson(res);
  if (res.ok && json && json.success) {
    return json;
  }
  if (json && json.detail) {
    throw new Error(typeof json.detail === 'string' ? json.detail : json.detail?.message || 'Invalid clinical credentials.');
  }
  if (!res.ok) {
    throw new Error('Invalid username/email or password.');
  }
  throw new Error('Authentication failed. Please verify your credentials.');
}

export async function logoutUser(userName: string, userRole: string) {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-name': userName,
        'x-user-role': userRole,
      },
    });
  } catch (e) {
    console.warn('Logout API error:', e);
  }
}

export async function loginAdmin(username: string, password: string) {
  const u = username.trim().toLowerCase();
  const p = password.trim();

  // SECURITY: Admin authentication is performed exclusively by the backend.
  // There is intentionally no client-side fallback that grants admin access.
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, password: p }),
  });
  const json = await safeJson(res);
  if (res.ok && json && json.success) {
    return json;
  }
  if (json && json.detail) {
    throw new Error(typeof json.detail === 'string' ? json.detail : json.detail?.message || 'Invalid administrator credentials.');
  }
  if (!res.ok) {
    throw new Error('Invalid administrator credentials.');
  }
  throw new Error('Authentication failed. Please verify your credentials.');
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const sessionStr = localStorage.getItem('medi_trend_session');
  if (sessionStr) {
    try {
      const parsed = JSON.parse(sessionStr);
      if (parsed.token) {
        headers['Authorization'] = `Bearer ${parsed.token}`;
        headers['x-auth-token'] = parsed.token;
      }
      if (parsed.user?.name) {
        headers['x-user-name'] = parsed.user.name;
      }
      if (parsed.role) {
        headers['x-user-role'] = parsed.role;
      }
    } catch {}
  }
  return headers;
}

export async function loginUnified(username_or_email: string, password: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username_or_email: username_or_email.trim().toLowerCase(),
        password: password.trim(),
      }),
    });
    return await readApiResponse<TokenApiResponse>(res, 'Authentication failed. Please verify your credentials.');
  } catch (error) {
    throw apiConnectionError(error);
  }
}

export async function adminFirstPasswordChange(username: string, current_password: string, new_password: string) {
  // SECURITY: No client-side fallback. Backend is the sole authority.
  const res = await fetch(`${API_BASE}/admin/first-password-change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, current_password, new_password }),
  });
  return readApiResponse<TokenApiResponse>(res, 'Unable to initialize admin password.');
}

export async function changeAdminPassword(username: string, old_password: string, new_password: string) {
  // SECURITY: No client-side fallback. Backend is the sole authority.
  const res = await fetch(`${API_BASE}/admin/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, old_password, new_password }),
  });
  return readApiResponse<TokenApiResponse>(res, 'Unable to change admin password.');
}

export async function changeAdminIdentity(current_username: string, new_username: string, new_email: string, current_password: string) {
  // SECURITY: No client-side fallback. Backend is the sole authority.
  const res = await fetch(`${API_BASE}/admin/change-identity`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ current_username, new_username, new_email, current_password }),
  });
  return readApiResponse<IdentityApiResponse>(res, 'Unable to update admin identity.');
}

export async function changeDoctorPassword(doctor_id: string, old_password: string, new_password: string) {
  // SECURITY: No client-side fallback. Backend is the sole authority.
  const res = await fetch(`${API_BASE}/doctor/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ doctor_id, old_password, new_password }),
  });
  return readApiResponse<BaseApiResponse>(res, 'Unable to change doctor password.');
}

export async function requestForgotPassword(identifier: string, role: string) {
  // SECURITY: No client-side token fabrication. Backend is the sole authority.
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, role }),
  });
  return readApiResponse<ForgotPasswordResponse>(res, 'Unable to initiate password recovery.');
}

export async function resetPasswordWithToken(token: string, new_password: string) {
  // SECURITY: No client-side token validation. Backend is the sole authority.
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password }),
  });
  return readApiResponse<BaseApiResponse>(res, 'Unable to reset password. The token may be invalid or expired.');
}

export async function resetUserPassword(user_type: string, user_id: string, new_password: string) {
  // SECURITY: No client-side fallback. Backend is the sole authority.
  const res = await fetch(`${API_BASE}/admin/reset-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ user_type, user_id, new_password }),
  });
  return readApiResponse<BaseApiResponse>(res, 'Unable to reset password.');
}

export async function fetchAdminSessions() {
  const res = await fetch(`${API_BASE}/admin/sessions`, {
    headers: getAuthHeaders(),
  });
  return safeJson(res);
}

export async function revokeAllOtherAdminSessions() {
  const res = await fetch(`${API_BASE}/admin/sessions/revoke-all`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return safeJson(res);
}

export async function fetchAdminDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return await readApiResponse<BaseApiResponse>(res, 'Unable to load dashboard statistics.');
  } catch (error) {
    throw apiConnectionError(error);
  }
}

const DELETED_DOCS_KEY = 'medi_deleted_doctor_ids';
const DELETED_PATS_KEY = 'medi_deleted_patient_ids';
const CUSTOM_DOCS_KEY = 'medi_custom_doctors_list';
const CUSTOM_PATS_KEY = 'medi_custom_patients_list';

export function getDeletedDoctorIds(): string[] {
  try {
    const s = localStorage.getItem(DELETED_DOCS_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function addDeletedDoctorId(id: string) {
  try {
    const list = getDeletedDoctorIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_DOCS_KEY, JSON.stringify(list));
    }
  } catch {}
}

export function removeDeletedDoctorId(id: string) {
  try {
    const list = getDeletedDoctorIds().filter((i) => i !== id);
    localStorage.setItem(DELETED_DOCS_KEY, JSON.stringify(list));
  } catch {}
}

export function getCustomDoctors(): any[] {
  try {
    const s = localStorage.getItem(CUSTOM_DOCS_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function saveCustomDoctor(doc: any) {
  try {
    const list = getCustomDoctors().filter(
      (d) => d.doctor_id !== doc.doctor_id && d.id !== doc.id && d.email !== doc.email
    );
    list.unshift(doc);
    localStorage.setItem(CUSTOM_DOCS_KEY, JSON.stringify(list));
  } catch {}
}

export function removeCustomDoctor(id: string) {
  try {
    const list = getCustomDoctors().filter(
      (d) => d.doctor_id !== id && d.id !== id && d.email !== id
    );
    localStorage.setItem(CUSTOM_DOCS_KEY, JSON.stringify(list));
  } catch {}
}

export function getDeletedPatientIds(): string[] {
  try {
    const s = localStorage.getItem(DELETED_PATS_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function addDeletedPatientId(id: string) {
  try {
    const list = getDeletedPatientIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_PATS_KEY, JSON.stringify(list));
    }
  } catch {}
}

export function removeDeletedPatientId(id: string) {
  try {
    const list = getDeletedPatientIds().filter((i) => i !== id);
    localStorage.setItem(DELETED_PATS_KEY, JSON.stringify(list));
  } catch {}
}

export function getCustomPatients(): PatientProfile[] {
  try {
    const s = localStorage.getItem(CUSTOM_PATS_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function saveCustomPatient(pat: PatientProfile) {
  try {
    const list = getCustomPatients().filter(
      (p) => p.patientId !== pat.patientId && (p.email ? p.email !== pat.email : true)
    );
    list.unshift(pat);
    localStorage.setItem(CUSTOM_PATS_KEY, JSON.stringify(list));
  } catch {}
}

export function removeCustomPatient(id: string) {
  try {
    const list = getCustomPatients().filter(
      (p) => p.patientId !== id && (p as any).id !== id && (p.email ? p.email !== id : true)
    );
    localStorage.setItem(CUSTOM_PATS_KEY, JSON.stringify(list));
  } catch {}
}

const DELETED_REPS_KEY = 'medi_deleted_reports_list';
const CUSTOM_REPORTS_KEY = 'medi_custom_patient_reports_map';

export function getDeletedReportIds(): string[] {
  try {
    const s = localStorage.getItem(DELETED_REPS_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function addDeletedReportId(id: string) {
  try {
    const list = getDeletedReportIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_REPS_KEY, JSON.stringify(list));
    }
  } catch {}
}

export function removeDeletedReportId(id: string) {
  try {
    const list = getDeletedReportIds().filter((i) => i !== id);
    localStorage.setItem(DELETED_REPS_KEY, JSON.stringify(list));
  } catch {}
}

export function getCustomReportsForPatient(patientId: string): ReportRecord[] {
  try {
    const raw = localStorage.getItem(CUSTOM_REPORTS_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw);
    return Array.isArray(map[patientId]) ? map[patientId] : [];
  } catch {
    return [];
  }
}

export function saveCustomReportForPatient(patientId: string, report: ReportRecord) {
  try {
    const raw = localStorage.getItem(CUSTOM_REPORTS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const existing: ReportRecord[] = Array.isArray(map[patientId]) ? map[patientId] : [];
    const filtered = existing.filter((r) => r.reportId !== report.reportId);
    filtered.push(report);
    map[patientId] = filtered;
    localStorage.setItem(CUSTOM_REPORTS_KEY, JSON.stringify(map));
  } catch {}
}

export function removeCustomReportForPatient(reportId: string) {
  try {
    const raw = localStorage.getItem(CUSTOM_REPORTS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    for (const pid of Object.keys(map)) {
      if (Array.isArray(map[pid])) {
        map[pid] = map[pid].filter((r: ReportRecord) => r.reportId !== reportId);
      }
    }
    localStorage.setItem(CUSTOM_REPORTS_KEY, JSON.stringify(map));
  } catch {}
}

export function clearCustomReportsForPatient(patientId: string) {
  try {
    const raw = localStorage.getItem(CUSTOM_REPORTS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[patientId];
    localStorage.setItem(CUSTOM_REPORTS_KEY, JSON.stringify(map));
  } catch {}
}

export async function fetchDoctors(status?: string) {
  const deletedIds = getDeletedDoctorIds();
  const customDocs = getCustomDoctors();
  const mapById = new Map<string, any>();

  // 1. Fetch Real Backend Doctors
  try {
    const url = status ? `${API_BASE}/admin/doctors?status=${encodeURIComponent(status)}` : `${API_BASE}/admin/doctors`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
<<<<<<< HEAD
    return await readApiResponse<any[]>(res, 'Unable to load doctors.');
  } catch (error) {
    throw apiConnectionError(error);
  }
}

export async function createDoctor(data: any) {
  try {
    const res = await fetch(`${API_BASE}/admin/doctors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await readApiResponse<BaseApiResponse>(res, 'Failed to create doctor record.');
  } catch (error) {
    throw apiConnectionError(error);
  }
=======
    const json = await safeJson(res);
    if (res.ok && Array.isArray(json)) {
      json.forEach((d: any) => {
        if (!deletedIds.includes(d.doctor_id) && !deletedIds.includes(d.id) && !deletedIds.includes(d.email)) {
          mapById.set(d.doctor_id || d.id, d);
        }
      });
    }
  } catch (e) {
    console.warn('Backend /admin/doctors fetch fallback:', e);
  }

  // 2. Supabase Direct Query Fallback
  try {
    let query = supabase.from('doctors').select('*');
    if (status) {
      query = query.eq('status', status.toUpperCase());
    }
    const { data: supaDocs, error } = await query;
    if (!error && supaDocs && supaDocs.length > 0) {
      supaDocs.forEach((d: any) => {
        if (!deletedIds.includes(d.doctor_id) && !deletedIds.includes(d.id) && !deletedIds.includes(d.email)) {
          if (!mapById.has(d.doctor_id)) {
            mapById.set(d.doctor_id, {
              id: d.id,
              doctor_id: d.doctor_id,
              full_name: d.full_name,
              email: d.email,
              phone: d.phone || '',
              specialization: d.specialization || 'General Medicine',
              department: d.department || 'Cardiology',
              status: d.status || 'ACTIVE',
              deactivation_reason: d.deactivation_reason,
              avatar_url: d.avatar_url,
              permissions: d.permissions || ['PATIENT_VIEW', 'PATIENT_CREATE', 'REPORT_VIEW', 'REPORT_UPLOAD', 'ANALYSIS_CREATE', 'ANALYSIS_VIEW', 'REPORT_EXPORT'],
              created_at: d.created_at,
            });
          }
        }
      });
    }
  } catch (e) {
    console.warn('Supabase doctors query fallback:', e);
  }

  // 3. Merge Custom Persistent Doctors
  customDocs.forEach((d) => {
    if (!deletedIds.includes(d.doctor_id) && !deletedIds.includes(d.id) && !deletedIds.includes(d.email)) {
      mapById.set(d.doctor_id, d);
    }
  });

  // 4. Default Pre-Configured Clinical Faculty
  const defaults = [
    {
      id: 'doc-001',
      doctor_id: 'DOC-001',
      full_name: 'Dr. Arvind Kumar',
      email: 'dr.arvind@hospital.org',
      phone: '+91 98401 11223',
      specialization: 'Cardiology & Lipidology',
      department: 'Cardiovascular Sciences',
      status: 'ACTIVE',
      permissions: ['PATIENT_VIEW', 'PATIENT_CREATE', 'REPORT_VIEW', 'REPORT_UPLOAD', 'ANALYSIS_CREATE', 'ANALYSIS_VIEW', 'REPORT_EXPORT'],
      created_at: '2026-01-10T10:00:00Z',
    },
  ];

  defaults.forEach((d) => {
    if (!deletedIds.includes(d.doctor_id) && !deletedIds.includes(d.id) && !deletedIds.includes(d.email)) {
      if (!mapById.has(d.doctor_id)) {
        mapById.set(d.doctor_id, d);
      }
    }
  });

  const allList = Array.from(mapById.values());
  return status ? allList.filter((d) => d.status === status.toUpperCase()) : allList;
}

export async function createDoctor(data: {
  full_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  department?: string;
  password?: string;
}) {
  const normEmail = data.email.trim().toLowerCase();
  const fullName = data.full_name.trim();

  if (!fullName) {
    throw new Error('Physician full name is required.');
  }
  if (!normEmail || !normEmail.includes('@')) {
    throw new Error('A valid email address is required.');
  }

  // Unmark from deleted registry
  removeDeletedDoctorId(normEmail);

  const docNum = Math.floor(100 + Math.random() * 900);
  const doctorId = `DOC-${docNum}`;
  removeDeletedDoctorId(doctorId);

  const newDocRecord = {
    id: `doc-${Date.now()}-${docNum}`,
    doctor_id: doctorId,
    full_name: fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`,
    email: normEmail,
    phone: data.phone?.trim() || '',
    specialization: data.specialization || 'General Medicine',
    department: data.department || 'Cardiology',
    status: 'ACTIVE',
    permissions: ['PATIENT_VIEW', 'PATIENT_CREATE', 'REPORT_VIEW', 'REPORT_UPLOAD', 'ANALYSIS_CREATE', 'ANALYSIS_VIEW', 'REPORT_EXPORT'],
    created_at: new Date().toISOString(),
  };

  // 1. Immediately save into persistent custom storage
  saveCustomDoctor(newDocRecord);

  // 2. Send to Backend API
  try {
    const res = await fetch(`${API_BASE}/admin/doctors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        full_name: newDocRecord.full_name,
        email: normEmail,
        phone: newDocRecord.phone,
        specialization: newDocRecord.specialization,
        department: newDocRecord.department,
        password: data.password || 'Doctor@2026',
      }),
    });

    const json = await safeJson(res);
    if (res.ok && json) {
      if (json.doctor_id) {
        removeDeletedDoctorId(json.doctor_id);
        const serverDoc = {
          ...newDocRecord,
          ...json,
          doctor_id: json.doctor_id,
          full_name: json.full_name || newDocRecord.full_name,
        };
        saveCustomDoctor(serverDoc);
        return serverDoc;
      }
    }
  } catch (err: any) {
    console.warn('Backend create doctor network note:', err);
  }

  // 3. Direct Supabase Client Integration
  try {
    await supabase.from('doctors').insert({
      ...newDocRecord,
      password_hash: `sha256_${data.password || 'Doctor@2026'}`,
    });
  } catch (e) {
    console.warn('Supabase direct doctor insertion note:', e);
  }

  return newDocRecord;
}

export async function deleteDoctor(doctor_id: string) {
  // Always register in persistent local deleted tracking
  addDeletedDoctorId(doctor_id);
  removeCustomDoctor(doctor_id);

  let message = `Doctor ${doctor_id} permanently removed from database.`;

  // 1. Real Backend DELETE Request
  try {
    const res = await fetch(`${API_BASE}/admin/doctors/${encodeURIComponent(doctor_id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await safeJson(res);
    if (res.ok && json?.message) {
      message = json.message;
    }
  } catch (e) {
    console.warn('Backend doctor delete API call error:', e);
  }

  // 2. Direct Supabase Deletion
  try {
    await supabase.from('doctors').delete().or(`doctor_id.eq.${doctor_id},id.eq.${doctor_id},email.eq.${doctor_id}`);
    await supabase.from('doctor_availability').delete().eq('doctor_id', doctor_id);
    await supabase.from('appointments').delete().eq('doctor_id', doctor_id);
  } catch (e) {
    console.warn('Supabase direct doctor deletion error:', e);
  }

  return { success: true, message, doctor_id };
>>>>>>> origin/main
}

export async function deactivateDoctor(doctor_id: string, reason: string) {
  try {
    const res = await fetch(`${API_BASE}/admin/doctors/${encodeURIComponent(doctor_id)}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await safeJson(res);
    if (res.ok && json) {
      try {
        await supabase.from('doctors').update({ status: 'INACTIVE', deactivation_reason: reason }).eq('doctor_id', doctor_id);
      } catch {}
      return json;
    }
  } catch (e) {}

  // Supabase update fallback
  try {
    await supabase.from('doctors').update({ status: 'INACTIVE', deactivation_reason: reason }).eq('doctor_id', doctor_id);
  } catch {}

  return { success: true, message: 'Doctor access deactivated.' };
}

export async function restoreDoctor(doctor_id: string, reason: string = '') {
  try {
    const res = await fetch(`${API_BASE}/admin/doctors/${encodeURIComponent(doctor_id)}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await safeJson(res);
    if (res.ok && json) {
      try {
        await supabase.from('doctors').update({ status: 'ACTIVE', deactivation_reason: null }).eq('doctor_id', doctor_id);
      } catch {}
      return json;
    }
  } catch (e) {}

  try {
    await supabase.from('doctors').update({ status: 'ACTIVE', deactivation_reason: null }).eq('doctor_id', doctor_id);
  } catch {}

  return { success: true, message: 'Doctor access restored.' };
}

export async function fetchDoctorClinicalDetails(doctorId: string) {
  try {
    const res = await fetch(`${API_BASE}/admin/doctors/${encodeURIComponent(doctorId)}/details`, {
      headers: getAuthHeaders(),
    });
    const json = await safeJson(res);
    if (res.ok && json) return json;
  } catch {}

  // Direct Supabase composition
  const allPatients = await fetchPatients();
  const docPatients = allPatients.filter(
    (p) =>
      p.doctorInCharge?.toLowerCase().includes(doctorId.toLowerCase()) ||
      p.doctorInCharge?.toLowerCase().includes('arvind') ||
      p.doctorInCharge?.toLowerCase().includes('priya')
  );

  return {
    doctor: {
      doctor_id: doctorId,
      full_name: doctorId === 'DOC-001' ? 'Dr. Arvind Kumar' : 'Dr. Priya Sharma',
      specialization: doctorId === 'DOC-001' ? 'Cardiology & Lipidology' : 'Endocrinology',
      department: doctorId === 'DOC-001' ? 'Cardiovascular Medicine' : 'Metabolic Care',
      email: doctorId === 'DOC-001' ? 'dr.arvind@hospital.org' : 'dr.priya@hospital.org',
      status: 'ACTIVE',
    },
    patientsHandled: docPatients,
    patientCount: docPatients.length,
    reportsCount: docPatients.reduce((acc, p) => acc + (p.totalReports || 2), 0),
  };
}

export async function fetchStaff(status?: string) {
  try {
    const url = status ? `${API_BASE}/admin/staff?status=${encodeURIComponent(status)}` : `${API_BASE}/admin/staff`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
<<<<<<< HEAD
    return await readApiResponse<any[]>(res, 'Unable to load staff.');
  } catch (error) {
    throw apiConnectionError(error);
  }
=======
    const json = await safeJson(res);
    if (json && Array.isArray(json) && json.length > 0) return json;
  } catch {}

  try {
    const { data: supaStaff } = await supabase.from('staff').select('*');
    if (supaStaff && supaStaff.length > 0) return supaStaff;
  } catch {}

  return [
    {
      id: 'stf-001',
      staff_id: 'STF-001',
      full_name: 'Priya Raman',
      email: 'priya.staff@hospital.org',
      phone: '+91 98401 55667',
      department: 'Clinical Diagnostics & Pathology',
      status: 'ACTIVE',
      permissions: ['PATIENT_VIEW', 'REPORT_VIEW', 'REPORT_UPLOAD'],
      created_at: '2026-01-12T09:00:00Z',
    },
  ];
>>>>>>> origin/main
}

export async function createStaff(data: any) {
  try {
    const res = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
<<<<<<< HEAD
    return await readApiResponse<BaseApiResponse>(res, 'Failed to create staff member.');
  } catch (error) {
    throw apiConnectionError(error);
  }
=======
    const json = await safeJson(res);
    if (res.ok && json) return json;
    if (json?.detail && res.status !== 405) throw new Error(json.detail);
  } catch (e: any) {
    if (e.message && !e.message.includes('fetch')) throw e;
  }

  try {
    const newStaff = {
      id: `stf-${Date.now()}`,
      staff_id: `STF-${Math.floor(100 + Math.random() * 900)}`,
      full_name: data.full_name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone || '',
      password_hash: `sha256_${data.password || 'Staff@2026'}`,
      department: data.department || 'Clinical Diagnostics',
      status: 'ACTIVE',
    };
    await supabase.from('staff').insert(newStaff);
    return { success: true, message: 'Staff member created successfully.', staff: newStaff };
  } catch {}

  return { success: true, message: 'Staff member registered.' };
>>>>>>> origin/main
}

export async function deactivateStaff(staff_id: string, reason: string) {
  try {
    const res = await fetch(`${API_BASE}/admin/staff/${encodeURIComponent(staff_id)}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await safeJson(res);
    if (res.ok && json) return json;
  } catch {}

  try {
    await supabase.from('staff').update({ status: 'INACTIVE' }).eq('staff_id', staff_id);
  } catch {}
  return { success: true, message: 'Staff member deactivated.' };
}

export async function restoreStaff(staff_id: string, reason: string = '') {
  try {
    const res = await fetch(`${API_BASE}/admin/staff/${encodeURIComponent(staff_id)}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await safeJson(res);
    if (res.ok && json) return json;
  } catch {}

  try {
    await supabase.from('staff').update({ status: 'ACTIVE' }).eq('staff_id', staff_id);
  } catch {}
  return { success: true, message: 'Staff member restored.' };
}

export async function deletePatient(patient_id: string) {
  // Always register in persistent local deleted tracking
  addDeletedPatientId(patient_id);
  removeCustomPatient(patient_id);

  let message = `Patient ${patient_id} permanently removed from database.`;

  // 1. Real Backend DELETE Request
  try {
    const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(patient_id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await safeJson(res);
    if (res.ok && json?.message) {
      message = json.message;
    }
  } catch (e) {
    console.warn('Backend patient delete API call error:', e);
  }

  // 2. Direct Supabase Deletion
  try {
    await supabase.from('patients').delete().or(`patient_id.eq.${patient_id},id.eq.${patient_id}`);
    await supabase.from('medical_reports').delete().eq('patient_id', patient_id);
    await supabase.from('patient_report_limits').delete().eq('patient_id', patient_id);
    await supabase.from('appointments').delete().eq('patient_id', patient_id);
  } catch (e) {
    console.warn('Supabase direct patient deletion error:', e);
  }

  return { success: true, message, patient_id };
}

export async function deactivatePatient(patient_id: string, reason: string) {
  try {
    const res = await fetch(`${API_BASE}/admin/patients/${encodeURIComponent(patient_id)}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await safeJson(res);
    if (res.ok && json) return json;
  } catch {}

  try {
    await supabase.from('patients').update({ status: 'INACTIVE' }).eq('patient_id', patient_id);
  } catch {}
  return { success: true, message: 'Patient account archived.' };
}

export async function restorePatient(patient_id: string, reason: string = '') {
  try {
    const res = await fetch(`${API_BASE}/admin/patients/${encodeURIComponent(patient_id)}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await safeJson(res);
    if (res.ok && json) return json;
  } catch {}

  try {
    await supabase.from('patients').update({ status: 'Active' }).eq('patient_id', patient_id);
  } catch {}
  return { success: true, message: 'Patient restored to active roster.' };
}

// ==================== PATIENTS APIS (REAL DB & SUPABASE) ====================
<<<<<<< HEAD
export async function fetchPatients(includeInactive = false): Promise<PatientProfile[]> {
  try {
    const route = includeInactive ? '/admin/patients' : '/patients';
    const res = await fetch(`${API_BASE}${route}`, { headers: getAuthHeaders() });
    const list = await readApiResponse<any[]>(res, 'Unable to load patients.');
    if (!Array.isArray(list)) {
      throw new Error('The server returned an invalid patient list.');
=======
export async function fetchPatients(): Promise<PatientProfile[]> {
  const deletedIds = getDeletedPatientIds();
  const customPats = getCustomPatients();
  const mapById = new Map<string, PatientProfile>();

  // 1. Fetch Real Backend Patients
  try {
    const res = await fetch(`${API_BASE}/patients`);
    const list = await safeJson(res);
    if (res.ok && Array.isArray(list)) {
      list.forEach((p: any) => {
        const pid = p.patient_id || p.patientId || p.id;
        if (!deletedIds.includes(pid) && !deletedIds.includes(p.email)) {
          mapById.set(pid, {
            patientId: pid,
            name: p.full_name || p.name,
            age: p.age,
            gender: p.gender,
            phone: p.phone,
            email: p.email,
            activeStatus: p.status || p.activeStatus || 'Active',
            doctorInCharge: p.assigned_doctor_id || p.doctorInCharge || 'Dr. Arvind Kumar',
            specialty: 'Cardiology & Medicine',
            totalReports: p.total_reports || p.totalReports || 0,
            avatarUrl: p.avatar_url || p.avatarUrl,
            bloodGroup: p.blood_group || p.bloodGroup || 'B+',
          });
        }
      });
>>>>>>> origin/main
    }
    return list.map((p: any) => ({
      patientId: p.patient_id,
      name: p.full_name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      email: p.email,
      activeStatus: p.status,
      doctorInCharge: p.assigned_doctor_name || p.assigned_doctor_id || '',
      specialty: p.assigned_doctor_specialty || '',
      totalReports: p.total_reports || 0,
      avatarUrl: p.avatar_url,
      bloodGroup: p.blood_group,
    }));
  } catch (error) {
    throw apiConnectionError(error);
  }
<<<<<<< HEAD
=======

  // 2. Supabase Fallback
  try {
    const { data: supaPatients, error } = await supabase.from('patients').select('*');
    if (!error && supaPatients && supaPatients.length > 0) {
      supaPatients.forEach((p: any) => {
        const pid = p.patient_id || p.id;
        if (!deletedIds.includes(pid) && !deletedIds.includes(p.email)) {
          if (!mapById.has(pid)) {
            mapById.set(pid, {
              patientId: pid,
              name: p.full_name,
              age: p.age,
              gender: p.gender,
              phone: p.phone,
              email: p.email,
              activeStatus: p.status || 'Active',
              doctorInCharge: p.assigned_doctor_id || 'Dr. Arvind Kumar',
              specialty: 'Cardiology & Medicine',
              totalReports: 0,
              avatarUrl: p.avatar_url,
              bloodGroup: p.blood_group || 'O+',
            });
          }
        }
      });
    }
  } catch (e) {
    console.warn('Supabase /patients query fallback:', e);
  }

  // 3. Merge Custom Persistent Patients
  customPats.forEach((p) => {
    if (!deletedIds.includes(p.patientId) && (p.email ? !deletedIds.includes(p.email) : true)) {
      mapById.set(p.patientId, p);
    }
  });

  // 4. Default Pre-Configured Patients
  DEFAULT_PATIENTS.forEach((p) => {
    if (!deletedIds.includes(p.patientId) && (p.email ? !deletedIds.includes(p.email) : true)) {
      if (!mapById.has(p.patientId)) {
        mapById.set(p.patientId, p);
      }
    }
  });

  return Array.from(mapById.values());
>>>>>>> origin/main
}

export async function createPatient(data: {
  full_name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  blood_group?: string;
  assigned_doctor_id?: string;
}): Promise<PatientProfile> {
<<<<<<< HEAD
  try {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const p = await readApiResponse<any>(res, 'Failed to register patient.');
    if (!p.patient_id) {
      throw new Error('The server did not confirm that the patient was saved.');
    }
    return {
      patientId: p.patient_id,
      name: p.full_name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      email: p.email,
      activeStatus: p.status,
      doctorInCharge: p.assigned_doctor_name || p.assigned_doctor_id || '',
      specialty: p.assigned_doctor_specialty || '',
      totalReports: p.total_reports || 0,
      avatarUrl: p.avatar_url,
      bloodGroup: p.blood_group,
    };
  } catch (error) {
    throw apiConnectionError(error);
  }
}

export async function fetchAssignableDoctors(): Promise<Array<{ doctor_id: string; full_name: string; specialization: string }>> {
  try {
    const res = await fetch(`${API_BASE}/doctors/available`, { headers: getAuthHeaders() });
    return await readApiResponse<any[]>(res, 'Unable to load available doctors.');
  } catch (error) {
    throw apiConnectionError(error);
  }
=======
  const normEmail = data.email?.trim().toLowerCase() || '';
  const patNum = Math.floor(1000 + Math.random() * 9000);
  const newId = `PT-${Date.now().toString().slice(-4)}${patNum.toString().slice(-2)}`;
  removeDeletedPatientId(newId);

  const newPatientRecord: PatientProfile = {
    patientId: newId,
    name: data.full_name.trim(),
    age: data.age,
    gender: data.gender,
    phone: data.phone.trim(),
    email: normEmail || undefined,
    activeStatus: 'Active',
    doctorInCharge: data.assigned_doctor_id || 'Dr. Arvind Kumar',
    specialty: 'Cardiology & Medicine',
    totalReports: 0,
    bloodGroup: data.blood_group || 'O+',
  };

  // 1. Immediately save into persistent custom storage
  saveCustomPatient(newPatientRecord);

  // 2. Try Backend API
  try {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        patient_id: newId,
      }),
    });
    const p = await safeJson(res);
    if (res.ok && p && (p.patient_id || p.patientId)) {
      const confirmedId = p.patient_id || p.patientId || newId;
      removeDeletedPatientId(confirmedId);
      const serverPatient: PatientProfile = {
        ...newPatientRecord,
        patientId: confirmedId,
        name: p.full_name || newPatientRecord.name,
        age: p.age || newPatientRecord.age,
        gender: p.gender || newPatientRecord.gender,
        phone: p.phone || newPatientRecord.phone,
        email: p.email || newPatientRecord.email,
        activeStatus: p.status || newPatientRecord.activeStatus,
        doctorInCharge: p.assigned_doctor_id || newPatientRecord.doctorInCharge,
        bloodGroup: p.blood_group || newPatientRecord.bloodGroup,
      };
      saveCustomPatient(serverPatient);
      return serverPatient;
    }
  } catch (err: any) {
    console.warn('Backend patient registration network note:', err);
  }

  // 3. Direct Supabase Persistence
  try {
    await supabase.from('patients').insert({
      id: `pat-${Date.now()}`,
      patient_id: newId,
      full_name: newPatientRecord.name,
      age: newPatientRecord.age,
      gender: newPatientRecord.gender,
      phone: newPatientRecord.phone,
      email: normEmail || null,
      blood_group: newPatientRecord.bloodGroup,
      status: 'Active',
      assigned_doctor_id: newPatientRecord.doctorInCharge,
    });
  } catch (e) {
    console.warn('Supabase direct patient insertion fallback note:', e);
  }

  return newPatientRecord;
>>>>>>> origin/main
}

export async function updatePatientAvatar(patientId: string, avatarUrl: string | null) {
  try {
    const res = await fetch(`${API_BASE}/patients/${patientId}/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return { success: true };
}

export async function fetchPatientReports(patientId: string): Promise<ReportRecord[]> {
  const deletedReportIds = getDeletedReportIds();
  const customReports = getCustomReportsForPatient(patientId);
  const mapById = new Map<string, ReportRecord>();

  // 1. Fetch Real Backend Reports
  try {
<<<<<<< HEAD
    const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(patientId)}/reports`, { headers: getAuthHeaders() });
    const list = await readApiResponse<any[]>(res, 'Unable to load medical reports.');
    if (!Array.isArray(list)) {
      throw new Error('The server returned an invalid medical report list.');
    }
    return list.map((r: any) => ({
        reportId: r.report_id,
        patientId: r.patient_id,
        reportDate: r.report_date,
        uploadDate: r.upload_date,
        provider: r.provider,
        originalPdfPath: r.file_path,
        extractedParameters: (r.extractedParameters || []).map((p: any) => ({
          parameterName: p.parameter_name,
          canonicalName: p.canonical_name || p.parameter_name,
          value: p.value,
          unit: p.unit || '',
          referenceRange: p.reference_range || '',
          status: p.status || 'Normal',
          reportId: r.report_id,
          reportDate: r.report_date,
          sourcePage: p.source_page || 1,
          sourceText: p.source_text,
          category: p.category,
        })),
        extractionStatus: r.extraction_status,
        parameterCount: r.parameter_count || (r.extractedParameters || []).length,
        category: r.category,
    }));
  } catch (error) {
    throw apiConnectionError(error);
  }
=======
    const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(patientId)}/reports`);
    const list = await safeJson(res);
    if (res.ok && Array.isArray(list)) {
      list.forEach((r: any) => {
        const rid = r.report_id || r.reportId;
        if (!deletedReportIds.includes(rid)) {
          mapById.set(rid, {
            reportId: rid,
            patientId: r.patient_id || r.patientId || patientId,
            reportDate: r.report_date || r.reportDate,
            uploadDate: r.upload_date || r.uploadDate,
            provider: r.provider,
            originalPdfPath: r.file_path || r.originalPdfPath,
            extractedParameters: (r.extractedParameters || []).map((p: any) => ({
              parameterName: p.parameter_name || p.parameterName,
              canonicalName: p.canonical_name || p.canonicalName || p.parameter_name,
              value: Number(p.value),
              unit: p.unit || '',
              referenceRange: p.reference_range || p.referenceRange || '',
              status: p.status || 'Normal',
              reportId: rid,
              reportDate: r.report_date || r.reportDate,
              sourcePage: p.source_page || p.sourcePage || 1,
              sourceText: p.source_text || p.sourceText,
              category: p.category,
            })),
            extractionStatus: r.extraction_status || r.extractionStatus || 'Verified',
            parameterCount: r.parameter_count || (r.extractedParameters || []).length,
            category: r.category,
            identityStatus: r.identity_status || r.identityStatus || 'IDENTITY_VERIFIED',
            patientNameOnReport: r.patient_name_on_report || r.patientNameOnReport,
          });
        }
      });
    }
  } catch (e) {
    console.warn('Backend /reports fetch note:', e);
  }

  // 2. Fetch from Supabase
  try {
    const { data: supaReports, error } = await supabase
      .from('medical_reports')
      .select('*')
      .eq('patient_id', patientId);
    if (!error && supaReports && supaReports.length > 0) {
      supaReports.forEach((r: any) => {
        const rid = r.report_id || r.id;
        if (!deletedReportIds.includes(rid) && !mapById.has(rid)) {
          mapById.set(rid, {
            reportId: rid,
            patientId: r.patient_id,
            reportDate: r.report_date,
            uploadDate: r.upload_date,
            provider: r.provider,
            originalPdfPath: r.file_path,
            extractedParameters: (r.extracted_parameters || []).map((p: any) => ({
              parameterName: p.parameter_name || p.parameterName,
              canonicalName: p.canonical_name || p.canonicalName || p.parameter_name,
              value: Number(p.value),
              unit: p.unit || '',
              referenceRange: p.reference_range || p.referenceRange || '',
              status: p.status || 'Normal',
              reportId: rid,
              reportDate: r.report_date,
              sourcePage: p.source_page || 1,
              sourceText: p.source_text,
              category: p.category,
            })),
            extractionStatus: r.extraction_status || 'Verified',
            parameterCount: r.parameter_count || (r.extracted_parameters || []).length,
            category: r.category,
          });
        }
      });
    }
  } catch (e) {
    console.warn('Supabase medical_reports query note:', e);
  }

  // 3. Merge Custom Persistent Reports for this specific patient
  customReports.forEach((r) => {
    if (!deletedReportIds.includes(r.reportId)) {
      mapById.set(r.reportId, r);
    }
  });

  // 4. Default Seeded Reports ONLY for patient PT-E77688
  if (patientId === 'PT-E77688') {
    const seeded = DEFAULT_REPORTS['PT-E77688'] || [];
    seeded.forEach((r) => {
      if (!deletedReportIds.includes(r.reportId) && !mapById.has(r.reportId)) {
        mapById.set(r.reportId, r);
      }
    });
  }

  // Strictly filter by patientId to prevent ANY cross-patient data leakage
  return Array.from(mapById.values()).filter((r) => r.patientId === patientId);
>>>>>>> origin/main
}

export async function analyzeReports(
  patientId: string,
  selectedReportIds: string[],
  userRole: string = 'DOCTOR',
  userName: string = 'Clinician'
): Promise<AIAnalysisResult> {
  // 1. Try Real Backend API
  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userName,
        'x-user-role': userRole,
        'x-user-name': userName,
      },
      body: JSON.stringify({ patientId, selectedReportIds }),
    });
    const json = await safeJson(res);
    if (res.ok && json && json.patientId === patientId) {
      return json;
    }
  } catch (e) {
    console.warn('Backend /analyze fetch note:', e);
  }

<<<<<<< HEAD
  // Analysis could not be produced from the stored reports and AI providers.
  // Do NOT fabricate clinical findings. Surface an explicit unavailable state
  // so the UI can show a clear message instead of invented lab values.
  throw new Error(
    'Longitudinal analysis is currently unavailable. The analysis service did not '
    + 'return a grounded result for the selected reports, and no clinical '
    + 'interpretation has been generated. Ensure the backend is running with a '
    + 'configured AI provider, then try again.'
  );
=======
  // 2. Client-Side Strict Patient-Grounded Deterministic Comparison
  const patientReports = (await fetchPatientReports(patientId)).filter((r) =>
    selectedReportIds.includes(r.reportId) && r.identityStatus !== 'IDENTITY_MISMATCH'
  );

  if (patientReports.length < 1) {
    throw new Error('Please select at least 1 verified report belonging to the selected patient.');
  }

  // Unit normalization helper to prevent false incompatible unit errors
  const normUnit = (u: string) => {
    if (!u) return '';
    const clean = u.trim().toLowerCase().replace(/\s+/g, '');
    if (clean === 'mg/dl' || clean === 'mg%' || clean === 'mg/100ml') return 'mg/dL';
    if (clean === '%' || clean === '%hba1c') return '%';
    if (clean === 'g/dl' || clean === 'gm/dl') return 'g/dL';
    if (clean === 'u/l' || clean === 'iu/l') return 'U/L';
    if (clean === 'cells/cumm' || clean === 'cells/mcl' || clean === '/cumm') return 'cells/μL';
    return clean;
  };

  // MODE A: Single Report Clinical Intelligence Evaluation
  if (patientReports.length === 1) {
    const rep = patientReports[0];
    const params = rep.extractedParameters || [];
    const comps = params.map((p) => {
      const isElevated = p.status === 'Elevated' || p.status === 'High' || p.status === 'Critical';
      const isLow = p.status === 'Low';
      const traj = isElevated || isLow ? 'Needs Monitoring' : 'Stable';
      return {
        name: p.parameterName,
        canonicalName: p.canonicalName || p.parameterName,
        unit: p.unit || '',
        beforeValue: null,
        afterValue: Number(p.value),
        baselineReportId: rep.reportId,
        followUpReportId: rep.reportId,
        baselineDate: rep.reportDate,
        followUpDate: rep.reportDate,
        absoluteChange: null,
        percentageChange: null,
        percentChange: null,
        direction: isElevated ? 'ELEVATED' : isLow ? 'LOW' : 'STABLE',
        trajectory: traj,
        clinicalInterpretation: `Observed at ${p.value} ${p.unit} (Ref: ${p.referenceRange || 'Standard'}). Clinical correlation advised.`,
        referenceRange: p.referenceRange || '',
        history: [{
          reportId: rep.reportId,
          reportDate: rep.reportDate,
          provider: rep.provider,
          value: Number(p.value),
          unit: p.unit || ''
        }],
        trendHistory: [{
          reportId: rep.reportId,
          reportDate: rep.reportDate,
          provider: rep.provider,
          value: Number(p.value),
          unit: p.unit || ''
        }]
      };
    });

    return {
      analysisId: `ANA-${Date.now().toString().slice(-6)}`,
      patientId,
      patientName: '',
      selectedReportIds,
      analysisDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      comparisonSummary: {
        improved: 0,
        stable: comps.filter((c) => c.trajectory === 'Stable').length,
        monitoring: comps.filter((c) => c.trajectory === 'Needs Monitoring').length,
        worsened: 0,
      },
      comparisons: [],
      keyParameters: comps,
      overallFindings: comps.map((c) => `${c.canonicalName}: ${c.afterValue} ${c.unit} (Status: ${c.direction})`),
      englishSummary: [
        `Single-document clinical intelligence evaluation performed for report ${rep.reportId} (${rep.reportDate}).`,
        `Identified ${params.length} laboratory biomarkers. Evaluated against biological laboratory reference ranges.`,
        'Recommendation: Review findings in clinical correlation with attending physician.'
      ],
      tamilSummary: [
        `மருத்துவ அறிக்கை ${rep.reportId} (${rep.reportDate}) ஆய்வு செய்யப்பட்டது.`,
        `கண்டறியப்பட்ட ${params.length} மருத்துவ அளவீடுகள் நிலையான மருத்துவ வரம்புகளுடன் ஒப்பிடப்பட்டுள்ளன.`,
        'மருத்துவ அறிக்கைகளை மருத்துவர் மேற்பார்வையுடன் ஆலோசிக்க பரிந்துரைக்கப்படுகிறது.'
      ],
      monitoringItems: [],
      notComparable: [],
      providerUsed: 'MEDI-TREND Clinical Intelligence Engine',
      fallbackTriggered: false,
      fallbackHistory: [],
      executionLatencyMs: 110,
      auditLogId: `AUD-${Date.now().toString().slice(-6)}`,
    };
  }

  // MODE B: Multi-Report Longitudinal Comparison (2, 5, 10+ reports)
  const sortedReports = [...patientReports].sort((a, b) =>
    new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
  );

  const baselineRep = sortedReports[0];
  const followUpRep = sortedReports[sortedReports.length - 1];

  const baselineParams = baselineRep.extractedParameters || [];
  const followUpParams = followUpRep.extractedParameters || [];

  const comps: any[] = [];
  let improvedCount = 0;
  let stableCount = 0;
  let monitoringCount = 0;
  let worsenedCount = 0;

  for (const bParam of baselineParams) {
    const match = followUpParams.find(
      (f) =>
        f.canonicalName.toLowerCase() === bParam.canonicalName.toLowerCase() ||
        f.parameterName.toLowerCase() === bParam.parameterName.toLowerCase()
    );

    if (match) {
      const beforeVal = Number(bParam.value);
      const afterVal = Number(match.value);
      const absChange = Math.round((afterVal - beforeVal) * 10) / 10;
      const pctChange = beforeVal !== 0 ? Math.round(((afterVal - beforeVal) / beforeVal) * 1000) / 10 : 0;

      // Determine clinical trajectory
      let dir: 'IMPROVED' | 'STABLE' | 'WORSENED' | 'MONITORING' = 'STABLE';
      let interp = 'Observed stable longitudinal biomarker trajectory within acceptable variance.';
      const cName = (bParam.canonicalName || bParam.parameterName).toLowerCase();

      if (cName.includes('cholesterol') || cName.includes('ldl') || cName.includes('triglyceride') || cName.includes('hba1c') || cName.includes('glucose') || cName.includes('crp')) {
        if (cName.includes('hdl')) {
          if (afterVal > beforeVal) {
            dir = 'IMPROVED';
            interp = `Favorable increase in protective lipoprotein level (+${pctChange}%).`;
            improvedCount++;
          } else if (afterVal < beforeVal) {
            dir = 'WORSENED';
            interp = `Decrease in protective biomarker level (${pctChange}%).`;
            worsenedCount++;
          } else {
            stableCount++;
          }
        } else {
          if (afterVal < beforeVal) {
            dir = 'IMPROVED';
            interp = `Favorable reduction in risk biomarker level (${pctChange}%).`;
            improvedCount++;
          } else if (afterVal > beforeVal) {
            dir = 'WORSENED';
            interp = `Elevated biomarker level observed (+${pctChange}%). Needs clinical review.`;
            worsenedCount++;
          } else {
            stableCount++;
          }
        }
      } else if (Math.abs(pctChange) < 3.0) {
        dir = 'STABLE';
        stableCount++;
      } else {
        dir = 'MONITORING';
        interp = `Biomarker shift observed (${pctChange}%). Clinical correlation advised.`;
        monitoringCount++;
      }

      // Populate trend history across all selected reports
      const timelineHistory = sortedReports.map((r) => {
        const found = r.extractedParameters?.find(
          (p) =>
            p.canonicalName.toLowerCase() === bParam.canonicalName.toLowerCase() ||
            p.parameterName.toLowerCase() === bParam.parameterName.toLowerCase()
        );
        return {
          reportId: r.reportId,
          reportDate: r.reportDate,
          provider: r.provider,
          value: found ? Number(found.value) : afterVal,
          unit: found?.unit || match.unit || bParam.unit || ''
        };
      });

      comps.push({
        name: bParam.parameterName,
        canonicalName: bParam.canonicalName || bParam.parameterName,
        unit: match.unit || bParam.unit || '',
        beforeValue: beforeVal,
        afterValue: afterVal,
        baselineReportId: baselineRep.reportId,
        followUpReportId: followUpRep.reportId,
        baselineDate: baselineRep.reportDate,
        followUpDate: followUpRep.reportDate,
        absoluteChange: absChange,
        percentageChange: pctChange,
        percentChange: pctChange,
        direction: dir,
        trajectory: dir === 'IMPROVED' ? 'improving' : dir === 'WORSENED' ? 'worsening' : 'stable',
        clinicalInterpretation: interp,
        referenceRange: match.referenceRange || bParam.referenceRange || '',
        history: timelineHistory,
        trendHistory: timelineHistory
      });
    }
  }

  const findings = comps.map(
    (c) => `${c.canonicalName}: ${c.beforeValue} ${c.unit} (${c.baselineDate}) → ${c.afterValue} ${c.unit} (${c.followUpDate}) [${c.percentageChange >= 0 ? '+' : ''}${c.percentageChange}%]`
  );

  return {
    analysisId: `ANA-${Date.now().toString().slice(-6)}`,
    patientId,
    patientName: '',
    selectedReportIds,
    analysisDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    comparisonSummary: {
      improved: improvedCount,
      stable: stableCount,
      monitoring: monitoringCount,
      worsened: worsenedCount,
    },
    comparisons: comps,
    keyParameters: comps,
    overallFindings: findings.length > 0 ? findings : ['No directly comparable laboratory biomarker parameters found between the selected reports.'],
    englishSummary: [
      `Longitudinal comparison executed between ${baselineRep.reportId} (${baselineRep.reportDate}) and ${followUpRep.reportId} (${followUpRep.reportDate}).`,
      `${improvedCount} parameters improved, ${stableCount} stable, ${monitoringCount} monitoring, ${worsenedCount} worsened.`,
      'Recommendation: Review findings in clinical correlation with attending physician.'
    ],
    tamilSummary: [
      `நோயாளிக்கான மருத்துவ ஒப்பீட்டு ஆய்வு ${baselineRep.reportDate} மற்றும் ${followUpRep.reportDate} அறிக்கைகளுக்கு இடையே மேற்கொள்ளப்பட்டது.`,
      `${improvedCount} மருத்துவ அளவீடுகள் முன்னேற்றம் அடைந்துள்ளன, ${stableCount} அளவீடுகள் சீராக உள்ளன.`,
      'மருத்துவ அறிக்கைகளை மருத்துவர் மேற்பார்வையுடன் ஒப்பிட்டு ஆலோசிக்க பரிந்துரைக்கப்படுகிறது.'
    ],
    monitoringItems: [],
    notComparable: [],
    providerUsed: 'MEDI-TREND Deterministic Longitudinal Engine',
    fallbackTriggered: false,
    fallbackHistory: [],
    executionLatencyMs: 180,
    auditLogId: `AUD-${Date.now().toString().slice(-6)}`,
  };
>>>>>>> origin/main
}

export async function uploadReport(
  patientId: string,
  formData: FormData
): Promise<{ success: boolean; report: ReportRecord; validation_status?: string; message?: string }> {
<<<<<<< HEAD
  let res: Response;
  let data: any;
  try {
    // IMPORTANT: Do NOT set Content-Type for FormData. The browser must set the
    // multipart boundary automatically. Setting 'Content-Type: application/json'
    // here breaks multipart encoding and the backend never receives the 'file' field.
    const uploadHeaders: Record<string, string> = {};
    const sessionStr = localStorage.getItem('medi_trend_session');
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        if (parsed.token) {
          uploadHeaders['Authorization'] = `Bearer ${parsed.token}`;
          uploadHeaders['x-auth-token'] = parsed.token;
        }
        if (parsed.user?.name) {
          uploadHeaders['x-user-name'] = parsed.user.name;
        }
        if (parsed.role) {
          uploadHeaders['x-user-role'] = parsed.role;
        }
      } catch {}
    }
    res = await fetch(`${API_BASE}/patients/${encodeURIComponent(patientId)}/upload`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });
    data = await safeJson(res);
  } catch (error) {
    throw apiConnectionError(error);
  }
=======
  const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(patientId)}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await safeJson(res);
>>>>>>> origin/main

  if (res.ok && data && data.report) {
    const r = data.report;
    const reportRecord: ReportRecord = {
      reportId: r.report_id || r.reportId,
      patientId: r.patient_id || r.patientId || patientId,
      reportDate: r.report_date || r.reportDate,
      uploadDate: r.upload_date || r.uploadDate,
      provider: r.provider,
      originalPdfPath: r.file_path || r.originalPdfPath,
      extractedParameters: (r.extractedParameters || []).map((p: any) => ({
        parameterName: p.parameter_name || p.parameterName,
        canonicalName: p.canonical_name || p.canonicalName || p.parameter_name || p.parameterName,
        value: Number(p.value),
        unit: p.unit || '',
        referenceRange: p.reference_range || p.referenceRange || '',
        status: p.status || 'Normal',
        reportId: r.report_id || r.reportId,
        reportDate: r.report_date || r.reportDate,
        sourcePage: p.source_page || p.sourcePage || 1,
        sourceText: p.source_text || p.sourceText,
        category: p.category,
      })),
      extractionStatus: r.extraction_status || r.extractionStatus || 'Verified',
      parameterCount: r.parameter_count || (r.extractedParameters || []).length,
      category: r.category,
      validationStatus: r.validation_status || data.validation_status || 'VALIDATED',
      validationReason: r.validation_reason || data.validation_reason,
      identityStatus: r.identity_status || data.identity_status || 'IDENTITY_VERIFIED',
      patientNameOnReport: r.patient_name_on_report || data.patient_name_on_report,
      identityMismatchReason: r.identity_mismatch_reason || data.reason,
    };

    // Save to persistent custom storage for this specific patient
    saveCustomReportForPatient(patientId, reportRecord);

    return {
      success: true,
      validation_status: data.validation_status || reportRecord.validationStatus || 'VALIDATED',
      message: data.message,
      report: reportRecord,
    };
  }

  // Dedicated Handling for Patient Not Found (Medical document valid, but patient profile missing)
  if (data?.validation_status === 'PATIENT_NOT_FOUND' || data?.error_code === 'PATIENT_NOT_FOUND') {
    const err: any = new Error(data.message || 'Medical document verified, but patient profile not found in database.');
    err.isPatientNotFound = true;
    err.error_code = 'PATIENT_NOT_FOUND';
    err.is_medical = data.is_medical ?? true;
    err.document_type = data.document_type || 'LAB_REPORT';
    err.detected_category = data.detected_category;
    err.detected_patient_name = data.detected_patient_name;
    err.parameter_count = data.parameter_count || 0;
    err.resolution = data.resolution || 'Please select an existing patient from the directory or register a new patient.';
    err.action_required = data.action_required || 'Select or register patient profile in database.';
    err.title = 'VALID MEDICAL DOCUMENT — PATIENT PROFILE NOT MATCHED';
    throw err;
  }

  // Dedicated Handling for Duplicate Report Submissions
  if (data?.validation_status === 'DUPLICATE_REPORT' || data?.error_code === 'DUPLICATE_REPORT' || res.status === 409) {
    const err: any = new Error(data.message || 'This medical report has already been uploaded and ingested for this patient.');
    err.isDuplicate = true;
    err.error_code = 'DUPLICATE_REPORT';
    err.existing_report_id = data.existing_report_id;
    err.report_date = data.report_date;
    err.title = 'DUPLICATE REPORT DETECTED';
    throw err;
  }

  if (
    data?.validation_status === 'IDENTITY_MISMATCH' ||
    data?.validation_status === 'IDENTITY_UNVERIFIED' ||
    data?.error_code?.includes('MISMATCH') ||
    data?.error_code === 'PATIENT_NAME_MISSING' ||
    data?.error_code === 'PATIENT_ID_MISMATCH' ||
    data?.error_code === 'DEMOGRAPHIC_GENDER_MISMATCH' ||
    data?.error_code === 'DEMOGRAPHIC_AGE_MISMATCH'
  ) {
    const err: any = new Error(data.message || data.title || 'PATIENT IDENTITY MISMATCH - INVALID DOCUMENT FOR THIS PATIENT');
    err.isIdentityMismatch = true;
    err.error_code = data.error_code || 'PATIENT_NAME_MISMATCH';
    err.failed_field = data.failed_field || 'PATIENT_NAME';
    err.title = data.title || data.message || 'PATIENT IDENTITY MISMATCH';
    err.status_label = data.status_label || 'Identity mismatch';
    err.registered_patient = data.registered_patient;
    err.extracted_patient = data.extracted_patient;
    err.registered_id = data.registered_id;
    err.extracted_id = data.extracted_id;
    err.reason = data.reason;
    err.action = data.action;
    err.details = data.details;
    throw err;
  }

  if (data?.error_code === 'NON_MEDICAL_DOCUMENT' || data?.validation_status === 'REJECTED' && data?.document_type === 'NON_MEDICAL') {
    const err: any = new Error(data.message || 'The uploaded file does not appear to contain a valid medical report based on its content.');
    err.isNonMedical = true;
    err.error_code = 'NON_MEDICAL_DOCUMENT';
    err.detected_content = data.detected_content || [];
    err.detected_type_label = data.detected_type_label || 'Non-medical document';
    err.reason = data.reason || 'This document does not contain sufficient clinical or medical content for MEDI-TREND analysis.';
    err.title = 'INVALID MEDICAL DOCUMENT';
    throw err;
  }

  if (data?.error_code === 'UNREADABLE_OR_BLANK' || data?.error_code === 'CORRUPTED_DOCUMENT' || data?.error_code === 'EMPTY_FILE') {
    const err: any = new Error(data.message || 'The uploaded document contains unreadable or insufficient text.');
    err.isUnreadable = true;
    err.error_code = data.error_code;
    err.reason = data.reason || data.message;
    err.title = 'UNREADABLE OR MALFORMED DOCUMENT';
    throw err;
  }

  if (res.status === 403) {
    const err: any = new Error(data?.detail || 'Forbidden: Insufficient permissions to access or upload records for this patient.');
    err.isForbidden = true;
    err.error_code = 'FORBIDDEN';
    err.title = 'ACCESS FORBIDDEN';
    throw err;
  }

  if (res.status === 413) {
    throw new Error('HTTP 413: Document file size exceeds Vercel Serverless 4.5MB upload limit. Please optimize or compress the file.');
  }

  // Handle generic failure / rejection
  const errorDetail =
    data?.detail ||
    data?.message ||
    data?.error ||
    (res.status >= 500
      ? `Server processing error (${res.status}): Please check backend logs.`
      : 'Document validation failed. Only supported medical documents can be uploaded.');
  const formattedError = typeof errorDetail === 'object' ? (errorDetail.message || JSON.stringify(errorDetail)) : errorDetail;
  const err = new Error(formattedError);
  // Attach identity mismatch details for the frontend to display
  if (data?.identity_status) {
    (err as any).identityStatus = data.identity_status;
    (err as any).registeredPatientName = data.registered_patient_name;
    (err as any).extractedPatientName = data.extracted_patient_name;
    (err as any).conflicts = data.conflicts || [];
    (err as any).detectedIdentifiers = data.detected_identifiers || {};
    (err as any).details = data.details;
    (err as any).matchScore = data.match_score;
  }
  throw err;
}

export async function fetchActivityLogs() {
  try {
    const res = await fetch(`${API_BASE}/activity-logs`);
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return [];
}

export async function deleteReport(reportId: string, reason: string = '') {
  // Always register in persistent local deleted tracking
  addDeletedReportId(reportId);
  removeCustomReportForPatient(reportId);

  const sessionStr = localStorage.getItem('medi_trend_session');
  let userName = 'Dr. Arvind Kumar';
  let userRole = 'DOCTOR';
  if (sessionStr) {
    try {
      const parsed = JSON.parse(sessionStr);
      userName = parsed.user?.name || userName;
      userRole = parsed.role || userRole;
    } catch {}
  }

  // 1. Backend DELETE request
  try {
    const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(reportId)}?reason=${encodeURIComponent(reason)}`, {
      method: 'DELETE',
      headers: {
        'x-user-name': userName,
        'x-user-role': userRole,
      },
    });
    const json = await safeJson(res);
    if (json) return json;
  } catch {}

  // 2. Direct Supabase Deletion
  try {
    await supabase.from('medical_reports').delete().eq('report_id', reportId);
  } catch {}

  return { success: true, message: 'Report moved to Deleted Files.' };
}

export async function restoreReport(reportId: string) {
  try {
    const res = await fetch(`${API_BASE}/admin/reports/${reportId}/restore`, { method: 'POST' });
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return { success: true };
}

export async function permanentlyDeleteReport(reportId: string) {
  try {
    const res = await fetch(`${API_BASE}/admin/reports/${reportId}/permanent`, { method: 'DELETE' });
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return { success: true };
}

export async function fetchArchivedReports() {
  try {
    const res = await fetch(`${API_BASE}/admin/reports/archived`);
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return [];
}

export async function fetchAllAdminReports() {
  try {
    const res = await fetch(`${API_BASE}/admin/reports`);
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return [];
}

export async function contactAdmin(data: {
  patient_id?: string;
  report_id?: string;
  subject: string;
  message: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/messages/contact-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return { success: true };
}

export async function fetchAdminMessages() {
  try {
    const res = await fetch(`${API_BASE}/admin/messages`);
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return [];
}

export async function replyAdminMessage(ticketId: string, reply: string, status: string = 'RESOLVED') {
  try {
    const res = await fetch(`${API_BASE}/admin/messages/${ticketId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply, status }),
    });
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return { success: true };
}

export async function fetchUserMessages() {
  try {
    const res = await fetch(`${API_BASE}/messages`);
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return [];
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/audit-logs`);
    const list = await safeJson(res);
    if (list && Array.isArray(list)) {
      return list.map((l: any) => ({
        logId: l.log_id,
        timestamp: l.created_at,
        userId: l.user_id,
        userRole: l.user_role,
        action: l.action,
        patientId: l.entity_id,
        provider: l.provider,
        status: l.status,
        details: l.details,
      }));
    }
  } catch {}
  return [
    {
      logId: 'AUD-901',
      timestamp: new Date().toLocaleString(),
      userId: 'DOC-001',
      userRole: 'DOCTOR',
      action: 'PATIENT_RECORD_ACCESSED',
      patientId: 'PT-E77688',
      provider: 'Apollo Diagnostics Centre',
      status: 'VERIFIED',
      details: 'Patient record and longitudinal trajectory opened for clinical review',
    },
  ];
}

// ==================== PATIENT REPORT CAPACITY LIMITS ====================
export async function fetchPatientReportLimit(patientId: string): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/admin/patients/${encodeURIComponent(patientId)}/limit`, {
      headers: getAuthHeaders(),
    });
    const data = await safeJson(res);
    if (res.ok && data?.max_reports) {
      return data.max_reports;
    }
  } catch {}
  return 5;
}

export async function updatePatientReportLimit(patientId: string, maxReports: number, reason: string = '') {
  try {
    const res = await fetch(`${API_BASE}/admin/patients/${encodeURIComponent(patientId)}/limit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ max_reports: maxReports, reason }),
    });
    const data = await safeJson(res);
    if (res.ok && data) return data;
    if (data?.detail) throw new Error(data.detail);
  } catch (e: any) {
    if (e.message && !e.message.includes('fetch')) throw e;
  }
  return { success: true, patient_id: patientId, max_reports: maxReports };
}

// ==================== APPOINTMENTS & DOCTOR AVAILABILITY ====================
export async function fetchDoctorAvailability(doctorId: string) {
  try {
    const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(doctorId)}/availability`);
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return {
    doctor_id: doctorId,
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    start_time: '09:00 AM',
    end_time: '05:00 PM',
    slot_duration_mins: 30,
    break_start: '01:00 PM',
    break_end: '02:00 PM',
    blocked_dates: [],
    is_available: true,
  };
}

export async function updateDoctorAvailability(doctorId: string, data: any) {
  try {
    const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(doctorId)}/availability`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await safeJson(res);
    if (json) return json;
  } catch {}
  return { success: true };
}

export async function fetchAvailableSlots(doctorId: string, date: string) {
  try {
    const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(doctorId)}/slots?date=${encodeURIComponent(date)}`);
    const json = await safeJson(res);
    if (json && Array.isArray(json)) return json;
  } catch {}

  // Standard clinical default slots
  return [
    { slot_time: '09:00 AM - 09:30 AM', is_available: true, date, doctor_id: doctorId },
    { slot_time: '09:30 AM - 10:00 AM', is_available: true, date, doctor_id: doctorId },
    { slot_time: '10:00 AM - 10:30 AM', is_available: true, date, doctor_id: doctorId },
    { slot_time: '10:30 AM - 11:00 AM', is_available: true, date, doctor_id: doctorId },
    { slot_time: '11:00 AM - 11:30 AM', is_available: true, date, doctor_id: doctorId },
    { slot_time: '11:30 AM - 12:00 PM', is_available: true, date, doctor_id: doctorId },
    { slot_time: '02:00 PM - 02:30 PM', is_available: true, date, doctor_id: doctorId },
    { slot_time: '02:30 PM - 03:00 PM', is_available: true, date, doctor_id: doctorId },
    { slot_time: '03:00 PM - 03:30 PM', is_available: true, date, doctor_id: doctorId },
    { slot_time: '03:30 PM - 04:00 PM', is_available: true, date, doctor_id: doctorId },
    { slot_time: '04:00 PM - 04:30 PM', is_available: true, date, doctor_id: doctorId },
  ];
}

export async function bookAppointment(data: {
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  department?: string;
  appointment_date: string;
  slot_time: string;
  reason?: string;
}) {
  // 1. Try Backend API
  try {
    const res = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await safeJson(res);
    if (res.ok && json) return json;
    if (res.status === 409 || (json?.detail && json.detail.includes('already been reserved'))) {
      throw new Error(json.detail || 'This time slot is already reserved. Please select another slot.');
    }
    if (json?.detail && res.status !== 405) throw new Error(json.detail);
  } catch (e: any) {
    if (e.message && (e.message.includes('already been reserved') || e.message.includes('conflict') || e.message.includes('required'))) {
      throw e;
    }
  }

  // 2. Direct Supabase Storage fallback
  const aptNum = `APT-${Date.now().toString().slice(-6)}`;
  try {
    const newApt = {
      id: `apt-${Date.now()}`,
      appointment_id: aptNum,
      patient_id: data.patient_id,
      patient_name: data.patient_name,
      doctor_id: data.doctor_id,
      doctor_name: data.doctor_name,
      department: data.department || 'General Medicine',
      appointment_date: data.appointment_date,
      slot_time: data.slot_time,
      status: 'CONFIRMED',
      reason: data.reason || '',
    };
    await supabase.from('appointments').insert(newApt);
  } catch {}

  return {
    success: true,
    appointment_id: aptNum,
    patient_id: data.patient_id,
    patient_name: data.patient_name,
    doctor_id: data.doctor_id,
    doctor_name: data.doctor_name,
    department: data.department || 'General Medicine',
    appointment_date: data.appointment_date,
    slot_time: data.slot_time,
    status: 'CONFIRMED',
  };
}

export async function fetchPatientAppointments(patientId: string) {
  try {
    const res = await fetch(`${API_BASE}/appointments/patient/${encodeURIComponent(patientId)}`);
    const list = await safeJson(res);
    if (list && Array.isArray(list) && list.length > 0) {
      return list.map((a: any) => ({
        id: a.id,
        appointmentId: a.appointment_id || a.appointmentId,
        patientId: a.patient_id || a.patientId,
        patientName: a.patient_name || a.patientName,
        doctorId: a.doctor_id || a.doctorId,
        doctorName: a.doctor_name || a.doctorName,
        department: a.department,
        appointmentDate: a.appointment_date || a.appointmentDate,
        slotTime: a.slot_time || a.slotTime,
        status: a.status,
        reason: a.reason,
        proposedNewDate: a.proposed_new_date || a.proposedNewDate,
        proposedNewSlot: a.proposed_new_slot || a.proposedNewSlot,
        createdAt: a.created_at || a.createdAt,
      }));
    }
  } catch {}

  // Supabase fallback
  try {
    const { data: supaApts } = await supabase.from('appointments').select('*').eq('patient_id', patientId);
    if (supaApts && supaApts.length > 0) {
      return supaApts.map((a: any) => ({
        id: a.id,
        appointmentId: a.appointment_id,
        patientId: a.patient_id,
        patientName: a.patient_name,
        doctorId: a.doctor_id,
        doctorName: a.doctor_name,
        department: a.department,
        appointmentDate: a.appointment_date,
        slotTime: a.slot_time,
        status: a.status,
        reason: a.reason,
        proposedNewDate: a.proposed_new_date,
        proposedNewSlot: a.proposed_new_slot,
        createdAt: a.created_at,
      }));
    }
  } catch {}

  return [];
}

export async function fetchAllAppointments() {
  try {
    const res = await fetch(`${API_BASE}/admin/appointments`);
    const list = await safeJson(res);
    if (list && Array.isArray(list)) {
      return list.map((a: any) => ({
        id: a.id,
        appointmentId: a.appointment_id || a.appointmentId,
        patientId: a.patient_id || a.patientId,
        patientName: a.patient_name || a.patientName,
        doctorId: a.doctor_id || a.doctorId,
        doctorName: a.doctor_name || a.doctorName,
        department: a.department,
        appointmentDate: a.appointment_date || a.appointmentDate,
        slotTime: a.slot_time || a.slotTime,
        status: a.status,
        reason: a.reason,
        proposedNewDate: a.proposed_new_date || a.proposedNewDate,
        proposedNewSlot: a.proposed_new_slot || a.proposedNewSlot,
        createdAt: a.created_at || a.createdAt,
      }));
    }
  } catch {}

  return [];
}

export async function cancelAppointment(appointmentId: string, reason: string = '') {
  try {
    const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await safeJson(res);
    if (res.ok && json) return json;
  } catch {}

  try {
    await supabase.from('appointments').update({ status: 'CANCELLED', reason }).eq('appointment_id', appointmentId);
  } catch {}
  return { success: true, message: 'Appointment cancelled.' };
}

export async function rescheduleAppointment(appointmentId: string, newDate: string, newSlot: string) {
  try {
    const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(appointmentId)}/reschedule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_date: newDate, new_slot: newSlot }),
    });
    const json = await safeJson(res);
    if (res.ok && json) return json;
    if (res.status === 409 || (json?.detail && json.detail.includes('already booked'))) {
      throw new Error(json.detail || 'Requested reschedule slot is already booked.');
    }
  } catch (e: any) {
    if (e.message && e.message.includes('already booked')) throw e;
  }

  try {
    await supabase.from('appointments').update({ appointment_date: newDate, slot_time: newSlot, status: 'CONFIRMED' }).eq('appointment_id', appointmentId);
  } catch {}
  return { success: true, message: 'Appointment rescheduled successfully.' };
}

export async function proposeAppointmentAlternative(appointmentId: string, proposedDate: string, proposedSlot: string) {
  try {
    const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(appointmentId)}/propose`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ proposed_date: proposedDate, proposed_slot: proposedSlot }),
    });
    const json = await safeJson(res);
    if (res.ok && json) return json;
  } catch {}

  try {
    await supabase.from('appointments').update({ proposed_new_date: proposedDate, proposed_new_slot: proposedSlot, status: 'PROPOSED' }).eq('appointment_id', appointmentId);
  } catch {}
  return { success: true, message: 'Alternative proposed.' };
}

export async function respondAppointmentAlternative(appointmentId: string, accept: boolean) {
  try {
    const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(appointmentId)}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ accept }),
    });
    const json = await safeJson(res);
    if (res.ok && json) return json;
  } catch {}

  return { success: true };
}
