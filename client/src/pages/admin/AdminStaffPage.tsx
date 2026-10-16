import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Key,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UserX,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { fetchStaff, createStaff, resetUserPassword, deactivateStaff, restoreStaff } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useLanguage } from '../../context/LanguageContext';

export const AdminStaffPage: React.FC = () => {
  const { isTamil } = useLanguage();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [resettingStaff, setResettingStaff] = useState<any | null>(null);
  const [deactivatingStaff, setDeactivatingStaff] = useState<any | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Pathology / Clinical Lab');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Staff@2026');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchStaff();
      setStaffList(data || []);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Unable to load staff.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setActionError(null);
    try {
      await createStaff({
        full_name: fullName,
        email,
        department,
        phone,
        password,
      });
      setShowAddModal(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setActionSuccess(isTamil ? 'பணியாளர் வெற்றிகரமாக சேர்க்கப்பட்டார்' : 'Staff member created successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create staff member');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingStaff || !deactivateReason.trim()) {
      setActionError(isTamil ? 'நீக்குவதற்கான காரணத்தை கட்டாயம் குறிப்பிட வேண்டும்' : 'Deactivation reason is required.');
      return;
    }
    try {
      await deactivateStaff(deactivatingStaff.staff_id, deactivateReason.trim());
      setActionSuccess(
        isTamil
          ? `பணியாளர் ${deactivatingStaff.full_name} கணக்கு முடக்கப்பட்டது.`
          : `Staff member ${deactivatingStaff.full_name} deactivated.`
      );
      setDeactivatingStaff(null);
      setDeactivateReason('');
      setActionError(null);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (e: any) {
      setActionError(e.message || 'Failed to deactivate staff member');
    }
  };

  const handleRestore = async (stf: any) => {
    try {
      await restoreStaff(stf.staff_id, 'Admin restored staff access');
      setActionSuccess(
        isTamil
          ? `பணியாளர் ${stf.full_name} கணக்கு மீண்டும் செயல்படுத்தப்பட்டது!`
          : `Staff member ${stf.full_name} access restored successfully!`
      );
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to restore staff');
    }
  };

  const handleResetPassword = async () => {
    if (!resettingStaff || !newPassword) return;
    try {
      await resetUserPassword('staff', resettingStaff.staff_id, newPassword);
      setActionSuccess(`Password updated successfully for ${resettingStaff.full_name}`);
      setTimeout(() => {
        setActionSuccess(null);
        setResettingStaff(null);
        setNewPassword('');
      }, 2000);
    } catch (e: any) {
      alert(e.message || 'Password reset failed');
    }
  };

  const activeStaff = staffList.filter((s) => s.status === 'ACTIVE' || !s.status);
  const inactiveStaff = staffList.filter((s) => s.status === 'INACTIVE');
  const currentList = activeTab === 'ACTIVE' ? activeStaff : inactiveStaff;

  const filtered = currentList.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase()) ||
      s.staff_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>{isTamil ? 'மருத்துவ ஆதரவு மற்றும் ஆய்வக பணியாளர்கள்' : 'Clinical Support & Lab Personnel'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isTamil ? 'பணியாளர்கள் மேலாண்மை' : 'Staff Access & Operations'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isTamil ? 'ஆய்வக தொழில்நுட்ப வல்லுநர்கள் மற்றும் நிர்வாக ஊழியர் கணக்குகள்' : 'Manage laboratory technicians and support staff accounts'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-cyan-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isTamil ? 'புதிய பணியாளரைச் சேர்' : 'Add Staff Member'}</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && !deactivatingStaff && !showAddModal && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isTamil ? 'செயலில் உள்ள பணியாளர்கள்' : 'Active Staff'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
              {activeStaff.length}
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
            <span>{isTamil ? 'முடக்கப்பட்ட பணியாளர்கள்' : 'Inactive Staff'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
              {inactiveStaff.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isTamil ? 'பணியாளரை தேடுக...' : 'Search staff by name, email, department...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <LoadingSkeleton type="table" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={activeTab === 'ACTIVE' ? (isTamil ? 'செயலில் உள்ள பணியாளர்கள் இல்லை' : 'No Active Staff Members') : (isTamil ? 'முடக்கப்பட்ட பணியாளர்கள் இல்லை' : 'No Inactive Staff')}
          description={isTamil ? 'புதிய பணியாளரைச் சேர்க்க மேலே உள்ள பொத்தானைப் பயன்படுத்தவும்.' : 'Add laboratory technicians and clinical coordinators to manage document ingestions.'}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Staff ID</th>
                <th className="py-3 px-4 font-semibold">Staff Name</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                {activeTab === 'INACTIVE' && <th className="py-3 px-4 font-semibold">Reason</th>}
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((stf) => (
                <tr key={stf.staff_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{stf.staff_id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {stf.full_name}
                  </td>
                  <td className="py-3 px-4">{stf.department}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{stf.email}</td>
                  <td className="py-3 px-4">
                    {stf.status === 'INACTIVE' ? (
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
                      {stf.deactivation_reason || 'Access retired'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-right space-x-1">
                    {stf.status !== 'INACTIVE' ? (
                      <>
                        <button
                          onClick={() => setResettingStaff(stf)}
                          className="p-1.5 text-xs text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Reset Pass</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeactivatingStaff(stf);
                            setDeactivateReason('');
                          }}
                          className="p-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg inline-flex items-center gap-1 font-semibold"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleRestore(stf)}
                        className="px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 rounded-lg inline-flex items-center gap-1 font-semibold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Access</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deactivate Staff Modal */}
      {deactivatingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-red-200 dark:border-red-900/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isTamil ? 'பணியாளரை முடக்க வேண்டுமா?' : 'Deactivate Staff Member?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil ? 'பணியாளர் கணக்கு முடக்கப்பட்டு உள்நுழைவு ரத்து செய்யப்படும்' : 'Account will be deactivated and active sessions revoked'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p><b>Staff Name:</b> {deactivatingStaff.full_name}</p>
              <p><b>Email:</b> {deactivatingStaff.email}</p>
              <p><b>Staff ID:</b> {deactivatingStaff.staff_id}</p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 text-xs text-red-700 dark:bg-red-950/60 dark:text-red-300">
                {actionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isTamil ? 'காரணம் (கட்டாயம்)' : 'Reason (Required)'}
              </label>
              <input
                type="text"
                required
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="e.g. Staff resigned / Transferred to other unit"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeactivatingStaff(null);
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
                Deactivate Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Add New Staff Member
            </h2>
            {actionError && (
              <div role="alert" className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-xs text-red-700 dark:text-red-300">
                {actionError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Ramanathan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98402 67890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/30 disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reset Password for {resettingStaff.full_name}
            </h3>
            <p className="text-xs text-slate-500">
              Set new strong password for staff login.
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
                onClick={() => setResettingStaff(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-4 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm"
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
