import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  TrendingUp,
  Activity,
  Languages,
  FileCheck,
  ShieldCheck,
  HeartPulse,
  UserCheck,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { HologramBodyViewer } from '../components/HologramBodyViewer';
import { Footer } from '../components/Footer';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import logoImg from '../assets/logo.png';

interface LandingPageProps {
  onOpenAuth: () => void;
  onOpenAdminLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onOpenAdminLogin,
}) => {
  const navigate = useNavigate();
  const { t, dict, isTamil } = useLanguage();

  // Dynamic Typewriter Animation Hook for Headline Phrases (in English & Tamil)
  const typewriterPhrases = isTamil
    ? [
        dict.typewriter_1,
        dict.typewriter_2,
        dict.typewriter_3,
        dict.typewriter_4,
        dict.typewriter_5,
      ]
    : [
        dict.typewriter_1,
        dict.typewriter_2,
        dict.typewriter_3,
        dict.typewriter_4,
        dict.typewriter_5,
      ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Reset typing text when language switches
    setCurrentText('');
    setIsDeleting(false);
  }, [isTamil]);

  useEffect(() => {
    const fullText = typewriterPhrases[currentPhraseIndex] || typewriterPhrases[0];
    const typingSpeed = isDeleting ? 30 : 65;

    const timer = setTimeout(() => {
      if (!isDeleting && currentText.length < fullText.length) {
        setCurrentText(fullText.slice(0, currentText.length + 1));
      } else if (!isDeleting && currentText.length === fullText.length) {
        // Pause before deleting
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && currentText.length > 0) {
        setCurrentText(fullText.slice(0, currentText.length - 1));
      } else if (isDeleting && currentText.length === 0) {
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % typewriterPhrases.length);
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentPhraseIndex, typewriterPhrases]);

  const workflowCards = [
    {
      icon: Layers,
      title: dict.wf_report_comp_title,
      desc: dict.wf_report_comp_desc,
      color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    },
    {
      icon: TrendingUp,
      title: dict.wf_health_track_title,
      desc: dict.wf_health_track_desc,
      color: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400',
    },
    {
      icon: Activity,
      title: dict.wf_param_analysis_title,
      desc: dict.wf_param_analysis_desc,
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Languages,
      title: dict.wf_bilingual_title,
      desc: dict.wf_bilingual_desc,
      color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: FileCheck,
      title: dict.wf_source_insights_title,
      desc: dict.wf_source_insights_desc,
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
    {
      icon: ShieldCheck,
      title: dict.wf_secure_records_title,
      desc: dict.wf_secure_records_desc,
      color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    },
    {
      icon: HeartPulse,
      title: dict.wf_interactive_trends_title,
      desc: dict.wf_interactive_trends_desc,
      color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
    },
    {
      icon: UserCheck,
      title: dict.wf_clinical_support_title,
      desc: dict.wf_clinical_support_desc,
      color: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#040816] text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#060d24]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-cyan-500/20 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="MEDI-TREND AI Logo"
            className="w-10 h-10 object-contain rounded-xl shadow-md ring-1 ring-cyan-500/30"
          />
          <div>
            <div className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              MEDI-TREND <span className="text-cyan-500 text-xs px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 font-mono">AI</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              {dict.app_tagline}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Landing Page Language Switcher Button */}
          <LanguageSwitcher variant="landing" />

          <button
            onClick={onOpenAdminLogin}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-purple-500" />
            <span>{dict.admin_command}</span>
          </button>
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/30 transition"
          >
            <span>{dict.secure_sign_in}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 lg:py-16 space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headline with Dynamic Typing Effect & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800/60 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>{dict.hero_badge}</span>
            </div>

            {/* Dynamic Typewriter Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.18]">
                <span className="bg-gradient-to-r from-brand-600 via-cyan-500 to-teal-400 bg-clip-text text-transparent">
                  {currentText}
                </span>
                <span className="inline-block w-1.5 h-8 sm:h-11 ml-1 bg-cyan-500 animate-pulse align-middle" />
              </h1>
              <div className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300">
                {dict.hero_subheading}
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {dict.hero_description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02]"
              >
                <span>{dict.launch_workspace}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm transition"
              >
                <Lock className="w-4 h-4 text-purple-500" />
                <span>{dict.admin_command}</span>
              </button>
            </div>

            {/* Compliance Trust Badges */}
            <div className="flex flex-wrap items-center gap-4 pt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {dict.hero_trust_grade}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {dict.hero_trust_traceable}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {dict.hero_trust_secure}
              </span>
            </div>
          </div>

          {/* Right Column: Holographic Anatomical Heart & Body Visualizer */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md">
              <HologramBodyViewer compact={false} interactive={true} />
            </div>
          </div>
        </div>

        {/* Feature Grid: Built Around the Patient's Journey */}
        <div className="space-y-8 pt-4">
          <div className="text-center space-y-2.5 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {dict.journey_heading}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {dict.journey_subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowCards.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-cyan-500/40 transition-all space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className={`w-11 h-11 rounded-xl ${feat.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Signature Animated Footer */}
      <Footer />
    </div>
  );
};
