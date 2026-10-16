import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportRecord, PatientProfile, AIAnalysisResult, ParameterComparison } from '../types';
import {
  Brain,
  Layers,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  CheckSquare,
  Square,
<<<<<<< HEAD
  ShieldAlert,
  Info,
  Clock,
=======
  Languages,
  Info,
  Calendar,
  Building2,
>>>>>>> origin/main
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { KeyParametersTable } from '../components/KeyParametersTable';
import { useLanguage } from '../context/LanguageContext';

interface AnalysisPageProps {
  patient: PatientProfile | null;
  reports: ReportRecord[];
  selectedReportIds: string[];
  onToggleReportSelect: (reportId: string) => void;
  onSelectAllReports: () => void;
  onClearSelectedReports: () => void;
  analysisResult: AIAnalysisResult | null;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  onSelectParamForChart: (param: ParameterComparison) => void;
  selectedParam: ParameterComparison | null;
  onOpenUpload: () => void;
  onOpenExport?: () => void;
}

function getIdentityBadge(status: string | undefined | null) {
  switch (status) {
    case 'VERIFIED':
      return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Verified', icon: <ShieldCheck className="w-3 h-3" /> };
    case 'MISMATCH':
      return { color: 'text-rose-600 bg-rose-50 border-rose-100', label: 'Mismatch', icon: <ShieldAlert className="w-3 h-3" /> };
    case 'UNVERIFIED':
      return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Unverified', icon: <Info className="w-3 h-3" /> };
    case 'REVIEW_REQUIRED':
      return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Review', icon: <Info className="w-3 h-3" /> };
    default:
      return { color: 'text-slate-500 bg-slate-100 border-slate-200', label: 'Unknown', icon: <Info className="w-3 h-3" /> };
  }
}

function getAnalysisStatusColor(status: string | undefined | null) {
  switch (status) {
    case 'Analysis Complete':
      return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'Analysis Partially Complete':
      return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'Manual Review Required':
      return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'Patient Identity Mismatch':
      return 'text-rose-600 bg-rose-50 border-rose-100';
    default:
      return 'text-slate-500 bg-slate-100 border-slate-200';
  }
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  patient,
  reports,
  selectedReportIds,
  onToggleReportSelect,
  onSelectAllReports,
  onClearSelectedReports,
  analysisResult,
  onRunAnalysis,
  isAnalyzing,
  onSelectParamForChart,
  selectedParam,
  onOpenUpload,
  onOpenExport,
}) => {
  const navigate = useNavigate();
  const { dict, isTamil } = useLanguage();
  const [summaryLang, setSummaryLang] = useState<'both' | 'en' | 'ta'>('both');

  if (!patient) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Brain}
          title="No Patient Profile Selected"
          description="Select a patient from the directory to configure and run AI longitudinal comparisons."
        />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Layers}
          title="No Medical Reports Available"
          description={`Patient ${patient.name} has no uploaded reports. Upload laboratory reports (PDF, PNG, JPG) to begin clinical evaluation.`}
          actionText={dict.nav_upload_pdf}
          onAction={onOpenUpload}
        />
      </div>
    );
  }

  // Filter out any reports with definite identity mismatch from selection
  const validReports = reports.filter((r) => r.identityStatus !== 'IDENTITY_MISMATCH');
  const mismatchedReports = reports.filter((r) => r.identityStatus === 'IDENTITY_MISMATCH');

  const sortedSelected = reports.filter((r) => selectedReportIds.includes(r.reportId));
  const isSingleReport = selectedReportIds.length === 1;
  const baselineReport = sortedSelected[0] || reports[0];
  const followUpReport = sortedSelected[sortedSelected.length - 1] || sortedSelected[0] || reports[0];

  // Check if any selected report has identity issues
  const hasMismatch = sortedSelected.some(r => r.identityVerificationStatus === 'MISMATCH');
  const hasUnverified = sortedSelected.some(r => r.identityVerificationStatus === 'UNVERIFIED');
  const hasReviewRequired = sortedSelected.some(r => r.identityVerificationStatus === 'REVIEW_REQUIRED');

  return (
    <div className="space-y-6">
      {/* Identity Mismatch Warning Banner if any mismatched reports exist */}
      {mismatchedReports.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-amber-900 dark:text-amber-100">
              Identity Verification Notice: {mismatchedReports.length} Document(s) Excluded
            </div>
            <p className="leading-relaxed">
              Documents belonging to a different patient name were detected and safely isolated from {patient.name}'s medical comparisons.
            </p>
          </div>
        </div>
      )}

      {/* Header Studio Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>{dict.analysis_page_title}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium">
              Multi-Document Clinical Intelligence
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select 1 report for in-depth analysis, or 2, 5, 10+ reports for longitudinal chronological trend comparison.
          </p>
        </div>

        <button
          onClick={onRunAnalysis}
<<<<<<< HEAD
          disabled={selectedReportIds.length < 2 || isAnalyzing || hasMismatch}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition ${
            selectedReportIds.length >= 2 && !isAnalyzing && !hasMismatch
=======
          disabled={selectedReportIds.length === 0 || isAnalyzing}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition ${
            selectedReportIds.length >= 1 && !isAnalyzing
>>>>>>> origin/main
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{dict.analysis_running_btn}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isSingleReport
                  ? `Run Clinical Analysis (1 Report)`
                  : `Run Longitudinal Comparison (${selectedReportIds.length} Reports)`}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Identity Mismatch Warning Banner */}
      {hasMismatch && (
        <div className="p-4 rounded-xl border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-900/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-rose-800 dark:text-rose-400">Patient Identity Mismatch Detected</h3>
            <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
              One or more selected reports belong to a different patient. These reports will be excluded from clinical comparison.
            </p>
          </div>
        </div>
      )}

      {/* Identity Unverified Warning Banner */}
      {!hasMismatch && (hasUnverified || hasReviewRequired) && (
        <div className="p-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">Identity Verification Required</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Some reports have unverified or ambiguous patient identity. Manual review may be required before analysis.
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Interactive Report Selection Matrix */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-mono">1</span>
              <span>{dict.analysis_select_reports_title}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select 1 report to evaluate parameters, or 2, 5, 10+ reports to compare chronological trajectory.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-brand-600 dark:text-brand-400">
            <button onClick={onSelectAllReports} className="hover:underline">
              {dict.analysis_select_all} ({validReports.length})
            </button>
            <span>•</span>
            <button onClick={onClearSelectedReports} className="hover:underline">
              {dict.analysis_clear_selection}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {reports.map((r) => {
            const isMismatched = r.identityStatus === 'IDENTITY_MISMATCH';
            const isChecked = selectedReportIds.includes(r.reportId);
<<<<<<< HEAD
            const identity = getIdentityBadge(r.identityVerificationStatus);
            const isMismatch = r.identityVerificationStatus === 'MISMATCH';
            return (
              <div
                key={r.reportId}
                onClick={() => !isMismatch && onToggleReportSelect(r.reportId)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isChecked
                    ? 'bg-brand-50/70 dark:bg-brand-950/50 border-brand-400 dark:border-brand-600 ring-2 ring-brand-500/20 shadow-sm'
                    : isMismatch
                      ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
=======

            return (
              <div
                key={r.reportId}
                onClick={() => {
                  if (!isMismatched) onToggleReportSelect(r.reportId);
                }}
                className={`p-3.5 rounded-xl border transition-all select-none ${
                  isMismatched
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 opacity-70 cursor-not-allowed'
                    : isChecked
                    ? 'bg-brand-50/70 dark:bg-brand-950/50 border-brand-400 dark:border-brand-600 ring-2 ring-brand-500/20 shadow-sm cursor-pointer'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 cursor-pointer'
>>>>>>> origin/main
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {r.reportId}
                  </span>
                  <div className={isChecked ? 'text-brand-600' : 'text-slate-400'}>
                    {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {r.reportDate}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {r.provider}
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400">
                    {r.parameterCount || r.extractedParameters?.length || 0} params
                  </span>

                  {/* Identity Verification Status Badge */}
                  {isMismatched ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-bold">
                      Mismatch
                    </span>
                  ) : r.identityStatus === 'IDENTITY_UNVERIFIED' ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-medium">
                      Unverified
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {identity.icon}
                  <span className={`text-xs font-bold ${identity.color}`}>
                    {identity.label}
                  </span>
                </div>
                {isMismatch && (
                  <div className="mt-1 text-[9px] text-rose-600 dark:text-rose-400 font-medium">
                    Excluded from analysis
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Clinical Intelligence & Parameter Matrix Results */}
      {analysisResult && (
        <div className="space-y-6">
<<<<<<< HEAD
          {/* Analysis Status Bar */}
          <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              {analysisResult.analysisStatus === 'Patient Identity Mismatch' ? (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              ) : analysisResult.analysisStatus === 'Analysis Complete' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
              <span>Status: </span>
              <span className={`font-bold ${getAnalysisStatusColor(analysisResult.analysisStatus)}`}>
                {analysisResult.analysisStatus}
=======
          {/* Active Clinical Analysis Status Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>
                Status:{' '}
                <b className="text-emerald-400">
                  {analysisResult.comparisons.length === 0
                    ? 'Single-Report Clinical Intelligence Evaluation'
                    : `Longitudinal Multi-Document Comparison (${analysisResult.selectedReportIds.length} Reports)`}
                </b>
>>>>>>> origin/main
              </span>
            </div>

            <div className="flex items-center gap-3">
              {analysisResult.completeness?.issues && analysisResult.completeness.issues.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>Incomplete data detected</span>
                </div>
              )}
              {onOpenExport && (
                <button
                  onClick={onOpenExport}
                  disabled={analysisResult.analysisStatus === 'Patient Identity Mismatch'}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <span>{dict.share_whatsapp} / PDF</span>
                </button>
              )}
              <button
                onClick={() => navigate('/clinical-summary')}
                className="text-cyan-400 font-bold hover:underline flex items-center gap-1 font-sans"
              >
                <span>{dict.nav_clinical_summary}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

<<<<<<< HEAD
          {analysisResult.analysisStatus === 'Patient Identity Mismatch' && (
            <div className="p-4 rounded-xl border-rose-200 bg-rose-50 text-rose-700 text-sm">
              <p><strong>Analysis blocked:</strong> One or more reports have a patient identity mismatch and cannot be included in clinical comparison.</p>
              <p>Please upload the correct documents for this patient or contact the administrator for manual review.</p>
            </div>
          )}
=======
          {/* Bilingual English & Tamil Clinical Summary Cards */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Clinical Findings Summary (English & தமிழ்)
                </h3>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-semibold">
                <button
                  onClick={() => setSummaryLang('both')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    summaryLang === 'both' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                  }`}
                >
                  Both
                </button>
                <button
                  onClick={() => setSummaryLang('en')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    summaryLang === 'en' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setSummaryLang('ta')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    summaryLang === 'ta' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                  }`}
                >
                  தமிழ்
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(summaryLang === 'both' || summaryLang === 'en') && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                    <span>English Clinical Summary</span>
                  </div>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                    {analysisResult.englishSummary.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(summaryLang === 'both' || summaryLang === 'ta') && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>தமிழ் மருத்துவச் சுருக்கம்</span>
                  </div>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                    {analysisResult.tamilSummary.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Medical Cautionary Disclaimer */}
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <p>
                <b>Clinical Guidance Note:</b> MEDI-TREND AI provides clinical decision support grounded strictly in laboratory reference standards. It does not independently establish a definitive medical diagnosis. Clinical correlation, patient history, and direct physician assessment are required.
              </p>
            </div>
          </div>
>>>>>>> origin/main

          {/* Full Key Parameters Comparison Table */}
          {analysisResult.keyParameters.length > 0 && (
            <KeyParametersTable
              parameters={analysisResult.keyParameters}
              baselineReportName={baselineReport.reportId}
              followUpReportName={followUpReport.reportId}
              baselineDate={baselineReport.reportDate}
              followUpDate={followUpReport.reportDate}
              selectedParamName={selectedParam?.name || ''}
              onSelectParameterForChart={onSelectParamForChart}
            />
          )}

          {analysisResult.keyParameters.length === 0 && analysisResult.analysisStatus !== 'Patient Identity Mismatch' && (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title="No Comparable Parameters Found"
                description="The selected reports do not share any common laboratory parameters for comparison."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
