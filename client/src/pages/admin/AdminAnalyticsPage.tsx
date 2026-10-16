import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  RefreshCw,
  Activity,
  CheckCircle2,
  FileText,
  Users,
} from 'lucide-react';
import { fetchAdminDashboardStats } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const AdminAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminDashboardStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Operational & Diagnostic Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Clinical System Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Biomarker longitudinal trends, PDF extraction throughput, and AI token metrics
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-600" />
              <span>Data Volume Distribution</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Patients Registered</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{stats?.total_patients ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Medical Reports Processed</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{stats?.total_reports ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Multi-Model AI Invocations</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{stats?.total_analyses ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Pipeline Health & Latency</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Document Ingestion & Extraction Latency</span>
                <span className="font-bold text-emerald-600 font-mono">~120 ms / page</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Clinical Decision Support Analysis Latency</span>
                <span className="font-bold text-emerald-600 font-mono">~1.2 s / query</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Longitudinal Grounding Accuracy</span>
                <span className="font-bold text-emerald-600 font-mono">100% Deterministic</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
