import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Tag,
  FileText,
  Sparkles,
  Info,
  RotateCw,
} from 'lucide-react';
import { PatientProfile, WoundAssessmentRecord } from '../../types';
import { uploadAndAssessWound } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface WoundUploadModalProps {
  patient: PatientProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAssessment: WoundAssessmentRecord) => void;
}

const COMMON_LOCATIONS = [
  'Right Plantar Hallux',
  'Right Plantar Metatarsal Head',
  'Right Heel',
  'Left Plantar Hallux',
  'Left Plantar Metatarsal Head',
  'Left Heel',
  'Right Medial Malleolus',
  'Right Lateral Malleolus',
  'Left Medial Malleolus',
  'Left Lateral Malleolus',
  'Lower Extremity (Gaiter Region)',
  'Sacrum / Coccyx',
  'Ischial Tuberosity',
  'Post-Surgical Abdominal Incision',
  'Other / Custom Anatomical Site',
];

const WOUND_TYPES = [
  'Diabetic Foot Ulcer (DFU)',
  'Venous Leg Ulcer (VLU)',
  'Arterial Ischemic Ulcer',
  'Pressure Injury / Decubitus Ulcer',
  'Post-Surgical Wound Dehiscence',
  'Neuropathic Ulcer',
  'Traumatic Cutaneous Wound',
  'Unspecified Chronic Ulcer',
];

