import React from 'react';
import {
  WoundCorrelatedReportSummary,
  CorrelatedBiomarker,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  FileCheck2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';

import { WoundLanguageMode } from '../../utils/woundTranslation';
import { WoundDualBlock } from './WoundDualBlock';

interface WoundReportCorrelationCardProps {
  summary: WoundCorrelatedReportSummary;
  mode?: WoundLanguageMode;
}

export const WoundReportCorrelationCard: React.FC<WoundReportCorrelationCardProps> = ({
  summary,
  mode = 'en',
}) => {
  const { isTamil } = useLanguage();

  if (!summary || summary.approved_report_count === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-slate-500">
          <HelpCircle className="w-5 h-5 text-slate-400" />
          <div className="text-xs">
            <span className="font-bold">
              {isTamil ? 'அங்கீகரிக்கப்பட்ட ஆய்வக அறிக்கைகள் இல்லை' : 'No Approved Laboratory Reports Available'}
            </span>
            <p className="text-slate-400 mt-0.5">
              {isTamil
                ? 'புண் குணமடைதலை ஆய்வு செய்ய குறைந்தபட்சம் ஒரு அங்கீகரிக்கப்பட்ட மருத்துவ அறிக்கையை பதிவேற்றவும்.'
                : 'Upload and validate medical reports to correlate metabolic, glycemic, and inflammatory markers with wound healing.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'high':
      case 'critical':
      case 'elevated':
        return 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';
      case 'low':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
      case 'optimal':
      case 'normal':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>
                {isTamil
                  ? 'அங்கீகரிக்கப்பட்ட மருத்துவ அறிக்கை & ஆய்வக ஒருங்கிணைப்பு'
                  : 'Approved Medical Reports & Biomarker Correlation'}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {summary.approved_report_count} {isTamil ? 'அறிக்கைகள்' : 'Approved Reports'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isTamil
                ? 'புண் குணமடைதலுடன் தொடர்புடைய இரத்த சர்க்கரை, அழற்சி மற்றும் ஊட்டச்சத்து குறிப்பான்கள்'
                : 'Correlated glycemic, inflammatory, and nutritional markers impacting tissue regeneration'}
            </p>
          </div>
        </div>
      </div>

      {/* Correlated Parameters Table */}
      {summary.correlated_parameters && summary.correlated_parameters.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-2">{isTamil ? 'குறிப்பான் (Biomarker)' : 'Biomarker Parameter'}</th>
                <th className="pb-2">{isTamil ? 'சமீபத்திய மதிப்பு' : 'Latest Value'}</th>
                <th className="pb-2">{isTamil ? 'நிலை' : 'Status'}</th>
                <th className="pb-2">{isTamil ? 'தேதி & போக்கு' : 'Date & Trend'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {summary.correlated_parameters.map((bm, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="py-2.5 text-slate-800 dark:text-slate-200 font-bold">
                    {bm.parameter}
                  </td>
                  <td className="py-2.5 font-mono text-slate-900 dark:text-white">
                    {bm.latest_value} <span className="text-[10px] text-slate-400">{bm.unit}</span>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColor(
                        bm.status
                      )}`}
                    >
                      {bm.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="font-mono">{bm.report_date}</span>
                    {bm.trend_text && (
                      <span className="block text-[10px] text-brand-600 dark:text-brand-400 font-mono mt-0.5">
                        {bm.trend_text}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-3 text-xs text-slate-500 italic">
          {isTamil
            ? 'அங்கீகரிக்கப்பட்ட அறிக்கைகளில் புண் தொடர்பான குறிப்பிட்ட குறிப்பான்கள் கண்டறியப்படவில்லை.'
            : 'No direct wound-related biomarkers found in existing approved reports.'}
        </div>
      )}

      {/* Clinical Correlation Summary Note */}
      {summary.clinical_correlation_note && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>{mode === 'ta' ? 'மருத்துவ ஆய்வு குறிப்பு' : mode === 'both' ? 'Clinical Decision Support Correlation / மருத்துவ ஆய்வு குறிப்பு' : 'Clinical Decision Support Correlation'}</span>
          </div>
          <WoundDualBlock en={summary.clinical_correlation_note} mode={mode} />
        </div>
      )}

      {/* Missing Key Parameters Display (Explicitly surfaces missing data) */}
      {summary.missing_key_parameters && summary.missing_key_parameters.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {isTamil
                ? 'அறிக்கைகளில் இல்லாத முக்கியமான ஆய்வக சோதனைகள் (Missing Data):'
                : 'Key Wound Healing Biomarkers Missing from Recent Reports:'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {summary.missing_key_parameters.map((param, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                • {param}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            {isTamil
              ? 'துல்லியமான மருத்துவ முடிவுக்கு இந்த விடுபட்ட சோதனைகளை செய்ய மருத்துவர் பரிசீலிக்கலாம்.'
              : 'Consider ordering these missing tests to evaluate nutritional, inflammatory, and metabolic healing reserves.'}
          </p>
        </div>
      )}
    </div>
  );
};
