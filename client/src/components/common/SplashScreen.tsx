import React from 'react';
import { HeartPulse } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  message = 'Preparing your secure clinical workspace...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050b1a] text-white select-none transition-opacity duration-500">
      {/* Background Radial Glow */}
      <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Icon with Rhythmic Heartbeat Animation */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 p-[1px] shadow-2xl shadow-cyan-500/30">
          <div className="w-full h-full bg-[#070e24] rounded-2xl flex items-center justify-center">
            <HeartPulse className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div className="absolute -inset-2 bg-cyan-400/20 rounded-3xl blur-md -z-10 animate-ping opacity-30" />
      </div>

      {/* Brand Title */}
      <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 mb-2">
        MEDI-TREND <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 font-mono">AI</span>
      </h1>

      {/* User-facing Message */}
      <p className="text-xs text-slate-300 font-medium mb-6 tracking-wide">
        {message}
      </p>

      {/* Minimal Animated Progress Bar */}
      <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-brand-500 via-cyan-400 to-brand-500 rounded-full w-24 animate-[shimmer_1.5s_infinite_linear]" />
      </div>

      {/* Subtitle Security Note */}
      <div className="text-[10px] text-slate-500 font-mono mt-8 tracking-wider uppercase">
        Encrypted Clinical Decision Support Platform
      </div>
    </div>
  );
};
