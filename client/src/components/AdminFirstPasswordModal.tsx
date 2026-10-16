import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, Loader2, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { adminFirstPasswordChange } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface AdminFirstPasswordModalProps {
  isOpen: boolean;
  username: string;
  onSuccess: (token: string) => void;
}

export const AdminFirstPasswordModal: React.FC<AdminFirstPasswordModalProps> = ({
  isOpen,
  username,
  onSuccess,
}) => {
  const { isTamil } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('admin13152425');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setErrorMsg(isTamil ? 'புதிய கடவுச்சொல்லை உள்ளிடவும்' : 'Please enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(isTamil ? 'கடவுச்சொற்கள் பொருந்தவில்லை' : 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg(isTamil ? 'கடவுச்சொல் குறைந்தது 8 எழுத்துக்கள் கொண்டிருக்க வேண்டும்' : 'Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminFirstPasswordChange(username, currentPassword, newPassword);
      if (res.success && res.token) {
        onSuccess(res.token);
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isTamil ? 'கடவுச்சொல் மாற்றுவதில் பிழை ஏற்பட்டது' : 'Failed to initialize administrator password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-red-300 dark:border-red-900/60 shadow-2xl overflow-hidden">
        {/* Header - Strictly Mandatory (No Close Button) */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isTamil ? 'கட்டாய நிர்வாக கடவுச்சொல் மாற்றம்' : 'Create Your New Administrator Password'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-mono font-bold">
                  {isTamil ? 'கட்டாயம்' : 'MANDATORY'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isTamil
                  ? 'பாதுகாப்பு காரணங்களுக்காக ஆரம்ப கடவுச்சொல்லை மாற்றிய பின்னரே டாஷ்போர்டை அணுக முடியும்'
                  : 'For security compliance, you must set a permanent private password before continuing.'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" />
              <span>{isTamil ? 'பாதுகாப்புக் கொள்கை' : 'Security Notice:'}</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              {isTamil
                ? 'ஆரம்ப இயல்புநிலை கடவுச்சொல் (admin13152425) இந்த மாற்றத்திற்குப் பிறகு நிரந்தரமாக முடக்கப்படும்.'
                : 'Once updated, the initial default password (admin13152425) will immediately cease to function across all systems.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isTamil ? 'தற்போதைய ஆரம்ப கடவுச்சொல்' : 'Current Default Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="admin13152425"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isTamil ? 'புதிய நிர்வாக கடவுச்சொல் (குறைந்தது 8 எழுத்துக்கள்)' : 'New Strong Password (min 8 chars, letters & digits)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {isTamil ? 'புதிய கடவுச்சொல்லை மீண்டும் உறுதிசெய்க' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isTamil ? 'கடவுச்சொல் சேமிக்கப்படுகிறது...' : 'Updating Administrator Password...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isTamil ? 'கடவுச்சொல்லை உறுதிசெய்து தொடர்க' : 'Save New Password & Enter Admin Portal'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
