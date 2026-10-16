import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  Shield,
  Stethoscope,
  X,
  AlertTriangle,
  RotateCcw,
  Check,
  CalendarCheck,
  FileText,
  User,
  Building2,
} from 'lucide-react';
import {
  fetchDoctors,
  fetchAvailableSlots,
  bookAppointment,
  fetchPatientAppointments,
  fetchAllAppointments,
  cancelAppointment,
  rescheduleAppointment,
  proposeAppointmentAlternative,
  respondAppointmentAlternative,
  fetchDoctorAvailability,
  updateDoctorAvailability,
} from '../services/api';
import { PatientProfile, Appointment, TimeSlotItem, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

interface AppointmentsPageProps {
  currentPatient: PatientProfile | null;
  userRole: UserRole;
  currentUserName: string;
  currentUserId?: string;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
  currentPatient,
  userRole,
  currentUserName,
  currentUserId,
}) => {
  const { isTamil } = useLanguage();
  const [activeTab, setActiveTab] = useState<'BOOK' | 'UPCOMING' | 'HISTORY' | 'SCHEDULE'>('BOOK');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('DOC-001');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [visitReason, setVisitReason] = useState<string>('Longitudinal clinical follow-up & report review');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Reschedule & Modal States
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>('');
  const [newRescheduleSlot, setNewRescheduleSlot] = useState<string>('');
  const [rescheduleSlots, setRescheduleSlots] = useState<TimeSlotItem[]>([]);

  // Admin Propose Alternative State
  const [proposingApt, setProposingApt] = useState<Appointment | null>(null);
  const [proposedDate, setProposedDate] = useState<string>('');
  const [proposedSlot, setProposedSlot] = useState<string>('');

  // Doctor Availability Settings State
  const [docWorkingDays, setDocWorkingDays] = useState<string[]>([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ]);
  const [docStartTime, setDocStartTime] = useState('09:00 AM');
  const [docEndTime, setDocEndTime] = useState('05:00 PM');
  const [docSlotDuration, setDocSlotDuration] = useState(30);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Notification Alerts
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const docList = await fetchDoctors('ACTIVE');
      setDoctors(docList || []);
      if (docList && docList.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docList[0].doctor_id);
      }

      if (userRole === 'ADMIN') {
        const allApts = await fetchAllAppointments();
        setAppointments(allApts || []);
      } else if (currentPatient) {
        const patApts = await fetchPatientAppointments(currentPatient.patientId);
        setAppointments(patApts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPatient, userRole]);

  // Fetch slots whenever selected doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const slots = await fetchAvailableSlots(selectedDoctorId, selectedDate);
        setAvailableSlots(slots || []);
        // Select first available slot by default
        const firstAvail = (slots || []).find((s: any) => s.is_available);
        setSelectedSlotTime(firstAvail ? firstAvail.slot_time : '');
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) {
      setAlertError('Please select or register a patient profile first.');
      return;
    }
    if (!selectedSlotTime) {
      setAlertError('Please select an available consultation time slot.');
      return;
    }

    const doc = doctors.find((d) => d.doctor_id === selectedDoctorId) || doctors[0];
    setBookingInProgress(true);
    setAlertError(null);
    try {
      const result = await bookAppointment({
        patient_id: currentPatient.patientId,
        patient_name: currentPatient.name,
        doctor_id: selectedDoctorId,
        doctor_name: doc?.full_name ? `Dr. ${doc.full_name}` : 'Dr. Arvind Kumar',
        department: doc?.specialization || doc?.department || 'General Medicine',
        appointment_date: selectedDate,
        slot_time: selectedSlotTime,
        reason: visitReason,
      });

      setAlertSuccess(
        isTamil
          ? `முன்பதிவு உறுதி செய்யப்பட்டது! எண்: ${result.appointment_id}`
          : `Appointment successfully confirmed! Booking Ref: ${result.appointment_id}`
      );
      setTimeout(() => setAlertSuccess(null), 5000);
      setActiveTab('UPCOMING');
      loadData();
    } catch (err: any) {
      setAlertError(err.message || 'Failed to book appointment slot.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellingApt) return;
    try {
      await cancelAppointment(cancellingApt.appointmentId, cancelReason);
      setAlertSuccess(
        isTamil
          ? `முன்பதிவு ${cancellingApt.appointmentId} ரத்து செய்யப்பட்டது.`
          : `Appointment ${cancellingApt.appointmentId} has been cancelled.`
      );
      setCancellingApt(null);
      setCancelReason('');
      setTimeout(() => setAlertSuccess(null), 4000);
      loadData();
    } catch (e: any) {
      setAlertError(e.message || 'Cancellation failed.');
    }
  };

  const handleReschedule = async () => {
    if (!reschedulingApt || !newRescheduleDate || !newRescheduleSlot) {
      setAlertError('Please select both a new date and time slot.');
      return;
    }
    try {
      await rescheduleAppointment(reschedulingApt.appointmentId, newRescheduleDate, newRescheduleSlot);
      setAlertSuccess(
        isTamil
          ? `முன்பதிவு ${newRescheduleDate} அன்று ${newRescheduleSlot} நேரத்திற்கு மாற்றப்பட்டது!`
          : `Appointment rescheduled to ${newRescheduleDate} at ${newRescheduleSlot}!`
      );
      setReschedulingApt(null);
      setTimeout(() => setAlertSuccess(null), 4000);
      loadData();
    } catch (e: any) {
      setAlertError(e.message || 'Reschedule failed.');
    }
  };

  const handleProposeAlternative = async () => {
    if (!proposingApt || !proposedDate || !proposedSlot) return;
    try {
      await proposeAppointmentAlternative(proposingApt.appointmentId, proposedDate, proposedSlot);
      setAlertSuccess(`Alternative proposal sent to patient for appointment ${proposingApt.appointmentId}.`);
      setProposingApt(null);
      setTimeout(() => setAlertSuccess(null), 4000);
      loadData();
    } catch (e: any) {
      setAlertError(e.message || 'Proposal failed.');
    }
  };

  const handleRespondAlternative = async (aptId: string, accept: boolean) => {
    try {
      await respondAppointmentAlternative(aptId, accept);
      setAlertSuccess(accept ? 'Alternative consultation slot accepted and confirmed!' : 'Alternative slot declined.');
      setTimeout(() => setAlertSuccess(null), 4000);
      loadData();
    } catch (e: any) {
      setAlertError(e.message || 'Failed to submit response.');
    }
  };

  const handleSaveDoctorSchedule = async () => {
    setSavingSchedule(true);
    try {
      await updateDoctorAvailability(selectedDoctorId || 'DOC-001', {
        working_days: docWorkingDays,
        start_time: docStartTime,
        end_time: docEndTime,
        slot_duration_mins: docSlotDuration,
      });
      setAlertSuccess('Doctor availability schedule updated and published.');
      setTimeout(() => setAlertSuccess(null), 4000);
    } catch (e: any) {
      setAlertError(e.message || 'Failed to update schedule.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const upcomingApts = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'PROPOSED');
  const historyApts = appointments.filter((a) => a.status === 'CANCELLED' || a.status === 'COMPLETED');

  const selectedDoctor = doctors.find((d) => d.doctor_id === selectedDoctorId) || doctors[0];

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <CalendarCheck className="w-4 h-4" />
            <span>{isTamil ? 'மருத்துவ முன்பதிவு சேவை' : 'Clinical Consultation Scheduling'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isTamil ? 'மருத்துவர் சந்திப்பு முன்பதிவு' : 'Patient Appointment Booking'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isTamil
              ? 'மருத்துவர் நேரம், நிகழ்நேர இடங்கள் மற்றும் கால அட்டவணையை நிர்வகிக்கவும்'
              : 'Discover physicians, select guaranteed time slots, and manage longitudinal clinical reviews'}
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{isTamil ? 'புதுப்பி' : 'Refresh'}</span>
        </button>
      </div>

      {/* Alert Notifications */}
      {alertSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{alertSuccess}</span>
        </div>
      )}
      {alertError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{alertError}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold w-fit">
        <button
          onClick={() => setActiveTab('BOOK')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'BOOK'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isTamil ? 'புதிய முன்பதிவு' : 'Book Consultation'}</span>
        </button>

        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'UPCOMING'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isTamil ? 'வரவிருக்கும் சந்திப்புகள்' : 'Upcoming Bookings'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {upcomingApts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'HISTORY'
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isTamil ? 'முந்தைய வரலாறு' : 'Booking History'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {historyApts.length}
          </span>
        </button>

        {(userRole === 'ADMIN' || userRole === 'DOCTOR') && (
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'SCHEDULE'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{isTamil ? 'மருத்துவர் கிடைக்கும் நேரம்' : 'Availability Settings'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: BOOK NEW APPOINTMENT */}
      {activeTab === 'BOOK' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleBook} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-brand-600" />
                <span>{isTamil ? 'மருத்துவர் மற்றும் நேரத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Clinician & Consultation Slot'}</span>
              </h2>

              {/* Step 1: Physician Discovery */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  1. {isTamil ? 'மருத்துவரைத் தேர்வு செய்க' : 'Select Attending Physician'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctors.map((doc) => (
                    <button
                      key={doc.doctor_id}
                      type="button"
                      onClick={() => setSelectedDoctorId(doc.doctor_id)}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                        selectedDoctorId === doc.doctor_id
                          ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-600 flex items-center justify-center font-bold text-xs">
                        Dr
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Dr. {doc.full_name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {doc.specialization || 'Cardiology'}
                        </p>
                        <p className="text-[10px] text-brand-600 dark:text-brand-400 font-mono">
                          {doc.department || 'Medicine'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Date Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    2. {isTamil ? 'சந்திப்பு தேதி' : 'Consultation Date'}
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isTamil ? 'நோயாளி விவரம்' : 'Patient Profile'}
                  </label>
                  <div className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <p className="font-bold">{currentPatient?.name || 'S. Gurumurthy'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {currentPatient?.patientId || 'PT-E77688'}</p>
                  </div>
                </div>
              </div>

              {/* Step 3: Guaranteed Time Slots Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    3. {isTamil ? 'நேர இடைவெளியைத் தேர்ந்தெடுக்கவும்' : 'Available Guaranteed Time Slots'}
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {availableSlots.filter((s) => s.is_available).length} slots open
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="py-6 flex items-center justify-center text-xs text-slate-500 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                    <span>Loading available clinician slots...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-800 dark:text-amber-300">
                    Doctor is not taking appointments on this date. Please choose another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={!slot.is_available}
                        onClick={() => setSelectedSlotTime(slot.slot_time)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition text-center border ${
                          !slot.is_available
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200/60 line-through cursor-not-allowed'
                            : selectedSlotTime === slot.slot_time
                            ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/30 ring-2 ring-brand-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-500'
                        }`}
                      >
                        {slot.slot_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 4: Reason for Visit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  4. {isTamil ? 'சந்திப்பிற்கான காரணம் / அறிகுறிகள்' : 'Clinical Reason / Symptoms for Visit'}
                </label>
                <input
                  type="text"
                  required
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="e.g. 6-month lipid profile trajectory review & blood pressure check"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={bookingInProgress || !selectedSlotTime}
                  className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-brand-600/20 transition flex items-center justify-center gap-2"
                >
                  {bookingInProgress && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{bookingInProgress ? 'Reserving Guaranteed Slot...' : 'Confirm & Reserve Appointment'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Column 3: Summary Sidebar */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-brand-600 to-indigo-700 text-white p-6 rounded-3xl shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-100 uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>Verified Booking Policy</span>
              </div>
              <h3 className="text-base font-bold">Hospital-Grade Concurrency Protection</h3>
              <p className="text-xs text-brand-100/90 leading-relaxed">
                Slots are locked atomically in the database to prevent duplicate scheduling. You will receive an instant verified appointment identifier.
              </p>
              <div className="pt-2 border-t border-white/20 text-xs space-y-1.5">
                <p>• <b>Free Cancellation:</b> Up to 2 hours prior</p>
                <p>• <b>Report Access:</b> Attending doctor receives AI longitudinal telemetry automatically</p>
              </div>
            </div>

            {/* Selected Doctor Summary Card */}
            {selectedDoctor && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs space-y-2">
                <p className="text-[10px] font-bold uppercase text-slate-400">Selected Physician</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Dr. {selectedDoctor.full_name}</p>
                <p className="text-slate-500">{selectedDoctor.specialization}</p>
                <p className="text-slate-500">{selectedDoctor.department}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <p>Contact: {selectedDoctor.phone || '+91 98401 11223'}</p>
                  <p>Email: {selectedDoctor.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: UPCOMING APPOINTMENTS */}
      {activeTab === 'UPCOMING' && (
        <div className="space-y-4">
          {upcomingApts.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={isTamil ? 'வரவிருக்கும் சந்திப்புகள் எதுவும் இல்லை' : 'No Upcoming Appointments'}
              description={isTamil ? 'புதிய மருத்துவ ஆலோசனையை முன்பதிவு செய்ய மேலே உள்ள தாவலைப் பயன்படுத்தவும்.' : 'You have no active confirmed consultations. Click Book Consultation to schedule a visit.'}
              actionText="Book New Appointment"
              onAction={() => setActiveTab('BOOK')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingApts.map((apt) => (
                <div
                  key={apt.appointmentId}
                  className={`p-5 rounded-3xl border transition shadow-sm space-y-4 bg-white dark:bg-slate-900 ${
                    apt.status === 'PROPOSED'
                      ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-full">
                        {apt.appointmentId}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {apt.doctorName}
                      </h3>
                      <p className="text-xs text-slate-500">{apt.department}</p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      apt.status === 'PROPOSED'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {apt.status}
                    </span>
                  </div>

                  {/* Date & Time Badge */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Date</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{apt.appointmentDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Time Slot</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{apt.slotTime}</p>
                    </div>
                  </div>

                  {apt.reason && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{apt.reason}"
                    </p>
                  )}

                  {/* Proposed Alternative Alert Banner */}
                  {apt.status === 'PROPOSED' && apt.proposedNewDate && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Doctor Requested Alternative Slot:</span>
                      </p>
                      <p>Proposed: <b>{apt.proposedNewDate}</b> at <b>{apt.proposedNewSlot}</b></p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleRespondAlternative(apt.appointmentId, true)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[11px]"
                        >
                          Accept New Slot
                        </button>
                        <button
                          onClick={() => handleRespondAlternative(apt.appointmentId, false)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px]"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setReschedulingApt(apt);
                        setNewRescheduleDate(apt.appointmentDate);
                      }}
                      className="px-3 py-1.5 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => setCancellingApt(apt)}
                      className="px-3 py-1.5 text-xs text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl"
                    >
                      Cancel
                    </button>
                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setProposingApt(apt);
                          setProposedDate(apt.appointmentDate);
                        }}
                        className="px-3 py-1.5 text-xs text-amber-600 font-semibold hover:bg-amber-50 rounded-xl"
                      >
                        Propose Alt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BOOKING HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          {historyApts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No historical or cancelled appointments recorded.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200/80 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {historyApts.map((a) => (
                  <tr key={a.appointmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{a.appointmentId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.doctorName}</td>
                    <td className="py-3 px-4">{a.department}</td>
                    <td className="py-3 px-4">{a.appointmentDate} • {a.slotTime}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 italic text-slate-500 truncate max-w-xs">{a.reason || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 4: DOCTOR AVAILABILITY & WORKING HOURS */}
      {activeTab === 'SCHEDULE' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-2xl space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-purple-600" />
            <span>Doctor Practice Hours & Telemetry Configuration</span>
          </h2>

          <div className="space-y-4 text-xs">
            {/* Working Days */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Active Consultation Days
              </label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const isChecked = docWorkingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setDocWorkingDays(docWorkingDays.filter((d) => d !== day));
                        } else {
                          setDocWorkingDays([...docWorkingDays, day]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                        isChecked
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shift Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Consultation Hour
                </label>
                <input
                  type="text"
                  value={docStartTime}
                  onChange={(e) => setDocStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  End Consultation Hour
                </label>
                <input
                  type="text"
                  value={docEndTime}
                  onChange={(e) => setDocEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <button
              onClick={handleSaveDoctorSchedule}
              disabled={savingSchedule}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition"
            >
              {savingSchedule ? 'Publishing Schedule...' : 'Save Availability Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancellingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-red-200 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cancel Appointment {cancellingApt.appointmentId}?
            </h3>
            <p className="text-xs text-slate-500">
              The reserved time slot ({cancellingApt.slotTime} on {cancellingApt.appointmentDate}) will be released for other patients.
            </p>
            <input
              type="text"
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellingApt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
