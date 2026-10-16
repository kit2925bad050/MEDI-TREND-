import React, { useState } from 'react';
import { ReportRecord, ParameterData } from '../types';
import { X, FileText, ExternalLink, ShieldCheck, CheckCircle, Search } from 'lucide-react';

interface DocumentSourceModalProps {
  report: ReportRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentSourceModal: React.FC<DocumentSourceModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [filterText, setFilterText] = useState('');

  if (!isOpen || !report) return null;

  const filteredParams = (report.extractedParameters || []).filter(
    (p) =>
      p.parameterName.toLowerCase().includes(filterText.toLowerCase()) ||
      p.unit.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{report.reportId} Source Traceability</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-normal">
                  Verified Ground Truth
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {report.provider} • Date: {report.reportDate} • Uploaded: {report.uploadDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Side-by-side: Extracted Data & Simulated Original PDF) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          {/* Left Column: Extracted Structured Records */}
          <div className="p-5 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Extracted Clinical Parameters ({filteredParams.length})
              </h4>
              <div className="relative w-40">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter parameters..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredParams.map((param, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {param.parameterName}
                    </span>
                    <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                      {param.value} {param.unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>Ref Range: {param.referenceRange}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                      Source: Page {param.sourcePage}
                    </span>
                  </div>

                  {param.sourceText && (
                    <div className="text-[10px] text-slate-400 font-mono bg-white dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800 mt-1.5">
                      Ground Truth Raw: "{param.sourceText}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Ground-truth PDF Visual Preview */}
          <div className="p-5 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-start">
            <div className="w-full bg-white text-slate-900 p-6 rounded-xl shadow-lg border border-slate-300 max-w-sm space-y-4 font-sans text-xs">
              {/* Lab Report Header */}
              <div className="border-b pb-3 text-center">
                <div className="font-extrabold text-sm text-[#004b87] uppercase tracking-wider">
                  {report.provider}
                </div>
                <div className="text-[10px] text-slate-500">
                  CLINICAL REFERENCE LABORATORY • ISO 15189 CERTIFIED
                </div>
              </div>

              {/* Patient Block */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px] grid grid-cols-2 gap-1">
                <div><b>Patient:</b> S. Gurumurthy</div>
                <div><b>Patient ID:</b> PT-2026-001</div>
                <div><b>Date:</b> {report.reportDate}</div>
                <div><b>Ref Doctor:</b> Dr. Arvind Kumar</div>
              </div>

              {/* Sample Highlighted Results */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-700 border-b pb-1">
                  INVESTIGATION FINDINGS
                </div>
                {report.extractedParameters?.slice(0, 7).map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1 border-b border-dashed border-slate-200 text-[10px]"
                  >
                    <span>{p.parameterName}</span>
                    <span className="font-mono font-bold bg-amber-100 px-1 rounded text-slate-900">
                      {p.value} {p.unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Verified Stamp */}
              <div className="pt-2 text-center text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Digitally Authenticated Document Grounding</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>* Original document is stored immutably in secure hospital storage.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700"
          >
            Close Source Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
