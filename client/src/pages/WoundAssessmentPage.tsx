import React, { useState, useEffect } from 'react';
import {
  PatientProfile,
  WoundAssessmentRecord,
  WoundComparisonResult,
} from '../types';
import {
  fetchPatientWoundAssessments,
  compareWoundAssessments,
  updateWoundDoctorNotes,
  deleteWoundAssessment,
  getWoundImageUrl,
} from '../services/api';
import { WoundUploadModal } from '../components/wound/WoundUploadModal';
import { WoundComparisonViewer } from '../components/wound/WoundComparisonViewer';
import { WoundReportCorrelationCard } from '../components/wound/WoundReportCorrelationCard';
import { ExportWoundReportModal } from '../components/wound/ExportWoundReportModal';
import { WoundLanguageSelector } from '../components/wound/WoundLanguageSelector';
import { WoundDualBlock, WoundDualList } from '../components/wound/WoundDualBlock';
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

  const [assessments, setAssessments] = useState<WoundAssessmentRecord[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<WoundComparisonResult | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Doctor note editing state
  const [editingNotes, setEditingNotes] = useState('');
  const [editingStatus, setEditingStatus] = useState('VALIDATED');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  // Load assessments when patient changes
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
        // Pre-select latest two for comparison if available
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
      loadAssessments(currentPatient.patientId);
    } else {
      setAssessments([]);
      setSelectedAssessmentId(null);
      setComparisonResult(null);
    }
  }, [currentPatient?.patientId]);

  const selectedAssessment = assessments.find(
    (a) => a.assessment_id === selectedAssessmentId
  );

  useEffect(() => {
    if (selectedAssessment) {
      setEditingNotes(selectedAssessment.doctor_notes || '');
      setEditingStatus(selectedAssessment.review_status || 'VALIDATED');
    }
  }, [selectedAssessment?.assessment_id]);

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

  if (!currentPatient) {
    return (
      <div className="p-6">
        <EmptyState
          title={isTamil ? 'நோயாளி தேர்ந்தெடுக்கப்படவில்லை' : 'No Patient Selected'}
          description={
            isTamil
              ? 'புண் மற்றும் புண் முன்னேற்றத்தை கண்காணிக்க ஒரு நோயாளியை தேர்ந்தெடுக்கவும்.'
              : 'Select a patient or register a new one to begin AI-assisted wound and ulcer monitoring.'
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
                  ? 'AI புண் & புண் மதிப்பாய்வு மற்றும் முன்னேற்ற கண்காணிப்பு'
                  : 'AI Wound & Ulcer Assessment and Progress Monitoring'}
              </span>
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              Clinical Vision
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isTamil
              ? 'காலின் புண்கள், சர்க்கரை நோய் பாத புண்கள், அறுவை சிகிச்சை காயங்கள் மற்றும் அழுத்தப் புண்களுக்கான AI ஆய்வு'
              : 'Multi-visit photographic analysis, tissue composition breakdown, warning sign surveillance, and lab correlation'}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-300">
            <span>{isTamil ? 'நோயாளி:' : 'Patient:'} <b>{currentPatient.name}</b></span>
            <span>•</span>
            <span className="font-mono text-slate-500">{currentPatient.patientId}</span>
            <span>•</span>
            <span>{currentPatient.age} Y / {currentPatient.gender}</span>
            <span>•</span>
            <span>{isTamil ? 'பதிவான புண்கள்:' : 'Wound Records:'} <b className="font-mono">{assessments.length}</b></span>
          </div>
        </div>

        {/* Top Action Buttons & Wound Language Selector */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Wound Assessment Exclusive Language Selector */}
          <WoundLanguageSelector
            value={woundLang}
            onChange={handleWoundLangChange}
          />

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{woundLang === 'ta' ? 'புண் படம் பதிவேற்று' : woundLang === 'both' ? 'Upload Image / படம் பதிவேற்று' : 'Upload Wound Image'}</span>
          </button>
          {selectedAssessment && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>{woundLang === 'ta' ? 'PDF ஏற்றுமதி' : woundLang === 'both' ? 'Export PDF / PDF ஏற்றுமதி' : 'Export PDF'}</span>
            </button>
          )}
        </div>
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
            en="Wound image analysis is decision support only. Do not diagnose definitively or determine whether surgery is required from an image alone. An in-person clinical examination, probe-to-bone test, vascular Doppler study, and qualified physician judgment are strictly required."
            ta="புண் புகைப்பட பகுப்பாய்வு மருத்துவர்களுக்கான ஒரு முடிவெடுக்கும் ஆதரவு கருவி மட்டுமே. புகைப்படத்திலிருந்து மட்டுமே உறுதியான நோயறிதலோ அல்லது அறுவை சிகிச்சை தேவையா என்றோ தீர்மானிக்கக் கூடாது. நேரில் மருத்துவர் செய்யும் முழுமையான மருத்துவ பரிசோதனை, இரத்த ஓட்ட ஆய்வு மற்றும் தகுதிவாய்ந்த மருத்துவரின் நேரடி முடிவே கட்டாயமாகும்."
            mode={woundLang}
          />
        </div>
      </div>

      {/* Main Content: If no assessments exist */}
      {assessments.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isTamil ? 'புண் பதிவுகள் எதுவும் இல்லை' : 'No Wound Records Recorded Yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              {isTamil
                ? 'இந்த நோயாளிக்கு பாத புண், அறுவைசிகிச்சை காயம் அல்லது அழுத்தப் புண் படத்தை பதிவேற்றி AI மதிப்பாய்வைத் தொடங்கவும்.'
                : 'Upload the first clinical wound photograph (foot ulcer, venous leg wound, diabetic ulcer, or pressure sore) to begin longitudinal monitoring.'}
            </p>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{isTamil ? 'முதல் புண் படத்தை பதிவேற்றுக' : 'Upload First Wound Image'}</span>
          </button>
        </div>
      )}

      {/* When assessments exist */}
      {assessments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Timeline / History & Comparison Selector */}
          <div className="lg:col-span-4 space-y-4">
            {/* Timeline Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {isTamil ? 'புண் வரலாற்றுப் பட்டியல்' : 'Wound Assessment History'}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {assessments.length} {assessments.length === 1 ? 'visit' : 'visits'}
                </span>
              </div>

              {/* Assessment list cards */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {assessments.map((a, idx) => {
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
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt="Wound thumb"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-500">
                              IMG
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {woundLang === 'ta'
                                ? translateWoundMedicalText(a.wound_location)
                                : woundLang === 'both'
                                ? `${a.wound_location} / ${translateWoundMedicalText(a.wound_location)}`
                                : a.wound_location}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                            <span>{a.visit_date}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Gran: {gran}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {woundLang === 'ta'
                                ? translateWoundMedicalText(a.wound_type_tag)
                                : woundLang === 'both'
                                ? `${a.wound_type_tag} (${translateWoundMedicalText(a.wound_type_tag)})`
                                : a.wound_type_tag}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                a.review_status === 'VALIDATED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {a.review_status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Compare Checkbox Trigger */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCompareSelect(a.assessment_id);
                          }}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                            isCompared
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                          }`}
                          title="Select for comparison"
                        >
                          {isCompared ? (isTamil ? 'ஒப்பீடு ✓' : 'Compare ✓') : (isTamil ? '+ ஒப்பீடு' : '+ Compare')}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAssessment(a.assessment_id);
                          }}
                          className="text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 p-1"
                          title="Delete assessment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison instructions */}
              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
                <Layers className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                <span>
                  {isTamil
                    ? 'முன்னேற்ற ஒப்பீட்டை பார்க்க 2 அல்லது அதற்கு மேற்பட்ட படங்களைத் தேர்ந்தெடுக்கவும்.'
                    : 'Select 2 or more examinations to generate longitudinal progress comparison.'}
                </span>
              </div>
            </div>

            {/* Approved Medical Reports Integration Card */}
            {selectedAssessment?.linked_report_summary && (
              <WoundReportCorrelationCard
                summary={selectedAssessment.linked_report_summary}
                mode={woundLang}
              />
            )}
          </div>

          {/* Right Column: Selected Assessment Details & Longitudinal Comparison */}
          <div className="lg:col-span-8 space-y-6">
            {/* Comparison Viewer (if 2+ selected) */}
            {comparisonResult && selectedForCompare.length >= 2 && (
              <div className="space-y-4">
                <WoundComparisonViewer comparison={comparisonResult} mode={woundLang} />
              </div>
            )}

            {/* Selected Assessment Detailed Card */}
            {selectedAssessment && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                {/* Header with Severity & Review Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {woundLang === 'ta'
                          ? translateWoundMedicalText(selectedAssessment.wound_location)
                          : woundLang === 'both'
                          ? `${selectedAssessment.wound_location} / ${translateWoundMedicalText(selectedAssessment.wound_location)}`
                          : selectedAssessment.wound_location}
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                        {woundLang === 'ta'
                          ? translateWoundMedicalText(selectedAssessment.wound_type_tag)
                          : woundLang === 'both'
                          ? `${selectedAssessment.wound_type_tag} (${translateWoundMedicalText(selectedAssessment.wound_type_tag)})`
                          : selectedAssessment.wound_type_tag}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1 font-mono">
                      <span>{isTamil ? 'தேதி:' : 'Exam Date:'} {selectedAssessment.visit_date}</span>
                      <span>•</span>
                      <span>ID: {selectedAssessment.assessment_id}</span>
                      <span>•</span>
                      <span>{isTamil ? 'பதிவேற்றியவர்:' : 'Uploaded by:'} {selectedAssessment.uploaded_by}</span>
                    </div>
                  </div>

                  {/* Severity Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                        selectedAssessment.severity_indicator.includes('Severe')
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : selectedAssessment.severity_indicator.includes('Moderate')
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {woundLang === 'ta'
                        ? translateWoundMedicalText(selectedAssessment.severity_indicator)
                        : woundLang === 'both'
                        ? `${selectedAssessment.severity_indicator} / ${translateWoundMedicalText(selectedAssessment.severity_indicator)}`
                        : selectedAssessment.severity_indicator}
                    </span>
                  </div>
                </div>

                {/* Main View: Image + Tissue Breakdown Meter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Photo Display */}
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-950 flex items-center justify-center aspect-video group">
                    <img
                      src={getWoundImageUrl(selectedAssessment.image_filename)}
                      alt="Wound assessment"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-slate-900/80 text-[10px] text-white font-mono">
                      {selectedAssessment.image_mime_type} • {(selectedAssessment.image_size_bytes / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>

                  {/* Tissue Breakdown Meters */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-rose-500" />
                      <span>
                        {woundLang === 'ta'
                          ? 'திசு கலவை பகுப்பாய்வு'
                          : woundLang === 'both'
                          ? 'Wound Bed Tissue Composition / திசு கலவை பகுப்பாய்வு'
                          : 'Wound Bed Tissue Composition'}
                      </span>
                    </h4>

                    {/* Granulation Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {woundLang === 'ta'
                            ? 'சிவப்பு தசை (Granulation - Viable)'
                            : woundLang === 'both'
                            ? 'Granulation Tissue (Viable) / சிவப்பு தசை'
                            : 'Granulation Tissue (Viable)'}
                        </span>
                        <b className="font-mono text-emerald-600 dark:text-emerald-400">
                          {selectedAssessment.visible_characteristics.tissue_breakdown.granulation_percent}%
                        </b>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${selectedAssessment.visible_characteristics.tissue_breakdown.granulation_percent}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Slough Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {woundLang === 'ta'
                            ? 'மஞ்சள் சவ்வு (Slough - Non-viable)'
                            : woundLang === 'both'
                            ? 'Yellow / Tan Slough (Non-viable) / மஞ்சள் சவ்வு'
                            : 'Yellow / Tan Slough (Non-viable)'}
                        </span>
                        <b className="font-mono text-amber-600 dark:text-amber-400">
                          {selectedAssessment.visible_characteristics.tissue_breakdown.slough_percent}%
                        </b>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{
                            width: `${selectedAssessment.visible_characteristics.tissue_breakdown.slough_percent}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Necrotic Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {woundLang === 'ta'
                            ? 'கருப்பு இறந்த திசு (Necrotic Eschar)'
                            : woundLang === 'both'
                            ? 'Necrotic Eschar (Black/Brown) / கருப்பு இறந்த திசு'
                            : 'Necrotic Eschar (Black/Brown)'}
                        </span>
                        <b className="font-mono text-rose-600 dark:text-rose-400">
                          {selectedAssessment.visible_characteristics.tissue_breakdown.necrotic_percent}%
                        </b>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-rose-600 transition-all duration-500"
                          style={{
                            width: `${selectedAssessment.visible_characteristics.tissue_breakdown.necrotic_percent}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Epithelial Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {woundLang === 'ta'
                            ? 'மேல் தோல் மூடல் (Epithelialization)'
                            : woundLang === 'both'
                            ? 'Epithelialization (Margin) / மேல் தோல் மூடல்'
                            : 'Epithelialization (Margin)'}
                        </span>
                        <b className="font-mono text-blue-600 dark:text-blue-400">
                          {selectedAssessment.visible_characteristics.tissue_breakdown.epithelial_percent}%
                        </b>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{
                            width: `${selectedAssessment.visible_characteristics.tissue_breakdown.epithelial_percent}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visible Characteristics Detail Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {woundLang === 'ta'
                        ? 'சுற்றியுள்ள சிவத்தல் (Erythema)'
                        : woundLang === 'both'
                        ? 'Periwound Erythema / சுற்றியுள்ள சிவத்தல்'
                        : 'Periwound Erythema'}
                    </span>
                    <WoundDualBlock
                      en={selectedAssessment.visible_characteristics.periwound_redness}
                      mode={woundLang}
                      as="p"
                      className="font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {woundLang === 'ta'
                        ? 'வீக்கம் மற்றும் கசிவு'
                        : woundLang === 'both'
                        ? 'Swelling & Exudate / வீக்கம் மற்றும் கசிவு'
                        : 'Swelling & Exudate'}
                    </span>
                    <WoundDualBlock
                      en={`${selectedAssessment.visible_characteristics.surrounding_swelling} • ${selectedAssessment.visible_characteristics.discharge_characteristics?.type || 'Scant'}`}
                      mode={woundLang}
                      as="p"
                      className="font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {woundLang === 'ta'
                        ? 'விளிம்பு நிலை'
                        : woundLang === 'both'
                        ? 'Wound Edge Condition / விளிம்பு நிலை'
                        : 'Wound Edge Condition'}
                    </span>
                    <WoundDualBlock
                      en={selectedAssessment.visible_characteristics.edge_condition}
                      mode={woundLang}
                      as="p"
                      className="font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Scale & Dimensions Notice */}
                <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-500" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold">
                      {woundLang === 'ta'
                        ? 'அளவு அளவீட்டு நிலை: '
                        : woundLang === 'both'
                        ? 'Dimensional Scale Status / அளவு அளவீட்டு நிலை: '
                        : 'Dimensional Scale Status: '}
                    </span>
                    {selectedAssessment.dimensions_info.has_scale_marker ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                        {selectedAssessment.dimensions_info.length_cm} cm x{' '}
                        {selectedAssessment.dimensions_info.width_cm} cm (Area:{' '}
                        {selectedAssessment.dimensions_info.surface_area_cm2} cm²)
                      </span>
                    ) : (
                      <WoundDualBlock
                        en={selectedAssessment.dimensions_info.scale_notes}
                        mode={woundLang}
                        as="span"
                      />
                    )}
                  </div>
                </div>

                {/* Candidate Categories Differentials */}
                {selectedAssessment.categories_considered && selectedAssessment.categories_considered.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {woundLang === 'ta'
                        ? 'பரிசீலிக்க வேண்டிய சாத்தியமான புண் வகைகள்'
                        : woundLang === 'both'
                        ? 'Possible Categories to Consider / சாத்தியமான புண் வகைகள்'
                        : 'Possible Categories to Consider (With Uncertainty)'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedAssessment.categories_considered.map((cat, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {woundLang === 'ta'
                                ? translateWoundMedicalText(cat.category)
                                : woundLang === 'both'
                                ? `${cat.category} (${translateWoundMedicalText(cat.category)})`
                                : cat.category}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {cat.confidence}
                            </span>
                          </div>
                          <WoundDualBlock
                            en={cat.rationale}
                            mode={woundLang}
                            as="p"
                            className="text-[11px] text-slate-500 dark:text-slate-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Warning Signs (Red Flags) */}
                {selectedAssessment.warning_signs && selectedAssessment.warning_signs.length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>
                        {woundLang === 'ta'
                          ? 'கவனிக்க வேண்டிய எச்சரிக்கை அறிகுறிகள்'
                          : woundLang === 'both'
                          ? 'Clinical Warning Signs / எச்சரிக்கை அறிகுறிகள்'
                          : 'Clinical Warning Signs Requiring Prompt Evaluation'}
                      </span>
                    </div>
                    <WoundDualList
                      items={selectedAssessment.warning_signs}
                      mode={woundLang}
                      bulletColor="bg-rose-500"
                      className="text-xs text-rose-800/90 dark:text-rose-300/90"
                    />
                  </div>
                )}

                {/* Image Limitations & Non-Photographic Findings */}
                {selectedAssessment.limitations_notes && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Info className="w-4 h-4 text-slate-500" />
                      <span>
                        {woundLang === 'ta'
                          ? 'பட வரம்புகள் மற்றும் புகைப்படத்தில் அறிய முடியாத காரணிகள்'
                          : woundLang === 'both'
                          ? 'Image Quality Limitations / பட வரம்புகள்'
                          : 'Image Quality Limitations & Findings Unassessable via Photograph'}
                      </span>
                    </div>
                    <WoundDualList
                      items={selectedAssessment.limitations_notes}
                      mode={woundLang}
                      bulletColor="bg-slate-400"
                      className="text-xs text-slate-600 dark:text-slate-400"
                    />
                  </div>
                )}

                {/* Decision Support Recommendations Grid */}
                {selectedAssessment.clinical_recommendations && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-brand-500" />
                      <span>
                        {woundLang === 'ta'
                          ? 'மருத்துவ பரிந்துரைகள் மற்றும் முடிவெடுக்கும் ஆதரவு'
                          : woundLang === 'both'
                          ? 'Clinical Decision Support Recommendations / மருத்துவ பரிந்துரைகள்'
                          : 'Doctor-Facing Decision Support Recommendations'}
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Recommended Assessments */}
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                          <span>
                            {woundLang === 'ta'
                              ? 'பரிந்துரைக்கப்படும் மருத்துவ சோதனைகள்'
                              : woundLang === 'both'
                              ? 'Recommended Clinical Assessments / மருத்துவ சோதனைகள்'
                              : 'Recommended Clinical Assessments'}
                          </span>
                        </div>
                        <WoundDualList
                          items={selectedAssessment.clinical_recommendations.recommended_assessments || []}
                          mode={woundLang}
                          bulletColor="bg-brand-500"
                          className="text-xs text-slate-600 dark:text-slate-400"
                        />
                      </div>

                      {/* Wound Care Considerations */}
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-500" />
                          <span>
                            {woundLang === 'ta'
                              ? 'பொதுவான புண் பராமரிப்பு வழிகாட்டல்'
                              : woundLang === 'both'
                              ? 'General Wound Care Considerations / புண் பராமரிப்பு'
                              : 'General Wound Care Considerations'}
                          </span>
                        </div>
                        <WoundDualList
                          items={selectedAssessment.clinical_recommendations.wound_care_considerations || []}
                          mode={woundLang}
                          bulletColor="bg-emerald-500"
                          className="text-xs text-slate-600 dark:text-slate-400"
                        />
                      </div>

                      {/* Specialist Referral Triggers */}
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                          <span>
                            {woundLang === 'ta'
                              ? 'சிறப்பு மருத்துவர் பரிந்துரை காரணங்கள்'
                              : woundLang === 'both'
                              ? 'Specialist Referral Triggers / சிறப்பு மருத்துவர் பரிந்துரை'
                              : 'Specialist Referral Triggers'}
                          </span>
                        </div>
                        <WoundDualList
                          items={selectedAssessment.clinical_recommendations.specialist_referral_triggers || []}
                          mode={woundLang}
                          bulletColor="bg-indigo-500"
                          className="text-xs text-slate-600 dark:text-slate-400"
                        />
                      </div>

                      {/* Pre-Surgical Evaluation Factors */}
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {woundLang === 'ta'
                              ? 'அறுவை சிகிச்சைக்கு முன் மருத்துவர் மதிப்பீடு'
                              : woundLang === 'both'
                              ? 'Pre-Surgical Evaluation Factors / அறுவை சிகிச்சைக்கு முன் மதிப்பீடு'
                              : 'Pre-Surgical Evaluation Factors'}
                          </span>
                        </div>
                        <WoundDualList
                          items={selectedAssessment.clinical_recommendations.surgical_evaluation_factors || []}
                          mode={woundLang}
                          bulletColor="bg-amber-500"
                          className="text-xs text-slate-600 dark:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Doctor Notes & Validation Form */}
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-600" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {isTamil ? 'மருத்துவர் குறிப்புகள் மற்றும் இறுதி ஒப்புதல்' : 'Physician Notes & Clinical Sign-Off'}
                      </h4>
                    </div>
                    {notesSaveSuccess && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {isTamil ? 'குறிப்புகள் சேமிக்கப்பட்டன!' : 'Saved successfully!'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <textarea
                        rows={3}
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        placeholder={
                          isTamil
                            ? 'மருத்துவர் ஆய்வு முடிவு, சிகிச்சை மாற்றம், ஆஃப்லோடிங் உத்தரவு...'
                            : 'Enter treating physician clinical assessment, planned debridement, dressing orders...'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                      />
                    </div>
                    <div className="space-y-2 flex flex-col justify-between">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          {isTamil ? 'ஆய்வு நிலை (Review Status):' : 'Review Status:'}
                        </label>
                        <select
                          value={editingStatus}
                          onChange={(e) => setEditingStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                        >
                          <option value="VALIDATED">VALIDATED (Confirmed)</option>
                          <option value="FOLLOW_UP_REQUIRED">FOLLOW_UP_REQUIRED</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveDoctorNotes}
                        disabled={isSavingNotes}
                        className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                      >
                        {isSavingNotes ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>{isTamil ? 'குறிப்புகளைச் சேமி' : 'Save Clinical Notes'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <WoundUploadModal
          patient={currentPatient}
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={(newAssessment) => {
            setAssessments((prev) => [...prev, newAssessment]);
            setSelectedAssessmentId(newAssessment.assessment_id);
            if (assessments.length >= 1) {
              const ids = [assessments[0].assessment_id, newAssessment.assessment_id];
              setSelectedForCompare(ids);
              runComparison(currentPatient.patientId, ids);
            }
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
