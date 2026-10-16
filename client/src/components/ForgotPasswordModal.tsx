import React, { useState } from 'react';
import { KeyRound, Mail, X, CheckCircle2, AlertCircle, Loader2, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { requestForgotPassword, resetPasswordWithToken } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'doctor',
}) => {
  const { isTamil } = useLanguage();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg(isTamil ? 'மின்னஞ்சல் அல்லது அடையாள எண்ணை உள்ளிடவும்' : 'Please enter your email or account ID.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await requestForgotPassword(identifier.trim(), role);
      if (res.success) {
        setSuccessMsg(res.message || (isTamil ? 'மீட்பு டோக்கன் உருவாக்கப்பட்டது.' : 'Reset token generated.'));
        // Only advance to reset step if a token was actually generated (account exists and is active)
        if (res.reset_token) {
          setToken(res.reset_token);
          setStep('reset');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isTamil ? 'பயனரைக் கண்டுபிடிக்க முடியவில்லை' : 'Failed to initiate recovery.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMsg(isTamil ? 'மீட்பு டோக்கனை உள்ளிடவும்' : 'Please enter the reset token.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(isTamil ? 'கடவுச்சொற்கள் பொருந்தவில்லை' : 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg(isTamil ? 'கடவுச்சொல் குறைந்தது 8 எழுத்துக்கள் கொண்டிருக்க வேண்டும்' : 'Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await resetPasswordWithToken(token.trim(), newPassword);
      if (res.success) {
        setSuccessMsg(isTamil ? 'கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது! இப்போது உள்நுழையலாம்.' : 'Password reset successfully! You can now log in.');
        setTimeout(() => {
          onClose();
          setStep('request');
          setIdentifier('');
          setToken('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg(null);
        }, 2500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isTamil ? 'கடவுச்சொல் மீட்டமைப்பில் பிழை' : 'Password reset failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isTamil ? 'பாதுகாப்பான கடவுச்சொல் மீட்பு' : 'Secure Account Password Recovery'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isTamil ? 'நேரவரையறை கொண்ட மீட்டமைப்பு டோக்கன் சரிபார்ப்பு' : 'Time-limited token verification'}
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

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestToken} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isTamil ? 'பயனர் பங்கு' : 'Account Role'}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="doctor">{isTamil ? 'மருத்துவர்' : 'Doctor / Clinician'}</option>
                  <option value="staff">{isTamil ? 'பணியாளர்' : 'Clinical Staff'}</option>
                  <option value="admin">{isTamil ? 'நிர்வாகி' : 'Hospital Administrator'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isTamil ? 'மின்னஞ்சல் அல்லது அடையாள எண்' : 'Email Address or Account ID'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. dr.arvind@hospital.org"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isTamil ? 'மீட்பு டோக்கனை பெறுக' : 'Generate Recovery Token'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isTamil ? 'சரிபார்ப்பு மீட்பு டோக்கன்' : 'Single-Use Recovery Token (15-min validity)'}
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste reset token here"
                  className="w-full px-3 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isTamil ? 'புதிய கடவுச்சொல்' : 'New Password (min 8 chars)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono"
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
                  {isTamil ? 'புதிய கடவுச்சொல்லை உறுதிசெய்க' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white font-mono"
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
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isTamil ? 'கடவுச்சொல்லை மீட்டமை' : 'Reset Password & Invalidate Sessions'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
