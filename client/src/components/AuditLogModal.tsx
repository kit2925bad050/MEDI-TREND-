import React, { useState, useEffect } from 'react';
import { AuditLogEntry, UserRole } from '../types';
import { fetchAuditLogs } from '../services/api';
import { X, ShieldCheck, Clock, UserCheck, Activity, Terminal } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAuditLogs().then((res) => {
        setLogs(res);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-brand-950/80 text-brand-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Security & Clinical Audit Trail</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  Role: {currentUserRole}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable record of all patient data accesses, uploads, and AI inferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Log List */}
        <div className="p-6 overflow-y-auto space-y-3 font-mono text-xs flex-1">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No logs recorded yet.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.logId}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-brand-600 dark:text-brand-400">
                    [{log.action}]
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.timestamp}
                  </span>
                </div>

                <div className="text-slate-700 dark:text-slate-300 text-[11px]">
                  <b>User:</b> {log.userId} ({log.userRole}) • <b>Patient:</b> {log.patientId || 'N/A'} • <b>Reports:</b> {log.reportId || 'N/A'}
                </div>

                {log.details && (
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
                    {log.details}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Compliance: HIPAA & GDPR Clinical Audit Logging Standard</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
