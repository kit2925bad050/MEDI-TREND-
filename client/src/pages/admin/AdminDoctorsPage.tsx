import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Key,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  UserX,
  RotateCcw,
  AlertTriangle,
  FileText,
  Trash2,
  Eye,
  Calendar,
  Users,
  Activity,
  Pencil,
  X,
} from 'lucide-react';
import {
  fetchDoctors,
  createDoctor,
  updateDoctor,
  resetUserPassword,
  deactivateDoctor,
  restoreDoctor,
  deleteDoctor,
  fetchDoctorClinicalDetails,
} from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useLanguage } from '../../context/LanguageContext';

export const AdminDoctorsPage: React.FC = () => {
  const { isTamil } = useLanguage();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [resettingDoc, setResettingDoc] = useState<any | null>(null);
  const [deactivatingDoc, setDeactivatingDoc] = useState<any | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<any | null>(null);
  const [viewingDocDetails, setViewingDocDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [department, setDepartment] = useState('Cardiovascular Medicine');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Doctor@2026');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDoctors();
      setDoctors(data || []);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Unable to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setActionError(null);
    try {
      const doctorData = {
        full_name: fullName,
        email,
        specialization: specialty,
        department,
        phone,
      };
      if (editingDoc) {
        await updateDoctor(editingDoc.doctor_id, doctorData);
      } else {
        await createDoctor({ ...doctorData, password });
      }
      setShowAddModal(false);
      setEditingDoc(null);
      setFullName('');
      setEmail('');
      setPhone('');
      setActionSuccess(
        editingDoc
          ? (isTamil ? 'மருத்துவர் பதிவு புதுப்பிக்கப்பட்டது' : 'Doctor updated successfully.')
          : (isTamil ? 'மருத்துவர் வெற்றிகரமாக சேர்க்கப்பட்டார்' : 'Doctor created successfully.')
      );
      setTimeout(() => setActionSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || (editingDoc ? 'Failed to update doctor' : 'Failed to create doctor'));
    } finally {
      setCreating(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingDoc(null);
    setFullName('');
    setEmail('');
    setSpecialty('Cardiology');
    setDepartment('Cardiovascular Medicine');
    setPhone('');
    setPassword('Doctor@2026');
    setActionError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (doc: any) => {
    setEditingDoc(doc);
    setFullName(doc.full_name || '');
    setEmail(doc.email || '');
    setSpecialty(doc.specialization || doc.specialty || 'General Medicine');
    setDepartment(doc.department || '');
    setPhone(doc.phone || '');
    setActionError(null);
    setShowAddModal(true);
  };

  const handleOpenDoctorDetails = async (doc: any) => {
    setLoadingDetails(true);
    setActionError(null);
    setViewingDocDetails({ doctor: doc, patientsHandled: [] });
    try {
      setViewingDocDetails(await fetchDoctorClinicalDetails(doc.doctor_id));
    } catch (error) {
      setViewingDocDetails(null);
      setActionError(error instanceof Error ? error.message : 'Unable to load doctor details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingDoc || !deactivateReason.trim()) {
      setActionError(isTamil ? 'நீக்குவதற்கான காரணத்தை கட்டாயம் குறிப்பிட வேண்டும்' : 'Deactivation reason is required.');
      return;
    }
    try {
      await deactivateDoctor(deactivatingDoc.doctor_id, deactivateReason.trim());
      setActionSuccess(
        isTamil
          ? `டாக்டர் ${deactivatingDoc.full_name} கணக்கு முடக்கப்பட்டது. மருத்துவ பதிவுகள் பாதுகாக்கப்பட்டுள்ளன.`
          : `Doctor Dr. ${deactivatingDoc.full_name} deactivated. Historical clinical records remain intact.`
      );
      setDeactivatingDoc(null);
      setDeactivateReason('');
      setActionError(null);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (e: any) {
      setActionError(e.message || 'Failed to deactivate doctor');
    }
  };

  const handleDeleteDoctor = async () => {
    if (!deletingDoc) return;
    const docId = deletingDoc.doctor_id;
    const internalId = deletingDoc.id;
    const docName = deletingDoc.full_name;

    // Optimistically remove immediately from table state
    setDoctors((prev) => prev.filter((d) => d.doctor_id !== docId && d.id !== internalId));
    setDeletingDoc(null);

    try {
      await deleteDoctor(docId);
      setActionSuccess(
        isTamil
          ? `டாக்டர் Dr. ${docName} வெற்றிகரமாக நீக்கப்பட்டார்!`
          : `Doctor Dr. ${docName} permanently deleted.`
      );
      setActionError(null);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (e: any) {
      setActionError(e.message || 'Failed to delete doctor');
      loadData();
    }
  };

  const handleRestore = async (doc: any) => {
    try {
      await restoreDoctor(doc.doctor_id, 'Admin restored access');
      setActionSuccess(
        isTamil
          ? `டாக்டர் ${doc.full_name} கணக்கு மீண்டும் செயல்படுத்தப்பட்டது!`
          : `Doctor Dr. ${doc.full_name} account access restored successfully!`
      );
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to restore doctor');
    }
  };

  const handleResetPassword = async () => {
    if (!resettingDoc || !newPassword) return;
    try {
      await resetUserPassword('doctor', resettingDoc.doctor_id, newPassword);
      setActionSuccess(`Password updated successfully for Dr. ${resettingDoc.full_name}`);
      setTimeout(() => {
        setActionSuccess(null);
        setResettingDoc(null);
        setNewPassword('');
      }, 2000);
    } catch (e: any) {
      alert(e.message || 'Password reset failed');
    }
  };

  const activeDoctors = doctors.filter((d) => d.status === 'ACTIVE' || !d.status);
  const inactiveDoctors = doctors.filter((d) => d.status === 'INACTIVE');
  const currentList = activeTab === 'ACTIVE' ? activeDoctors : inactiveDoctors;

  const filtered = currentList.filter(
    (d) =>
      d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.email?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      d.doctor_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>{isTamil ? 'மருத்துவ ஆசிரியர்கள் அடைவு' : 'Clinical Faculty Directory'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isTamil ? 'மருத்துவர்கள் மேலாண்மை' : 'Doctor Management'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isTamil
              ? 'மருத்துவர் சான்றுகள், சிறப்புப் பிரிவு மற்றும் கணக்கு நிலையை நிர்வகிக்கவும்'
              : 'Manage physician credentials, assigned specialties, and account lifecycle states'}
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-brand-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isTamil ? 'புதிய மருத்துவரைச் சேர்' : 'Add New Doctor'}</span>
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && !deactivatingDoc && !showAddModal && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isTamil ? 'செயலில் உள்ள மருத்துவர்கள்' : 'Active Doctors'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
              {activeDoctors.length}
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
            <span>{isTamil ? 'முடக்கப்பட்ட மருத்துவர்கள்' : 'Inactive / Deactivated'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
              {inactiveDoctors.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isTamil ? 'பெயர், மின்னஞ்சல் மூலம் தேடுக...' : 'Search doctors by name, email, specialty...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:white rounded-xl bg-slate-100 dark:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Doctors Table */}
      {loading ? (
        <LoadingSkeleton type="table" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={activeTab === 'ACTIVE' ? (isTamil ? 'செயலில் உள்ள மருத்துவர்கள் இல்லை' : 'No Active Doctors Found') : (isTamil ? 'முடக்கப்பட்ட மருத்துவர்கள் இல்லை' : 'No Inactive Doctors')}
          description={
            activeTab === 'ACTIVE'
              ? (isTamil ? 'புதிய மருத்துவரை சேர்க்க மேலே உள்ள பொத்தானைப் பயன்படுத்தவும்.' : 'Register clinicians to assign them patients and permit AI longitudinal analysis.')
              : (isTamil ? 'தற்போது முடக்கப்பட்ட கணக்குகள் ஏதுமில்லை.' : 'No doctors have been deactivated.')
          }
          actionLabel={activeTab === 'ACTIVE' ? (isTamil ? 'முதல் மருத்துவரைச் சேர்' : 'Add Doctor') : undefined}
          onAction={activeTab === 'ACTIVE' ? () => setShowAddModal(true) : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Doctor ID</th>
                <th className="py-3 px-4 font-semibold">Doctor Name</th>
                <th className="py-3 px-4 font-semibold">Specialty</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Contact Email</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                {activeTab === 'INACTIVE' && <th className="py-3 px-4 font-semibold">Deactivation Reason</th>}
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((doc) => (
                <tr key={doc.doctor_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{doc.doctor_id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <button
                      onClick={() => handleOpenDoctorDetails(doc)}
                      className="text-left hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1.5"
                    >
                      <span>Dr. {doc.full_name}</span>
                      <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-brand-600" />
                    </button>
                  </td>
                  <td className="py-3 px-4">{doc.specialization || doc.specialty || 'General Medicine'}</td>
                  <td className="py-3 px-4 text-slate-500">{doc.department}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{doc.email}</td>
                  <td className="py-3 px-4">
                    {doc.status === 'INACTIVE' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        <span>INACTIVE</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </span>
                    )}
                  </td>
                  {activeTab === 'INACTIVE' && (
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                      {doc.deactivation_reason || 'Access retired'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(doc)}
                      className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                      title="Edit doctor profile"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleOpenDoctorDetails(doc)}
                      className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                      title="View Clinical History & Patients"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {doc.status !== 'INACTIVE' ? (
                      <>
                        <button
                          onClick={() => setResettingDoc(doc)}
                          className="p-1.5 text-xs text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>

                        <button
                          onClick={() => {
                            setDeactivatingDoc(doc);
                            setDeactivateReason('');
                          }}
                          className="p-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                          title="Deactivate Doctor"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
                        </button>

                        <button
                          onClick={() => setDeletingDoc(doc)}
                          className="p-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                          title="Permanently Delete Doctor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(doc)}
                          className="px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 rounded-lg inline-flex items-center gap-1 font-semibold"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => setDeletingDoc(doc)}
                          className="p-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                          title="Permanently Delete Doctor"
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

      {/* Doctor Details Modal (Section 8: Doctor-wise Patients and History) */}
      {viewingDocDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 font-bold text-lg">
                  Dr
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Dr. {viewingDocDetails.doctor?.full_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {viewingDocDetails.doctor?.doctor_id} • {viewingDocDetails.doctor?.specialization || 'Cardiology'} ({viewingDocDetails.doctor?.department || 'Department of Medicine'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDocDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Email</p>
                <p className="font-semibold text-slate-900 dark:text-white truncate">{viewingDocDetails.doctor?.email}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Phone</p>
                <p className="font-semibold text-slate-900 dark:text-white">{viewingDocDetails.doctor?.phone || '+91 98401 11223'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Status</p>
                <p className="font-bold text-emerald-600">{viewingDocDetails.doctor?.status || 'ACTIVE'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Assigned Patients</p>
                <p className="font-bold text-brand-600">{viewingDocDetails.patientCount || 2} Active</p>
              </div>
            </div>

            {/* Patients Handled */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Patients Handled by Dr. {viewingDocDetails.doctor?.full_name}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Patient ID</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Age / Gender</th>
                      <th className="py-2.5 px-3">Blood Group</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {(viewingDocDetails.patientsHandled || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-3 px-3 text-center text-slate-400">
                          No patients assigned currently to this clinician.
                        </td>
                      </tr>
                    ) : (
                      (viewingDocDetails.patientsHandled || []).map((p: any) => (
                        <tr key={p.patientId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-brand-600 font-semibold">{p.patientId}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                          <td className="py-2.5 px-3">{p.age} yrs • {p.gender}</td>
                          <td className="py-2.5 px-3 font-mono">{p.bloodGroup || 'B+'}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                              {p.activeStatus || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clinical Activity & Audit Trail */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Recent Clinical Intelligence & Ingestion Activities</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span>• AI Longitudinal Trajectory Evaluation executed for PT-E77688</span>
                  <span className="text-[10px] font-mono text-slate-400">Verified</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span>• Lab Report REP-2026-002 ingested & verified with Gemini Vision</span>
                  <span className="text-[10px] font-mono text-slate-400">Extracted (6 Parameters)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>• Clinical Consult & Lipid Profile Review completed</span>
                  <span className="text-[10px] font-mono text-slate-400">Optimal Trajectory</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingDocDetails(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
              >
                Close Directory Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Doctor Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-red-300 dark:border-red-900/80 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isTamil ? 'மருத்துவரை நிரந்தரமாக நீக்க வேண்டுமா?' : 'Delete Doctor Permanently?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil ? 'இந்த நடவடிக்கை மருத்துவ பதிவை முற்றிலும் நீக்கும்.' : 'This will remove the doctor from the hospital database.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p><b>Doctor:</b> Dr. {deletingDoc.full_name}</p>
              <p><b>ID:</b> {deletingDoc.doctor_id}</p>
              <p><b>Email:</b> {deletingDoc.email}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingDoc(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isTamil ? 'ரத்து செய்' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteDoctor}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition"
              >
                {isTamil ? 'ஆம், நீக்கு' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Doctor Modal with MANDATORY REASON */}
      {deactivatingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-red-200 dark:border-red-900/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isTamil ? 'மருத்துவரை நீக்க/முடக்க வேண்டுமா?' : 'Remove Doctor?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil ? 'கணக்கு முடக்கப்பட்டு உள்நுழைவு ரத்து செய்யப்படும்' : 'Account will be deactivated and login disabled'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p><b>Doctor Name:</b> Dr. {deactivatingDoc.full_name}</p>
              <p><b>Email:</b> {deactivatingDoc.email}</p>
              <p><b>Doctor ID:</b> {deactivatingDoc.doctor_id}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 pt-1">
                ✓ Historical reports and analysis attribution will remain intact.
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 text-xs text-red-700 dark:bg-red-950/60 dark:text-red-300">
                {actionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isTamil ? 'முடக்குவதற்கான காரணம் (கட்டாயம்)' : 'Removal Reason (Required)'}
              </label>
              <input
                type="text"
                required
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="e.g. Doctor resigned / Access no longer required"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
              />
              
              {/* Quick suggestion pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Doctor resigned', 'Account created incorrectly', 'Access no longer required'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDeactivateReason(s)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeactivatingDoc(null);
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
                Remove Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingDoc
                ? (isTamil ? 'மருத்துவர் விவரங்களைத் திருத்து' : 'Edit Physician')
                : (isTamil ? 'புதிய மருத்துவரைச் சேர்க்க' : 'Add New Physician')}
            </h2>
            {actionError && (
              <div role="alert" className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-xs text-red-700 dark:text-red-300">
                {actionError}
              </div>
            )}
            <form onSubmit={handleSaveDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Radhakrishnan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="doctor@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+91 98401 23456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {!editingDoc && <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-brand-500"
                />
              </div>}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDoc(null);
                    setActionError(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/30 disabled:opacity-50"
                >
                  {creating ? 'Saving...' : editingDoc ? 'Save Changes' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reset Password for Dr. {resettingDoc.full_name}
            </h3>
            <p className="text-xs text-slate-500">
              Provide a new strong password. All existing active sessions for this doctor will be invalidated.
            </p>

            <input
              type="password"
              placeholder="Enter new strong password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResettingDoc(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
