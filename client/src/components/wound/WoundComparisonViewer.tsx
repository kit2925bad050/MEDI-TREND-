import React from 'react';
import {
  WoundComparisonResult,
  WoundAssessmentRecord,
} from '../../types';
import { getWoundImageUrl } from '../../services/api';
import { WoundLanguageMode, translateWoundMedicalText } from '../../utils/woundTranslation';
import { WoundDualBlock, WoundDualList } from './WoundDualBlock';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Camera,
} from 'lucide-react';

interface WoundComparisonViewerProps {
  comparison: WoundComparisonResult;
  baselineAssessment?: WoundAssessmentRecord;
  currentAssessment?: WoundAssessmentRecord;
  mode?: WoundLanguageMode;
}

export const WoundComparisonViewer: React.FC<WoundComparisonViewerProps> = ({
  comparison,
  baselineAssessment,
  currentAssessment,
  mode = 'en',
}) => {
  const isTamil = mode === 'ta';

  const getStatusBadge = (status: string) => {
    let enLabel = status;
    let taLabel = 'மதிப்பிட முடியவில்லை';
    switch (status) {
      case 'Improving':
        taLabel = 'முன்னேற்றம் காணப்படுகிறது';
        break;
      case 'Worsening':
        taLabel = 'தீவிரமடைகிறது';
        break;
      case 'No Clear Change':
        taLabel = 'குறிப்பிடத்தக்க மாற்றமில்லை';
        break;
      default:
        taLabel = 'மதிப்பிட முடியவில்லை';
        break;
    }

    let displayLabel = enLabel;
    if (mode === 'ta') {
      displayLabel = taLabel;
    } else if (mode === 'both') {
      displayLabel = `${enLabel} • ${taLabel}`;
    }

    switch (status) {
      case 'Improving':
        return {
          icon: TrendingUp,
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
          label: displayLabel,
        };
      case 'Worsening':
        return {
          icon: TrendingDown,
          bg: 'bg-rose-50 dark:bg-rose-950/60',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-200 dark:border-rose-800',
          label: displayLabel,
        };
      case 'No Clear Change':
        return {
          icon: Minus,
          bg: 'bg-blue-50 dark:bg-blue-950/60',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800',
          label: displayLabel,
        };
      default:
        return {
          icon: HelpCircle,
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-300 dark:border-slate-700',
          label: displayLabel,
        };
    }
  };

  const badge = getStatusBadge(comparison.progress_status);
  const StatusIcon = badge.icon;

  const baselineImgUrl = getWoundImageUrl(comparison.baseline_image_filename);
  const currentImgUrl = getWoundImageUrl(comparison.current_image_filename);

  const tc = comparison.tissue_changes;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isTamil ? 'புண் முன்னேற்ற ஒப்பீடு' : 'Wound Progress Comparison'}
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({comparison.baseline_date} → {comparison.current_date})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isTamil
              ? 'ஒரே நோயாளியின் முந்தைய மற்றும் தற்போதைய புண் படங்களின் பக்கவாட்டு ஒப்பீடு'
              : 'Side-by-side longitudinal assessment across consecutive patient visits'}
          </p>
        </div>

        {/* Progress Badge */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${badge.bg} ${badge.text} ${badge.border}`}
        >
          <StatusIcon className="w-4 h-4" />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Side-by-Side Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline (Previous) Image */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950/60 flex flex-col">
          <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isTamil ? 'முந்தைய படம் (Baseline)' : 'Baseline Examination'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{comparison.baseline_date}</span>
            </div>
          </div>
          <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center overflow-hidden">
            {baselineImgUrl ? (
              <img
                src={baselineImgUrl}
                alt="Baseline wound"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-4 text-slate-500 text-xs flex flex-col items-center gap-2">
                <Camera className="w-6 h-6 text-slate-600" />
                <span>{isTamil ? 'படம் கிடைக்கவில்லை' : 'Image not available'}</span>
              </div>
            )}
          </div>
          <div className="p-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span>{isTamil ? 'சிவப்பு தசை (Granulation):' : 'Granulation:'}</span>
              <b className="font-mono">{tc.baseline_breakdown.granulation_percent}%</b>
            </div>
            <div className="flex justify-between">
              <span>{isTamil ? 'மஞ்சள் சவ்வு (Slough):' : 'Slough:'}</span>
              <b className="font-mono">{tc.baseline_breakdown.slough_percent}%</b>
            </div>
            <div className="flex justify-between">
              <span>{isTamil ? 'கருப்பு இறந்த திசு (Necrotic):' : 'Necrotic Eschar:'}</span>
              <b className="font-mono">{tc.baseline_breakdown.necrotic_percent}%</b>
            </div>
          </div>
        </div>

        {/* Current (Follow-up) Image */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950/60 flex flex-col">
          <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isTamil ? 'தற்போதைய படம் (Current)' : 'Current Examination'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{comparison.current_date}</span>
            </div>
          </div>
          <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center overflow-hidden">
            {currentImgUrl ? (
              <img
                src={currentImgUrl}
                alt="Current wound"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-4 text-slate-500 text-xs flex flex-col items-center gap-2">
                <Camera className="w-6 h-6 text-slate-600" />
                <span>{isTamil ? 'படம் கிடைக்கவில்லை' : 'Image not available'}</span>
              </div>
            )}
          </div>
          <div className="p-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span>{isTamil ? 'சிவப்பு தசை (Granulation):' : 'Granulation:'}</span>
              <b
                className={`font-mono ${
                  tc.granulation_delta > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : tc.granulation_delta < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : ''
                }`}
              >
                {tc.current_breakdown.granulation_percent}% ({tc.granulation_delta > 0 ? '+' : ''}
                {tc.granulation_delta}%)
              </b>
            </div>
            <div className="flex justify-between">
              <span>{isTamil ? 'மஞ்சள் சவ்வு (Slough):' : 'Slough:'}</span>
              <b
                className={`font-mono ${
                  tc.slough_delta < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : tc.slough_delta > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : ''
                }`}
              >
                {tc.current_breakdown.slough_percent}% ({tc.slough_delta > 0 ? '+' : ''}
                {tc.slough_delta}%)
              </b>
            </div>
            <div className="flex justify-between">
              <span>{isTamil ? 'கருப்பு இறந்த திசு (Necrotic):' : 'Necrotic Eschar:'}</span>
              <b
                className={`font-mono ${
                  tc.necrotic_delta < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : tc.necrotic_delta > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : ''
                }`}
              >
                {tc.current_breakdown.necrotic_percent}% ({tc.necrotic_delta > 0 ? '+' : ''}
                {tc.necrotic_delta}%)
              </b>
            </div>
          </div>
        </div>
      </div>

      {/* Differences Summary */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Layers className="w-4 h-4 text-brand-500" />
          <span>{mode === 'ta' ? 'கண்காணிக்கப்பட்ட மாற்றங்களின் சுருக்கம்' : mode === 'both' ? 'Observed Comparative Changes / மாற்றங்களின் சுருக்கம்' : 'Observed Comparative Changes'}</span>
        </div>
        
        <WoundDualBlock en={comparison.differences_summary} mode={mode} />

        <div className="pt-1">
          <WoundDualList enItems={comparison.detailed_points} mode={mode} bulletClass="text-brand-500" />
        </div>
      </div>

      {/* Cautionary Safety Callout */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
        <div className="leading-relaxed flex-1">
          <span className="font-bold">
            {mode === 'ta' ? 'மருத்துவ எச்சரிக்கை: ' : mode === 'both' ? 'Clinical Precaution / மருத்துவ எச்சரிக்கை: ' : 'Clinical Precaution: '}
          </span>
          <WoundDualBlock en={comparison.cautionary_note} mode={mode} />
        </div>
      </div>
    </div>
  );
};
