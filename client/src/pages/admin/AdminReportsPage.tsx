import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Building2,
  Calendar,
  CheckCircle2,
  FileCheck,
  Trash2,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  Shield,
  Send,
  Loader2,
} from 'lucide-react';
import {
  fetchAllAdminReports,
  fetchArchivedReports,
  restoreReport,
  permanentlyDeleteReport,
  fetchAdminMessages,
  replyAdminMessage,
} from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED' | 'TICKETS'>('ACTIVE');
  const [allReports, setAllReports] = useState<any[]>([]);
  const [archivedReports, setArchivedReports] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, archivedData, ticketsData] = await Promise.all([
        fetchAllAdminReports().catch(() => []),
        fetchArchivedReports().catch(() => []),
        fetchAdminMessages().catch(() => []),
      ]);
      setAllReports(reportsData.filter((r: any) => !r.is_deleted));
      setArchivedReports(archivedData);
      setSupportTickets(ticketsData);
    } catch (e) {
      console.error('Failed to load admin reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRestore = async (reportId: string) => {
    setActionLoadingId(reportId);
    try {
      await restoreReport(reportId);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to restore report');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePermanentDelete = async (reportId: string) => {
    if (!window.confirm(`Permanently delete report ${reportId} from the database? This action is IRREVERSIBLE.`)) {
      return;
    }
    setActionLoadingId(reportId);
    try {
      await permanentlyDeleteReport(reportId);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete report');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setActionLoadingId(ticketId);
    try {
      await replyAdminMessage(ticketId, replyText.trim(), 'RESOLVED');
      setReplyingTicketId(null);
      setReplyText('');
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to send reply');
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeFiltered = allReports.filter(
    (r) =>
      r.report_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.provider?.toLowerCase().includes(search.toLowerCase())
  );

  const archivedFiltered = archivedReports.filter(
    (r) =>
      r.report_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.deleted_by?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-purple-200 dark:border-purple-900/40 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Administrative Command</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Hospital Reports & Document Trash Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage active laboratory archives, restore clinician-deleted reports, and reply to support inquiries.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'ACTIVE'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Active Reports ({allReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ARCHIVED')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'ARCHIVED'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Admin Trash / Archived ({archivedReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'TICKETS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Clinician Requests ({supportTickets.length})</span>
        </button>
      </div>

      {/* Search Input */}
      {activeTab !== 'TICKETS' && (
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Report ID, Patient Name, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
          />
        </div>
      )}

      {/* TAB 1: ACTIVE REPORTS */}
      {activeTab === 'ACTIVE' && (
        loading ? (
          <LoadingSkeleton type="table" />
        ) : activeFiltered.length === 0 ? (
          <EmptyState
            title="No Active Reports Found"
            description="All active hospital laboratory reports are listed here."
          />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Report ID</th>
                  <th className="py-3 px-4 font-semibold">Patient</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Laboratory Provider</th>
                  <th className="py-3 px-4 font-semibold">Report Date</th>
                  <th className="py-3 px-4 font-semibold text-center">Parameters</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {activeFiltered.map((r) => (
                  <tr key={r.report_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {r.report_id}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <div>{r.patient_name || 'Patient'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.patient_id}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{r.category || 'Diagnostic Lab'}</td>
                    <td className="py-3 px-4 text-slate-500">{r.provider}</td>
                    <td className="py-3 px-4 text-slate-500">{r.report_date}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {r.parameter_count || r.parameterCount || 0} Parameters
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* TAB 2: ARCHIVED / TRASH REPORTS */}
      {activeTab === 'ARCHIVED' && (
        loading ? (
          <LoadingSkeleton type="table" />
        ) : archivedFiltered.length === 0 ? (
          <EmptyState
            title="Admin Trash is Empty"
            description="Reports archived by doctors or clinical staff will appear here for administrative restoration or permanent deletion."
          />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 overflow-hidden shadow-sm">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span><b>Admin Authority Trash:</b> These reports were archived from the active clinical workspace. You can restore them to the patient's record or permanently destroy them.</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Archived Report ID</th>
                  <th className="py-3 px-4 font-semibold">Patient</th>
                  <th className="py-3 px-4 font-semibold">Archived By</th>
                  <th className="py-3 px-4 font-semibold">Archived At</th>
                  <th className="py-3 px-4 font-semibold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {archivedFiltered.map((r) => (
                  <tr key={r.report_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {r.report_id}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <div>{r.patient_name || 'Patient'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.patient_id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {r.deleted_by || 'Attending Doctor'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {r.deleted_at || 'Recently'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(r.report_id)}
                          disabled={actionLoadingId === r.report_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl transition text-xs"
                        >
                          {actionLoadingId === r.report_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          <span>Restore to Patient</span>
                        </button>

                        <button
                          onClick={() => handlePermanentDelete(r.report_id)}
                          disabled={actionLoadingId === r.report_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 border border-red-300 text-red-700 dark:text-red-300 font-bold rounded-xl transition text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Permanently Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* TAB 3: CLINICIAN SUPPORT MESSAGES & RESTORE REQUESTS */}
      {activeTab === 'TICKETS' && (
        loading ? (
          <LoadingSkeleton type="table" />
        ) : supportTickets.length === 0 ? (
          <EmptyState
            title="No Clinician Support Requests"
            description="Messages, inquiries, and report restore requests sent by doctors or staff will appear here."
          />
        ) : (
          <div className="space-y-4">
            {supportTickets.map((t) => (
              <div
                key={t.ticket_id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {t.ticket_id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t.subject}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    t.status === 'OPEN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="font-semibold text-slate-400 text-[10px] mb-1">
                    From: {t.sender_name} ({t.sender_role}) • {t.created_at} {t.report_id ? `• Ref Report: ${t.report_id}` : ''}
                  </div>
                  <div>{t.message}</div>
                </div>

                {t.admin_reply && (
                  <div className="text-xs text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-200 dark:border-purple-900/50">
                    <div className="font-semibold text-purple-500 text-[10px] mb-1">
                      Admin Reply by {t.replied_by || 'Hospital Administrator'}:
                    </div>
                    <div>{t.admin_reply}</div>
                  </div>
                )}

                {replyingTicketId === t.ticket_id ? (
                  <div className="pt-2 space-y-2">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your official administrator response or resolution note..."
                      className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-200"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setReplyingTicketId(null);
                          setReplyText('');
                        }}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendReply(t.ticket_id)}
                        disabled={actionLoadingId === t.ticket_id || !replyText.trim()}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Resolution</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={() => {
                        setReplyingTicketId(t.ticket_id);
                        setReplyText(t.admin_reply || '');
                      }}
                      className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t.admin_reply ? 'Update Reply' : 'Reply / Resolve'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
