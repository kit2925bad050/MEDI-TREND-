import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, TranslationDictionary, translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof TranslationDictionary, fallback?: string) => string;
  dict: TranslationDictionary;
  isTamil: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'medi_trend_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ta' || saved === 'en') {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'en'; // Default to English as specified
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      if (lang === 'ta') {
        document.body.classList.add('font-tamil-mode');
      } else {
        document.body.classList.remove('font-tamil-mode');
      }
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ta' : 'en';
    setLanguage(nextLang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'ta') {
      document.body.classList.add('font-tamil-mode');
    } else {
      document.body.classList.remove('font-tamil-mode');
    }
  }, [language]);

  const dict = translations[language] || translations.en;

  const t = (key: keyof TranslationDictionary, fallback?: string): string => {
    if (dict[key]) {
      return dict[key];
    }
    if (translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        dict,
        isTamil: language === 'ta',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
