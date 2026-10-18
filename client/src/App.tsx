import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  fetchPatients,
  fetchPatientReports,
  analyzeReports,
  logoutUser,
  BACKEND_SESSION_TTL_MS,
} from './services/api';
import {
  PatientProfile,
  ReportRecord,
  AIAnalysisResult,
  ParameterComparison,
  UserRole,
} from './types';

// Components & Layout
import { AppShell } from './components/layout/AppShell';
import { AuthModal } from './components/AuthModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminFirstPasswordModal } from './components/AdminFirstPasswordModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { ExportReportModal } from './components/ExportReportModal';
import { AuditLogModal } from './components/AuditLogModal';
import { AddPatientModal } from './components/AddPatientModal';
import { DocumentSourceModal } from './components/DocumentSourceModal';
import { AccessDenied } from './components/common/AccessDenied';
import { LanguageProvider } from './context/LanguageContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { TrendsPage } from './pages/TrendsPage';
import { ClinicalSummaryPage } from './pages/ClinicalSummaryPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AppointmentsPage } from './pages/AppointmentsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminDoctorsPage } from './pages/admin/AdminDoctorsPage';
import { AdminStaffPage } from './pages/admin/AdminStaffPage';
import { AdminPatientsPage } from './pages/admin/AdminPatientsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminAnalysesPage } from './pages/admin/AdminAnalysesPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export const AppContent: React.FC = () => {
  const navigate = useNavigate();

  // Application Global State
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('DOCTOR');
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email: string; avatarUrl?: string }>({
    id: 'DOC-001',
    name: 'Dr. Arvind Kumar',
    email: 'dr.arvind@hospital.org',
  });

  // Patient & Reports Data
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [currentPatient, setCurrentPatient] = useState<PatientProfile | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  // AI Analysis State
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [selectedParam, setSelectedParam] = useState<ParameterComparison | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Document Source Modal State
  const [sourceModalReport, setSourceModalReport] = useState<ReportRecord | null>(null);

  // Global Modals State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isFirstPasswordOpen, setIsFirstPasswordOpen] = useState(false);
  const [firstPasswordAdminUsername, setFirstPasswordAdminUsername] = useState('admin');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const patientFetchIdRef = useRef<string>('');

  // Load Session from localStorage on Mount
  useEffect(() => {
    const saved = localStorage.getItem('medi_trend_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          !parsed.token ||
          typeof parsed.expiresAt !== 'number' ||
          !Number.isFinite(parsed.expiresAt) ||
          Date.now() >= parsed.expiresAt
        ) {
          localStorage.removeItem('medi_trend_session');
          return;
        }
        if (parsed.user && parsed.role) {
          if (parsed.user.avatarUrl && (parsed.user.avatarUrl.includes('unsplash') || parsed.user.avatarUrl.includes('placeholder'))) {
            parsed.user.avatarUrl = undefined;
          }
          if (parsed.user.avatar_url && (parsed.user.avatar_url.includes('unsplash') || parsed.user.avatar_url.includes('placeholder'))) {
            parsed.user.avatar_url = undefined;
          }
          setCurrentUser(parsed.user);
          setUserRole(parsed.role as UserRole);
        }
      } catch (e) {
        console.error('Session restore error:', e);
      }
    }
  }, []);

  // Load Real Patients on Mount
  const loadPatients = async () => {
    try {
      const data = await fetchPatients();
      setPatients(data || []);
      if (data && data.length > 0 && !currentPatient) {
        handleSelectPatient(data[0]);
      }
    } catch (e) {
      console.error('Failed to load real patients:', e);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSelectPatient = async (p: PatientProfile) => {
    patientFetchIdRef.current = p.patientId;
    setCurrentPatient(p);
    // Explicitly reset prior patient state immediately to ensure absolute isolation
    setReports([]);
    setAnalysisResult(null);
    setSelectedReportIds([]);
    setSelectedParam(null);
    try {
      const reps = await fetchPatientReports(p.patientId);
      // Verify that the user has not switched to another patient while waiting
      if (patientFetchIdRef.current !== p.patientId) return;

      setReports(reps || []);
      if (reps && reps.length >= 2) {
        const initialSelected = reps.slice(0, 2).map((r) => r.reportId);
        setSelectedReportIds(initialSelected);
        runAnalysisForReports(p.patientId, initialSelected);
      } else if (reps && reps.length === 1) {
        setSelectedReportIds([reps[0].reportId]);
        setAnalysisResult(null);
      } else {
        setSelectedReportIds([]);
        setAnalysisResult(null);
      }
    } catch (e) {
      if (patientFetchIdRef.current === p.patientId) {
        setReports([]);
        setAnalysisResult(null);
      }
      console.error('Failed to load patient reports:', e);
    }
  };

  const runAnalysisForReports = async (patientId: string, reportIds: string[]) => {
    if (reportIds.length < 2) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeReports(patientId, reportIds, userRole, currentUser.name);
      if (patientFetchIdRef.current === patientId) {
        setAnalysisResult(res);
        if (res.keyParameters && res.keyParameters.length > 0) {
          setSelectedParam(res.keyParameters[0]);
        }
      }
    } catch (e) {
      console.error('Analysis error:', e);
    } finally {
      if (patientFetchIdRef.current === patientId) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleToggleReportSelect = (reportId: string) => {
    let updated: string[];
    if (selectedReportIds.includes(reportId)) {
      if (selectedReportIds.length <= 1) return;
      updated = selectedReportIds.filter((id) => id !== reportId);
    } else {
      updated = [...selectedReportIds, reportId];
    }
    setSelectedReportIds(updated);
  };

  const handleSelectAllReports = () => {
    const allIds = reports.map((r) => r.reportId);
    setSelectedReportIds(allIds);
  };

  const handleClearSelectedReports = () => {
    if (reports.length >= 2) {
      setSelectedReportIds([reports[0].reportId, reports[1].reportId]);
    }
  };

  const handleUploadSuccess = (newReport: ReportRecord) => {
    if (!currentPatient || currentPatient.patientId !== newReport.patientId) return;
    const updatedReports = [...reports.filter((r) => r.reportId !== newReport.reportId), newReport];
    setReports(updatedReports);
    const updatedSelected = [...selectedReportIds.filter((id) => id !== newReport.reportId), newReport.reportId];
    setSelectedReportIds(updatedSelected);
    if (updatedSelected.length >= 2) {
      runAnalysisForReports(currentPatient.patientId, updatedSelected);
    } else {
      setAnalysisResult(null);
    }
  };

  const handleReportDeleted = (deletedReportId: string) => {
    const remaining = reports.filter((r) => r.reportId !== deletedReportId);
    setReports(remaining);
    const updatedSelected = selectedReportIds.filter((id) => id !== deletedReportId);
    setSelectedReportIds(updatedSelected);
    if (currentPatient && updatedSelected.length >= 2) {
      runAnalysisForReports(currentPatient.patientId, updatedSelected);
    } else {
      setAnalysisResult(null);
    }
  };

  const handlePatientCreated = (newPatient: PatientProfile) => {
    setPatients((prev) => [newPatient, ...prev]);
    handleSelectPatient(newPatient);
    navigate('/dashboard');
  };

  const handleSelectParamByName = (paramName: string) => {
    if (!analysisResult) return;
    const found = analysisResult.keyParameters.find((p) => p.name === paramName);
    if (found) {
      setSelectedParam(found);
    }
  };

  const handleLoginSuccess = (userObj: { id?: string; name: string; email: string; role: UserRole; avatarUrl?: string; token?: string }) => {
    setCurrentUser({
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      avatarUrl: userObj.avatarUrl,
    });
    setUserRole(userObj.role);
    localStorage.setItem('medi_trend_session', JSON.stringify({
      user: { id: userObj.id, name: userObj.name, email: userObj.email, avatarUrl: userObj.avatarUrl },
      role: userObj.role,
      token: userObj.token,
      expiresAt: Date.now() + BACKEND_SESSION_TTL_MS,
    }));
    if (userObj.role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    await logoutUser(currentUser.name, userRole);
    localStorage.removeItem('medi_trend_session');
    setCurrentUser({ name: 'Clinician', email: 'clinician@hospital.org' });
    setUserRole('DOCTOR');
    navigate('/');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Routes>
        {/* Public Landing Page */}
        <Route
          path="/"
          element={
            <LandingPage
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            />
          }
        />

        {/* Clinical Application Shell */}
        <Route
          element={
            <AppShell
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              userRole={userRole}
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenAuditLogs={() => setIsAuditOpen(true)}
            />
          }
        >
          {/* Clinical Workspaces (Doctor & Staff) */}
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                patient={currentPatient}
                patients={patients}
                onSelectPatient={handleSelectPatient}
                reports={reports}
                latestAnalysis={analysisResult}
                onOpenUpload={() => setIsUploadOpen(true)}
                onOpenCreatePatient={() => setIsAddPatientOpen(true)}
              />
            }
          />
          <Route
            path="/patients"
            element={
              <PatientsPage
                patients={patients}
                selectedPatient={currentPatient}
                onSelectPatient={handleSelectPatient}
                onOpenCreatePatient={() => setIsAddPatientOpen(true)}
              />
            }
          />
          <Route
            path="/reports"
            element={
              <ReportsPage
                patient={currentPatient}
                reports={reports}
                onOpenUpload={() => setIsUploadOpen(true)}
                onViewSource={(r) => setSourceModalReport(r)}
                onReportDeleted={handleReportDeleted}
              />
            }
          />
          <Route
            path="/analysis"
            element={
              <AnalysisPage
                patient={currentPatient}
                reports={reports}
                selectedReportIds={selectedReportIds}
                onToggleReportSelect={handleToggleReportSelect}
                onSelectAllReports={handleSelectAllReports}
                onClearSelectedReports={handleClearSelectedReports}
                analysisResult={analysisResult}
                onRunAnalysis={() => {
                  if (currentPatient) runAnalysisForReports(currentPatient.patientId, selectedReportIds);
                }}
                isAnalyzing={isAnalyzing}
                onSelectParamForChart={(param) => setSelectedParam(param)}
                selectedParam={selectedParam}
                onOpenUpload={() => setIsUploadOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
              />
            }
          />
          <Route
            path="/trends"
            element={
              <TrendsPage
                patient={currentPatient}
                parameters={analysisResult?.keyParameters || []}
                selectedParam={selectedParam}
                onSelectParamName={handleSelectParamByName}
              />
            }
          />
          <Route
            path="/clinical-summary"
            element={
              <ClinicalSummaryPage
                patient={currentPatient}
                analysis={analysisResult}
                onOpenExport={() => setIsExportOpen(true)}
              />
            }
          />
          <Route
            path="/documents"
            element={
              <DocumentsPage
                currentPatient={currentPatient}
                reports={reports}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            }
          />
          <Route path="/history" element={<HistoryPage />} />
          <Route
            path="/appointments"
            element={
              <AppointmentsPage
                currentPatient={currentPatient}
                userRole={userRole}
                currentUserName={currentUser?.name || ''}
                currentUserId={currentUser?.id}
              />
            }
          />

          {/* Admin Routes - Strictly Guarded */}
          <Route
            path="/admin"
            element={
              userRole === 'ADMIN' ? (
                <AdminDashboardPage />
              ) : (
                <AccessDenied requiredRole="ADMIN" currentRole={userRole} currentUserName={currentUser.name} />
              )
            }
          />
          <Route
            path="/admin/doctors"
            element={
              userRole === 'ADMIN' ? (
                <AdminDoctorsPage />
              ) : (
                <AccessDenied requiredRole="ADMIN" currentRole={userRole} currentUserName={currentUser.name} />
              )
            }
          />
          <Route
            path="/admin/staff"
            element={
              userRole === 'ADMIN' ? (
                <AdminStaffPage />
              ) : (
                <AccessDenied requiredRole="ADMIN" currentRole={userRole} currentUserName={currentUser.name} />
              )
            }
          />
          <Route
            path="/admin/patients"
            element={
              userRole === 'ADMIN' ? (
                <AdminPatientsPage />
              ) : (
                <AccessDenied requiredRole="ADMIN" currentRole={userRole} currentUserName={currentUser.name} />
              )
            }
          />
          <Route
            path="/admin/reports"
            element={
              userRole === 'ADMIN' ? (
                <AdminReportsPage />
              ) : (
                <AccessDenied requiredRole="ADMIN" currentRole={userRole} currentUserName={currentUser.name} />
              )
            }
          />
          <Route
            path="/admin/analyses"
            element={
              userRole === 'ADMIN' ? (
                <AdminAnalysesPage />
              ) : (
                <AccessDenied requiredRole="ADMIN" currentRole={userRole} currentUserName={currentUser.name} />
              )
            }
          />
          <Route
            path="/admin/activity"
            element={
              userRole === 'ADMIN' ? (
                <AdminActivityPage />
              ) : (
                <AccessDenied requiredRole="ADMIN" currentRole={userRole} currentUserName={currentUser.name} />
              )
            }
          />
          <Route
            path="/admin/audit"
            element={
              userRole === 'ADMIN' ? (
                <AdminAuditPage />
              ) : (
                <AccessDenied requiredRole="ADMIN" currentRole={userRole} currentUserName={currentUser.name} />
              )
            }
          />
          <Route
            path="/admin/analytics"
            element={
              userRole === 'ADMIN' ? (
                <AdminAnalyticsPage />
              ) : (
                <AccessDenied requiredRole="ADMIN" currentRole={userRole} currentUserName={currentUser.name} />
              )
            }
          />
          <Route
            path="/admin/settings"
            element={
              userRole === 'ADMIN' ? (
                <AdminSettingsPage />
              ) : (
                <AccessDenied requiredRole="ADMIN" currentRole={userRole} currentUserName={currentUser.name} />
              )
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Modals (Mounted at Root Level for All Routes) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleLoginSuccess}
        onOpenAdminLogin={() => {
          setIsAuthOpen(false);
          setIsAdminLoginOpen(true);
        }}
        onOpenForgotPassword={() => {
          setIsAuthOpen(false);
          setIsForgotPasswordOpen(true);
        }}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onAdminAuthSuccess={handleLoginSuccess}
        onRequireFirstPasswordChange={(uname) => {
          setFirstPasswordAdminUsername(uname);
          setIsFirstPasswordOpen(true);
        }}
        onOpenForgotPassword={() => {
          setIsAdminLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
      />

      <AdminFirstPasswordModal
        isOpen={isFirstPasswordOpen}
        username={firstPasswordAdminUsername}
        onSuccess={(token) => {
          setIsFirstPasswordOpen(false);
          handleLoginSuccess({
            id: 'admin-root-001',
            name: 'Hospital Administrator',
            email: 'admin@hospital.org',
            role: 'ADMIN',
            token,
          });
        }}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

      <DocumentUploadModal
        patientId={currentPatient?.patientId || (patients.length > 0 ? patients[0].patientId : 'PT-E77688')}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {currentPatient && analysisResult && (
        <ExportReportModal
          patient={currentPatient}
          analysis={analysisResult}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      <AuditLogModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        currentUserRole={userRole}
      />

      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientCreated={handlePatientCreated}
      />

      {/* Document Source Grounding Modal */}
      <DocumentSourceModal
        isOpen={Boolean(sourceModalReport)}
        report={sourceModalReport}
        onClose={() => setSourceModalReport(null)}
      />
    </div>
  );
};
 
export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </LanguageProvider>
  );
};

export default App;
