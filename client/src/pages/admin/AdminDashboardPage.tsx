import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  UserCheck,
  FileText,
  Brain,
  Activity,
  Cpu,
  TrendingUp,
  Clock,
  CheckCircle2,
  Key,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { fetchAdminDashboardStats } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchAdminDashboardStats();
      setStats(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load admin statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <LoadingSkeleton type="card" count={4} />;
  }

  const kpis = [
    {
      label: 'Registered Doctors',
      value: stats?.total_doctors ?? null,
      icon: UserCheck,
      color: 'text-brand-600 bg-brand-50 dark:bg-brand-950/60',
    },
    {
      label: 'Clinical Staff',
      value: stats?.total_staff ?? null,
      icon: Users,
      color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60',
    },
    {
      label: 'Active Patients',
      value: stats?.total_patients ?? null,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60',
    },
    {
      label: 'Medical Reports',
      value: stats?.total_reports ?? null,
      icon: FileText,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      label: 'AI Analyses Run',
      value: stats?.total_analyses ?? null,
      icon: Brain,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Hospital Administration Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            System Administration Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time infrastructure status, access management, and AI orchestrator metrics
          </p>
        </div>

        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      {loadError && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300">
          {loadError}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-xl ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {kpi.value ?? '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clinical Intelligence Service Status */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Clinical Intelligence System Status
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-full font-bold">
            All Clinical Services Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Primary Clinical Reasoning Service
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Operational</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Longitudinal parameter trajectory normalization and clinical correlation.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Consensus Verification Service
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Operational</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Multi-report cross-validation and numerical change verification.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Bilingual Medical Synthesis Service
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Operational</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Grounded synthesis for English and Medical Tamil observations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
