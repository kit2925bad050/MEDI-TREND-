import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientProfile } from '../types';
import { Users, Search, Plus, Phone, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { PatientAvatar } from '../components/PatientAvatar';
import { EmptyState } from '../components/common/EmptyState';
import { useLanguage } from '../context/LanguageContext';

interface PatientsPageProps {
  patients: PatientProfile[];
  selectedPatient: PatientProfile | null;
  onSelectPatient: (patient: PatientProfile) => void;
  onOpenCreatePatient: () => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onOpenCreatePatient,
}) => {
  const navigate = useNavigate();
  const { dict } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  const handlePatientClick = (p: PatientProfile) => {
    onSelectPatient(p);
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" />
            <span>{dict.nav_patients}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {patients.length} Active Records
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.journey_subheading}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={dict.search_patient_placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-slate-200"
            />
          </div>

          <button
            onClick={onOpenCreatePatient}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{dict.dash_add_patient}</span>
          </button>
        </div>
      </div>

      {/* Patient Cards Grid */}
      {patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Patients Registered Yet"
          description="Click '+ Add Patient' to register your first patient profile in the hospital database."
          actionText={dict.dash_add_patient}
          onAction={onOpenCreatePatient}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Matching Patients Found"
          description={`No patient matched your search query "${searchTerm}". Try searching by ID or phone number.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => {
            const isSelected = selectedPatient?.patientId === p.patientId;
            return (
              <div
                key={p.patientId}
                onClick={() => handlePatientClick(p)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden group hover:scale-[1.01] ${
                  isSelected
                    ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-400 dark:border-brand-600 ring-2 ring-brand-500/20 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-xl shadow-sm">
                    {dict.patient_active}
                  </div>
                )}

                <div className="flex items-center gap-3.5 mb-3">
                  <PatientAvatar
                    name={p.name}
                    avatarUrl={p.avatarUrl}
                    size="md"
                    showStatus={true}
                    isActive={p.activeStatus === 'Active'}
                    editable={false}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                      {p.name}
                    </h3>
                    <div className="text-xs text-brand-600 dark:text-brand-400 font-semibold font-mono">
                      {dict.pid_label}: {p.patientId}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>{dict.age_label} / {dict.gender_label}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {p.age} {dict.years_label} / {p.gender}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{dict.blood_group_label}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {p.bloodGroup || 'O+'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{dict.phone_label}:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {p.phone}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform">
                  <span>{dict.launch_workspace}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
