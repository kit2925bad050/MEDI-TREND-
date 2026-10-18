import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Shield,
  Cpu,
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  User,
  LogOut,
  Smartphone,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  changeAdminPassword,
  changeAdminIdentity,
  fetchAdminSessions,
  revokeAllOtherAdminSessions,
  BACKEND_SESSION_TTL_MS,
} from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const AdminSettingsPage: React.FC = () => {
  const { isTamil } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'security' | 'identity' | 'sessions' | 'ai'>('security');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Identity change state
  const [currentUsername, setCurrentUsername] = useState('admin');
  const [newUsername, setNewUsername] = useState('admin');
  const [newEmail, setNewEmail] = useState('admin@hospital.org');
  const [identityCurrentPass, setIdentityCurrentPass] = useState('');
  const [showIdentityPass, setShowIdentityPass] = useState(false);
  const [identityStatus, setIdentityStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingIdentity, setSavingIdentity] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionActionMsg, setSessionActionMsg] = useState<string | null>(null);

  // AI & System Settings
  const [primaryAI, setPrimaryAI] = useState('gemini');
  const [enableAuditLog, setEnableAuditLog] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await fetchAdminSessions();
      setSessions(data || []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'sessions') {
      loadSessions();
    }
  }, [activeSubTab]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: isTamil ? 'புதிய கடவுச்சொற்கள் பொருந்தவில்லை' : 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: isTamil ? 'கடவுச்சொல் குறைந்தது 8 எழுத்துக்கள் கொண்டிருக்க வேண்டும்' : 'Password must be at least 8 characters' });
      return;
    }

    setSavingPassword(true);
    setPasswordStatus(null);
    try {
      const res = await changeAdminPassword(currentUsername, oldPassword, newPassword);
      if (res.token) {
        try {
          const sessionStr = localStorage.getItem('medi_trend_session');
          if (sessionStr) {
            const parsed = JSON.parse(sessionStr);
            parsed.token = res.token;
            parsed.expiresAt = Date.now() + BACKEND_SESSION_TTL_MS;
            localStorage.setItem('medi_trend_session', JSON.stringify(parsed));
          }
        } catch {}
      }
      setPasswordStatus({ type: 'success', message: res.message || 'Admin password changed successfully! Audit log recorded.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !identityCurrentPass) {
      setIdentityStatus({ type: 'error', message: isTamil ? 'அனைத்து புலங்களையும் நிரப்பவும்' : 'Please fill all required fields.' });
      return;
    }

    setSavingIdentity(true);
    setIdentityStatus(null);
    try {
      const res = await changeAdminIdentity(currentUsername, newUsername.trim(), newEmail.trim(), identityCurrentPass);
      setIdentityStatus({ type: 'success', message: res.message || 'Admin login identifier updated successfully!' });
      setCurrentUsername(newUsername.trim());
      setIdentityCurrentPass('');
    } catch (err: any) {
      setIdentityStatus({ type: 'error', message: err.message || 'Failed to update identity' });
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      const res = await revokeAllOtherAdminSessions();
      if (!res.token) {
        throw new Error('The server revoked sessions but did not return a replacement token.');
      }
      const sessionStr = localStorage.getItem('medi_trend_session');
      if (!sessionStr) {
        throw new Error('The active administrator session is missing. Please log in again.');
      }
      const parsed = JSON.parse(sessionStr);
      parsed.token = res.token;
      parsed.expiresAt = Date.now() + BACKEND_SESSION_TTL_MS;
      localStorage.setItem('medi_trend_session', JSON.stringify(parsed));
      setSessionActionMsg(isTamil ? 'மற்ற அனைத்து அமர்வுகளும் வெற்றிகரமாக ரத்து செய்யப்பட்டன.' : 'All other active sessions revoked.');
      loadSessions();
      setTimeout(() => setSessionActionMsg(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to revoke sessions');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>{isTamil ? 'மருத்துவமனை மேலாண்மை கட்டமைப்பு' : 'Hospital Platform Configuration'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isTamil ? 'கணினி மற்றும் பாதுகாப்பு அமைப்புகள்' : 'System & Security Settings'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isTamil
              ? 'நிர்வாகி சான்றுகள், அமர்வு மேலாண்மை மற்றும் இணக்கக் கொள்கைகள்'
              : 'Admin credentials management, active session invalidation, and compliance policies'}
          </p>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 w-fit text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeSubTab === 'security'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{isTamil ? 'கடவுச்சொல் மாற்றம்' : 'Password & Security'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('identity')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeSubTab === 'identity'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{isTamil ? 'உள்நுழைவு அடையாளம்' : 'Login Identity'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeSubTab === 'sessions'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{isTamil ? 'செயலில் உள்ள அமர்வுகள்' : 'Active Sessions'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeSubTab === 'ai'
              ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{isTamil ? 'AI கட்டமைப்பு' : 'AI Orchestration'}</span>
        </button>
      </div>

      {/* SUBTAB 1: Password & Security */}
      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Lock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isTamil ? 'நிர்வாக கடவுச்சொல் மாற்றம்' : 'Change Admin Password'}
              </h2>
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}
              >
                {passwordStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isTamil ? 'தற்போதைய கடவுச்சொல்' : 'Current Admin Password'}
                </label>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isTamil ? 'புதிய கடவுச்சொல் (குறைந்தது 8 எழுத்துக்கள்)' : 'New Strong Password (min 8 chars)'}
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New strong password"
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isTamil ? 'புதிய கடவுச்சொல்லை உறுதிசெய்க' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {savingPassword ? (isTamil ? 'சேமிக்கப்படுகிறது...' : 'Updating Password...') : (isTamil ? 'புதிய கடவுச்சொல்லை சேமி' : 'Save New Admin Password')}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isTamil ? 'பாதுகாப்பு & தணிக்கைக் கொள்கை' : 'Security & Audit Governance'}
              </h2>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 list-disc list-inside leading-relaxed">
              <li><b>{isTamil ? 'நிரந்தர தணிக்கை பதிவு:' : 'Immutable Audit Trails:'}</b> Every password update, identity change, and deactivation creates an immutable record with actor identity and timestamp.</li>
              <li><b>{isTamil ? 'அமர்வு ரத்து:' : 'Session Invalidation:'}</b> Changing your password immediately revokes all older tokens on any other browser.</li>
              <li><b>{isTamil ? 'கிரிப்டோகிராஃபிக் பாதுகாப்பு:' : 'Cryptographic Hashing:'}</b> Passwords are never stored or displayed in plaintext.</li>
            </ul>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Identity Change */}
      {activeSubTab === 'identity' && (
        <div className="max-w-xl bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isTamil ? 'நிர்வாக உள்நுழைவு அடையாளத்தை மாற்று' : 'Change Administrator Login Identity'}
            </h2>
          </div>

          {identityStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                identityStatus.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {identityStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{identityStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleChangeIdentity} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isTamil ? 'புதிய பயனர் பெயர்' : 'New Administrator Username'}
              </label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isTamil ? 'நிர்வாக மின்னஞ்சல் முகவரி' : 'Official Administrator Email'}
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isTamil ? 'உறுதிப்படுத்த தற்போதைய கடவுச்சொல்லை உள்ளிடவும்' : 'Current Password (Required for Identity Change)'}
              </label>
              <div className="relative">
                <input
                  type={showIdentityPass ? "text" : "password"}
                  required
                  value={identityCurrentPass}
                  onChange={(e) => setIdentityCurrentPass(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowIdentityPass(!showIdentityPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showIdentityPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingIdentity}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              {savingIdentity ? (isTamil ? 'புதுப்பிக்கப்படுகிறது...' : 'Updating Identity...') : (isTamil ? 'அடையாளத்தை சேமி (ADMIN_IDENTITY_CHANGED)' : 'Save Identity (ADMIN_IDENTITY_CHANGED)')}
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 3: Active Sessions */}
      {activeSubTab === 'sessions' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>{isTamil ? 'செயலில் உள்ள அங்கீகரிக்கப்பட்ட அமர்வுகள்' : 'Active Authenticated Sessions'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {isTamil ? 'நிகழ்நேர தரவுத்தள அமர்வு டோக்கன் பட்டியல்' : 'Real-time database session tokens and active devices'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadSessions}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleRevokeAllSessions}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isTamil ? 'மற்ற அனைத்து அமர்வுகளிலிருந்தும் வெளியேறு' : 'Sign Out of Other Sessions'}</span>
              </button>
            </div>
          </div>

          {sessionActionMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200">
              {sessionActionMsg}
            </div>
          )}

          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No other active sessions found.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s, idx) => (
                <div
                  key={s.token || idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{s.user_name || 'Administrator'}</span>
                    <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                      {s.role}
                    </span>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-sm">
                      Token: {s.token?.slice(0, 24)}...
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Created: {new Date(s.created_at * 1000).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: AI Orchestrator */}
      {activeSubTab === 'ai' && (
        <div className="max-w-xl bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isTamil ? 'AI மருத்துவ மாதிரி முன்னுரிமை' : 'AI Clinical Reasoning Models'}
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Clinical Reasoning Model
              </label>
              <select
                value={primaryAI}
                onChange={(e) => setPrimaryAI(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="gemini">Google Gemini 1.5 Pro (Primary Grounded)</option>
                <option value="grok">xAI Grok Fast (Fallback 1)</option>
                <option value="openrouter">OpenAI GPT-4o (Fallback 2)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Session Idle Timeout (Minutes)
              </label>
              <input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
