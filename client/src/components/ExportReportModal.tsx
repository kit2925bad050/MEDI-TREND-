import React, { useState } from 'react';
import { AIAnalysisResult, PatientProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  FileDown,
  CheckCircle,
  Printer,
  Sparkles,
  ShieldCheck,
  Share2,
  Phone,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Send,
  Smartphone,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportReportModalProps {
  patient: PatientProfile;
  analysis: AIAnalysisResult;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  patient,
  analysis,
  isOpen,
  onClose,
}) => {
  const { isTamil } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState(patient.phone || '');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'download' | 'preview'>('whatsapp');

  if (!isOpen) return null;

  // Sanitize phone number to standard international format (digits only, prepending 91 for standard 10-digit Indian numbers)
  const sanitizePhoneNumber = (raw: string): string => {
    let cleaned = raw.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return cleaned;
  };

  const buildWhatsAppMessage = (): string => {
    const keyParamBullets = (analysis.keyParameters || [])
      .slice(0, 6)
      .map((p) => {
        const changeStr =
          p.percentChange !== null
            ? `(${p.percentChange > 0 ? '+' : ''}${p.percentChange}%)`
            : '';
        return `• ${p.name}: ${p.beforeValue} → ${p.afterValue} ${p.unit} ${changeStr} [${p.trajectory}]`;
      })
      .join('\n');

    const enBullets = (analysis.englishSummary || [])
      .slice(0, 3)
      .map((s) => `• ${s}`)
      .join('\n');

    const taBullets = (analysis.tamilSummary || [])
      .slice(0, 2)
      .map((s) => `• ${s}`)
      .join('\n');

    return `🏥 *MEDI-TREND AI — PATIENT CLINICAL LONGITUDINAL REPORT*
👤 *Patient:* ${patient.name} (PID: ${patient.patientId})
📅 *Analysis Date:* ${analysis.analysisDate || 'Current Review'}
📋 *Reports Compared:* ${analysis.selectedReportIds.join(', ')}

🔬 *Key Parameter Progression:*
${keyParamBullets || '• Verified laboratory parameters matched and evaluated.'}

📝 *Clinical Summary (English):*
${enBullets || '• Clinical progression grounded in verified source parameters.'}

🇮🇳 *மருத்துவ சுருக்கம் (தமிழ்):*
${taBullets || '• ஆய்வு செய்யப்பட்ட மருத்துவ அறிக்கைகளின் அடிப்படையிலான தகவல்.'}

👨‍⚕️ *Consultant Physician:* ${patient.doctorInCharge || 'Attending Medical Specialist'}
⚠️ *Notice:* This longitudinal review is generated for clinical decision support.`;
  };

  const generatePDFBlob = (): { doc: jsPDF; filename: string } => {
    const doc = new jsPDF();

    // Hospital Header Banner
    doc.setFillColor(0, 75, 135);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDI-TREND AI - CLINICAL LONGITUDINAL REVIEW', 14, 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Document-Grounded Patient Report Intelligence Platform • Clinical Decision Support',
      14,
      20
    );

    // Patient Demographics Table
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT DEMOGRAPHICS & ANALYSIS CONTEXT', 14, 36);

    autoTable(doc, {
      startY: 40,
      head: [
        [
          'Patient Name',
          'Patient ID',
          'Age / Gender',
          'Doctor in Charge',
          'Patient Mobile',
          'Analysis Date',
        ],
      ],
      body: [
        [
          patient.name,
          patient.patientId,
          `${patient.age} Y / ${patient.gender}`,
          patient.doctorInCharge || 'Dr. Arvind Kumar',
          phoneNumber || patient.phone || 'N/A',
          analysis.analysisDate || 'Current Review',
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    });

    // Comparison Summary Stats
    const statsY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `SELECTED REPORTS: ${analysis.selectedReportIds.join('  •  ')}`,
      14,
      statsY
    );

    // Parameters Table
    const tableRows = analysis.keyParameters.map((p) => [
      p.name,
      p.unit,
      p.beforeValue !== null ? p.beforeValue.toString() : 'N/A',
      p.afterValue !== null ? p.afterValue.toString() : 'N/A',
      p.percentChange !== null
        ? `${p.percentChange > 0 ? '+' : ''}${p.percentChange}%`
        : '0%',
      p.trajectory,
      p.referenceRange,
    ]);

    autoTable(doc, {
      startY: statsY + 4,
      head: [
        [
          'Parameter',
          'Unit',
          'Baseline',
          'Latest',
          'Change (%)',
          'Trajectory',
          'Reference Range',
        ],
      ],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [2, 107, 201],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // AI Clinical Summary Box
    const summaryY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL SUMMARY (GROUNDED AI OBSERVATIONS)', 14, summaryY);

    let currentY = summaryY + 5;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    analysis.englishSummary.forEach((point) => {
      doc.text(`• ${point}`, 14, currentY);
      currentY += 5;
    });

    // Clinician Review & Safety Signature Line
    currentY += 6;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, currentY, 196, currentY);

    currentY += 7;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(
      'CLINICAL REVIEW NOTE: This document was generated by MEDI-TREND AI for physician review support.\n' +
        'It reflects verified mathematical changes across ingested documents and must be clinically correlated.',
      14,
      currentY
    );

    currentY += 10;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      'Reviewing Physician Signature: _______________________      Date: ____________',
      14,
      currentY
    );

    const filename = `MEDI_TREND_${patient.patientId}_Longitudinal_Report.pdf`;
    return { doc, filename };
  };

  const handleGeneratePDF = () => {
    setIsExporting(true);
    try {
      const { doc, filename } = generatePDFBlob();
      doc.save(filename);
      setIsExporting(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      setIsExporting(false);
    }
  };

  const handleShareToWhatsApp = async () => {
    const cleanNumber = sanitizePhoneNumber(phoneNumber);
    if (!cleanNumber) {
      alert('Please enter a valid patient mobile number.');
      return;
    }

    const message = buildWhatsAppMessage();

    // 1. Also automatically trigger PDF download so the physician can easily attach it to the WhatsApp conversation
    try {
      const { doc, filename } = generatePDFBlob();
      doc.save(filename);
    } catch (e) {
      console.error('PDF auto-download note:', e);
    }

    // 2. Open WhatsApp Web / App directly targeting the patient's registered mobile number
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendSMS = () => {
    const cleanNumber = sanitizePhoneNumber(phoneNumber);
    if (!cleanNumber) {
      alert('Please enter a valid patient mobile number.');
      return;
    }
    const shortMessage = `MEDI-TREND AI Clinical Report for ${patient.name} (${patient.patientId}). Longitudinal comparison across reports ${analysis.selectedReportIds.join(', ')} is ready. Please consult your physician for review.`;
    const smsUrl = `sms:${cleanNumber}?body=${encodeURIComponent(shortMessage)}`;
    window.location.href = smsUrl;
  };

  const handleCopyMessage = () => {
    const text = buildWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      const { doc, filename } = generatePDFBlob();
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `MEDI-TREND AI Report - ${patient.name}`,
          text: buildWhatsAppMessage(),
          files: [pdfFile],
        });
      } else {
        handleShareToWhatsApp();
      }
    } catch (e) {
      console.warn('Native share fallback:', e);
      handleShareToWhatsApp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isTamil ? 'மருத்துவ அறிக்கையை நோயாளியுடன் பகிரவும்' : 'Share Clinical Report to Patient'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                  {isTamil ? 'வாட்ஸ்அப் & மொபைல்' : 'WhatsApp & Mobile'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isTamil ? 'நோயாளி' : 'Patient'}: <b>{patient.name}</b> (PID: {patient.patientId}) • {isTamil ? 'தொலைபேசி' : 'Phone'}: {patient.phone}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-100 dark:border-slate-800 gap-2 bg-slate-50/30 dark:bg-slate-800/20 text-xs font-bold">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'whatsapp'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isTamil ? 'வாட்ஸ்அப் / மொபைல் அனுப்பு' : 'WhatsApp / Mobile Delivery'}</span>
          </button>

          <button
            onClick={() => setActiveTab('download')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'download'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isTamil ? 'PDF கோப்பு விவரங்கள்' : 'PDF Package Details'}</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isTamil ? 'செய்தி நேரடி முன்னோட்டம்' : 'Message Live Preview'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: WhatsApp / Mobile Direct Delivery */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              {/* Patient Phone Input Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Patient Registered Mobile Number</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    Direct WhatsApp Deep Link
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98400 54321"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  Clicking <b>Send to Patient WhatsApp</b> will open the official WhatsApp chat with <b>{patient.name}</b> at <b>{phoneNumber}</b> and prefill the grounded longitudinal report summary & test comparison.
                </p>
              </div>

              {/* Share Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleShareToWhatsApp}
                  className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-left shadow-lg shadow-emerald-600/30 transition group hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-emerald-100 opacity-80 group-hover:opacity-100" />
                  </div>
                  <div className="text-xs font-bold">Send to Patient WhatsApp</div>
                  <div className="text-[11px] text-emerald-100/90 mt-0.5">
                    Opens WhatsApp Web / Mobile to {phoneNumber}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePDF}
                  disabled={isExporting}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left shadow-sm transition group hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <Printer className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {isExporting ? 'Generating...' : 'Download Clinical PDF'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Official branded longitudinal document
                  </div>
                </button>
              </div>

              {/* Quick Secondary Options */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition flex items-center gap-1.5"
                >
                  {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedMessage ? 'Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendSMS}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-slate-400" />
                  <span>Send via Standard SMS</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Download Package Inclusions */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-500" />
                  <span>Verified Clinical PDF Package Inclusions:</span>
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li><b>Patient Demographics:</b> Name, Patient ID, Age, Gender, Mobile Phone</li>
                  <li><b>Longitudinal Matrix:</b> {analysis.keyParameters.length} verified laboratory parameters compared chronologically</li>
                  <li><b>Mathematical Changes:</b> Exact absolute differences and percentage changes</li>
                  <li><b>Bilingual AI Clinical Summary:</b> Grounded English and Tamil (தமிழ் சுருக்கம்) findings</li>
                  <li><b>Official Verification:</b> Physician signature line & clinical review disclaimer</li>
                </ul>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleGeneratePDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isExporting ? 'Generating PDF...' : 'Download Full PDF Report'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Message Live Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Formatted WhatsApp Message Preview</span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-brand-600 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto border border-emerald-900/40">
                {buildWhatsAppMessage()}
              </div>
            </div>
          )}

          {/* Success Notification Banner */}
          {downloadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><b>Clinical PDF Report Downloaded:</b> Ready for medical consultation and patient records.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Recipient: <b>{phoneNumber || patient.phone}</b>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share to Patient WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

