import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { compressAndResizeImage, getPatientInitials } from '../utils/avatar';
import { uploadReportToSupabaseStorage, supabase } from '../services/supabase';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  currentAvatarUrl?: string | null;
  onAvatarUpdated: (newUrl: string | null) => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  currentAvatarUrl,
  onAvatarUpdated,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const rawFile = e.target.files[0];
      setErrorMsg(null);
      try {
        const compressed = await compressAndResizeImage(rawFile);
        setSelectedFile(compressed);
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(compressed);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error processing image.');
      }
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile && !previewUrl) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      let finalUrl = previewUrl;

      // Upload to Supabase Storage if configured
      if (selectedFile) {
        const uploadedUrl = await uploadReportToSupabaseStorage(
          `avatars/${patientId}`,
          selectedFile
        );
        if (uploadedUrl) {
          finalUrl = uploadedUrl;
        }
      }

      onAvatarUpdated(finalUrl);
      setIsSaving(false);
      onClose();
    } catch (e: any) {
      console.warn('Fallback to local avatar preview:', e);
      onAvatarUpdated(previewUrl);
      setIsSaving(false);
      onClose();
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onAvatarUpdated(null);
    onClose();
  };

  const initials = getPatientInitials(patientName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Patient Profile Photo
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {patientName} ({patientId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 flex flex-col items-center">
          {errorMsg && (
            <div className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Large Circular Avatar Preview */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-brand-500/20 shadow-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              {previewUrl || currentAvatarUrl ? (
                <img
                  src={previewUrl || (currentAvatarUrl as string)}
                  alt="Preview"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-bold tracking-wider">
                  {initials}
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-md ring-2 ring-white dark:ring-slate-900 transition"
              title="Select New Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="text-center space-y-1">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {previewUrl || currentAvatarUrl
                ? 'Custom Photo Uploaded'
                : 'Showing Dynamic Initials Avatar'}
            </div>
            <div className="text-[11px] text-slate-400">
              Supported formats: JPG, PNG, WebP (Max 5MB) • Auto-compressed
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{previewUrl || currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
            </button>

            {(previewUrl || currentAvatarUrl) && (
              <button
                onClick={handleRemovePhoto}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-semibold transition"
                title="Remove photo and revert to initials"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePhoto}
            disabled={isSaving || !previewUrl}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl text-white transition ${
              previewUrl && !isSaving
                ? 'bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Storage...</span>
              </>
            ) : (
              <span>Save Profile Photo</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
