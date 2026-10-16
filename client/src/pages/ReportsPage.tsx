import React, { useState } from 'react';
import { ReportRecord, PatientProfile } from '../types';
import {
  FileText,
  Search,
  Upload,
  Eye,
  Filter,
  Calendar,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Building2,
  Loader2,
  ShieldAlert,
  X,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { deleteReport } from '../services/api';
import { ContactAdminModal } from '../components/ContactAdminModal';
import { useLanguage } from '../context/LanguageContext';

interface ReportsPageProps {
  patient: PatientProfile | null;
  reports: ReportRecord[];
  onOpenUpload: () => void;
  onViewSource: (report: ReportRecord) => void;
  onReportDeleted?: (reportId: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  patient,
  reports,
  onOpenUpload,
  onViewSource,
  onReportDeleted,
}) => {
  const { dict } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('All Providers');
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [confirmDeleteReport, setConfirmDeleteReport] = useState<ReportRecord | null>(null);
  const [deleteReason, setDeleteReason] = useState('Duplicate or superseded laboratory report');
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);
  const [deleteSuccessBanner, setDeleteSuccessBanner] = useState<string | null>(null);
  const [isContactAdminOpen, setIsContactAdminOpen] = useState(false);
  const [contactAdminReportId, setContactAdminReportId] = useState<string | undefined>(undefined);

  if (!patient) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileText}
          title="No Patient Selected"
          description="Please select a patient from the Patients tab to view their medical report library."
        />
      </div>
    );
  }

  const providers = ['All Providers', ...Array.from(new Set(reports.map((r) => r.provider)))];

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.reportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reportDate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProv = selectedProvider === 'All Providers' || r.provider === selectedProvider;
    return matchesSearch && matchesProv;
  });

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteReport) return;
    const repId = confirmDeleteReport.reportId;
    setDeletingReportId(repId);
    setModalErrorMsg(null);

    try {
      await deleteReport(repId, deleteReason);
      setDeletingReportId(null);
      setConfirmDeleteReport(null);
      setDeleteSuccessBanner(`Report ${repId} moved to Deleted Files. It is securely preserved in the Hospital Admin Portal.`);
      onReportDeleted?.(repId);
    } catch (err: any) {
      setDeletingReportId(null);
      setModalErrorMsg(err.message || 'Unable to move this report to Deleted Files. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {deleteSuccessBanner && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{deleteSuccessBanner}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const matched = deleteSuccessBanner.match(/Report\s+[0-9]+/i) || deleteSuccessBanner.match(/REP-[A-Za-z0-9]+/);
                setContactAdminReportId(matched ? matched[0] : undefined);
                setIsContactAdminOpen(true);
              }}
              className="px-3 py-1 bg-amber-200 dark:bg-amber-900/80 hover:bg-amber-300 font-bold rounded-xl text-amber-900 dark:text-amber-100 text-[11px] transition flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Request Admin Restore</span>
            </button>
            <button
              onClick={() => setDeleteSuccessBanner(null)}
              className="text-amber-700 dark:text-amber-400 font-bold px-2 py-1 hover:underline"
            >
              {dict.close}
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-500" />
            <span>{dict.nav_reports}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {patient.name} ({reports.length} Reports)
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.docs_page_subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={dict.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-slate-200"
            />
          </div>

          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer font-medium"
          >
            {providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            <span>{dict.nav_upload_pdf}</span>
          </button>
        </div>
      </div>

      {/* Reports Table / Cards */}
      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={dict.dash_no_reports_msg}
          description={dict.dash_no_reports_sub}
          actionText={dict.dash_ingest_first}
          onAction={onOpenUpload}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Matching Reports Found"
          description={`No reports found matching "${searchTerm}".`}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3.5 px-4">Report Identifier</th>
                  <th className="py-3.5 px-4">Collection Date</th>
                  <th className="py-3.5 px-4">Laboratory Provider</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Extracted Parameters</th>
                  <th className="py-3.5 px-4 text-center">{dict.status}</th>
                  <th className="py-3.5 px-4 text-right">{dict.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filtered.map((report) => (
                  <tr
                    key={report.reportId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition text-slate-800 dark:text-slate-200"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-500" />
                        <span>{report.reportId}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Uploaded: {report.uploadDate}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold">
                      {report.reportDate}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {report.provider}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {report.category || 'General Panel'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-md bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800">
                        {report.parameterCount || report.extractedParameters?.length || 0} parameters
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {report.extractionStatus || 'Verified'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewSource(report)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-500" />
                          <span>{dict.docs_view_source}</span>
                        </button>

                        <button
                          onClick={() => {
                            setConfirmDeleteReport(report);
                            setModalErrorMsg(null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold text-xs transition"
                          title="Move Report to Deleted Files"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Move Report to Deleted Files Modal */}
      {confirmDeleteReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-red-200 dark:border-red-900/50 shadow-2xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Move Report to Deleted Files?
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {dict.pid_label}: {patient.name} ({patient.patientId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmDeleteReport(null)}
                disabled={Boolean(deletingReportId)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message inside Modal */}
            {modalErrorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            {/* Metadata Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-1 font-medium">
              <div><b>Report:</b> {confirmDeleteReport.reportId}</div>
              <div><b>Provider:</b> {confirmDeleteReport.provider}</div>
              <div><b>Report Date:</b> {confirmDeleteReport.reportDate}</div>
              <div><b>Parameters:</b> {confirmDeleteReport.parameterCount} extracted values</div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This report will be removed from your active Reports list and securely retained in <b>Deleted Files</b> for authorized recovery.
            </p>

            {/* Reason selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Deletion
              </label>
              <select
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="Duplicate or superseded laboratory report">Duplicate or superseded laboratory report</option>
                <option value="Incorrect test panel or date entered">Incorrect test panel or date entered</option>
                <option value="Document uploaded under incorrect patient record">Document uploaded under incorrect patient record</option>
                <option value="Clinician requested file removal">Clinician requested file removal</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteReport(null)}
                disabled={Boolean(deletingReportId)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={Boolean(deletingReportId)}
                className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md shadow-red-600/30 transition flex items-center gap-1.5"
              >
                {deletingReportId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Moving to Deleted Files...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move to Deleted Files</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Admin Modal */}
      <ContactAdminModal
        isOpen={isContactAdminOpen}
        onClose={() => setIsContactAdminOpen(false)}
        patientId={patient.patientId}
        reportId={contactAdminReportId}
        defaultSubject={contactAdminReportId ? `Request to restore archived report ${contactAdminReportId}` : 'Clinical Request to Admin'}
      />
    </div>
  );
};
