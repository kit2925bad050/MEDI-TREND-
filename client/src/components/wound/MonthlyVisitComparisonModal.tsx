import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { WoundVisitComparisonResult } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { WoundLanguageMode } from '../../utils/woundTranslation';

interface MonthlyVisitComparisonModalProps {
  comparison: WoundVisitComparisonResult;
  isOpen: boolean;
  onClose: () => void;
  woundLang?: WoundLanguageMode;
}

export const MonthlyVisitComparisonModal: React.FC<MonthlyVisitComparisonModalProps> = ({
  comparison,
  isOpen,
  onClose,
  woundLang = 'en',
}) => {
  const { isTamil } = useLanguage();
  const [basePhotoIdx, setBasePhotoIdx] = useState(0);
  const [currPhotoIdx, setCurrPhotoIdx] = useState(0);

  if (!isOpen) return null;

  const basePhotos = comparison.baseline_visit.photos || [];
  const currPhotos = comparison.current_visit.photos || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Improving':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Worsening':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'Mixed / Needs Monitoring':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const isDual = woundLang === 'both';
  const isTaOnly = woundLang === 'ta';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isTaOnly
                  ? 'மாதாந்திர புண் வருகை ஒப்பீடு'
                  : isDual
                  ? 'Monthly Wound Visit Comparison / மாதாந்திர வருகை ஒப்பீடு'
                  : 'Monthly Wound Visit Comparison'}
              </h2>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${getStatusColor(
                  comparison.progress_status
                )}`}
              >
                {comparison.progress_status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Patient: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{comparison.patient_id}</span> • Comparing{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {comparison.baseline_visit.visit_month}
              </span>{' '}
              with{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {comparison.current_visit.visit_month}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Comparison Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Side-by-Side Visit Photo Galleries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Previous Visit (Baseline) */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Previous Month
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>{comparison.baseline_visit.visit_month}</span>
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Date: {comparison.baseline_visit.visit_date} • {basePhotos.length} Photos
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {comparison.baseline_visit.wound_location}
                </span>
              </div>

              {/* Main Photo Display */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center">
                {basePhotos.length > 0 ? (
                  <img
                    src={basePhotos[basePhotoIdx]?.image_url}
                    alt="Previous visit photo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-slate-500 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>No image stored</span>
                  </div>
                )}
                {basePhotos.length > 1 && (
                  <div className="absolute inset-x-2 bottom-2 flex items-center justify-between text-white text-xs bg-black/60 px-2.5 py-1 rounded-xl backdrop-blur-sm">
                    <button
                      onClick={() => setBasePhotoIdx((prev) => (prev > 0 ? prev - 1 : basePhotos.length - 1))}
                      className="p-0.5 hover:text-rose-400"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span>
                      Photo {basePhotoIdx + 1} of {basePhotos.length}
                    </span>
                    <button
                      onClick={() => setBasePhotoIdx((prev) => (prev < basePhotos.length - 1 ? prev + 1 : 0))}
                      className="p-0.5 hover:text-rose-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {basePhotos.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {basePhotos.map((p, idx) => (
                    <button
                      key={p.photo_id}
                      onClick={() => setBasePhotoIdx(idx)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                        basePhotoIdx === idx ? 'border-rose-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Previous Summary */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200/80 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  Baseline Clinical Summary:
                </div>
                <p>{comparison.baseline_visit.summary}</p>
              </div>
            </div>

            {/* Current Visit (Follow-up) */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Current Month
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>{comparison.current_visit.visit_month}</span>
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Date: {comparison.current_visit.visit_date} • {currPhotos.length} Photos
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  {comparison.current_visit.wound_location}
                </span>
              </div>

              {/* Main Photo Display */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center">
                {currPhotos.length > 0 ? (
                  <img
                    src={currPhotos[currPhotoIdx]?.image_url}
                    alt="Current visit photo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-slate-500 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>No image stored</span>
                  </div>
                )}
                {currPhotos.length > 1 && (
                  <div className="absolute inset-x-2 bottom-2 flex items-center justify-between text-white text-xs bg-black/60 px-2.5 py-1 rounded-xl backdrop-blur-sm">
                    <button
                      onClick={() => setCurrPhotoIdx((prev) => (prev > 0 ? prev - 1 : currPhotos.length - 1))}
                      className="p-0.5 hover:text-rose-400"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span>
                      Photo {currPhotoIdx + 1} of {currPhotos.length}
                    </span>
                    <button
                      onClick={() => setCurrPhotoIdx((prev) => (prev < currPhotos.length - 1 ? prev + 1 : 0))}
                      className="p-0.5 hover:text-rose-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {currPhotos.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {currPhotos.map((p, idx) => (
                    <button
                      key={p.photo_id}
                      onClick={() => setCurrPhotoIdx(idx)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                        currPhotoIdx === idx ? 'border-rose-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Current Summary */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200/80 dark:border-slate-700/60">
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  Current Clinical Summary:
                </div>
                <p>{comparison.current_visit.summary}</p>
              </div>
            </div>
          </div>

          {/* Tissue Composition Delta Comparison */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-500" />
              <span>Visible Tissue Composition Shift (Monthly Delta)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* Granulation */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] uppercase font-bold text-slate-500">Granulation (Red)</div>
                <div className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                  {comparison.current_visit.tissue_breakdown.granulation_percent}%
                </div>
                <div className="text-[11px] font-mono mt-0.5 font-bold">
                  {comparison.tissue_changes.granulation_delta > 0 ? (
                    <span className="text-emerald-600">+{comparison.tissue_changes.granulation_delta}%</span>
                  ) : (
                    <span className="text-slate-500">{comparison.tissue_changes.granulation_delta}%</span>
                  )}
                </div>
              </div>

              {/* Slough */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] uppercase font-bold text-slate-500">Slough (Yellow)</div>
                <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {comparison.current_visit.tissue_breakdown.slough_percent}%
                </div>
                <div className="text-[11px] font-mono mt-0.5 font-bold">
                  {comparison.tissue_changes.slough_delta < 0 ? (
                    <span className="text-emerald-600">{comparison.tissue_changes.slough_delta}%</span>
                  ) : (
                    <span className="text-rose-500">+{comparison.tissue_changes.slough_delta}%</span>
                  )}
                </div>
              </div>

              {/* Necrotic */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] uppercase font-bold text-slate-500">Necrotic (Black/Eschar)</div>
                <div className="text-base font-extrabold text-slate-700 dark:text-slate-300 mt-1">
                  {comparison.current_visit.tissue_breakdown.necrotic_percent}%
                </div>
                <div className="text-[11px] font-mono mt-0.5 font-bold">
                  {comparison.tissue_changes.necrotic_delta <= 0 ? (
                    <span className="text-emerald-600">{comparison.tissue_changes.necrotic_delta}%</span>
                  ) : (
                    <span className="text-rose-600">+{comparison.tissue_changes.necrotic_delta}%</span>
                  )}
                </div>
              </div>

              {/* Epithelial */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] uppercase font-bold text-slate-500">Epithelial Margin</div>
                <div className="text-base font-extrabold text-pink-600 dark:text-pink-400 mt-1">
                  {comparison.current_visit.tissue_breakdown.epithelial_percent}%
                </div>
                <div className="text-[11px] font-mono mt-0.5 font-bold">
                  {comparison.tissue_changes.epithelial_delta >= 0 ? (
                    <span className="text-emerald-600">+{comparison.tissue_changes.epithelial_delta}%</span>
                  ) : (
                    <span className="text-slate-500">{comparison.tissue_changes.epithelial_delta}%</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Categorized Findings Trajectory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Improved */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Signs of Improvement ({comparison.findings_trajectory.improved_findings.length})</span>
              </div>
              <ul className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1 pl-4 list-disc">
                {comparison.findings_trajectory.improved_findings.length > 0 ? (
                  comparison.findings_trajectory.improved_findings.map((f, i) => <li key={i}>{f}</li>)
                ) : (
                  <li className="text-slate-500 italic list-none">No distinctive improvement detected</li>
                )}
              </ul>
            </div>

            {/* Worsened / Deterioration */}
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-2">
              <div className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Signs of Deterioration ({comparison.findings_trajectory.worsened_findings.length})</span>
              </div>
              <ul className="text-xs text-rose-900 dark:text-rose-200 space-y-1 pl-4 list-disc">
                {comparison.findings_trajectory.worsened_findings.length > 0 ? (
                  comparison.findings_trajectory.worsened_findings.map((f, i) => <li key={i}>{f}</li>)
                ) : (
                  <li className="text-slate-500 italic list-none">No acute worsening signs detected</li>
                )}
              </ul>
            </div>

            {/* Stable / Unchanged */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-600" />
                <span>Stable / Unchanged Features ({comparison.findings_trajectory.unchanged_findings.length})</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-4 list-disc">
                {comparison.findings_trajectory.unchanged_findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Dimensions Comparison Notice */}
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Approximate Dimensions & Calibration Standard:</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              {comparison.dimensions_comparison.note}
            </p>
          </div>

          {/* Overall Comparison Summary */}
          <div className="p-5 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
            <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600" />
              <span>Longitudinal Comparison Narrative</span>
            </h4>
            <p className="text-xs text-rose-950 dark:text-rose-100 leading-relaxed">
              {comparison.comparison_summary}
            </p>
            {isDual && comparison.tamil_translation?.comparison_summary && (
              <p className="text-xs text-rose-900/90 dark:text-rose-300/90 leading-relaxed border-t border-rose-200/60 dark:border-rose-800/40 pt-2 font-medium">
                {comparison.tamil_translation.comparison_summary}
              </p>
            )}
          </div>

          {/* Quality & Safety Disclaimers */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Image Quality & Clinical Distinction Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {comparison.quality_comparison_warning}
            </p>
            <p className="text-[11px] leading-relaxed font-semibold">
              {comparison.cautionary_note}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-md"
          >
            {isTamil ? 'மூடுக' : 'Close Comparison'}
          </button>
        </div>
      </div>
    </div>
  );
};
