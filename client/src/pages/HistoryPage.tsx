import React, { useState, useEffect } from 'react';
import {
  History,
  Shield,
  Activity,
  Clock,
  User,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { fetchActivityLogs, fetchAuditLogs } from '../services/api';
import { AuditLogEntry } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { useLanguage } from '../context/LanguageContext';

export const HistoryPage: React.FC = () => {
  const { dict } = useLanguage();
  const [activeTab, setActiveTab] = useState<'activity' | 'audit'>('activity');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [act, aud] = await Promise.all([
        fetchActivityLogs(),
        fetchAuditLogs(),
      ]);
      setActivityLogs(act || []);
      setAuditLogs(aud || []);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredActivities = activityLogs.filter((a) =>
    (a.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.details || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredAudits = auditLogs.filter((a) =>
    (a.userId || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.details || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.userRole || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>{dict.history_page_title}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {dict.history_page_title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.history_page_subtitle}
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'activity'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{dict.nav_admin_activity} ({activityLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{dict.nav_admin_audit} ({auditLogs.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={dict.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Log Table / List */}
      {loading ? (
        <LoadingSkeleton type="table" />
      ) : activeTab === 'activity' ? (
        filteredActivities.length === 0 ? (
          <EmptyState
            title="No Activity Logs Available"
            description="Operational activity records such as report uploads, patient updates, and AI queries will appear here automatically."
          />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">{dict.history_timestamp}</th>
                    <th className="py-3 px-4 font-semibold">{dict.history_actor}</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">{dict.history_event_type}</th>
                    <th className="py-3 px-4 font-semibold">Entity</th>
                    <th className="py-3 px-4 font-semibold">{dict.history_details}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredActivities.map((log, idx) => (
                    <tr key={log.log_id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {log.user_name || log.user_id || 'System'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                          {log.user_role || 'STAFF'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        filteredAudits.length === 0 ? (
          <EmptyState
            title="No Compliance Audit Logs Available"
            description="Compliance and security events are recorded directly to the database and will be visible here."
          />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Audit ID</th>
                    <th className="py-3 px-4 font-semibold">{dict.history_timestamp}</th>
                    <th className="py-3 px-4 font-semibold">{dict.history_actor}</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">{dict.history_event_type}</th>
                    <th className="py-3 px-4 font-semibold">{dict.status}</th>
                    <th className="py-3 px-4 font-semibold">{dict.history_details}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredAudits.map((log) => (
                    <tr key={log.logId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {log.logId}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {log.userId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {log.action}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{log.status || 'SUCCESS'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};
