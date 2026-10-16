import React from 'react';
import { Globe, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'header' | 'compact' | 'landing' | 'pill';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, toggleLanguage, isTamil } = useLanguage();

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
            language === 'en'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLanguage('ta')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
            language === 'ta'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          தமிழ்
        </button>
      </div>
    );
  }

  if (variant === 'landing') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-cyan-500/30 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-sm transition group ${className}`}
        title={isTamil ? 'Switch to English' : 'தமிழுக்கு மாற்றவும்'}
      >
        <Languages className="w-3.5 h-3.5 text-cyan-500 group-hover:scale-110 transition-transform" />
        <span>{isTamil ? '🇬🇧 English' : '🇮🇳 தமிழ்'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
        isTamil
          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-800 shadow-sm'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
      } ${className}`}
      title={isTamil ? 'Switch to English' : 'Switch to Tamil (தமிழ்)'}
    >
      <Languages className="w-3.5 h-3.5 text-brand-500" />
      <span>{isTamil ? 'தமிழ் (TA)' : 'English (EN)'}</span>
    </button>
  );
};
