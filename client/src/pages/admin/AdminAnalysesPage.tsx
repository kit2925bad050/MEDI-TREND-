import React, { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  RefreshCw,
  Cpu,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { fetchAdminDashboardStats } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminAnalysesPage: React.FC = () => {
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
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
            <Brain className="w-4 h-4" />
            <span>AI Orchestration Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            AI Analyses Executions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log of multi-model LangGraph longitudinal synthesis and grounding traces
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Primary Clinical Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold">Online</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Primary clinical model configured for longitudinal trajectory extraction and complex cross-report parameter reconciliation.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Consensus Verification Gateway</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold">Online</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High-availability secondary bridge ensuring continuous analysis pipeline redundancy.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Medical Synthesis Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold">Online</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fast inference synthesizer for authentic medical Tamil (தமிழ் சுருக்கம்) grounding.
            </p>
          </div>
        </div>
      )}

      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <Cpu className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Total Analyses Executed: {stats?.total_analyses ?? 0}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Every AI analysis invocation is grounded strictly in source parameters and logged to the compliance database.
        </p>
      </div>
    </div>
  );
};
