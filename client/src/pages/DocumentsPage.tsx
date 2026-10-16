import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { PatientProfile, ReportRecord } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { DocumentSourceModal } from '../components/DocumentSourceModal';
import { useLanguage } from '../context/LanguageContext';

interface DocumentsPageProps {
  currentPatient: PatientProfile | null;
  reports: ReportRecord[];
  onOpenUpload: () => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  currentPatient,
  reports,
  onOpenUpload,
}) => {
  const { dict } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedDocForModal, setSelectedDocForModal] = useState<ReportRecord | null>(null);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reportDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.category && r.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.reportId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'ALL' || r.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(reports.map((r) => r.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            <span>{dict.docs_page_title}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {dict.docs_page_title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentPatient
              ? `${dict.docs_page_subtitle} (${currentPatient.name} - ${currentPatient.patientId})`
              : dict.docs_page_subtitle}
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35 transition active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{dict.nav_upload_pdf}</span>
        </button>
      </div>

      {/* Controls / Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={dict.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid / Table */}
      {filteredReports.length === 0 ? (
        <EmptyState
          title={dict.dash_no_reports_msg}
          description={dict.dash_no_reports_sub}
          actionLabel={dict.dash_ingest_first}
          onAction={onOpenUpload}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.reportId}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 hover:border-brand-500/50 transition-all hover:shadow-lg hover:shadow-brand-500/5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    {report.reportId}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                  {report.category || 'Diagnostic Laboratory Report'}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{report.provider}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Report Date: {report.reportDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{report.extractedParameters.length} Parameters Extracted</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedDocForModal(report)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl text-xs font-semibold transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{dict.docs_view_source}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Source Modal */}
      <DocumentSourceModal
        isOpen={Boolean(selectedDocForModal)}
        report={selectedDocForModal}
        onClose={() => setSelectedDocForModal(null)}
      />
    </div>
  );
};
