import React, { useState } from 'react';
import {
  WoundAssessmentRecord,
  PatientProfile,
  WoundComparisonResult,
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  FileDown,
  Printer,
  Sparkles,
  ShieldCheck,
  Check,
  Smartphone,
  Copy,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { WoundLanguageMode, translateWoundMedicalText } from '../../utils/woundTranslation';

interface ExportWoundReportModalProps {
  patient: PatientProfile;
  assessment: WoundAssessmentRecord;
  comparison?: WoundComparisonResult | null;
  isOpen: boolean;
  onClose: () => void;
  mode?: WoundLanguageMode;
}

export const ExportWoundReportModal: React.FC<ExportWoundReportModalProps> = ({
  patient,
  assessment,
  comparison,
  isOpen,
  onClose,
  mode = 'en',
}) => {
  const { isTamil } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen) return null;

  const buildSummaryText = (): string => {
    const vc = assessment.visible_characteristics;
    const tb = vc.tissue_breakdown;
    const recs = assessment.clinical_recommendations;

    const enText = `🏥 *MEDI-TREND AI — WOUND & ULCER ASSESSMENT SUMMARY*
👤 *Patient:* ${patient.name} (PID: ${patient.patientId}) • ${patient.age} Y / ${patient.gender}
📍 *Location:* ${assessment.wound_location} (${assessment.wound_type_tag})
📅 *Visit Date:* ${assessment.visit_date}
⚠️ *Severity:* ${assessment.severity_indicator}

🔬 *Visible Tissue Bed Breakdown:*
• Granulation: ${tb.granulation_percent}%
• Non-viable Slough: ${tb.slough_percent}%
• Necrotic Eschar: ${tb.necrotic_percent}%
• Periwound: ${vc.periwound_redness}

📏 *Dimensions:* ${
      assessment.dimensions_info.has_scale_marker
        ? `${assessment.dimensions_info.length_cm} x ${assessment.dimensions_info.width_cm} cm (${assessment.dimensions_info.surface_area_cm2} cm²)`
        : 'Scale marker not detected; dimensions cannot be measured from photo.'
    }

💡 *Clinical Recommendations:*
• Assessments: ${(recs.recommended_assessments || []).slice(0, 2).join('; ')}
• Wound Care: ${(recs.wound_care_considerations || []).slice(0, 2).join('; ')}
• Specialist Referral: ${(recs.specialist_referral_triggers || []).slice(0, 1).join('; ')}

👨‍⚕️ *Doctor Notes:* ${assessment.doctor_notes || 'Pending clinician sign-off.'}
⚠️ *Notice:* Decision-support aid only; final diagnosis rests with treating physician.`;

    if (mode === 'en') return enText;

    const taText = `🏥 *MEDI-TREND AI — புண் மற்றும் புண் மதிப்பாய்வு சுருக்கம்*
👤 *நோயாளி:* ${patient.name} (PID: ${patient.patientId}) • ${patient.age} Y / ${patient.gender}
📍 *இடம்:* ${assessment.wound_location} (${assessment.wound_type_tag})
📅 *பரிசோதனை தேதி:* ${assessment.visit_date}
⚠️ *தீவிரம்:* ${translateWoundMedicalText(assessment.severity_indicator)}

🔬 *திசு கலவை பகுப்பாய்வு:*
• சிவப்பு தசை (Granulation): ${tb.granulation_percent}%
• மஞ்சள் சவ்வு (Slough): ${tb.slough_percent}%
• கருப்பு நசிவு திசு (Necrotic): ${tb.necrotic_percent}%
• சுற்றியுள்ள சிவத்தல்: ${translateWoundMedicalText(vc.periwound_redness)}

📏 *அளவீடு:* ${
      assessment.dimensions_info.has_scale_marker
        ? `${assessment.dimensions_info.length_cm} x ${assessment.dimensions_info.width_cm} cm (${assessment.dimensions_info.surface_area_cm2} cm²)`
        : 'அளவீட்டு குறிப்பான் இல்லை; புகைப்படத்திலிருந்து அளவிட முடியாது.'
    }

💡 *மருத்துவ பரிந்துரைகள்:*
• சோதனைகள்: ${(recs.recommended_assessments || []).slice(0, 2).map(a => translateWoundMedicalText(a)).join('; ')}
• புண் பராமரிப்பு: ${(recs.wound_care_considerations || []).slice(0, 2).map(c => translateWoundMedicalText(c)).join('; ')}
• சிறப்பு மருத்துவர் பரிந்துரை: ${(recs.specialist_referral_triggers || []).slice(0, 1).map(r => translateWoundMedicalText(r)).join('; ')}

👨‍⚕️ *மருத்துவர் குறிப்புகள்:* ${assessment.doctor_notes || 'மருத்துவர் கையொப்பம் நிலுவையில் உள்ளது.'}
⚠️ *அறிவிப்பு:* மருத்துவ முடிவெடுக்கும் உதவி மட்டுமே; இறுதி நோயறிதல் சிகிச்சை அளிக்கும் மருத்துவருக்கே உரியது.`;

    if (mode === 'ta') return taText;

    return `=== English ===\n${enText}\n\n=== தமிழ் ===\n${taText}`;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(buildSummaryText());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const generateWoundPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      // Top Banner
      doc.setFillColor(159, 18, 57); // Rose-800
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MEDI-TREND AI — WOUND & ULCER CLINICAL ASSESSMENT', 14, 12);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'AI-Assisted Wound Bed Evaluation & Longitudinal Progress Report • Clinical Decision Support',
        14,
        20
      );

      // Patient Demographics Table
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PATIENT DEMOGRAPHICS & CLINICAL CONTEXT', 14, 36);

      autoTable(doc, {
        startY: 40,
        head: [
          [
            'Patient Name',
            'Patient ID',
            'Age / Gender',
            'Attending Physician',
            'Visit Date',
            'Anatomical Location',
          ],
        ],
        body: [
          [
            patient.name,
            patient.patientId,
            `${patient.age} Y / ${patient.gender}`,
            patient.doctorInCharge || 'Dr. Arvind Kumar',
            assessment.visit_date,
            assessment.wound_location,
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

      // Section: Wound Bed Characteristics
      const charsY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('VISIBLE WOUND BED TISSUE CHARACTERISTICS', 14, charsY);

      const vc = assessment.visible_characteristics;
      const tb = vc.tissue_breakdown;

      autoTable(doc, {
        startY: charsY + 4,
        head: [['Parameter', 'Visible Finding', 'Clinical Significance']],
        body: [
          [
            'Tissue Breakdown',
            `Granulation: ${tb.granulation_percent}% | Slough: ${tb.slough_percent}% | Necrotic: ${tb.necrotic_percent}% | Epithelial: ${tb.epithelial_percent}%`,
            'Proportion of viable regenerative tissue vs. non-viable barrier',
          ],
          [
            'Primary Bed Appearance',
            vc.primary_bed_appearance,
            'Overall visual condition of base tissue',
          ],
          [
            'Periwound Erythema',
            vc.periwound_redness,
            'Indicator of localized vs. spreading inflammation',
          ],
          [
            'Visible Edema',
            vc.surrounding_swelling,
            'Fluid retention / microvascular compromise',
          ],
          [
            'Exudate / Discharge',
            `${vc.discharge_characteristics.amount || 'Scant'} - ${vc.discharge_characteristics.type || 'Serous'}`,
            'Moisture balance & infection surveillance',
          ],
          [
            'Physical Scale / Dimensions',
            assessment.dimensions_info.has_scale_marker
              ? `${assessment.dimensions_info.length_cm} x ${assessment.dimensions_info.width_cm} cm (Area: ${assessment.dimensions_info.surface_area_cm2} cm²)`
              : 'Scale marker not detected; dimensions cannot be measured from photo',
            assessment.dimensions_info.scale_notes,
          ],
        ],
        theme: 'striped',
        headStyles: {
          fillColor: [255, 228, 230],
          textColor: [159, 18, 57],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8 },
      });

      // Section: Severity & Differential Considerations
      const diffY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `SEVERITY INDICATOR: ${assessment.severity_indicator.toUpperCase()}`,
        14,
        diffY
      );

      const catRows = assessment.categories_considered.map((c) => [
        c.category,
        c.confidence,
        c.rationale,
      ]);

      autoTable(doc, {
        startY: diffY + 4,
        head: [['Wound Etiology Considered', 'Likelihood', 'Clinical Rationale']],
        body: catRows.length > 0 ? catRows : [['Unspecified Ulcer', 'Possible', 'Standard chronic wound evaluation']],
        theme: 'grid',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8 },
      });

      // Section: Clinical Recommendations & Surgical Considerations
      let recsY = (doc as any).lastAutoTable.finalY + 8;
      if (recsY > 230) {
        doc.addPage();
        recsY = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CLINICAL RECOMMENDATIONS & DECISION SUPPORT', 14, recsY);

      const recs = assessment.clinical_recommendations;
      autoTable(doc, {
        startY: recsY + 4,
        head: [['Recommendation Domain', 'Clinical Action Points']],
        body: [
          [
            'Recommended Clinical Assessments',
            (recs.recommended_assessments || []).join('\n• '),
          ],
          [
            'General Wound Care Considerations',
            (recs.wound_care_considerations || []).join('\n• '),
          ],
          [
            'Specialist Referral Triggers',
            (recs.specialist_referral_triggers || []).join('\n• '),
          ],
          [
            'Pre-Surgical Evaluation Factors',
            (recs.surgical_evaluation_factors || []).join('\n• '),
          ],
          [
            'Urgent Warning Signs (Red Flags)',
            (recs.urgent_warning_signs || []).join('\n• '),
          ],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [254, 242, 242],
          textColor: [153, 27, 27],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: { fontSize: 7.5 },
      });

      // Section: Correlated Approved Laboratory Reports
      if (
        assessment.linked_report_summary &&
        assessment.linked_report_summary.correlated_parameters &&
        assessment.linked_report_summary.correlated_parameters.length > 0
      ) {
        let labY = (doc as any).lastAutoTable.finalY + 8;
        if (labY > 230) {
          doc.addPage();
          labY = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `CORRELATED APPROVED LAB BIOMARKERS (${assessment.linked_report_summary.approved_report_count} Reports)`,
          14,
          labY
        );

        const labRows = assessment.linked_report_summary.correlated_parameters.map(
          (b) => [b.parameter, `${b.latest_value} ${b.unit}`, b.status, b.report_date, b.trend_text || '']
        );

        autoTable(doc, {
          startY: labY + 4,
          head: [['Biomarker', 'Value', 'Status', 'Date', 'Trend']],
          body: labRows,
          theme: 'striped',
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 8,
          },
          bodyStyles: { fontSize: 7.5 },
        });
      }

      // Longitudinal Comparison Section (if available)
      if (comparison) {
        let compY = (doc as any).lastAutoTable.finalY + 8;
        if (compY > 240) {
          doc.addPage();
          compY = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `LONGITUDINAL COMPARISON: ${comparison.progress_status.toUpperCase()}`,
          14,
          compY
        );

        autoTable(doc, {
          startY: compY + 4,
          head: [['Metric', 'Baseline Examination', 'Current Examination', 'Observed Delta']],
          body: [
            [
              'Examination Date',
              comparison.baseline_date,
              comparison.current_date,
              'Consecutive follow-up',
            ],
            [
              'Granulation Tissue',
              `${comparison.tissue_changes.baseline_breakdown.granulation_percent}%`,
              `${comparison.tissue_changes.current_breakdown.granulation_percent}%`,
              `${comparison.tissue_changes.granulation_delta > 0 ? '+' : ''}${comparison.tissue_changes.granulation_delta}%`,
            ],
            [
              'Slough Tissue',
              `${comparison.tissue_changes.baseline_breakdown.slough_percent}%`,
              `${comparison.tissue_changes.current_breakdown.slough_percent}%`,
              `${comparison.tissue_changes.slough_delta > 0 ? '+' : ''}${comparison.tissue_changes.slough_delta}%`,
            ],
            [
              'Necrotic Tissue',
              `${comparison.tissue_changes.baseline_breakdown.necrotic_percent}%`,
              `${comparison.tissue_changes.current_breakdown.necrotic_percent}%`,
              `${comparison.tissue_changes.necrotic_delta > 0 ? '+' : ''}${comparison.tissue_changes.necrotic_delta}%`,
            ],
          ],
          theme: 'grid',
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 8,
          },
          bodyStyles: { fontSize: 8 },
        });
      }

      // Doctor Notes & Sign-off Block
      let signY = (doc as any).lastAutoTable.finalY + 10;
      if (signY > 240) {
        doc.addPage();
        signY = 20;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('TREATING PHYSICIAN NOTES & CLINICAL SIGN-OFF:', 14, signY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(
        assessment.doctor_notes || 'Clinical notes recorded in patient electronic medical file.',
        14,
        signY + 6
      );

      doc.setDrawColor(203, 213, 225);
      doc.line(14, signY + 20, 90, signY + 20);
      doc.setFontSize(7.5);
      doc.text(
        `Attending Physician: ${patient.doctorInCharge || 'Dr. Arvind Kumar'}`,
        14,
        signY + 25
      );
      doc.text(
        `Review Status: ${assessment.review_status} • Date: ${assessment.reviewed_at || assessment.upload_date}`,
        14,
        signY + 29
      );

      // Mandatory Medical Disclaimer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'LEGAL NOTICE: This AI-assisted wound assessment is a clinical decision-support aid. It does not replace clinical judgment, physical palpation, vascular Doppler evaluation, or histological diagnosis. Never prescribe or perform surgery solely from photograph observations.',
        14,
        pageHeight - 8
      );

      const fileName = `Wound_Assessment_${patient.patientId}_${assessment.visit_date}.pdf`;
      doc.save(fileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isTamil ? 'புண் மதிப்பாய்வு அறிக்கை ஏற்றுமதி' : 'Export Wound Clinical Assessment'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {patient.name} ({patient.patientId}) • {assessment.visit_date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <span className="font-bold">
                {isTamil ? 'மருத்துவமனை வடிவமைப்பு PDF: ' : 'Hospital-Grade Clinical PDF: '}
              </span>
              {isTamil
                ? 'அனைத்து புண் பண்புகள், திசு சதவீதம், மருத்துவ பரிந்துரைகள் மற்றும் அங்கீகரிக்கப்பட்ட ஆய்வக முடிவுகளுடன் கூடிய முழுமையான அறிக்கை.'
                : 'Generates a branded hospital PDF containing tissue breakdowns, clinical decision support recommendations, warning signs, and correlated approved lab reports.'}
            </div>
          </div>

          {/* Quick Details Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{isTamil ? 'உடல் இருப்பிடம்:' : 'Anatomical Location:'}</span>
              <b className="text-slate-900 dark:text-white">{assessment.wound_location}</b>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{isTamil ? 'தீவிரத்தன்மை:' : 'Severity Indicator:'}</span>
              <b className="text-slate-900 dark:text-white">{assessment.severity_indicator}</b>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{isTamil ? 'சிவப்பு தசை (Granulation):' : 'Granulation:'}</span>
              <b className="text-emerald-600 dark:text-emerald-400 font-mono">
                {assessment.visible_characteristics.tissue_breakdown.granulation_percent}%
              </b>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{isTamil ? 'ஆய்வு நிலை:' : 'Review Status:'}</span>
              <b className="text-slate-900 dark:text-white">{assessment.review_status}</b>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={generateWoundPDF}
              disabled={isExporting}
              className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>
                {isExporting
                  ? isTamil ? 'PDF தயாராகிறது...' : 'Generating PDF...'
                  : downloadSuccess
                  ? isTamil ? 'PDF பதிவிறக்கப்பட்டது!' : 'PDF Downloaded!'
                  : isTamil ? 'மருத்துவமனை PDF பதிவிறக்கு' : 'Download Clinical PDF Assessment'}
              </span>
            </button>

            <button
              onClick={handleCopySummary}
              className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>
                {copiedSummary
                  ? isTamil ? 'சுருக்கம் நகலெடுக்கப்பட்டது!' : 'Summary Copied to Clipboard!'
                  : isTamil ? 'மருத்துவ குறிப்பு உரையை நகலெடு' : 'Copy Doctor Clinical Summary'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
