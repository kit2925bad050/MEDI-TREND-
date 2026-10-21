import React, { useState, useEffect } from 'react';
import {
  PatientProfile,
  WoundAssessmentRecord,
  WoundComparisonResult,
  WoundVisitRecord,
  WoundVisitPhoto,
  WoundVisitComparisonResult,
} from '../types';
import {
  fetchPatientWoundAssessments,
  compareWoundAssessments,
  updateWoundDoctorNotes,
  deleteWoundAssessment,
  getWoundImageUrl,
  fetchPatientWoundVisits,
  analyzeWoundVisit,
  deleteWoundVisitPhoto,
  deleteWoundVisit,
  compareWoundVisits,
} from '../services/api';
import { WoundUploadModal } from '../components/wound/WoundUploadModal';
import { WoundComparisonViewer } from '../components/wound/WoundComparisonViewer';
import { WoundReportCorrelationCard } from '../components/wound/WoundReportCorrelationCard';
import { ExportWoundReportModal } from '../components/wound/ExportWoundReportModal';
import { WoundLanguageSelector } from '../components/wound/WoundLanguageSelector';
import { WoundDualBlock, WoundDualList } from '../components/wound/WoundDualBlock';
import { MonthlyVisitUploadModal } from '../components/wound/MonthlyVisitUploadModal';
import { MonthlyVisitComparisonModal } from '../components/wound/MonthlyVisitComparisonModal';
import {
  WoundLanguageMode,
  WOUND_LANG_STORAGE_KEY,
  translateWoundMedicalText,
} from '../utils/woundTranslation';
import { useLanguage } from '../context/LanguageContext';
import { EmptyState } from '../components/common/EmptyState';
import {
  Upload,
  Layers,
  Sparkles,
  AlertTriangle,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileDown,
  Info,
  ChevronRight,
  TrendingUp,
  Activity,
  FileText,
  AlertCircle,
  RotateCw,
  Trash2,
  Save,
  Check,
  Eye,
  Plus,
  Play,
  ChevronLeft,
  Image as ImageIcon,
} from 'lucide-react';

interface WoundAssessmentPageProps {
  currentPatient: PatientProfile | null;
  onOpenCreatePatient: () => void;
}

