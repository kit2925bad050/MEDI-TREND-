import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  Shield,
  Phone,
  Mail,
  UserCheck,
  UserX,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Layers,
  FilePlus2,
  Pencil,
  X,
} from 'lucide-react';
import {
  fetchPatients,
  deactivatePatient,
  restorePatient,
  deletePatient,
  fetchPatientReportLimit,
  updatePatientReportLimit,
} from '../../services/api';
import { PatientProfile } from '../../types';
import { PatientAvatar } from '../../components/PatientAvatar';
import { AddPatientModal } from '../../components/AddPatientModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useLanguage } from '../../context/LanguageContext';

export const AdminPatientsPage: React.FC = () => {
  const { isTamil } = useLanguage();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null);
  const [deactivatingPatient, setDeactivatingPatient] = useState<any | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<any | null>(null);
  const [expandingLimitPatient, setExpandingLimitPatient] = useState<any | null>(null);
  const [currentLimit, setCurrentLimit] = useState<number>(5);
  const [newLimit, setNewLimit] = useState<number>(10);
  const [limitReason, setLimitReason] = useState<string>('Longitudinal clinical study expansion');
  const [savingLimit, setSavingLimit] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      setLoadError(null);
      const list = await fetchPatients(true);
      setPatients(list || []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Unable to load patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenLimitModal = async (p: any) => {
    setExpandingLimitPatient(p);
    try {
      const lim = await fetchPatientReportLimit(p.patientId);
      setCurrentLimit(lim || 5);
      setNewLimit((lim || 5) + 5);
    } catch {
      setCurrentLimit(5);
      setNewLimit(10);
    }
  };

  const handleSaveLimit = async () => {
    if (!expandingLimitPatient) return;
    setSavingLimit(true);
    try {
      await updatePatientReportLimit(expandingLimitPatient.patientId, Number(newLimit), limitReason);
      setActionSuccess(
        isTamil
          ? `நோயாளி ${expandingLimitPatient.name}-க்கான அறிக்கை கொள்ளளவு ${newLimit} ஆக அதிகரிக்கப்பட்டது!`
          : `Report capacity for ${expandingLimitPatient.name} expanded to ${newLimit} reports!`
      );
      setExpandingLimitPatient(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e: any) {
      setActionError(e.message || 'Failed to update report limit.');
    } finally {
      setSavingLimit(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!deletingPatient) return;
    const pId = deletingPatient.patientId;
    const pName = deletingPatient.name;

    // Optimistically remove immediately from table state
    setPatients((prev) => prev.filter((p) => p.patientId !== pId));
    setDeletingPatient(null);

    try {
      await deletePatient(pId);
      setActionSuccess(
        isTamil
          ? `நோயாளி ${pName} வெற்றிகரமாக நீக்கப்பட்டார்!`
          : `Patient ${pName} permanently removed.`
      );
      setActionError(null);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (e: any) {
      setActionError(e.message || 'Failed to delete patient');
      loadData();
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingPatient || !deactivateReason.trim()) {
      setActionError(isTamil ? 'நீக்குவதற்கான காரணத்தை கட்டாயம் குறிப்பிட வேண்டும்' : 'Deactivation reason is required.');
      return;
    }
    try {
      await deactivatePatient(deactivatingPatient.patientId, deactivateReason.trim());
      setActionSuccess(
        isTamil
          ? `நோயாளி ${deactivatingPatient.name} கணக்கு முடக்கப்பட்டது. மருத்துவ வரலாறு பாதுகாப்பாக உள்ளது.`
          : `Patient ${deactivatingPatient.name} deactivated. Historical medical reports remain preserved.`
      );
      setDeactivatingPatient(null);
      setDeactivateReason('');
      setActionError(null);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (e: any) {
      setActionError(e.message || 'Failed to deactivate patient');
    }
  };

  const handleRestore = async (p: any) => {
    try {
      await restorePatient(p.patientId, 'Admin restored patient');
      setActionSuccess(
        isTamil
          ? `நோயாளி ${p.name} கணக்கு மீண்டும் செயல்படுத்தப்பட்டது!`
          : `Patient ${p.name} access restored to active status!`
      );
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to restore patient');
    }
  };

  const handlePatientCreated = (newPatient: PatientProfile) => {
    setPatients((prev) => [newPatient, ...prev.filter((p) => p.patientId !== newPatient.patientId)]);
    setActionSuccess(
      isTamil
        ? `நோயாளி ${newPatient.name} வெற்றிகரமாக சேர்க்கப்பட்டார்!`
        : `Patient ${newPatient.name} registered successfully!`
    );
    setTimeout(() => setActionSuccess(null), 4000);
    loadData();
  };

  const handlePatientUpdated = (updatedPatient: PatientProfile) => {
    setPatients((prev) => prev.map((patient) =>
      patient.patientId === updatedPatient.patientId ? updatedPatient : patient
    ));
    setActionSuccess(
      isTamil
        ? `நோயாளி ${updatedPatient.name} பதிவு புதுப்பிக்கப்பட்டது!`
        : `Patient ${updatedPatient.name} updated successfully.`
    );
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 4000);
    loadData();
  };

  const activePatients = patients.filter((p) => p.activeStatus === 'ACTIVE' || p.activeStatus === 'Active' || !p.activeStatus);
  const inactivePatients = patients.filter((p) => p.activeStatus === 'INACTIVE' || p.activeStatus === 'DEACTIVATED');
  const currentList = activeTab === 'ACTIVE' ? activePatients : inactivePatients;

  const filtered = currentList.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.patientId?.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>{isTamil ? 'முதன்மை நோயாளி அடைவு' : 'Master Patient Index'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isTamil ? 'பதிவு செய்யப்பட்ட நோயாளிகள்' : 'All Registered Patients'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isTamil
              ? 'நோயாளி பதிவுகள் மற்றும் ஒதுக்கப்பட்ட மருத்துவர் மேற்பார்வை'
              : 'Admin oversight of longitudinal patient records and assigned attending physicians'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingPatient(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isTamil ? 'புதிய நோயாளி சேர்க்க' : '+ Add New Patient'}</span>
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isTamil ? 'புதுப்பி' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {loadError && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300">
          {loadError}
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isTamil ? 'செயலில் உள்ள நோயாளிகள்' : 'Active Patients'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {activePatients.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('INACTIVE')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'INACTIVE'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>{isTamil ? 'முடக்கப்பட்ட நோயாளிகள்' : 'Archived / Inactive'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
              {inactivePatients.length}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isTamil ? 'நோயாளி ID, பெயர் மூலம் தேடுக...' : 'Search by patient ID, name, or phone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton type="table" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={activeTab === 'ACTIVE' ? (isTamil ? 'செயலில் உள்ள நோயாளிகள் இல்லை' : 'No Registered Patients') : (isTamil ? 'முடக்கப்பட்ட நோயாளிகள் இல்லை' : 'No Archived Patients')}
          description={isTamil ? 'மருத்துவ உட்கொள்ளல் பணியகம் மூலம் சேர்க்கப்படும் நோயாளிகள் இங்கே பட்டியலிடப்படுவர்.' : 'Patients added through the clinical intake portal will be indexed here.'}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Patient</th>
                <th className="py-3 px-4 font-semibold">Patient ID</th>
                <th className="py-3 px-4 font-semibold">Demographics</th>
                <th className="py-3 px-4 font-semibold">Blood Group</th>
                <th className="py-3 px-4 font-semibold">Contact</th>
                <th className="py-3 px-4 font-semibold">Doctor Assigned</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((p) => (
                <tr key={p.patientId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <PatientAvatar
                      name={p.name}
                      avatarUrl={p.avatarUrl}
                      size="sm"
                      isActive={p.activeStatus === 'ACTIVE' || p.activeStatus === 'Active'}
                      editable={false}
                    />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{p.patientId}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {p.age} yrs • {p.gender}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                    {p.bloodGroup || 'N/A'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{p.phone || p.email || 'N/A'}</td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    {p.doctorInCharge}
                  </td>
                  <td className="py-3 px-4">
                    {p.activeStatus === 'INACTIVE' || p.activeStatus === 'DEACTIVATED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
                        INACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPatient(p);
                        setShowAddModal(true);
                        setActionError(null);
                      }}
                      className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                      title="Edit patient record"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {p.activeStatus !== 'INACTIVE' && p.activeStatus !== 'DEACTIVATED' ? (
                      <>
                        <button
                          onClick={() => handleOpenLimitModal(p)}
                          className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                          title="Expand Report Upload Capacity"
                        >
                          <FilePlus2 className="w-3.5 h-3.5" />
                          <span>Capacity</span>
                        </button>

                        <button
                          onClick={() => {
                            setDeactivatingPatient(p);
                            setDeactivateReason('');
                          }}
                          className="p-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                          title="Deactivate Patient"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
                        </button>

                        <button
                          onClick={() => setDeletingPatient(p)}
                          className="p-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                          title="Permanently Delete Patient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(p)}
                          className="px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 rounded-lg inline-flex items-center gap-1 font-semibold"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => setDeletingPatient(p)}
                          className="p-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                          title="Permanently Delete Patient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expand Patient Report Limit Modal */}
      {expandingLimitPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-indigo-200 dark:border-indigo-900/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isTamil ? 'அறிக்கை கொள்ளளவை அதிகரிக்க' : 'Grant Additional Report Capacity'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {expandingLimitPatient.name} ({expandingLimitPatient.patientId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpandingLimitPatient(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p><b>Current Allowed Capacity:</b> <span className="text-indigo-600 font-bold">{currentLimit} Accepted Reports</span></p>
              <p className="text-[11px] text-slate-500">Default policy grants 5 reports per patient. Administrators can expand capacity for ongoing longitudinal studies.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                New Max Report Capacity
              </label>
              <input
                type="number"
                min={currentLimit}
                max={50}
                value={newLimit}
                onChange={(e) => setNewLimit(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Administrative Reason / Justification
              </label>
              <input
                type="text"
                required
                value={limitReason}
                onChange={(e) => setLimitReason(e.target.value)}
                placeholder="e.g. Longitudinal cardiovascular progression monitoring"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExpandingLimitPatient(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingLimit}
                onClick={handleSaveLimit}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                {savingLimit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{savingLimit ? 'Saving Grant...' : 'Update Capacity'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Patient Modal */}
      {deletingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-red-300 dark:border-red-900/80 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isTamil ? 'நோயாளியை நிரந்தரமாக நீக்க வேண்டுமா?' : 'Delete Patient Permanently?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil ? 'இந்த நடவடிக்கை நோயாளி மற்றும் தொடர்புடைய மருத்துவ பதிவுகளை முற்றிலும் நீக்கும்.' : 'This will permanently remove the patient profile and all associated reports.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p><b>Patient:</b> {deletingPatient.name}</p>
              <p><b>Patient ID:</b> {deletingPatient.patientId}</p>
              <p><b>Phone:</b> {deletingPatient.phone || 'N/A'}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingPatient(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isTamil ? 'ரத்து செய்' : 'Cancel'}
              </button>
              <button
                onClick={handleDeletePatient}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition"
              >
                {isTamil ? 'ஆம், நீக்கு' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Patient Modal */}
      {deactivatingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-red-200 dark:border-red-900/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isTamil ? 'நோயாளி கணக்கை முடக்க வேண்டுமா?' : 'Deactivate Patient?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil ? 'மருத்துவ ஆவணங்கள் அழிக்கப்படாது, பாதுகாப்பாக இருக்கும்' : 'Clinical records and longitudinal history will NOT be destroyed'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p><b>Patient:</b> {deactivatingPatient.name}</p>
              <p><b>Patient ID:</b> {deactivatingPatient.patientId}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 pt-1">
                ✓ Historical reports and analyses will remain protected.
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 text-xs text-red-700 dark:bg-red-950/60 dark:text-red-300">
                {actionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isTamil ? 'முடக்குவதற்கான காரணம் (கட்டாயம்)' : 'Reason for Deactivation (Required)'}
              </label>
              <input
                type="text"
                required
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="e.g. Transferred to other hospital / Patient discharged"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeactivatingPatient(null);
                  setActionError(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30"
              >
                Deactivate Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingPatient(null);
        }}
        onPatientCreated={handlePatientCreated}
        patient={editingPatient}
        onPatientUpdated={handlePatientUpdated}
      />
    </div>
  );
};
