import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIAnalysisResult, PatientProfile } from '../types';
import {
  Sparkles,
  ShieldCheck,
  Brain,
  Printer,
  Copy,
  Check,
  AlertCircle,
  FileCheck,
  Calendar,
  Cpu,
  Layers,
  FileDown,
  Share2,
  MessageSquare,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { AIClinicalSummary } from '../components/AIClinicalSummary';
import { useLanguage } from '../context/LanguageContext';

interface ClinicalSummaryPageProps {
  patient: PatientProfile | null;
  analysis: AIAnalysisResult | null;
  onOpenExport: () => void;
}

export const ClinicalSummaryPage: React.FC<ClinicalSummaryPageProps> = ({
  patient,
  analysis,
  onOpenExport,
}) => {
  const navigate = useNavigate();
  const { dict } = useLanguage();

  if (!patient) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Sparkles}
          title="No Patient Selected"
          description="Select a patient to inspect their generated bilingual clinical summaries."
        />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Brain}
          title="No Clinical Summary Generated Yet"
          description={`No longitudinal analysis has been executed for ${patient.name} yet. Run an AI analysis across selected reports to generate grounded bilingual clinical summaries.`}
          actionText={dict.dash_run_comparison}
          onAction={() => navigate('/analysis')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-500" />
            <span>{dict.ai_summary_title}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${
              analysis.analysisStatus === 'Analysis Complete'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                : analysis.analysisStatus === 'Patient Identity Mismatch'
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/60 dark:text-rose-400 border border-rose-200'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/60 dark:text-amber-400 border border-amber-200'
            }`}>
              {analysis.analysisStatus}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.dash_clinical_summary_desc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>{dict.share_whatsapp}</span>
          </button>
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition"
          >
            <FileDown className="w-4 h-4" />
            <span>{dict.export_pdf}</span>
          </button>
        </div>
      </div>

      {/* Analysis Metadata Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-cyan-500/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Analysis ID</span>
          <span className="font-bold text-cyan-300">{analysis.analysisId}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Selected Reports</span>
          <span className="font-bold text-slate-200">{analysis.selectedReportIds.join(' • ')}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Verified Reports</span>
          <span className="font-bold text-slate-200">{analysis.verifiedReportIds.join(' • ')}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Analysis Date</span>
          <span className="font-bold text-slate-200">{analysis.analysisDate}</span>
        </div>
        {analysis.completeness && analysis.completeness.issues && analysis.completeness.issues.length > 0 && (
          <div className="col-span-full mt-2 p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-600 text-xs">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            <span>Completeness issues: {analysis.completeness.issues.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Main Dual-Language Clinical Summary Card */}
      <AIClinicalSummary analysis={analysis} patient={patient} onOpenExport={onOpenExport} />
    </div>
  );
};
