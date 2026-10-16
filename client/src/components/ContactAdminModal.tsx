import React, { useState } from 'react';
import { X, Send, MessageSquare, ShieldAlert, CheckCircle2, Loader2, Hospital, RotateCcw } from 'lucide-react';
import { contactAdmin } from '../services/api';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  reportId?: string;
  defaultSubject?: string;
}

export const ContactAdminModal: React.FC<ContactAdminModalProps> = ({
  isOpen,
  onClose,
  patientId,
  reportId,
  defaultSubject,
}) => {
  const [subject, setSubject] = useState(defaultSubject || (reportId ? `Request to restore report ${reportId}` : 'Clinical Support / System Inquiry'));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg('Please enter a subject and message description.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await contactAdmin({
        patient_id: patientId,
        report_id: reportId,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccessMsg('Your message has been delivered to the Hospital Administrator. They will review and respond.');
      setTimeout(() => {
        setSuccessMsg(null);
        setMessage('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch message to administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-purple-50/40 dark:bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Contact Hospital Administrator</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Direct Administrative Communication & File Restore Request
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {reportId && (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60 text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2 font-mono">
              <RotateCcw className="w-4 h-4 text-purple-600" />
              <span>Referencing Archived Report: <b>{reportId}</b> (Patient: {patientId})</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Request to restore archived report"
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Message Description / Clinical Note
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your request or reasons for restoring the report..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800 dark:text-slate-100 resize-none font-medium"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition disabled:opacity-50 hover:scale-[1.02]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send to Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
