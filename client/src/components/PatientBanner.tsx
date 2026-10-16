import React, { useState } from 'react';
import { PatientProfile } from '../types';
import { Phone, Calendar, FileText } from 'lucide-react';
import { PatientAvatar } from './PatientAvatar';
import { AvatarUploadModal } from './AvatarUploadModal';
import { useLanguage } from '../context/LanguageContext';

interface PatientBannerProps {
  patient: PatientProfile;
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
  onPatientUpdated?: (updated: PatientProfile) => void;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({
  patient,
  activeSubTab,
  onSubTabChange,
  onPatientUpdated,
}) => {
  const { dict } = useLanguage();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: dict.tab_overview },
    { id: 'reports', label: dict.tab_reports },
    { id: 'analysis', label: dict.tab_analysis },
    { id: 'trends', label: dict.tab_trends },
    { id: 'clinical_summary', label: dict.tab_clinical_summary },
    { id: 'documents', label: dict.tab_documents },
    { id: 'history', label: dict.tab_history },
  ];

  const handleAvatarUpdated = (newUrl: string | null) => {
    const updated = { ...patient, avatarUrl: newUrl || undefined };
    if (onPatientUpdated) {
      onPatientUpdated(updated);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 select-none transition-colors duration-200">
        {/* Top Patient Info Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Left: Avatar with Dynamic Initials / Uploaded Photo & Demographics */}
          <div className="flex items-center gap-4">
            <PatientAvatar
              name={patient.name}
              avatarUrl={patient.avatarUrl}
              size="lg"
              showStatus={true}
              isActive={patient.activeStatus === 'Active'}
              onClick={() => setIsAvatarModalOpen(true)}
              editable={true}
            />

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {patient.name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {patient.activeStatus === 'Active' ? dict.patient_active : dict.patient_inactive}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {dict.pid_label}: {patient.patientId}
                </span>
                <span>•</span>
                <span>{patient.age} {dict.years_label}</span>
                <span>•</span>
                <span>{patient.gender}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {patient.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Right Stats: Total Reports, First Report, Latest Report */}
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            {/* Total Reports */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
              <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-400">
                  {dict.total_reports}
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {patient.totalReports}
                </div>
              </div>
            </div>

            {/* First Report */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-400">
                  {dict.first_report}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {patient.firstReportDate || '25 Apr 2026'}
                </div>
              </div>
            </div>

            {/* Latest Report */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
              <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-400">
                  {dict.latest_report}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {patient.latestReportDate || '30 Jul 2026'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pt-1">
          {tabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Avatar Upload / Edit Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        patientId={patient.patientId}
        patientName={patient.name}
        currentAvatarUrl={patient.avatarUrl}
        onAvatarUpdated={handleAvatarUpdated}
      />
    </>
  );
};