export const WoundAssessmentPage: React.FC<WoundAssessmentPageProps> = ({
  currentPatient,
  onOpenCreatePatient,
}) => {
  const { isTamil } = useLanguage();

  // Exclusive Wound Assessment language preference (en / ta / both)
  const [woundLang, setWoundLang] = useState<WoundLanguageMode>(() => {
    try {
      const saved = localStorage.getItem(WOUND_LANG_STORAGE_KEY);
      if (saved === 'en' || saved === 'ta' || saved === 'both') {
        return saved;
      }
    } catch {}
    return 'en';
  });

  const handleWoundLangChange = (mode: WoundLanguageMode) => {
    setWoundLang(mode);
    try {
      localStorage.setItem(WOUND_LANG_STORAGE_KEY, mode);
    } catch {}
  };

  // Active view tab: 'monthly_visits' (Primary) or 'single_quick' (Legacy)
  const [activeTab, setActiveTab] = useState<'monthly_visits' | 'single_quick'>('monthly_visits');

  // ==================== Monthly Visit Tracking State ====================
  const [visits, setVisits] = useState<WoundVisitRecord[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [selectedVisitIdsForCompare, setSelectedVisitIdsForCompare] = useState<string[]>([]);
  const [visitComparison, setVisitComparison] = useState<WoundVisitComparisonResult | null>(null);
  const [isMonthlyUploadOpen, setIsMonthlyUploadOpen] = useState(false);
  const [isMonthlyCompareOpen, setIsMonthlyCompareOpen] = useState(false);
  const [editingVisitForUpload, setEditingVisitForUpload] = useState<WoundVisitRecord | null>(null);
  const [isAnalyzingVisitId, setIsAnalyzingVisitId] = useState<string | null>(null);
  const [isComparingVisits, setIsComparingVisits] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // ==================== Legacy Single Assessment State ====================
  const [assessments, setAssessments] = useState<WoundAssessmentRecord[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<WoundComparisonResult | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals for legacy
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Doctor note editing state
  const [editingNotes, setEditingNotes] = useState('');
  const [editingStatus, setEditingStatus] = useState('VALIDATED');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  // Load monthly visits
  const loadVisits = async (patientId: string) => {
    try {
      const data = await fetchPatientWoundVisits(patientId);
      setVisits(data);
      if (data.length > 0) {
        setSelectedVisitId((prev) =>
          prev && data.some((v) => v.visit_id === prev) ? prev : data[data.length - 1].visit_id
        );
        // Pre-select latest two analyzed visits for comparison if available
        const analyzed = data.filter((v) => v.status === 'ANALYZED');
        if (analyzed.length >= 2) {
          setSelectedVisitIdsForCompare([analyzed[0].visit_id, analyzed[analyzed.length - 1].visit_id]);
        }
      } else {
        setSelectedVisitId(null);
      }
    } catch (err: any) {
      console.error('Failed to load visits:', err);
    }
  };

  // Load legacy assessments
  const loadAssessments = async (patientId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setComparisonResult(null);
    setSelectedForCompare([]);
    try {
      const data = await fetchPatientWoundAssessments(patientId);
      setAssessments(data);
      if (data.length > 0) {
        setSelectedAssessmentId(data[data.length - 1].assessment_id);
        if (data.length >= 2) {
          const ids = [data[0].assessment_id, data[data.length - 1].assessment_id];
          setSelectedForCompare(ids);
          runComparison(patientId, ids);
        }
      } else {
        setSelectedAssessmentId(null);
      }
    } catch (err: any) {
      console.error('Failed to load wound assessments:', err);
      setErrorMsg(err.message || 'Failed to load wound assessments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentPatient) {
      loadVisits(currentPatient.patientId);
      loadAssessments(currentPatient.patientId);
    } else {
      setVisits([]);
      setAssessments([]);
      setSelectedVisitId(null);
      setSelectedAssessmentId(null);
      setComparisonResult(null);
      setVisitComparison(null);
    }
  }, [currentPatient?.patientId]);

  const selectedAssessment = assessments.find(
    (a) => a.assessment_id === selectedAssessmentId
  );

  const selectedVisit = visits.find((v) => v.visit_id === selectedVisitId);

  useEffect(() => {
    setActivePhotoIdx(0);
  }, [selectedVisitId]);

  useEffect(() => {
    if (selectedAssessment) {
      setEditingNotes(selectedAssessment.doctor_notes || '');
      setEditingStatus(selectedAssessment.review_status || 'VALIDATED');
    }
  }, [selectedAssessment?.assessment_id]);

  // Legacy comparison
  const runComparison = async (patientId: string, assessmentIds: string[]) => {
    if (assessmentIds.length < 2) {
      setComparisonResult(null);
      return;
    }
    setIsComparing(true);
    try {
      const comp = await compareWoundAssessments(patientId, assessmentIds);
      setComparisonResult(comp);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setErrorMsg(err.message || 'Comparison failed.');
    } finally {
      setIsComparing(false);
    }
  };

  const handleToggleCompareSelect = (id: string) => {
    if (!currentPatient) return;
    let next: string[];
    if (selectedForCompare.includes(id)) {
      next = selectedForCompare.filter((item) => item !== id);
    } else {
      next = [...selectedForCompare, id];
    }
    setSelectedForCompare(next);
    if (next.length >= 2) {
      runComparison(currentPatient.patientId, next);
    } else {
      setComparisonResult(null);
    }
  };

  const handleSaveDoctorNotes = async () => {
    if (!currentPatient || !selectedAssessment) return;
    setIsSavingNotes(true);
    setNotesSaveSuccess(false);
    try {
      const updated = await updateWoundDoctorNotes(
        currentPatient.patientId,
        selectedAssessment.assessment_id,
        editingNotes,
        editingStatus
      );
      setAssessments((prev) =>
        prev.map((a) => (a.assessment_id === updated.assessment_id ? updated : a))
      );
      setNotesSaveSuccess(true);
      setTimeout(() => setNotesSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to save doctor notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!currentPatient) return;
    if (
      !window.confirm(
        isTamil
          ? 'இந்த புண் மதிப்பாய்வை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?'
          : 'Are you sure you want to permanently delete this wound assessment record?'
      )
    ) {
      return;
    }

    try {
      await deleteWoundAssessment(currentPatient.patientId, assessmentId);
      const remaining = assessments.filter((a) => a.assessment_id !== assessmentId);
      setAssessments(remaining);
      if (selectedAssessmentId === assessmentId) {
        setSelectedAssessmentId(remaining.length > 0 ? remaining[remaining.length - 1].assessment_id : null);
      }
      setSelectedForCompare((prev) => prev.filter((id) => id !== assessmentId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete assessment.');
    }
  };

  // ==================== Monthly Visit Action Handlers ====================

  const handleAnalyzeVisit = async (visitId: string) => {
    if (!currentPatient) return;
    setIsAnalyzingVisitId(visitId);
    try {
      const updated = await analyzeWoundVisit(currentPatient.patientId, visitId);
      setVisits((prev) => prev.map((v) => (v.visit_id === visitId ? updated : v)));
      setSelectedVisitId(visitId);
    } catch (err: any) {
      alert(err.message || 'Analysis failed. Please check the uploaded images and retry.');
    } finally {
      setIsAnalyzingVisitId(null);
    }
  };

  const handleDeleteVisitPhoto = async (visitId: string, photoId: string) => {
    if (!currentPatient) return;
    if (
      !window.confirm(
        isTamil
          ? 'இந்த புகைப்படத்தை வருகையிலிருந்து நீக்க விரும்புகிறீர்களா?'
          : 'Are you sure you want to remove this photo from the visit?'
      )
    ) {
      return;
    }

    try {
      const updated = await deleteWoundVisitPhoto(currentPatient.patientId, visitId, photoId);
      setVisits((prev) => prev.map((v) => (v.visit_id === visitId ? updated : v)));
    } catch (err: any) {
      alert(err.message || 'Failed to delete photo.');
    }
  };

  const handleToggleVisitCompare = (visitId: string) => {
    setSelectedVisitIdsForCompare((prev) => {
      if (prev.includes(visitId)) {
        return prev.filter((id) => id !== visitId);
      }
      if (prev.length >= 2) {
        return [prev[1], visitId];
      }
      return [...prev, visitId];
    });
  };

  const handleRunVisitComparison = async () => {
    if (!currentPatient || selectedVisitIdsForCompare.length !== 2) return;
    setIsComparingVisits(true);
    try {
      const res = await compareWoundVisits(
        currentPatient.patientId,
        selectedVisitIdsForCompare[0],
        selectedVisitIdsForCompare[1]
      );
      setVisitComparison(res);
      setIsMonthlyCompareOpen(true);
    } catch (err: any) {
      alert(err.message || 'Comparison failed.');
    } finally {
      setIsComparingVisits(false);
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!currentPatient) return;
    if (
      !window.confirm(
        isTamil
          ? 'இந்த மாதாந்திர வருகை மற்றும் அதன் அனைத்து புகைப்படங்களையும் நீக்க விரும்புகிறீர்களா?'
          : 'Are you sure you want to delete this monthly visit and all its photos?'
      )
    ) {
      return;
    }

    try {
      await deleteWoundVisit(currentPatient.patientId, visitId);
      setVisits((prev) => prev.filter((v) => v.visit_id !== visitId));
      if (selectedVisitId === visitId) {
        const remaining = visits.filter((v) => v.visit_id !== visitId);
        setSelectedVisitId(remaining.length > 0 ? remaining[remaining.length - 1].visit_id : null);
      }
      setSelectedVisitIdsForCompare((prev) => prev.filter((id) => id !== visitId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete visit.');
    }
  };

  if (!currentPatient) {
    return (
      <div className="p-6">
        <EmptyState
          title={isTamil ? 'நோயாளி தேர்ந்தெடுக்கப்படவில்லை' : 'No Patient Selected'}
          description={
            isTamil
              ? 'புண் மற்றும் புண் முன்னேற்றத்தை கண்காணிக்க ஒரு நோயாளியை தேர்ந்தெடுக்கவும்.'
              : 'Select a patient or register a new one to begin monthly wound photo tracking and longitudinal monitoring.'
          }
          actionText={isTamil ? '+ புதிய நோயாளி' : '+ Register Patient'}
          onAction={onOpenCreatePatient}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>
                {isTamil
                  ? 'மாதாந்திர புண் புகைப்பட கண்காணிப்பு & ஒப்பீடு'
                  : 'Monthly Wound Photo Tracking & Comparison'}
              </span>
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              Clinical Vision
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isTamil
              ? 'மாதாந்திர வருகை புகைப்பட தொகுப்பு (1–10 படங்கள்), காத்திருப்பு ஆய்வு மற்றும் பக்கவாட்டு ஒப்பீடு'
              : 'Patient-wise monthly visit photo management (1–10 photos), explicit on-demand analysis, and month-over-month visual delta comparison'}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-300">
            <span>{isTamil ? 'நோயாளி:' : 'Patient:'} <b>{currentPatient.name}</b></span>
            <span>•</span>
            <span className="font-mono text-slate-500">{currentPatient.patientId}</span>
            <span>•</span>
            <span>{currentPatient.age} Y / {currentPatient.gender}</span>
            <span>•</span>
            <span>{isTamil ? 'மாதாந்திர வருகைகள்:' : 'Monthly Visits:'} <b className="font-mono">{visits.length}</b></span>
          </div>
        </div>

        {/* Top Action Buttons & Wound Language Selector */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <WoundLanguageSelector
            value={woundLang}
            onChange={handleWoundLangChange}
          />

          {/* New Monthly Visit Button */}
          <button
            onClick={() => {
              setEditingVisitForUpload(null);
              setIsMonthlyUploadOpen(true);
            }}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>
              {woundLang === 'ta'
                ? '+ புதிய மாதாந்திர வருகை'
                : woundLang === 'both'
                ? '+ New Monthly Visit / புதிய வருகை'
                : '+ New Monthly Visit'}
            </span>
          </button>

          {/* Compare Visits Trigger Button */}
          {selectedVisitIdsForCompare.length === 2 && (
            <button
              onClick={handleRunVisitComparison}
              disabled={isComparingVisits}
              className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 animate-pulse"
            >
              <TrendingUp className="w-4 h-4" />
              <span>
                {isComparingVisits
                  ? 'Comparing...'
                  : isTamil
                  ? 'தேர்ந்தெடுத்த 2 வருகைகளை ஒப்பிடு'
                  : 'Compare Selected 2 Visits'}
              </span>
            </button>
          )}

          {selectedAssessment && activeTab === 'single_quick' && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>{woundLang === 'ta' ? 'PDF ஏற்றுமதி' : 'Export PDF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('monthly_visits')}
          className={`px-4 py-2 text-xs font-bold rounded-t-2xl border-b-2 transition flex items-center gap-2 ${
            activeTab === 'monthly_visits'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isTamil ? 'மாதாந்திர வருகை கண்காணிப்பு & ஒப்பீடு' : 'Monthly Visits & Photo Tracking'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/60 font-mono">
            {visits.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('single_quick')}
          className={`px-4 py-2 text-xs font-bold rounded-t-2xl border-b-2 transition flex items-center gap-2 ${
            activeTab === 'single_quick'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isTamil ? 'ஒற்றைப் புகைப்பட விரைவு ஆய்வு' : 'Single Photo Assessment'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
            {assessments.length}
          </span>
        </button>
      </div>

      {/* Clinical Decision Support & Medical Safety Notice */}
      <div className="p-4 rounded-3xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs leading-relaxed flex-1">
          <div className="font-extrabold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-2">
            <span>
              {woundLang === 'ta'
                ? 'மருத்துவ முடிவெடுக்கும் ஆதரவு & பாதுகாப்பு அறிவிப்பு'
                : woundLang === 'both'
                ? 'Clinical Decision Support Notice / முடிவெடுக்கும் ஆதரவு'
                : 'Clinical Decision Support & Medical Safety Notice'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider">
              Decision Support Only
            </span>
          </div>
          <WoundDualBlock
            en="Wound image analysis is clinical decision support only. Do not diagnose definitively or determine surgery from an image alone. An in-person clinical examination, vascular assessment, and qualified physician judgment are strictly required."
            ta="புண் புகைப்பட பகுப்பாய்வு மருத்துவர்களுக்கான ஒரு முடிவெடுக்கும் ஆதரவு கருவி மட்டுமே. புகைப்படத்திலிருந்து மட்டுமே உறுதியான நோயறிதலோ அல்லது அறுவை சிகிச்சை தேவையா என்றோ தீர்மானிக்கக் கூடாது. நேரில் மருத்துவர் செய்யும் முழுமையான மருத்துவ பரிசோதனை கட்டாயமாகும்."
            mode={woundLang}
          />
        </div>
      </div>

      {/* ==================== TAB 1: MONTHLY VISITS & PHOTO TRACKING ==================== */}
      {activeTab === 'monthly_visits' && (
        <div className="space-y-6">
          {visits.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isTamil ? 'மாதாந்திர வருகைப் பதிவுகள் எதுவும் இல்லை' : 'No Monthly Wound Visits Recorded Yet'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  {isTamil
                    ? 'ஒரு வருகை மாதத்தைத் தேர்ந்தெடுத்து (எ.கா. அக்டோபர் 2026), 1 முதல் 10 புகைப்படங்களைப் பதிவேற்றவும். அவை பகுப்பாய்வு செய்யப்படும் வரை காத்திருப்பு நிலையில் இருக்கும்.'
                    : 'Create your first monthly visit (e.g. October 2026), upload 1 to 10 photos in a pending state, and click "Analyze Photos" when ready.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingVisitForUpload(null);
                  setIsMonthlyUploadOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isTamil ? 'முதல் மாதாந்திர வருகையைப் பதிவு செய்' : 'Create First Monthly Visit'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Chronological Monthly Timeline */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {isTamil ? 'மாதாந்திர வருகை காலவரிசை' : 'Monthly Visit Timeline'}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      {visits.length} {visits.length === 1 ? 'Month' : 'Months'}
                    </span>
                  </div>

                  {/* Compare instructions badge */}
                  <div className="text-[11px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>Select 2 analyzed visits to compare:</span>
                    <span className="font-bold text-rose-600 font-mono">
                      {selectedVisitIdsForCompare.length} / 2 selected
                    </span>
                  </div>

                  {/* Visit Cards List */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {visits.map((visit) => {
                      const isSelected = visit.visit_id === selectedVisitId;
                      const isAnalyzed = visit.status === 'ANALYZED';
                      const isPending = visit.status === 'PENDING';
                      const isCheckedForCompare = selectedVisitIdsForCompare.includes(visit.visit_id);

                      return (
                        <div
                          key={visit.visit_id}
                          onClick={() => setSelectedVisitId(visit.visit_id)}
                          className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 shadow-md ring-1 ring-rose-500/20'
                              : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Visit Top Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {/* Checkbox for Compare */}
                              {isAnalyzed && (
                                <input
                                  type="checkbox"
                                  checked={isCheckedForCompare}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleToggleVisitCompare(visit.visit_id);
                                  }}
                                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                                  title="Select for comparison"
                                />
                              )}
                              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                <span>{visit.visit_month}</span>
                              </h4>
                            </div>

                            {/* Status Pill */}
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isAnalyzed
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                                  : isPending
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200'
                              }`}
                            >
                              {visit.status}
                            </span>
                          </div>

                          {/* Meta details */}
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span className="font-mono">Date: {visit.visit_date}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {visit.wound_location}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                              📷 {visit.photo_count} photos
                            </span>
                          </div>

                          {/* Photo Thumbnails Strip */}
                          {visit.photos.length > 0 && (
                            <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1">
                              {visit.photos.map((p, pIdx) => (
                                <div
                                  key={p.photo_id}
                                  className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 group"
                                >
                                  <img
                                    src={p.image_url}
                                    alt={`Photo ${pIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {/* Delete photo button (always available, particularly before analysis) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteVisitPhoto(visit.visit_id, p.photo_id);
                                    }}
                                    className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/70 text-white opacity-0 group-hover:opacity-100 transition hover:bg-rose-600"
                                    title="Remove this photo"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Bar per Card */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <div className="flex items-center gap-2">
                              {/* Analyze Button if Pending */}
                              {isPending && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAnalyzeVisit(visit.visit_id);
                                  }}
                                  disabled={isAnalyzingVisitId === visit.visit_id || visit.photo_count < 1}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                                >
                                  {isAnalyzingVisitId === visit.visit_id ? (
                                    <>
                                      <RotateCw className="w-3 h-3 animate-spin" />
                                      <span>Analyzing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3 h-3" />
                                      <span>Analyze Photos ({visit.photo_count})</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Add More Photos */}
                              {visit.photo_count < 10 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingVisitForUpload(visit);
                                    setIsMonthlyUploadOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Photos</span>
                                </button>
                              )}
                            </div>

                            {/* Delete Visit */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVisit(visit.visit_id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="Delete visit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Visit Inspection & Findings */}
              <div className="lg:col-span-7 space-y-4">
                {selectedVisit ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                    {/* Selected Visit Header */}
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{selectedVisit.visit_month}</span>
                            <span className="text-slate-400 font-normal">({selectedVisit.visit_date})</span>
                          </h3>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              selectedVisit.status === 'ANALYZED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {selectedVisit.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Location: <b className="text-slate-700 dark:text-slate-300">{selectedVisit.wound_location}</b> • Tag:{' '}
                          <span className="font-semibold">{selectedVisit.wound_type_tag}</span> •{' '}
                          <span className="font-mono font-bold text-rose-600">{selectedVisit.photo_count} photos</span>
                        </p>
                      </div>

                      {selectedVisit.status === 'PENDING' && (
                        <button
                          onClick={() => handleAnalyzeVisit(selectedVisit.visit_id)}
                          disabled={isAnalyzingVisitId === selectedVisit.visit_id || selectedVisit.photo_count < 1}
                          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold text-xs shadow-md flex items-center gap-2 transition disabled:opacity-50"
                        >
                          {isAnalyzingVisitId === selectedVisit.visit_id ? (
                            <>
                              <RotateCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Analyze Photos Now</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Photo Viewer & Carousel */}
                    {selectedVisit.photos.length > 0 ? (
                      <div className="space-y-3">
                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                          <img
                            src={selectedVisit.photos[activePhotoIdx]?.image_url}
                            alt={`Photo ${activePhotoIdx + 1}`}
                            className="w-full h-full object-contain"
                          />
                          {selectedVisit.photos.length > 1 && (
                            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-white text-xs bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                              <button
                                onClick={() =>
                                  setActivePhotoIdx((prev) =>
                                    prev > 0 ? prev - 1 : selectedVisit.photos.length - 1
                                  )
                                }
                                className="p-1 hover:text-rose-400"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <span className="font-mono">
                                Photo {activePhotoIdx + 1} of {selectedVisit.photos.length}
                              </span>
                              <button
                                onClick={() =>
                                  setActivePhotoIdx((prev) =>
                                    prev < selectedVisit.photos.length - 1 ? prev + 1 : 0
                                  )
                                }
                                className="p-1 hover:text-rose-400"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Thumbnail selector */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {selectedVisit.photos.map((p, idx) => (
                            <button
                              key={p.photo_id}
                              onClick={() => setActivePhotoIdx(idx)}
                              className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${
                                activePhotoIdx === idx
                                  ? 'border-rose-500 scale-105'
                                  : 'border-transparent opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
                        No photos uploaded for this visit yet. Click "+ Add Photos" to upload images.
                      </div>
                    )}

                    {/* Pending State Banner */}
                    {selectedVisit.status === 'PENDING' && (
                      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                          <Info className="w-4 h-4" />
                          <span>Photos Stored in Pending State</span>
                        </div>
                        <p className="leading-relaxed">
                          This visit currently holds {selectedVisit.photo_count} photos. As requested, uploading photos does not automatically run analysis. Review your photos above, add more if necessary, and click <b>"Analyze Photos Now"</b> to trigger multi-photo evaluation.
                        </p>
                      </div>
                    )}

                    {/* Analyzed Results */}
                    {selectedVisit.status === 'ANALYZED' && selectedVisit.analysis_result && (
                      <div className="space-y-5 border-t border-slate-100 dark:border-slate-800 pt-5">
                        {/* Summary of findings */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                            <span>Visit Summary of Findings</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {selectedVisit.analysis_result.summary_of_findings ||
                              selectedVisit.analysis_result.visible_characteristics?.primary_bed_appearance}
                          </p>
                        </div>

                        {/* Tissue Breakdown */}
                        {selectedVisit.analysis_result.visible_characteristics?.tissue_breakdown && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Composite Tissue Composition Across Visit Photos:
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs">
                                <span className="text-[10px] text-slate-500 font-bold block">Granulation</span>
                                <span className="text-sm font-extrabold text-rose-600">
                                  {selectedVisit.analysis_result.visible_characteristics.tissue_breakdown.granulation_percent}%
                                </span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
                                <span className="text-[10px] text-slate-500 font-bold block">Slough</span>
                                <span className="text-sm font-extrabold text-amber-600">
                                  {selectedVisit.analysis_result.visible_characteristics.tissue_breakdown.slough_percent}%
                                </span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                                <span className="text-[10px] text-slate-500 font-bold block">Necrotic</span>
                                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                  {selectedVisit.analysis_result.visible_characteristics.tissue_breakdown.necrotic_percent}%
                                </span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900 text-xs">
                                <span className="text-[10px] text-slate-500 font-bold block">Epithelial</span>
                                <span className="text-sm font-extrabold text-pink-600">
                                  {selectedVisit.analysis_result.visible_characteristics.tissue_breakdown.epithelial_percent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Image Quality Warnings */}
                        {selectedVisit.analysis_result.image_quality_warnings &&
                          selectedVisit.analysis_result.image_quality_warnings.length > 0 && (
                            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                              <div className="font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Image Quality & Calibration Warnings</span>
                              </div>
                              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                                {selectedVisit.analysis_result.image_quality_warnings.map((w: string, i: number) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {/* Warning signs */}
                        {selectedVisit.analysis_result.warning_signs && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Clinical Warning Signs to Monitor:</span>
                            </span>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-4 list-disc">
                              {selectedVisit.analysis_result.warning_signs.map((sign: string, idx: number) => (
                                <li key={idx}>{sign}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
                    Select a visit from the timeline on the left to view details and photos.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: SINGLE IMAGE QUICK ASSESSMENT (PRESERVED) ==================== */}
      {activeTab === 'single_quick' && (
        <div className="space-y-6">
          {assessments.length === 0 && !isLoading && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isTamil ? 'புண் பதிவுகள் எதுவும் இல்லை' : 'No Single Wound Records Recorded Yet'}
                </h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Single Wound Image</span>
              </button>
            </div>
          )}

          {assessments.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Timeline */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {isTamil ? 'புண் வரலாற்றுப் பட்டியல்' : 'Wound Assessment History'}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {assessments.length} records
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {assessments.map((a) => {
                      const isSelected = a.assessment_id === selectedAssessmentId;
                      const isCompared = selectedForCompare.includes(a.assessment_id);
                      const imgUrl = getWoundImageUrl(a.image_filename);
                      const gran = a.visible_characteristics?.tissue_breakdown?.granulation_percent ?? 50;

                      return (
                        <div
                          key={a.assessment_id}
                          onClick={() => setSelectedAssessmentId(a.assessment_id)}
                          className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 shadow-sm'
                              : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                              {imgUrl && (
                                <img src={imgUrl} alt="Wound thumb" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                                {a.wound_location}
                              </span>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                <span>{a.visit_date}</span>
                                <span>•</span>
                                <span className="text-emerald-600 font-bold">Gran: {gran}%</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCompareSelect(a.assessment_id);
                            }}
                            className={`p-1.5 rounded-lg border text-xs transition ${
                              isCompared
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                            }`}
                            title="Toggle comparison"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Details */}
              <div className="lg:col-span-8 space-y-4">
                {selectedAssessment && (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {selectedAssessment.wound_location}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                          Date: {selectedAssessment.visit_date} • Tag: {selectedAssessment.wound_type_tag}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAssessment(selectedAssessment.assessment_id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete assessment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                      <img
                        src={getWoundImageUrl(selectedAssessment.image_filename)}
                        alt="Selected assessment"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Primary bed appearance */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white">Primary Bed Appearance:</div>
                      <p className="text-slate-700 dark:text-slate-300">
                        {selectedAssessment.visible_characteristics?.primary_bed_appearance}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== GLOBAL MODALS ==================== */}

      {/* Monthly Visit Multi-Photo Upload Modal */}
      {isMonthlyUploadOpen && (
        <MonthlyVisitUploadModal
          patient={currentPatient}
          isOpen={isMonthlyUploadOpen}
          existingVisit={editingVisitForUpload}
          onClose={() => {
            setIsMonthlyUploadOpen(false);
            setEditingVisitForUpload(null);
          }}
          onSuccess={(newVisit) => {
            setVisits((prev) => {
              const idx = prev.findIndex((v) => v.visit_id === newVisit.visit_id);
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = newVisit;
                return copy;
              }
              return [...prev, newVisit];
            });
            setSelectedVisitId(newVisit.visit_id);
          }}
        />
      )}

      {/* Monthly Visit Comparison Modal (Side-by-Side) */}
      {isMonthlyCompareOpen && visitComparison && (
        <MonthlyVisitComparisonModal
          comparison={visitComparison}
          isOpen={isMonthlyCompareOpen}
          onClose={() => setIsMonthlyCompareOpen(false)}
          woundLang={woundLang}
        />
      )}

      {/* Legacy Upload Modal */}
      {isUploadOpen && (
        <WoundUploadModal
          patient={currentPatient}
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={(newAssessment) => {
            setAssessments((prev) => [...prev, newAssessment]);
            setSelectedAssessmentId(newAssessment.assessment_id);
          }}
        />
      )}

      {/* Export Report Modal */}
      {isExportOpen && selectedAssessment && (
        <ExportWoundReportModal
          patient={currentPatient}
          assessment={selectedAssessment}
          comparison={comparisonResult}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          mode={woundLang}
        />
      )}
    </div>
  );
};
