import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  KeyRound,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { loginUnified } from '../services/api';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAuthSuccess: (user: { id: string; name: string; email: string; role: UserRole; avatarUrl?: string; token?: string }) => void;
  onRequireFirstPasswordChange?: (username: string) => void;
  onOpenForgotPassword?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onAdminAuthSuccess,
  onRequireFirstPasswordChange,
  onOpenForgotPassword,
}) => {
  const { isTamil } = useLanguage();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg(isTamil ? 'பயனர்பெயர் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.' : 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginUnified(username.trim(), password.trim());
      if (res.success && res.user) {
        if (res.must_change_password && onRequireFirstPasswordChange) {
          onClose();
          onRequireFirstPasswordChange(username.trim());
          return;
        }

        onAdminAuthSuccess({
          id: res.user.id,
          name: res.user.name || res.user.full_name || 'Hospital Administrator',
          email: res.user.email || 'admin@hospital.org',
          role: 'ADMIN',
          avatarUrl: res.user.avatar_url,
          token: res.token,
        });
        onClose();
      } else {
        setErrorMsg(isTamil ? 'தவறான நிர்வாகி சான்றுகள்.' : 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isTamil ? 'உள்நுழைவு தோல்வியடைந்தது.' : 'Invalid administrator credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-purple-200 dark:border-purple-900/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-purple-50/40 dark:bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{isTamil ? 'நிர்வாக கட்டளை நுழைவாயில்' : 'Administrative Command Gateway'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isTamil ? 'அங்கீகரிக்கப்பட்ட மருத்துவமனை நிர்வாகம் மட்டும்' : 'Authorized Hospital Management Only'}
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

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span>{isTamil ? 'உண்மையான தரவுத்தள அங்கீகாரம்.' : 'Real database-backed cryptographic authority.'}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isTamil ? 'நிர்வாகி பயனர் பெயர்' : 'Admin Username / Identifier'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isTamil ? 'நிர்வாகி கடவுச்சொல்' : 'Admin Password'}
                </label>
                {onOpenForgotPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenForgotPassword();
                    }}
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
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
                  className="w-full pl-10 pr-10 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition text-slate-800 dark:text-slate-100 font-mono"
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isTamil ? 'நிர்வாகியாக உள்நுழைக' : 'Authenticate as Administrator'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
