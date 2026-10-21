import React from 'react';
import { Languages, Check } from 'lucide-react';
import { WoundLanguageMode } from '../../utils/woundTranslation';

interface WoundLanguageSelectorProps {
  value: WoundLanguageMode;
  onChange: (mode: WoundLanguageMode) => void;
  className?: string;
  compact?: boolean;
}

export const WoundLanguageSelector: React.FC<WoundLanguageSelectorProps> = ({
  value,
  onChange,
  className = '',
  compact = false,
}) => {
  const options: { id: WoundLanguageMode; label: string; subLabel?: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'ta', label: 'தமிழ்', subLabel: 'Tamil' },
    { id: 'both', label: 'Both', subLabel: 'English + தமிழ்' },
  ];

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-sm ${className}`}
      role="group"
      aria-label="Wound Assessment Language Selector"
    >
      <div className="flex items-center gap-1.5 px-2 text-slate-500 dark:text-slate-400">
        <Languages className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
        {!compact && (
          <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">
            Language:
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span>{opt.label}</span>
              {opt.subLabel && !compact && (
                <span className={`text-[10px] font-normal ${isActive ? 'text-rose-500/80 dark:text-rose-400/80' : 'text-slate-400'}`}>
                  ({opt.subLabel})
                </span>
              )}
              {isActive && <Check className="w-3 h-3 text-rose-500 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
