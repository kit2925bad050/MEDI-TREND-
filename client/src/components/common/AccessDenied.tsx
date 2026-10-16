import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, ArrowRight } from 'lucide-react';
import { UserRole } from '../../types';

interface AccessDeniedProps {
  requiredRole?: string;
  currentRole?: UserRole;
  currentUserName?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole = 'ADMIN',
  currentRole = 'DOCTOR',
  currentUserName = 'Clinician',
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center ring-8 ring-red-50 dark:ring-red-950/30">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>403 Access Restricted</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Administrative Privileges Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your authenticated identity (<b>{currentUserName}</b> • <span className="font-semibold text-brand-600 dark:text-brand-400">{currentRole}</span>) is assigned to the Clinical Workspace. Direct access to Administrative Command routes is strictly restricted.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition"
          >
            <span>Return to Clinical Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
