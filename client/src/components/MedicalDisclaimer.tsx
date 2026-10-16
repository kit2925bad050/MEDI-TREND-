import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export const MedicalDisclaimer: React.FC = () => {
  return (
    <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start sm:items-center gap-3 select-none">
      <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 space-y-0.5">
        <div className="font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
          <span>CLINICAL DECISION SUPPORT SYSTEM (CDSS) MANDATORY NOTICE</span>
          <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-mono">
            NON-DIAGNOSTIC
          </span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          MEDI-TREND AI is designed to assist licensed physicians and healthcare professionals with longitudinal comparison and structured visualization of laboratory documents. This application does not provide a definitive medical diagnosis, prescribe pharmaceutical treatment, or replace certified clinical judgment. All mathematical percentage changes and status classifications are computed deterministically from verified source PDF values.
        </p>
      </div>
    </div>
  );
};
