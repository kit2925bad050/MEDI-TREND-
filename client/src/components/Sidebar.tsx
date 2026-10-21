import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Brain,
  TrendingUp,
  FileDown,
  Settings,
  HeartPulse,
  Languages,
  FolderOpen,
  History,
  Calendar,
  Shield,
  UserCheck,
  Activity,
  BarChart3,
  Cpu,
  Camera,
} from 'lucide-react';
import { UserRole } from '../types';
import logoImg from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  userRole: UserRole;
  onOpenUpload: () => void;
  onOpenExport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole,
  onOpenUpload,
  onOpenExport,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, dict, isTamil } = useLanguage();
  const isAdmin = userRole === 'ADMIN';

  interface NavItem {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const clinicalItems: NavItem[] = [
    { to: '/dashboard', label: dict.nav_dashboard, icon: LayoutDashboard },
    { to: '/patients', label: dict.nav_patients, icon: Users },
    { to: '/appointments', label: dict.nav_appointments, icon: Calendar },
    { to: '/reports', label: dict.nav_reports, icon: FileText },
    { to: '/analysis', label: dict.nav_analysis, icon: Brain, badge: 'AI' },
    { to: '/wounds', label: isTamil ? 'புண் மதிப்பாய்வு' : 'AI Wound & Ulcer', icon: Camera, badge: 'Vision' },
    { to: '/trends', label: dict.nav_trends, icon: TrendingUp },
    { to: '/clinical-summary', label: dict.nav_clinical_summary, icon: Languages, badge: 'தமிழ்' },
    { to: '/documents', label: dict.nav_documents, icon: FolderOpen },
    { to: '/history', label: dict.nav_history, icon: History },
  ];

  const adminItems: NavItem[] = [
    { to: '/admin', label: dict.nav_admin_overview, icon: Shield },
    { to: '/admin/doctors', label: dict.nav_admin_doctors, icon: UserCheck },
    { to: '/admin/staff', label: dict.nav_admin_staff, icon: Users },
    { to: '/admin/patients', label: dict.nav_admin_patients, icon: Users },
    { to: '/appointments', label: dict.nav_appointments, icon: Calendar },
    { to: '/admin/reports', label: dict.nav_admin_reports, icon: FileText },
    { to: '/wounds', label: isTamil ? 'புண் மதிப்பாய்வு' : 'AI Wound & Ulcer', icon: Camera, badge: 'Vision' },
    { to: '/admin/analyses', label: dict.nav_admin_analyses, icon: Cpu },
    { to: '/admin/activity', label: dict.nav_admin_activity, icon: Activity },
    { to: '/admin/audit', label: dict.nav_admin_audit, icon: Shield },
    { to: '/admin/analytics', label: dict.nav_admin_analytics, icon: BarChart3 },
    { to: '/admin/settings', label: dict.nav_admin_settings, icon: Settings },
  ];

  const activeItems = isAdmin ? adminItems : clinicalItems;

  return (
    <aside className="w-64 flex-shrink-0 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between p-4 select-none transition-colors duration-200">
      <div>
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
          className="flex items-center gap-3 px-2 py-3 mb-4 cursor-pointer group"
        >
          <img
            src={logoImg}
            alt="MEDI-TREND AI Logo"
            className="w-10 h-10 object-contain rounded-xl shadow-md ring-1 ring-cyan-500/30 group-hover:scale-105 transition-transform"
          />
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              MEDI-TREND <span className="text-brand-500 text-xs px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 font-mono">AI</span>
            </h1>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-tight">
              {isAdmin ? dict.admin_command : dict.app_tagline}
            </p>
          </div>
        </div>

        {/* Workspace Portal Indicator */}
        <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            {isAdmin ? dict.admin_portal : dict.clinical_portal}
          </span>
          <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-emerald-500'} animate-pulse`} />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
          {activeItems.map((item) => {
            const Icon = item.icon;
            const isExactActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isExactActive
                    ? isAdmin
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-bold shadow-sm shadow-purple-500/10'
                      : 'bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 font-bold shadow-sm shadow-brand-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isExactActive
                        ? isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-brand-600 dark:text-brand-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {!isAdmin && (
          <button
            onClick={onOpenUpload}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
          >
            <FileText className="w-4 h-4" />
            <span>{dict.nav_upload_pdf}</span>
          </button>
        )}

        <div className="px-2 pt-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          <span>{dict.app_name}</span>
          <span>v2.0.0</span>
        </div>
      </div>
    </aside>
  );
};
