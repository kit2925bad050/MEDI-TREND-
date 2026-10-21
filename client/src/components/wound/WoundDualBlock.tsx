import React from 'react';
import { WoundLanguageMode, translateWoundMedicalText } from '../../utils/woundTranslation';

interface WoundDualBlockProps {
  en: string;
  ta?: string;
  mode: WoundLanguageMode;
  className?: string;
  label?: string;
  badgeStyle?: boolean;
  as?: 'span' | 'p' | 'div' | string;
}

/**
 * Renders text strictly complying with the language mode:
 * - English mode: Display English only
 * - Tamil mode: Display Tamil only
 * - Both mode: Display English first, then Tamil below it, clearly separated by the headings "English" and "தமிழ்"
 */
export const WoundDualBlock: React.FC<WoundDualBlockProps> = ({
  en,
  ta,
  mode,
  className = '',
  label,
  badgeStyle = false,
  as = 'span',
}) => {
  const tamilText = ta && ta.trim().length > 0 ? ta : translateWoundMedicalText(en);

  if (mode === 'en') {
    return as === 'p' ? (
      <p className={className}>{en}</p>
    ) : as === 'div' ? (
      <div className={className}>{en}</div>
    ) : (
      <span className={className}>{en}</span>
    );
  }

  if (mode === 'ta') {
    return as === 'p' ? (
      <p className={`${className} font-tamil-mode`}>{tamilText}</p>
    ) : as === 'div' ? (
      <div className={`${className} font-tamil-mode`}>{tamilText}</div>
    ) : (
      <span className={`${className} font-tamil-mode`}>{tamilText}</span>
    );
  }

  // 'both' mode: English first, Tamil below it, separated by headings "English" and "தமிழ்"
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          {label}
        </span>
      )}
      {/* English Block */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            English
          </span>
        </div>
        <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
          {en}
        </div>
      </div>

      {/* Tamil Block */}
      <div className="p-2.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 text-xs font-tamil-mode">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
            தமிழ்
          </span>
        </div>
        <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
          {tamilText}
        </div>
      </div>
    </div>
  );
};

interface WoundDualListProps {
  enItems?: string[];
  items?: string[];
  taItems?: string[];
  mode: WoundLanguageMode;
  bulletClass?: string;
  bulletColor?: string;
  className?: string;
}

/**
 * Renders lists of clinical items:
 * - English mode: English bullet list only
 * - Tamil mode: Tamil bullet list only
 * - Both mode: English list first under "English" heading, then Tamil list under "தமிழ்" heading
 */
export const WoundDualList: React.FC<WoundDualListProps> = ({
  enItems,
  items,
  taItems,
  mode,
  bulletClass,
  bulletColor,
  className = '',
}) => {
  const actualEnItems = items || enItems || [];
  const effectiveBullet = bulletColor
    ? bulletColor.startsWith('bg-')
      ? bulletColor
      : `bg-${bulletColor}`
    : bulletClass || 'text-brand-500';

  const isDotBullet = effectiveBullet.startsWith('bg-');

  const tamilItems =
    taItems && taItems.length === actualEnItems.length
      ? taItems
      : actualEnItems.map((item) => translateWoundMedicalText(item));

  if (!actualEnItems || actualEnItems.length === 0) {
    return <span className="text-xs text-slate-400">None recorded</span>;
  }

  const renderBullet = () =>
    isDotBullet ? (
      <span className={`w-1.5 h-1.5 rounded-full ${effectiveBullet} mt-1.5 flex-shrink-0`} />
    ) : (
      <span className={`mt-0.5 font-bold ${effectiveBullet}`}>•</span>
    );

  if (mode === 'en') {
    return (
      <ul className={`space-y-1.5 text-xs text-slate-600 dark:text-slate-400 ${className}`}>
        {actualEnItems.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            {renderBullet()}
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (mode === 'ta') {
    return (
      <ul className={`space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-tamil-mode ${className}`}>
        {tamilItems.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            {renderBullet()}
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  // 'both' mode
  return (
    <div className={`space-y-3 ${className}`}>
      {/* English Section */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            English
          </span>
        </div>
        <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
          {actualEnItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              {renderBullet()}
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tamil Section */}
      <div className="p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 font-tamil-mode">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
            தமிழ்
          </span>
        </div>
        <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
          {tamilItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              {renderBullet()}
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
