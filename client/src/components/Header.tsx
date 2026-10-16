import React from 'react';
import { Search, Bell, Moon, Sun, ShieldCheck, LogOut, Shield } from 'lucide-react';
import { UserRole } from '../types';
import { PatientAvatar } from './PatientAvatar';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  userRole: UserRole;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAuditLogs: () => void;
  onLogout: () => void;
  currentUser: { name: string; email: string; avatarUrl?: string };
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  darkMode,
  onToggleDarkMode,
  onOpenAuditLogs,
  onLogout,
  currentUser,
}) => {
  const { t, dict, isTamil } = useLanguage();

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'DOCTOR':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'STAFF':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    if (role === 'ADMIN') return dict.role_admin;
    if (role === 'DOCTOR') return dict.role_doctor;
    if (role === 'STAFF') return dict.role_staff;
    return role;
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      {/* Search Bar */}
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={dict.search_patient_placeholder}
            defaultValue="S. Gurumurthy"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-slate-200"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* User Role Badge */}
        <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${getRoleBadgeStyle(userRole)} flex items-center gap-1.5`}>
          <Shield className="w-3.5 h-3.5" />
          <span>{getRoleLabel(userRole)}</span>
        </div>

        {/* Global Language Switcher Button */}
        <LanguageSwitcher variant="header" />

        {/* Audit Log Button */}
        <button
          onClick={onOpenAuditLogs}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          title={dict.audit_logs}
        >
          <ShieldCheck className="w-4 h-4 text-brand-500" />
          <span className="hidden md:inline">{dict.audit_logs}</span>
        </button>

        {/* Notifications */}
        <div className="relative cursor-pointer p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            3
          </span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Toggle Light/Dark Mode"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Authenticated User Profile Avatar & Info */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <PatientAvatar
            name={currentUser.name}
            avatarUrl={currentUser.avatarUrl}
            size="sm"
            showStatus={true}
            isActive={true}
            editable={false}
          />
          <div className="hidden lg:block">
            <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[120px]">
              {currentUser.email}
            </div>
          </div>
        </div>

        {/* Secure Sign Out Button */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
          title={dict.secure_sign_out}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
