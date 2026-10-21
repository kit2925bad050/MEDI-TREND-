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
  Trash2,
  Plus,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import { PatientProfile, WoundVisitRecord } from '../../types';
import { createWoundVisit, uploadWoundVisitPhotos } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface MonthlyVisitUploadModalProps {
  patient: PatientProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVisit: WoundVisitRecord) => void;
  existingVisit?: WoundVisitRecord | null;
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

export const MonthlyVisitUploadModal: React.FC<MonthlyVisitUploadModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSuccess,
  existingVisit,
}) => {
  const { isTamil } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [woundLocation, setWoundLocation] = useState<string>(
    existingVisit?.wound_location || COMMON_LOCATIONS[0]
  );
  const [customLocation, setCustomLocation] = useState<string>('');
  const [woundTypeTag, setWoundTypeTag] = useState<string>(
    existingVisit?.wound_type_tag || WOUND_TYPES[0]
  );
  const [visitDate, setVisitDate] = useState<string>(
    existingVisit?.visit_date || new Date().toISOString().split('T')[0]
  );
  const [doctorNotes, setDoctorNotes] = useState<string>(
    existingVisit?.doctor_notes || ''
  );
  const [allowDuplicateDate, setAllowDuplicateDate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate formatted Month & Year from visitDate
  const getMonthLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
        return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      }
    } catch {}
    return dateStr;
  };

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentCount = (existingVisit?.photo_count || 0) + selectedFiles.length;
    if (currentCount + files.length > 10) {
      setErrorMessage(
        isTamil
          ? `ஒரு வருகைக்கு அதிகபட்சம் 10 புகைப்படங்கள் மட்டுமே அனுமதிக்கப்படும். ஏற்கனவே ${currentCount} படங்கள் உள்ளன.`
          : `Maximum of 10 photos allowed per visit. You already have ${currentCount} photos.`
      );
      return;
    }

    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    const newItems: { file: File; preview: string }[] = [];

    for (const file of files) {
      if (!validExtensions.includes(file.type)) {
        setErrorMessage(
          isTamil
            ? `தவறான கோப்பு வடிவம்: ${file.name}. JPG, PNG அல்லது WEBP வடிவங்களை மட்டுமே பதிவேற்றவும்.`
            : `Invalid file format for "${file.name}". Only JPG, PNG, and WEBP are supported.`
        );
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorMessage(
          isTamil
            ? `கோப்பு ${file.name} 20MB வரம்பை தாண்டியுள்ளது.`
            : `Image file "${file.name}" exceeds the 20MB limit.`
        );
        return;
      }
      newItems.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setSelectedFiles((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const totalPhotos = (existingVisit?.photo_count || 0) + selectedFiles.length;
    if (totalPhotos < 1) {
      setErrorMessage(
        isTamil
          ? 'குறைந்தபட்சம் 1 புண் புகைப்படத்தையாவது தேர்ந்தெடுக்கவும்.'
          : 'Please select at least 1 wound photograph to upload for this visit.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const finalLocation =
        woundLocation === 'Other / Custom Anatomical Site'
          ? customLocation.trim() || 'Custom Anatomical Site'
          : woundLocation;

      // 1. Create or get existing visit
      let visitRecord: WoundVisitRecord;
      if (existingVisit) {
        visitRecord = existingVisit;
      } else {
        visitRecord = await createWoundVisit(patient.patientId, {
          visit_date: visitDate,
          wound_location: finalLocation,
          wound_type_tag: woundTypeTag,
          doctor_notes: doctorNotes,
          allow_duplicate_date: allowDuplicateDate,
        });
      }

      // 2. Upload photos to this visit if any were selected
      if (selectedFiles.length > 0) {
        const rawFiles = selectedFiles.map((s) => s.file);
        visitRecord = await uploadWoundVisitPhotos(patient.patientId, visitRecord.visit_id, rawFiles);
      }

      onSuccess(visitRecord);
      handleClose();
    } catch (err: any) {
      console.error('Visit save error:', err);
      setErrorMessage(
        err.message ||
          (isTamil
            ? 'வருகைப் பதிவேற்றம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.'
            : 'Failed to record wound visit. Please check the network and try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    selectedFiles.forEach((s) => URL.revokeObjectURL(s.preview));
    setSelectedFiles([]);
    setErrorMessage(null);
    onClose();
  };

  const totalPhotosCount = (existingVisit?.photo_count || 0) + selectedFiles.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {existingVisit
                  ? isTamil ? 'கூடுதல் புகைப்படங்கள் சேர்க்கவும்' : 'Add Photos to Monthly Visit'
                  : isTamil ? 'புதிய மாதாந்திர புண் வருகைப் பதிவு' : 'New Monthly Wound Visit'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isTamil
                ? 'மாதாந்திர வருகைக்கான புகைப்படங்களைப் பதிவேற்றி காத்திருப்பு நிலையில் சேமிக்கவும்'
                : 'Upload 1 to 10 photos for this patient visit. Photos will be kept pending until you click Analyze Photos.'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Identity Strip */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">{patient.name}</div>
              <div className="text-[11px] text-slate-500 font-mono">ID: {patient.patientId} • {patient.age} Y / {patient.gender}</div>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[11px]">
              {getMonthLabel(visitDate)}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Visit Date & Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>{isTamil ? 'வருகை தேதி' : 'Visit Date'}</span>
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                disabled={Boolean(existingVisit)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>{isTamil ? 'மாதக் குறியீடு' : 'Visit Month'}</span>
              </label>
              <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between">
                <span>{getMonthLabel(visitDate)}</span>
                <span className="text-[10px] text-slate-500 font-mono">Auto-Indexed</span>
              </div>
            </div>
          </div>

          {/* Location & Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{isTamil ? 'உடற்கூறியல் இடம்' : 'Wound Location'}</span>
              </label>
              <select
                value={woundLocation}
                onChange={(e) => setWoundLocation(e.target.value)}
                disabled={Boolean(existingVisit)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500"
              >
                {COMMON_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-rose-500" />
                <span>{isTamil ? 'புண் வகை' : 'Provisional Clinical Tag'}</span>
              </label>
              <select
                value={woundTypeTag}
                onChange={(e) => setWoundTypeTag(e.target.value)}
                disabled={Boolean(existingVisit)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500"
              >
                {WOUND_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Location if selected */}
          {woundLocation === 'Other / Custom Anatomical Site' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isTamil ? 'தனிப்பயன் இருப்பிடம் குறிப்பிடவும்' : 'Specify Custom Location'}
              </label>
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="e.g. Dorsal foot over 2nd metatarsal head"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Photo Upload Zone & Previews */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                <span>{isTamil ? 'புண் புகைப்படங்கள் (1 முதல் 10 படங்கள்)' : 'Wound Photos (1–10 Photos)'}</span>
              </label>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                totalPhotosCount > 10 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {totalPhotosCount} / 10 photos
              </span>
            </div>

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFilesAdded}
              className="hidden"
            />

            {/* Upload Box / Dropzone */}
            {totalPhotosCount < 10 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-2xl p-5 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 hover:bg-rose-50/30 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">
                  {isTamil ? 'புகைப்படங்களை கிளிக் செய்து தேர்ந்தெடுக்கவும்' : 'Click to select or drop photos'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  JPG, PNG, WEBP (Max 20MB per photo • 1 to 10 photos per visit)
                </p>
              </div>
            )}

            {/* Existing Photos (if editing/adding to visit) */}
            {existingVisit && existingVisit.photos.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">Previously uploaded in this visit:</span>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {existingVisit.photos.map((p, i) => (
                    <div key={p.photo_id} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square group bg-slate-100">
                      <img src={p.image_url} alt={`Existing Photo ${i+1}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 left-1 px-1 bg-black/60 text-[9px] text-white rounded font-mono">
                        #{i+1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Photos Preview Grid */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ready to add ({selectedFiles.length} photos):</span>
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {selectedFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square group bg-slate-100 shadow-sm"
                    >
                      <img
                        src={item.preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSelectedFile(idx);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600 text-white shadow-md hover:bg-rose-700 transition opacity-90 hover:opacity-100"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-[9px] text-white rounded font-mono truncate max-w-[80%]">
                        Photo #{totalPhotosCount - selectedFiles.length + idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Doctor Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>{isTamil ? 'மருத்துவர் குறிப்புகள் (விருப்பத்தேர்வு)' : 'Clinician Observation Notes (Optional)'}</span>
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Patient reports improved dressing adherence; localized serosanguineous drainage noted."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Pending Policy Banner */}
          <div className="p-3.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-start gap-2.5 text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
            <div>
              <span className="font-bold">Pending State Protocol: </span>
              {isTamil
                ? 'புகைப்படங்கள் உடனடியாக பகுப்பாய்வு செய்யப்படாது. அவை பாதுகாப்பாக "காத்திருப்பு" நிலையில் சேமிக்கப்படும். நீங்கள் பின்னர் "புகைப்படங்களை பகுப்பாய்வு செய்" என்ற பொத்தானை கிளிக் செய்து ஆய்வு செய்யலாம்.'
                : 'Uploading photos will NOT automatically trigger AI analysis. All photos remain in a Pending state. You can add or remove photos at any time and click "Analyze Photos" when ready.'}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-50"
            >
              {isTamil ? 'ரத்து செய்' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalPhotosCount < 1}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isTamil ? 'சேமிக்கப்படுகிறது...' : 'Saving Photos...'}</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {existingVisit
                      ? isTamil ? `புகைப்படங்களைச் சேர் (${selectedFiles.length})` : `Add ${selectedFiles.length} Photos`
                      : isTamil ? `வருகையைப் பதிவு செய் (${totalPhotosCount} படங்கள்)` : `Save Visit (${totalPhotosCount} Photos)`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
