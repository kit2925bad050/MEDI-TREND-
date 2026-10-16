import React, { useState } from 'react';
import { AIAnalysisResult, PatientProfile } from '../types';
import {
  Sparkles,
  ShieldCheck,
  Copy,
  Download,
  Check,
  Languages,
  AlertCircle,
  FileCheck,
  Share2,
  MessageSquare,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AIClinicalSummaryProps {
  analysis: AIAnalysisResult;
  patient?: PatientProfile | null;
  onOpenExport?: () => void;
}

export const AIClinicalSummary: React.FC<AIClinicalSummaryProps> = ({
  analysis,
  patient,
  onOpenExport,
}) => {
  const { dict } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `MEDI-TREND AI CLINICAL SUMMARY\nPatient: ${analysis.patientName} (${analysis.patientId})\nReports: ${analysis.selectedReportIds.join(', ')}\n\n[ENGLISH SUMMARY]\n${analysis.englishSummary.map(s => `• ${s}`).join('\n')}\n\n[தமிழ் சுருக்கம்]\n${analysis.tamilSummary.map(s => `• ${s}`).join('\n')}\n\nDisclaimer: AI-assisted comparison for clinical review support only.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickWhatsAppShare = () => {
    if (onOpenExport) {
      onOpenExport();
      return;
    }
    const phone = patient?.phone ? patient.phone.replace(/[^0-9]/g, '') : '';
    const cleanNumber = phone.length === 10 ? `91${phone}` : phone;
    const msg = `🏥 *MEDI-TREND AI — PATIENT CLINICAL REPORT*\n👤 *Patient:* ${analysis.patientName} (${analysis.patientId})\n📋 *Reports Analyzed:* ${analysis.selectedReportIds.join(', ')}\n\n${analysis.englishSummary.map(s => `• ${s}`).join('\n')}\n\n🇮🇳 *தமிழ் சுருக்கம்:*\n${analysis.tamilSummary.map(s => `• ${s}`).join('\n')}`;
    const url = cleanNumber ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 select-none transition-colors duration-200 flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {dict.ai_summary_title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share to WhatsApp Button */}
            <button
              onClick={handleQuickWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition shadow-sm"
              title={dict.share_whatsapp}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{dict.share_whatsapp}</span>
            </button>

            {/* Source Grounding Badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{dict.ai_verified_badge}</span>
            </span>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={dict.copy}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dual Language Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {/* English Summary Box */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="w-6 h-6 rounded-md bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center">
                EN
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {dict.ai_summary_en_title}
                </div>
                <div className="text-[10px] text-slate-400">
                  {analysis.englishSummary.length} {dict.ai_key_findings}
                </div>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {analysis.englishSummary.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tamil Summary Box (தமிழ் சுருக்கம்) */}
          <div className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/50 space-y-2 font-tamil">
            <div className="flex items-center gap-2 pb-1 border-b border-blue-200/40 dark:border-blue-800/40 font-sans">
              <span className="w-6 h-6 rounded-md bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center">
                TA
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white font-tamil">
                  {dict.ai_summary_ta_title}
                </div>
                <div className="text-[10px] text-slate-400 font-tamil">
                  {analysis.tamilSummary.length} {dict.ai_key_findings}
                </div>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-tamil">
              {analysis.tamilSummary.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Monitoring Alert (if any) */}
        {analysis.monitoringItems && analysis.monitoringItems.length > 0 && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-bold">{dict.ai_followup_note}: </span>
              {analysis.monitoringItems[0].parameter} – {analysis.monitoringItems[0].action}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
