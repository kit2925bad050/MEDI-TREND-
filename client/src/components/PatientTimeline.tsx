import React from 'react';
import { ReportRecord } from '../types';
import { Upload, Eye, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

interface PatientTimelineProps {
  reports: ReportRecord[];
  selectedReportIds: string[];
  onToggleReportSelect: (reportId: string) => void;
  onOpenUpload: () => void;
  onViewSource: (report: ReportRecord) => void;
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({
  reports,
  selectedReportIds,
  onToggleReportSelect,
  onOpenUpload,
  onViewSource,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 select-none transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Patient Report Timeline</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({reports.length} longitudinal records)
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ Upload Report</span>
          </button>
        </div>
      </div>

      {/* Horizontal Connected Timeline */}
      <div className="relative overflow-x-auto pb-2 pt-1">
        {/* Connection Line */}
        <div className="absolute top-[28px] left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 z-0" />

        <div className="flex items-start gap-4 min-w-[700px] relative z-10">
          {reports.map((report, idx) => {
            const isSelected = selectedReportIds.includes(report.reportId);
            return (
              <div
                key={report.reportId}
                className={`flex-1 min-w-[150px] p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-brand-50/60 dark:bg-brand-950/40 border-brand-400 dark:border-brand-600 ring-2 ring-brand-500/20 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {/* Node Number & Checkbox */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      isSelected
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleReportSelect(report.reportId)}
                      className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Report Info */}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-brand-500" />
                    <span>{report.reportId}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {report.reportDate}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Lab: {report.provider}
                  </div>
                  <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                    {report.parameterCount || report.extractedParameters?.length || 32} parameters
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <button
                    onClick={() => onViewSource(report)}
                    className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Doc</span>
                  </button>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono">
                    Verified
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
