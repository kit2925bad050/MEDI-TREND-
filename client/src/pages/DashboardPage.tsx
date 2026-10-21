import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientProfile, ReportRecord, AIAnalysisResult, WoundAssessmentRecord } from '../types';
import {
  FileText,
  Brain,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  ArrowRight,
  Upload,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Users,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  FileCheck,
  AlertTriangle,
  Camera,
  Layers,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SummaryStatCards } from '../components/SummaryStatCards';
import { PatientAvatar } from '../components/PatientAvatar';
import { useLanguage } from '../context/LanguageContext';
import { fetchPatientWoundAssessments, getWoundImageUrl } from '../services/api';
import { WoundUploadModal } from '../components/wound/WoundUploadModal';

interface DashboardPageProps {
  patient: PatientProfile | null;
  patients?: PatientProfile[];
  onSelectPatient?: (patient: PatientProfile) => void;
  reports: ReportRecord[];
  latestAnalysis: AIAnalysisResult | null;
  onOpenUpload: () => void;
  onOpenCreatePatient: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  patient,
  patients = [],
  onSelectPatient,
  reports,
  latestAnalysis,
  onOpenUpload,
  onOpenCreatePatient,
}) => {
  const navigate = useNavigate();
  const { dict } = useLanguage();
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [wounds, setWounds] = useState<WoundAssessmentRecord[]>([]);
  const [isWoundUploadOpen, setIsWoundUploadOpen] = useState(false);

  useEffect(() => {
    if (patient?.patientId) {
      fetchPatientWoundAssessments(patient.patientId)
        .then((data) => setWounds(data || []))
        .catch(() => setWounds([]));
    } else {
      setWounds([]);
    }
  }, [patient?.patientId]);

  if (!patient) {
    return (
      <div className="p-6">
        <EmptyState
          title="No Patient Profile Selected"
          description="Register a new patient or select from the hospital directory to start longitudinal report analysis."
          actionText="+ Register Patient"
          onAction={onOpenCreatePatient}
        />
      </div>
    );
  }

  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;
  const firstReport = reports.length > 0 ? reports[0] : null;
  const reportsWithParams = reports.filter((r) => r.parameterCount > 0 || (r.extractedParameters && r.extractedParameters.length > 0));

  return (
    <div className="space-y-6">
      {/* Patient Overview Header Card with Switcher & Quick Registration */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Patient Identity with Switcher Dropdown */}
        <div className="flex items-center gap-4 relative">
          <PatientAvatar
            name={patient.name}
            avatarUrl={patient.avatarUrl}
            size="lg"
            showStatus={true}
            isActive={patient.activeStatus === 'Active'}
            editable={false}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {patient.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {patient.activeStatus === 'Active' ? dict.patient_active : dict.patient_inactive}
              </span>

              {/* Patient Switcher Trigger */}
              {patients.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition flex items-center gap-1 text-[11px] font-semibold px-2"
                    title={dict.dash_switch_patient}
                  >
                    <span>{dict.dash_switch_patient}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {isPatientDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-40 py-2 divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {dict.dash_hospital_patients} ({patients.length})
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
                        {patients.map((p) => (
                          <button
                            key={p.patientId}
                            onClick={() => {
                              onSelectPatient?.(p);
                              setIsPatientDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-brand-50 dark:hover:bg-slate-800 transition ${
                              p.patientId === patient.patientId ? 'bg-brand-50/70 dark:bg-slate-800/80 font-bold' : ''
                            }`}
                          >
                            <div>
                              <div className="text-xs text-slate-900 dark:text-white">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {p.patientId} • {p.age} {dict.years_label} ({p.gender})
                              </div>
                            </div>
                            {p.patientId === patient.patientId && (
                              <span className="w-2 h-2 rounded-full bg-brand-600" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setIsPatientDropdownOpen(false);
                            onOpenCreatePatient();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-xl transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{dict.dash_add_patient}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>{dict.pid_label}: <b className="font-mono">{patient.patientId}</b></span>
              <span>•</span>
              <span>{patient.age} {dict.years_label} ({patient.gender})</span>
              <span>•</span>
              <span>{dict.phone_label}: {patient.phone}</span>
              <span>•</span>
              <span>{dict.blood_group_label}: <b>{patient.bloodGroup || 'O+'}</b></span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Register Patient, Launch Analysis, Upload PDF */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={onOpenCreatePatient}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{dict.dash_add_patient}</span>
          </button>

          <button
            onClick={() => navigate('/analysis')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition"
          >
            <Brain className="w-4 h-4" />
            <span>{dict.dash_launch_analysis}</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
          >
            <Upload className="w-4 h-4" />
            <span>{dict.dash_upload_pdf}</span>
          </button>
        </div>
      </div>

      {/* Real KPI Summary Cards */}
      {latestAnalysis ? (
        <SummaryStatCards
          improved={latestAnalysis.comparisonSummary.improved}
          stable={latestAnalysis.comparisonSummary.stable}
          monitoring={latestAnalysis.comparisonSummary.monitoring}
          worsened={latestAnalysis.comparisonSummary.worsened}
        />
      ) : reports.length >= 2 ? (
        <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-900 dark:text-cyan-200">
                {reports.length} {dict.dash_reports_available}
              </div>
              <div className="text-[11px] text-cyan-700 dark:text-cyan-400">
                {dict.dash_reports_available_sub}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/analysis')}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition flex items-center gap-1.5"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{dict.dash_run_comparison}</span>
          </button>
        </div>
      ) : reports.length === 1 ? (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                1 {dict.dash_one_report_msg} ({reports[0].reportDate})
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-400">
                {dict.dash_one_report_sub}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ {dict.dash_upload_pdf}</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {dict.dash_no_reports_msg} ({patient.name})
              </div>
              <div className="text-[11px] text-slate-500">
                {dict.dash_no_reports_sub}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{dict.dash_ingest_first}</span>
          </button>
        </div>
      )}

      {/* AI Wound & Ulcer Assessment and Progress Monitoring Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  AI Wound & Ulcer Assessment and Progress Monitoring
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {wounds.length} {wounds.length === 1 ? 'Evaluation' : 'Evaluations'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-visit photographic analysis, tissue composition breakdown, warning sign surveillance, and lab correlation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsWoundUploadOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Upload Wound Image</span>
            </button>
            <button
              onClick={() => navigate('/wounds')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
            >
              <span>Open Wound Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {wounds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Latest assessment card */}
            {(() => {
              const latest = wounds[wounds.length - 1];
              const imgUrl = getWoundImageUrl(latest.image_filename);
              const tb = latest.visible_characteristics?.tissue_breakdown;
              const hasWarnings = (latest.warning_signs || []).length > 0;

              return (
                <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                    {imgUrl ? (
                      <img src={imgUrl} alt="Latest wound" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                        IMG
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {latest.wound_location}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        {latest.severity_indicator}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Visit Date: {latest.visit_date} • Tag: {latest.wound_type_tag}
                    </div>
                    {tb && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Granulation: <b>{tb.granulation_percent}%</b>
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          Slough: <b>{tb.slough_percent}%</b>
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          Necrotic: <b>{tb.necrotic_percent}%</b>
                        </span>
                      </div>
                    )}
                    {hasWarnings && (
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 pt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Warning signs flagged for clinician evaluation</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Quick Status / Comparison Summary Box */}
            <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/50 flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 tracking-wider">
                  Longitudinal Tracking
                </span>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {wounds.length >= 2
                    ? '2+ Examinations Recorded'
                    : '1 Baseline Examination Recorded'}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {wounds.length >= 2
                    ? 'Longitudinal comparison is ready. Inspect changes in granulation, non-viable slough, and correlated lab biomarkers.'
                    : 'Upload follow-up wound photographs on subsequent patient visits to assess healing progress and tissue shifts.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/wounds')}
                className="w-full py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition text-center"
              >
                {wounds.length >= 2 ? 'View Comparison & Trends →' : 'View Detailed Assessment →'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                No wound photographs recorded yet for this patient profile.
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload foot ulcer, venous leg wound, or surgical incision images to generate AI-assisted tissue breakdown and progress monitoring.
              </p>
            </div>
            <button
              onClick={() => setIsWoundUploadOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
            >
              + Upload Wound Image
            </button>
          </div>
        )}
      </div>

      {/* Two Column Overview: Workspaces & Recent Patient Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Quick Navigation Cards */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {dict.dash_workspaces_title}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => navigate('/reports')}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-500 cursor-pointer transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 flex items-center justify-between">
                <span>{dict.nav_reports}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {reports.length} {dict.dash_reports_library_desc}
              </p>
            </div>

            <div
              onClick={() => navigate('/analysis')}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-500 cursor-pointer transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-3">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 flex items-center justify-between">
                <span>{dict.nav_analysis}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {dict.dash_ai_comparison_desc}
              </p>
            </div>

            <div
              onClick={() => navigate('/trends')}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-500 cursor-pointer transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 flex items-center justify-between">
                <span>{dict.nav_trends}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {dict.dash_trend_graphs_desc}
              </p>
            </div>

            <div
              onClick={() => navigate('/clinical-summary')}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-500 cursor-pointer transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 flex items-center justify-between">
                <span>{dict.nav_clinical_summary}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {dict.dash_clinical_summary_desc}
              </p>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Recent Patient Reports Snapshot */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {dict.dash_recent_reports_snapshot}
          </h3>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                {dict.dash_no_reports_yet}
              </div>
            ) : (
              reports.slice(-3).reverse().map((r) => (
                <div
                  key={r.reportId}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center text-xs font-bold">
                      PDF
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {r.reportId} • {r.reportDate}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {r.provider} ({r.parameterCount} params)
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                    {r.extractionStatus}
                  </span>
                </div>
              ))
            )}

            <button
              onClick={() => navigate('/reports')}
              className="w-full py-2 rounded-xl text-center text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 transition"
            >
              {dict.dash_view_all_reports}
            </button>
          </div>
        </div>
      </div>

      {/* Wound Upload Modal triggered from Doctor Dashboard */}
      {isWoundUploadOpen && patient && (
        <WoundUploadModal
          patient={patient}
          isOpen={isWoundUploadOpen}
          onClose={() => setIsWoundUploadOpen(false)}
          onSuccess={(newAssessment) => {
            setWounds((prev) => [...prev, newAssessment]);
            setIsWoundUploadOpen(false);
          }}
        />
      )}
    </div>
  );
};
