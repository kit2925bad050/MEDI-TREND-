import React from 'react';
import { ReportRecord } from '../types';
import { CheckSquare, Square, Play, RefreshCw, Layers } from 'lucide-react';

interface SelectiveReportSelectorProps {
  reports: ReportRecord[];
  selectedReportIds: string[];
  onToggleReportSelect: (reportId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onRunAnalysis: () => void;
  isLoading: boolean;
}

export const SelectiveReportSelector: React.FC<SelectiveReportSelectorProps> = ({
  reports,
  selectedReportIds,
  onToggleReportSelect,
  onSelectAll,
  onClearAll,
  onRunAnalysis,
  isLoading,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 select-none transition-colors duration-200 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-500" />
              <span>Select Reports to Analyze</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Only selected documents will be compared
            </p>
          </div>

          <button
            onClick={onRunAnalysis}
            disabled={selectedReportIds.length < 2 || isLoading}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              selectedReportIds.length >= 2 && !isLoading
                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Compare Selected ({selectedReportIds.length})</span>
          </button>
        </div>

        {/* Quick select helpers */}
        <div className="flex items-center justify-between text-xs py-2 px-1 text-slate-500 dark:text-slate-400">
          <span>{selectedReportIds.length} of {reports.length} selected</span>
          <div className="flex gap-3 font-semibold text-brand-600 dark:text-brand-400">
            <button onClick={onSelectAll} className="hover:underline">Select All</button>
            <span>•</span>
            <button onClick={onClearAll} className="hover:underline">Clear</button>
          </div>
        </div>

        {/* Report List */}
        <div className="space-y-2 mt-1 max-h-[220px] overflow-y-auto pr-1">
          {reports.map((report) => {
            const isChecked = selectedReportIds.includes(report.reportId);
            return (
              <div
                key={report.reportId}
                onClick={() => onToggleReportSelect(report.reportId)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${isChecked ? 'text-brand-600' : 'text-slate-400'}`}>
                    {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold mr-2">{report.reportId}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{report.reportDate}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-3">{report.provider}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    {report.parameterCount || 32} params
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mt-3 pt-2 text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
        * Comparison strictly grounds AI conclusions to checked reports only.
      </div>
    </div>
  );
};