export const WoundUploadModal: React.FC<WoundUploadModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isTamil } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [woundLocation, setWoundLocation] = useState<string>(COMMON_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState<string>('');
  const [woundTypeTag, setWoundTypeTag] = useState<string>(WOUND_TYPES[0]);
  const [visitDate, setVisitDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validExtensions.includes(file.type)) {
      setErrorMessage(
        isTamil
          ? 'தவறான கோப்பு வடிவம். JPG, PNG அல்லது WEBP வடிவங்களை மட்டுமே பதிவேற்றவும்.'
          : 'Invalid file format. Only JPG, PNG, and WEBP wound images are supported.'
      );
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage(
        isTamil
          ? 'கோப்பு அளவு 20MB வரம்பை தாண்டியுள்ளது.'
          : 'Image file size exceeds the 20MB limit.'
      );
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validExtensions.includes(file.type)) {
      setErrorMessage(
        isTamil
          ? 'தவறான கோப்பு வடிவம். JPG, PNG அல்லது WEBP வடிவங்களை மட்டுமே பதிவேற்றவும்.'
          : 'Invalid file format. Only JPG, PNG, and WEBP wound images are supported.'
      );
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage(
        isTamil
          ? 'மதிப்பாய்வு செய்ய புண் புகைப்படத்தைத் தேர்ந்தெடுக்கவும்.'
          : 'Please select a wound photograph for assessment.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const finalLocation =
        woundLocation === 'Other / Custom Anatomical Site'
          ? customLocation.trim() || 'Custom Anatomical Site'
          : woundLocation;

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('wound_location', finalLocation);
      formData.append('wound_type_tag', woundTypeTag);
      formData.append('visit_date', visitDate);
      formData.append('doctor_notes', doctorNotes);

      const result = await uploadAndAssessWound(patient.patientId, formData);
      onSuccess(result);
      handleClose();
    } catch (err: any) {
      console.error('Wound upload error:', err);
      setErrorMessage(
        err.message ||
          (isTamil
            ? 'படப் பகுப்பாய்வு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.'
            : 'Wound image analysis failed. Please check the connection and try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    setDoctorNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>
                  {isTamil
                    ? 'புண் மற்றும் புண் மதிப்பாய்வு படம் பதிவேற்றம்'
                    : 'Upload Clinical Wound Photograph'}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  AI Vision
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {patient.name} ({patient.patientId}) • {patient.age} Y / {patient.gender}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-bold">{isTamil ? 'பிழை: ' : 'Upload Error: '}</span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Drag & Drop / Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isTamil ? 'புண் புகைப்படம் (JPG, JPEG, PNG, WEBP)' : 'Wound Photograph (JPG, PNG, WEBP)'}
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-400 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {isTamil ? 'படத்தை இங்கே இழுக்கவும் அல்லது கிளிக் செய்யவும்' : 'Click to upload or drag and drop'}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isTamil
                    ? 'பாத புண்கள், காலின் புண்கள், சர்க்கரை நோய் காயங்கள், அழுத்தப் புண்கள்'
                    : 'Foot ulcers, leg wounds, diabetic ulcers, surgical dehiscence, pressure sores'}
                </p>
                <span className="inline-block mt-2 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  Max: 20 MB • Secure Server Storage
                </span>
              </div>
            ) : (
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-900 group">
                <img
                  src={previewUrl}
                  alt="Wound preview"
                  className="w-full h-52 object-contain mx-auto"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 font-bold text-xs hover:bg-white transition flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    {isTamil ? 'மாற்றவும்' : 'Change Image'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
                  >
                    {isTamil ? 'நீக்கு' : 'Remove'}
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-900/80 text-[10px] text-white font-mono">
                  {selectedFile?.name} ({(selectedFile?.size! / (1024 * 1024)).toFixed(2)} MB)
                </div>
              </div>
            )}
          </div>

          {/* Scale Marker & Photographic Limitation Info Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">
                {isTamil ? 'அளவு மற்றும் புகைப்பட எல்லைகள்: ' : 'Scale & Calibration Notice: '}
              </span>
              {isTamil
                ? 'ஒரு அளவுகோல் அல்லது அளவு குறியீடு படத்தில் தெளிவாகத் தெரிந்தால் மட்டுமே உண்மையான பரப்பளவு கணக்கிடப்படும். குறியீடு இல்லையெனில், புகைப்படத்திலிருந்து துல்லியமான அளவை கணக்கிட முடியாது.'
                : 'Physical dimensions are calculated only when a calibrated scale marker or ruler is visible. Without a marker, dimensions cannot be calculated from a photograph alone.'}
            </div>
          </div>

          {/* Metadata Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visit / Examination Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                <span>{isTamil ? 'பரிசோதனை தேதி' : 'Examination / Visit Date'}</span>
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>

            {/* Wound Category Tag */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-rose-500" />
                <span>{isTamil ? 'புண் வகை குறிப்பு' : 'Wound Type Classification'}</span>
              </label>
              <select
                value={woundTypeTag}
                onChange={(e) => setWoundTypeTag(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              >
                {WOUND_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Anatomical Location Dropdown */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{isTamil ? 'உடல் இருப்பிடம்' : 'Anatomical Wound Location'}</span>
              </label>
              <select
                value={woundLocation}
                onChange={(e) => setWoundLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              >
                {COMMON_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Location if Selected */}
            {woundLocation === 'Other / Custom Anatomical Site' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isTamil ? 'தனிப்பயன் இருப்பிடம் குறிப்பிடவும்' : 'Specify Custom Location'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Left Dorsal Forefoot, 3cm distal to ankle"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>
            )}

            {/* Doctor Clinical Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{isTamil ? 'மருத்துவர் குறிப்புகள் (விருப்பத்தேர்வு)' : 'Doctor Preliminary Observations (Optional)'}</span>
              </label>
              <textarea
                rows={3}
                placeholder={
                  isTamil
                    ? 'காயத்தின் முந்தைய வரலாறு, வலி, தற்போதைய மருந்து மாற்றங்கள்...'
                    : 'Duration, prior offloading, local pain or tenderness, current dressing regimen...'
                }
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isTamil ? 'ரத்துசெய்' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>{isTamil ? 'AI பகுப்பாய்வு நடக்கிறது...' : 'Analyzing Wound with AI...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isTamil ? 'படத்தை ஆராய்ந்து சேமிக்க' : 'Analyze & Save Assessment'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
