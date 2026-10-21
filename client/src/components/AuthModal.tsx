import React, { useState } from 'react';
import {
  X,
  Shield,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  KeyRound,
  Hospital,
  Eye,
  EyeOff,
} from 'lucide-react';
import { loginUnified } from '../services/api';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { id: string; name: string; email: string; role: UserRole; avatarUrl?: string; token?: string }) => void;
  onOpenAdminLogin: () => void;
  onOpenForgotPassword?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onOpenAdminLogin,
  onOpenForgotPassword,
}) => {
  const { isTamil } = useLanguage();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUser.trim() || !password.trim()) {
      setErrorMsg(isTamil ? 'மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.' : 'Please enter your email/ID and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginUnified(emailOrUser.trim(), password.trim());
      if (res.success && res.user) {
        onAuthSuccess({
          id: res.user.id,
          name: res.user.name || res.user.full_name,
          email: res.user.email,
          role: res.role || res.user.role || 'DOCTOR',
          avatarUrl: res.user.avatar_url,
          token: res.token,
        });
        onClose();
      } else {
        setErrorMsg(isTamil ? 'தவறான மருத்துவ பயனர் சான்றுகள்.' : 'Invalid clinical credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isTamil ? 'உள்நுழைவு தோல்வியடைந்தது.' : 'Invalid clinical credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Hospital className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isTamil ? 'மருத்துவமனை மருத்துவ பணியகம்' : 'Hospital Clinical Workspace'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isTamil ? 'அங்கீகரிக்கப்பட்ட மருத்துவர் & பணியாளர் நுழைவாயில்' : 'Authorized Clinician & Staff Gateway'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Default Credentials Helper */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-brand-500" />
                <span>{isTamil ? 'முன்னிருப்பு உள்நுழைவு விவரங்கள்' : 'Default Login Credentials'}</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                Demo Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmailOrUser('dr.arvind@hospital.org');
                  setPassword('doctor1315');
                  setErrorMsg(null);
                }}
                className="p-2 rounded-xl text-left bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-950/30 transition group"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] group-hover:text-brand-600 flex items-center justify-between">
                  <span>👨‍⚕️ {isTamil ? 'மருத்துவர்' : 'Doctor'}</span>
                  <span className="text-[9px] text-brand-600 font-normal underline">Fill</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">dr.arvind@hospital.org</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">pwd: doctor1315</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmailOrUser('priya.staff@hospital.org');
                  setPassword('staff1315');
                  setErrorMsg(null);
                }}
                className="p-2 rounded-xl text-left bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-950/30 transition group"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] group-hover:text-brand-600 flex items-center justify-between">
                  <span>🩺 {isTamil ? 'பணியாளர்' : 'Staff'}</span>
                  <span className="text-[9px] text-brand-600 font-normal underline">Fill</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">priya.staff@hospital.org</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">pwd: staff1315</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isTamil ? 'மருத்துவர் / பணியாளர் மின்னஞ்சல் அல்லது ID' : 'Doctor / Staff Email or ID'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                  placeholder="e.g. dr.arvind@hospital.org"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isTamil ? 'கடவுச்சொல்' : 'Password'}
                </label>
                {onOpenForgotPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenForgotPassword();
                    }}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {isTamil ? 'கடவுச்சொல் மறந்துவிட்டதா?' : 'Forgot Password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-800 dark:text-slate-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isTamil ? 'பணியகத்தில் உள்நுழைக' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Admin gateway shortcut button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-center gap-1.5 mx-auto"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isTamil ? 'மருத்துவமனை நிர்வாகி உள்நுழைவு' : 'Hospital Administrator Portal Access'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
