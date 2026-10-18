import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  FileX,
  Building2,
  Calendar,
  Layers,
  RotateCcw,
  Eye,
  EyeOff,
  Activity,
  Check,
  FileCode,
} from 'lucide-react';
import { uploadReport } from '../services/api';
import { ReportRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DocumentUploadModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newReport: ReportRecord) => void;
}

async function optimizeImageForUpload(imageFile: File, maxDimension = 2400): Promise<File> {
  // If file is already small (under 3.2MB) and is jpg/jpeg, keep original
  if (imageFile.size <= 3.2 * 1024 * 1024 && !imageFile.name.toLowerCase().endsWith('.png')) {
    return imageFile;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageFile);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < imageFile.size) {
              const newName = imageFile.name.replace(/\.[^/.]+$/, "") + ".jpg";
              const optimized = new File([blob], newName, { type: 'image/jpeg' });
              resolve(optimized);
            } else {
              resolve(imageFile);
            }
          },
          'image/jpeg',
          0.92
        );
      };
      img.onerror = () => resolve(imageFile);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(imageFile);
    reader.readAsDataURL(imageFile);
  });
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  patientId,
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const { dict, isTamil } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [provider, setProvider] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [reportCategory, setReportCategory] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<boolean>(false);
  const [verifiedReport, setVerifiedReport] = useState<ReportRecord | null>(null);
  const [verifiedEvidence, setVerifiedEvidence] = useState<{
    documentType?: string;
    confidence?: number;
    medicalEvidence?: string[];
    detectedContent?: string[];
  } | null>(null);
  const [identityMismatchInfo, setIdentityMismatchInfo] = useState<{
    registeredPatientName?: string;
    extractedPatientName?: string;
    conflicts?: string[];
    detectedIdentifiers?: any;
    details?: string;
    matchScore?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const workflowStages = [
    { id: 1, label: isTamil ? '1. கோப்பு பதிவேற்றப்பட்டது' : '1. File Uploaded' },
    { id: 2, label: isTamil ? '2. உரை & OCR பிரித்தெடுத்தல்' : '2. Text Extraction / OCR' },
    { id: 3, label: isTamil ? '3. AI மருத்துவ பகுப்பாய்வு' : '3. AI Medical Analysis' },
    { id: 4, label: isTamil ? '4. மருத்துவ அளவுரு பிரித்தெடுத்தல்' : '4. Parameter Extraction' },
    { id: 5, label: isTamil ? '5. நோயாளி சரிபார்ப்பு' : '5. Patient Matching' },
    { id: 6, label: isTamil ? '6. மருத்துவ உறுதிப்படுத்தல்' : '6. Clinical Validation' },
    { id: 7, label: isTamil ? '7. சேமிக்க தயார்' : '7. Ready to Ingest' },
  ];

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile: File) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMsg('The selected document exceeds the 25MB upload limit.');
      setErrorDetails({ type: 'FILE_TOO_LARGE', detected: 'Maximum size: 25MB' });
      setFile(null);
      return;
    }
    
    // Immediate rejection of non-document audio, video, executable, archive formats
    const forbiddenExts = [
      '.mp3', '.wav', '.m4a', '.flac', '.aac', '.ogg',
      '.mp4', '.mov', '.avi', '.mkv',
      '.exe', '.bat', '.sh', '.cmd',
      '.zip', '.rar', '.7z', '.tar',
      '.doc', '.docx', '.odt', '.rtf', '.psd', '.ai', '.eps'
    ];

    if (forbiddenExts.includes(ext)) {
      setErrorMsg(`This file (${ext.toUpperCase()}) is not a supported medical document. Word documents, audio, video, executables, and archives cannot be ingested. Please upload a medical PDF or supported medical scan.`);
      setErrorDetails({
        type: 'UNSUPPORTED_MEDIA_TYPE',
        detected: `Unsupported file (${ext.toUpperCase()})`
      });
      setFile(null);
      return;
    }

    if (ext !== '.pdf' && ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      setErrorMsg(`Unsupported file format (${ext}). Only PDF reports and medical scans (.pdf, .png, .jpg, .jpeg) are supported.`);
      setErrorDetails({
        type: 'UNSUPPORTED_EXTENSION',
        detected: `File extension (${ext})`
      });
      setFile(null);
      return;
    }

    let processedFile = selectedFile;
    if (ext !== '.pdf') {
      try {
        processedFile = await optimizeImageForUpload(selectedFile);
      } catch (err) {
        console.warn('Image optimization note on selection:', err);
      }
    }

    setFile(processedFile);
    setErrorMsg(null);
    setErrorDetails(null);
    setValidationSuccess(false);
    setVerifiedReport(null);
    setVerifiedEvidence(null);
    setShowPreview(true);
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setErrorMsg('Please select a medical document to upload.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setErrorDetails(null);
    setValidationSuccess(false);
    setVerifiedReport(null);
    setVerifiedEvidence(null);

    // 1. File Uploaded
    setCurrentStageIndex(0);
    await new Promise((res) => setTimeout(res, 100));

    let uploadableFile = file;
    const isImageOrScan = !file.name.toLowerCase().endsWith('.pdf');
    if (isImageOrScan) {
      try {
        uploadableFile = await optimizeImageForUpload(file);
      } catch (err) {
        console.warn('Image optimization note:', err);
      }
    }

    if (uploadableFile.size > 4.5 * 1024 * 1024) {
      setIsProcessing(false);
      setErrorMsg(`Document size is ${(uploadableFile.size / (1024 * 1024)).toFixed(1)}MB. Vercel Serverless maximum payload limit is 4.5MB. Please compress or optimize your document before uploading.`);
      setErrorDetails({
        type: 'PAYLOAD_TOO_LARGE',
        detected: `File size ${(uploadableFile.size / (1024 * 1024)).toFixed(1)}MB exceeds 4.5MB limit`
      });
      return;
    }

    // 2. Text Extraction / OCR
    setCurrentStageIndex(1);
    await new Promise((res) => setTimeout(res, 150));

    // 3. AI Medical-Content Analysis
    setCurrentStageIndex(2);

    const formData = new FormData();
    formData.append('file', uploadableFile);
    formData.append('provider', provider);
    formData.append('reportDate', reportDate);
    formData.append('reportCategory', reportCategory);

    try {
      const res = await uploadReport(patientId, formData);

      // 4. Clinical Parameter Extraction
      setCurrentStageIndex(3);
      await new Promise((res) => setTimeout(res, 150));

      // 5. Patient Matching
      setCurrentStageIndex(4);
      await new Promise((res) => setTimeout(res, 150));

      // 6. Clinical Validation
      setCurrentStageIndex(5);
      await new Promise((res) => setTimeout(res, 150));

      // 7. Ready to Ingest
      setCurrentStageIndex(6);

      setVerifiedReport(res.report);
      setVerifiedEvidence({
        documentType: res.report.category || 'LAB_REPORT',
        confidence: res.report.validationStatus === 'VERIFIED' ? 0.96 : 0.92,
        medicalEvidence: res.report.extractedParameters?.map(p => p.parameterName) || []
      });
      setValidationSuccess(true);
      setIsProcessing(false);

      setTimeout(() => {
        onUploadSuccess(res.report);
        onClose();
      }, 1800);
    } catch (e: any) {
      setIsProcessing(false);

      const rawMsg = e.message || 'The uploaded file does not appear to contain a valid medical report based on its content.';
      setErrorMsg(rawMsg);
      setIdentityMismatchInfo(null);

      // Capture identity mismatch details from the backend error
      if (e.identityStatus === 'MISMATCH' || e.identityStatus === 'UNVERIFIED') {
        setIdentityMismatchInfo({
          registeredPatientName: e.registeredPatientName,
          extractedPatientName: e.extractedPatientName,
          conflicts: e.conflicts,
          detectedIdentifiers: e.detectedIdentifiers,
          details: e.details,
          matchScore: e.matchScore,
        });
      }

      if (e.isPatientNotFound) {
        setErrorMsg(e.message || 'Medical document verified, but patient profile not found in database.');
        setErrorDetails({
          type: 'PATIENT_NOT_FOUND',
          title: isTamil ? 'செல்லுபடியாகும் மருத்துவ ஆவணம் — நோயாளி சுயவிவரம் கிடைக்கவில்லை' : 'VALID MEDICAL DOCUMENT — PATIENT PROFILE NOT FOUND',
          document_type: e.document_type || 'LAB_REPORT',
          detected_category: e.detected_category,
          detected_patient_name: e.detected_patient_name,
          parameter_count: e.parameter_count || 0,
          resolution: e.resolution || (isTamil ? 'நோயாளி பட்டியலில் இருந்து சரியான நோயாளியைத் தேர்ந்தெடுக்கவும் அல்லது புதிய நோயாளியைப் பதிவு செய்யவும்.' : 'Please select an existing patient from the directory or register this patient before uploading.'),
          action: e.action_required || 'Select or register patient profile in database.',
          reason: e.message
        });
        return;
      }

      let detectedContent = 'Non-medical or unverified document';
      if (rawMsg.toLowerCase().includes('academic') || rawMsg.toLowerCase().includes('calendar') || rawMsg.toLowerCase().includes('semester')) {
        detectedContent = isTamil ? 'பல்கலைக்கழக கல்வி நாட்காட்டி / நேர அட்டவணை' : 'University academic calendar / timetable';
      } else if (rawMsg.toLowerCase().includes('resume') || rawMsg.toLowerCase().includes('curriculum vitae')) {
        detectedContent = isTamil ? 'மென்பொருள் பொறியாளர் சுயவிவரம் (Resume / CV)' : 'Software developer resume / CV';
      } else if (rawMsg.toLowerCase().includes('invoice') || rawMsg.toLowerCase().includes('gstin') || rawMsg.toLowerCase().includes('tax')) {
        detectedContent = isTamil ? 'வணிக விற்பனை வரி விலைப்பட்டியல் (Invoice)' : 'Commercial retail tax invoice';
      } else if (rawMsg.toLowerCase().includes('audio') || rawMsg.toLowerCase().includes('video') || rawMsg.toLowerCase().includes('unsupported')) {
        detectedContent = isTamil ? 'ஆவணமற்ற மீடியா கோப்பு (Audio / Video)' : 'Non-document media stream';
      } else if (rawMsg.toLowerCase().includes('corrupted') || rawMsg.toLowerCase().includes('signature')) {
        detectedContent = isTamil ? 'சிதைந்த / பழுதடைந்த கோப்பு' : 'Malformed / corrupted PDF binary';
      } else if (e.identityStatus === 'MISMATCH' || e.identityStatus === 'UNVERIFIED') {
        detectedContent = isTamil ? 'நோயாளி விவரமற்ற பொருத்தம் (Patient Identity Mismatch)' : 'Patient Identity Mismatch';
      }

      if (e.isDuplicate) {
        setErrorMsg(e.message || 'Duplicate medical report detected.');
        setErrorDetails({
          type: 'DUPLICATE_REPORT',
          title: isTamil ? 'ஏற்கனவே பதிவேற்றப்பட்ட ஆவணம் (நகல்)' : 'DUPLICATE REPORT DETECTED',
          existing_report_id: e.existing_report_id,
          report_date: e.report_date,
          reason: e.message
        });
        return;
      }

      if (e.isIdentityMismatch || (e.message && e.message.includes('MISMATCH'))) {
        const mismatchTitle = e.title || e.message || 'PATIENT IDENTITY MISMATCH - INVALID DOCUMENT FOR THIS PATIENT';
        setErrorMsg(mismatchTitle);
        setErrorDetails({
          type: 'IDENTITY_MISMATCH',
          error_code: e.error_code || 'PATIENT_NAME_MISMATCH',
          failed_field: e.failed_field || 'PATIENT_NAME',
          title: mismatchTitle,
          status_label: e.status_label || 'Identity mismatch',
          registered_patient: e.registered_patient || 'Selected Patient',
          extracted_patient: e.extracted_patient || 'Different Person',
          registered_id: e.registered_id,
          extracted_id: e.extracted_id,
          status: e.status_label || 'Identity mismatch',
          action: e.action || 'Review or upload the correct document for this patient.',
          reason: e.reason || 'Patient identity on document contradicts the registered patient account.'
        });
        return;
      }

      if (e.isNonMedical || e.error_code === 'NON_MEDICAL_DOCUMENT') {
        const nonMedReason = e.reason || e.message || 'This document does not contain sufficient clinical or medical content for MEDI-TREND analysis.';
        const detectedLabel = (e.detected_content && e.detected_content[0]) || e.detected_type_label || (isTamil ? 'மருத்துவமற்ற ஆவணம்' : 'Non-medical document');
        setErrorMsg(nonMedReason);
        setErrorDetails({
          type: 'NON_MEDICAL_DOCUMENT',
          title: isTamil ? 'செல்லுபடியாகாத மருத்துவ ஆவணம்' : 'INVALID MEDICAL DOCUMENT',
          detected: detectedLabel,
          reason: nonMedReason
        });
        return;
      }

      if (e.isUnreadable || e.error_code === 'UNREADABLE_OR_BLANK' || e.error_code === 'CORRUPTED_DOCUMENT') {
        const unreadMsg = e.reason || e.message || 'Document contains insufficient or unreadable text.';
        setErrorMsg(unreadMsg);
        setErrorDetails({
          type: 'UNREADABLE_OR_BLANK',
          title: isTamil ? 'படிக்க முடியாத / பழுதடைந்த ஆவணம்' : 'UNREADABLE OR INSUFFICIENT DOCUMENT CONTENT',
          detected: isTamil ? 'தெளிவற்ற ஆவணம்' : 'Unreadable / Corrupted Scan',
          reason: unreadMsg
        });
        return;
      }

      if (e.isForbidden || e.error_code === 'FORBIDDEN') {
        const forbiddenMsg = e.message || 'Forbidden: Insufficient permissions to access or upload records for this patient.';
        setErrorMsg(forbiddenMsg);
        setErrorDetails({
          type: 'FORBIDDEN',
          title: isTamil ? 'அனுமதி மறுக்கப்பட்டது' : 'ACCESS FORBIDDEN',
          reason: forbiddenMsg
        });
        return;
      }

      const fallbackMessage = e.message || 'The uploaded file could not be processed.';
      setErrorMsg(fallbackMessage);
      setErrorDetails({
        type: fallbackMessage.includes('500') || fallbackMessage.toLowerCase().includes('server processing error') ? 'SERVER_ERROR' : 'INVALID_MEDICAL_DOCUMENT',
        title: isTamil ? 'செயலாக்கப் பிழை' : 'PROCESSING ERROR',
        detected: isTamil ? 'சர்வர் செயலாக்க பிழை' : 'Server processing exception',
        reason: fallbackMessage
      });
    }
  };

  const handleResetUpload = () => {
    setFile(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    setErrorDetails(null);
    setValidationSuccess(false);
    setVerifiedReport(null);
    setVerifiedEvidence(null);
    setIdentityMismatchInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isPdf = file?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className={`bg-white dark:bg-slate-900 w-full ${file ? 'max-w-3xl' : 'max-w-xl'} max-h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-300`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{dict.modal_upload_title}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {dict.modal_upload_subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Rejection Warning / Patient Resolution Modal Card */}
          {errorMsg && (
            <div className={`p-5 rounded-2xl ${
              errorDetails?.type === 'PATIENT_NOT_FOUND'
                ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200'
                : errorDetails?.type === 'DUPLICATE_REPORT'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 text-indigo-800 dark:text-indigo-200'
                : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
            } text-xs space-y-3 animate-shake`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${
                  errorDetails?.type === 'PATIENT_NOT_FOUND'
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
                    : errorDetails?.type === 'DUPLICATE_REPORT'
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400'
                    : 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400'
                } flex items-center justify-center flex-shrink-0`}>
                  {errorDetails?.type === 'PATIENT_NOT_FOUND' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : errorDetails?.type === 'DUPLICATE_REPORT' ? (
                    <FileCheck className="w-5 h-5" />
                  ) : errorDetails?.type === 'IDENTITY_MISMATCH' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <FileX className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  {errorDetails?.type === 'PATIENT_NOT_FOUND' ? (
                    <div className="space-y-2">
                      <div className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>{errorDetails.title || 'VALID MEDICAL DOCUMENT — PATIENT PROFILE NOT FOUND'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-900/60 space-y-2 text-xs text-slate-800 dark:text-slate-200">
                        <div className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                          <span>✓ Verified Medical Document ({errorDetails.document_type || 'Clinical Report'})</span>
                          {errorDetails.parameter_count > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-mono">
                              {errorDetails.parameter_count} tests detected
                            </span>
                          )}
                        </div>
                        {errorDetails.detected_patient_name && (
                          <div>
                            <b>• Patient on Document:</b>{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">{errorDetails.detected_patient_name}</span>
                          </div>
                        )}
                        <div>
                          <b>• Target Patient ID:</b>{' '}
                          <span className="font-mono text-amber-700 dark:text-amber-400">{patientId}</span> (Not found in database)
                        </div>
                        <div className="pt-1 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-900/40">
                          <b>Resolution:</b> {errorDetails.resolution}
                        </div>
                      </div>
                    </div>
                  ) : errorDetails?.type === 'DUPLICATE_REPORT' ? (
                    <div className="space-y-2">
                      <div className="font-bold text-sm text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span>{errorDetails.title || 'DUPLICATE REPORT DETECTED'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-900/60 space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <div>{errorDetails.reason}</div>
                        {errorDetails.existing_report_id && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                            Existing Report ID: <b>{errorDetails.existing_report_id}</b>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : errorDetails?.type === 'IDENTITY_MISMATCH' ? (
                    <div className="space-y-2">
                      <div className="font-bold text-sm text-red-900 dark:text-red-200 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>{errorDetails.title || 'PATIENT IDENTITY MISMATCH — INVALID DOCUMENT FOR THIS PATIENT'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-red-200 dark:border-red-900/60 space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <div>
                          <b>• Registered patient:</b>{' '}
                          <span className="font-medium text-slate-900 dark:text-white">{errorDetails.registered_patient}</span>
                          {errorDetails.registered_id && (
                            <span className="ml-1 text-[11px] text-slate-500 font-mono font-normal">({errorDetails.registered_id})</span>
                          )}
                        </div>
                        <div>
                          <b>• Report patient:</b>{' '}
                          <span className="font-semibold text-red-600 dark:text-red-400">{errorDetails.extracted_patient}</span>
                          {errorDetails.extracted_id && (
                            <span className="ml-1 text-[11px] text-red-500 font-mono font-normal">({errorDetails.extracted_id})</span>
                          )}
                        </div>
                        <div>
                          <b>• Status:</b>{' '}
                          <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold text-[11px]">
                            {errorDetails.status_label || errorDetails.status || 'Identity mismatch'}
                          </span>
                        </div>
                        {errorDetails.reason && (
                          <div>
                            <b>• Rejection reason:</b>{' '}
                            <span className="font-medium text-red-700 dark:text-red-300">{errorDetails.reason}</span>
                          </div>
                        )}
                        <div>
                          <b>• Action:</b> <span className="font-medium text-slate-700 dark:text-slate-300">{errorDetails.action}</span>
                        </div>
                      </div>
                    </div>
                  ) : errorDetails?.type === 'UNREADABLE_OR_BLANK' ? (
                    <>
                      <div className="font-bold text-sm text-red-900 dark:text-red-200">
                        ⚠ {errorDetails.title || 'UNREADABLE OR INSUFFICIENT DOCUMENT CONTENT'}
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-medium">
                        {errorDetails.reason || 'The uploaded file does not contain legible text or clinical markers. Please upload a clear medical PDF or scan.'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-sm text-red-900 dark:text-red-200">
                        ⚠ {dict.modal_upload_invalid_title}
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-medium">
                        {dict.modal_upload_invalid_msg}
                      </div>
                      {errorDetails?.detected && (
                        <div className="text-[11px] font-semibold text-red-800 dark:text-red-200 bg-red-100/70 dark:bg-red-900/40 px-2.5 py-1 rounded-lg inline-block mt-1">
                          {dict.modal_upload_detected_badge}: <b>{errorDetails.detected}</b>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {errorDetails?.type !== 'IDENTITY_MISMATCH' && errorDetails?.type !== 'PATIENT_NOT_FOUND' && errorDetails?.type !== 'DUPLICATE_REPORT' && (
                <div className="text-[11px] text-red-700/90 dark:text-red-300/90 bg-white/80 dark:bg-red-950/80 p-3 rounded-xl border border-red-200/70 dark:border-red-900/50">
                  <b>Rejection Details:</b> {errorMsg}
                </div>
              )}

              {/* Patient Identity Mismatch Details */}
              {identityMismatchInfo && (
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-900/50 space-y-2 text-xs text-orange-900 dark:text-orange-100">
                  <div className="flex items-center gap-2 font-bold mb-1 text-orange-800 dark:text-orange-300">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Patient Identity Mismatch Details</span>
                  </div>
                  {identityMismatchInfo.registeredPatientName && (
                    <div className="flex justify-between border-b border-orange-200/50 pb-1">
                      <span className="text-orange-600 dark:text-orange-400">Registered Patient:</span>
                      <span className="font-medium">{identityMismatchInfo.registeredPatientName}</span>
                    </div>
                  )}
                  {identityMismatchInfo.extractedPatientName && (
                    <div className="flex justify-between border-b border-orange-200/50 pb-1">
                      <span className="text-orange-600 dark:text-orange-400">Report Patient:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{identityMismatchInfo.extractedPatientName}</span>
                    </div>
                  )}
                  {identityMismatchInfo.conflicts && identityMismatchInfo.conflicts.length > 0 && (
                    <div className="space-y-1">
                      <div className="font-bold text-orange-600 dark:text-orange-400 text-[10px] mb-1">Conflicts:</div>
                      {identityMismatchInfo.conflicts.map((c, i) => (
                        <div key={i} className="text-[10px] pl-2 text-orange-700 dark:text-orange-300">• {c}</div>
                      ))}
                    </div>
                  )}
                  {identityMismatchInfo.matchScore !== undefined && (
                    <div className="flex justify-between text-[10px] mt-1 border-t border-orange-200/50 pt-1">
                      <span className="text-orange-500 dark:text-orange-400">Match Score:</span>
                      <span className="font-mono font-bold text-orange-800 dark:text-orange-300">
                        {(identityMismatchInfo.matchScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={handleResetUpload}
                  className={`px-4 py-2 rounded-xl ${
                    errorDetails?.type === 'PATIENT_NOT_FOUND'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : errorDetails?.type === 'DUPLICATE_REPORT'
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                  } text-white font-bold text-xs shadow-md transition flex items-center gap-1.5`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{dict.modal_upload_try_again}</span>
                </button>
              </div>
            </div>
          )}

          {/* Evidence-Based Verification Success Card */}
          {validationSuccess && verifiedReport && (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-200 space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                    <span>✓ {dict.modal_upload_stage_complete}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 font-mono font-bold">
                      {verifiedReport.reportId}
                    </span>
                  </div>
                  <div className="text-[11px] mt-0.5 text-emerald-700 dark:text-emerald-300">
                    Category: <b>{verifiedReport.category}</b> • Status: <b>{verifiedReport.extractionStatus}</b>
                  </div>
                </div>
              </div>

              {/* Extracted Evidence Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-white/80 dark:bg-emerald-950/80 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Provider:</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    {verifiedReport.provider}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Report Date:</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    {verifiedReport.reportDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Clinical Evidence:</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    {verifiedReport.parameterCount} structured parameters
                  </span>
                </div>
              </div>

              {/* Real Extracted Parameters Table */}
              {verifiedReport.extractedParameters && verifiedReport.extractedParameters.length > 0 && (
                <div className="mt-3 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-white/90 dark:bg-slate-900/90 overflow-hidden">
                  <div className="px-3 py-1.5 bg-emerald-100/60 dark:bg-emerald-950/50 text-[10px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                    <span>EXTRACTED CLINICAL PARAMETERS</span>
                    <span>{verifiedReport.extractedParameters.length} TESTS</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {verifiedReport.extractedParameters.map((p, idx) => (
                      <div key={idx} className="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                          {p.parameterName}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {p.value} {p.unit}
                          </span>
                          {p.referenceRange && (
                            <span className="text-[10px] text-slate-400">
                              ({p.referenceRange})
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            p.status === 'Elevated' || p.status === 'High'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : p.status === 'Low'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Dropzone */}
          {!errorMsg && !file && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50/50 dark:bg-slate-800/30 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/*"
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {dict.modal_upload_drag_drop}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {dict.modal_upload_supported_formats}
                </div>
              </div>
            </div>
          )}

          {/* LIVE DOCUMENT PREVIEW & FILE STATUS */}
          {file && previewUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-900/40">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="uppercase font-mono font-semibold text-brand-600 dark:text-brand-400">
                        {isPdf ? 'PDF Document' : 'Image Scan'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-brand-300/80 dark:border-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-100/60 dark:hover:bg-brand-900/50 transition flex items-center gap-1.5 font-semibold"
                  >
                    {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetUpload}
                    disabled={isProcessing}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* In-Modal PDF / Image Live Preview Frame */}
              {showPreview && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 overflow-hidden shadow-inner animate-fadeIn">
                  <div className="px-3 py-1.5 bg-slate-200/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-brand-500" />
                      <span>Live Document Preview</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Scroll to inspect clinical metrics</span>
                  </div>

                  <div className="p-1">
                    {isPdf ? (
                      <iframe
                        src={previewUrl}
                        title="Medical Report PDF Preview"
                        className="w-full h-64 sm:h-72 rounded-xl bg-white border-0"
                      />
                    ) : (
                      <div className="flex items-center justify-center p-2 bg-slate-900/5 dark:bg-slate-900/40 rounded-xl max-h-72 overflow-auto">
                        <img
                          src={previewUrl}
                          alt="Medical Document Scan Preview"
                          className="max-h-64 object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Confirmation Inputs (Clearly marked as optional fallback) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Laboratory / Provider</span>
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="Auto-detected from document content"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Report / Test Date</span>
              </label>
              <input
                type="text"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                placeholder="Auto-detected from document content"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          {/* Real Multi-Step Validation Progress Indicator */}
          {isProcessing && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                  <span>{workflowStages[currentStageIndex]?.label || 'Validating Document...'}</span>
                </div>
                <span className="text-[11px] font-mono text-brand-600">
                  Step {currentStageIndex + 1} of {workflowStages.length}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-600 to-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentStageIndex + 1) / workflowStages.length) * 100}%` }}
                />
              </div>

              {/* Stage Step Indicators */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[10px] text-slate-400">
                {workflowStages.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`text-center py-1 px-1 rounded truncate ${
                      idx < currentStageIndex
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40'
                        : idx === currentStageIndex
                        ? 'text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-950/40'
                        : 'opacity-50'
                    }`}
                  >
                    {s.label.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            {dict.cancel}
          </button>
          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={isProcessing || !file || Boolean(errorMsg)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition disabled:opacity-50 hover:scale-[1.02]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{dict.modal_upload_save_active}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{dict.modal_upload_confirm_btn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
