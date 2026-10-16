import time
import uuid
<<<<<<< HEAD
from typing import Dict, Any, List, Optional, Tuple
=======
from typing import Dict, Any, List, Optional
>>>>>>> origin/main
from ..models.schemas import (
    AIAnalysisResult,
    PairwiseComparison,
    ParameterComparison,
    ReportRecord,
    PatientProfile,
    AuditLogEntry
)
from ..services.numerical_validator import (
    normalize_parameter_name,
    calculate_numerical_comparison,
    PARAMETER_CONFIGS
)
from ..providers.ai_provider import ai_router


class LangGraphMedicalOrchestrator:
    """
<<<<<<< HEAD
    Production LangGraph Orchestration Pipeline for MEDI-TREND AI:
    1. Receive selected report IDs
    2. Retrieve structured report data
    3. Validate patient identity for each report
    4. Validate document completeness
    5. Normalize parameters
    6. Compare values & calculate numerical changes using backend logic
    7. Call multi-model fallback chain (Gemini -> Grok -> OpenRouter -> Grounded Engine)
    8. Validate AI response against schema
    9. Save analysis result and audit log
=======
    Hospital-grade Multi-Document Clinical Analysis Orchestrator for MEDI-TREND AI:
    Supports 1, 2, 5, 10, or more medical reports.
    - 1 Report: In-depth Single Document Clinical Intelligence Evaluation.
    - 2+ Reports: Chronological Longitudinal Multi-Document Comparative Analytics.
    - Deterministic numerical calculations: AI never invents laboratory numbers.
    - Evidence-based clinical reference guidance (e.g. ADA diabetes, AHA/ACC lipid thresholds).
    - Analysis completeness verification and bilingual summaries (English + Tamil).
>>>>>>> origin/main
    """
    def __init__(self):
        self.ai_engine = ai_router

    def run_analysis(
        self,
        patient: PatientProfile,
        selected_reports: List[ReportRecord],
        user_id: str = "dr_arvind_kumar",
        user_role: str = "DOCTOR",
        report_identity_status: Optional[Dict[str, Any]] = None
    ) -> AIAnalysisResult:
        start_time = time.time()
        analysis_id = f"ANL-{uuid.uuid4().hex[:8].upper()}"

        if not selected_reports:
            raise ValueError("At least 1 medical report must be selected for clinical analysis.")

<<<<<<< HEAD
        # 2. Patient identity verification check
        identity_statuses = {}
        has_mismatch = False
        has_unverified = False
        has_review_required = False

        for r in sorted_reports:
            if report_identity_status and r.reportId in report_identity_status:
                id_status = report_identity_status[r.reportId]
            else:
                id_status = {"status": "UNVERIFIED", "details": "Identity not verified during upload"}
            identity_statuses[r.reportId] = id_status

            status = id_status.get("status", "UNVERIFIED")
            if status == "MISMATCH":
                has_mismatch = True
            elif status == "UNVERIFIED":
                has_unverified = True
            elif status == "REVIEW_REQUIRED":
                has_review_required = True

        # 3. Build completeness status
        completeness = self._check_completeness(sorted_reports)

        # Determine overall analysis status
        if has_mismatch:
            analysis_status = "Patient Identity Mismatch"
        elif not completeness["complete"]:
            analysis_status = "Analysis Partially Complete"
        elif has_unverified or has_review_required:
            analysis_status = "Manual Review Required"
        else:
            analysis_status = "Analysis Complete"

        # 4. Build pairwise comparisons (only include verified reports)
        pairwise_list: List[PairwiseComparison] = []
=======
        # 1. Sort reports chronologically by date
        sorted_reports = sorted(selected_reports, key=lambda r: r.reportDate)

        # Mode A: Single Report In-Depth Evaluation (1 report selected)
        if len(sorted_reports) == 1:
            return self._run_single_report_analysis(
                patient, sorted_reports[0], analysis_id, start_time, user_id, user_role
            )

        # Mode B: Multi-Document Longitudinal Comparison (2, 5, 10+ reports selected)
        return self._run_multi_report_comparison(
            patient, sorted_reports, analysis_id, start_time, user_id, user_role
        )

    def _run_single_report_analysis(
        self,
        patient: PatientProfile,
        report: ReportRecord,
        analysis_id: str,
        start_time: float,
        user_id: str,
        user_role: str
    ) -> AIAnalysisResult:
        """Executes detailed clinical intelligence evaluation for a single selected laboratory report."""
        key_parameters: List[ParameterComparison] = []
        normal_cnt = 0
        elevated_cnt = 0
        low_cnt = 0

        for p_data in report.extractedParameters:
            k, canonical_name, cfg = normalize_parameter_name(p_data.parameterName)
            if k == "unknown_param":
                continue

            status = p_data.status or "Normal"
            if status in ("Elevated", "High", "Critical"):
                elevated_cnt += 1
                traj = "Needs Monitoring"
            elif status == "Low":
                low_cnt += 1
                traj = "Needs Monitoring"
            else:
                normal_cnt += 1
                traj = "Stable"

            comp = ParameterComparison(
                name=canonical_name,
                canonicalName=canonical_name,
                unit=p_data.unit or cfg.get("unit", ""),
                beforeValue=None,
                afterValue=p_data.value,
                baselineReportId=report.reportId,
                followUpReportId=report.reportId,
                baselineDate=report.reportDate,
                followUpDate=report.reportDate,
                absoluteChange=None,
                percentChange=None,
                trajectory=traj,
                status=status,
                referenceRange=p_data.referenceRange or cfg.get("standard_range", ""),
                sourcePages=[f"R:{report.reportId} p.{p_data.sourcePage}"],
                isComparable=True,
                trendHistory=[{
                    "reportId": report.reportId,
                    "reportDate": report.reportDate,
                    "provider": report.provider,
                    "value": p_data.value,
                    "unit": p_data.unit or cfg.get("unit", "")
                }]
            )
            key_parameters.append(comp)

        # AI Interpretation Input
        ai_input = {
            "analysis_type": "SINGLE_REPORT_EVALUATION",
            "patient_id": patient.patientId,
            "patient_name": patient.name,
            "selected_reports": [report.reportId],
            "key_parameters": [p.dict() for p in key_parameters],
            "overall_summary": {
                "improved": 0,
                "stable": normal_cnt,
                "monitoring": elevated_cnt + low_cnt,
                "worsened": 0,
                "total_parameters": len(key_parameters)
            }
        }

        ai_response, provider_used, fallback_triggered, fallback_history = self.ai_engine.execute_with_fallback(ai_input)
        latency_ms = round((time.time() - start_time) * 1000, 2)
        audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"

        return AIAnalysisResult(
            analysisId=analysis_id,
            patientId=patient.patientId,
            patientName=patient.name,
            selectedReportIds=[report.reportId],
            analysisDate=time.strftime("%d %b %Y"),
            comparisonSummary={
                "improved": 0,
                "stable": normal_cnt,
                "monitoring": elevated_cnt + low_cnt,
                "worsened": 0
            },
            comparisons=[],
            keyParameters=key_parameters,
            overallFindings=ai_response.get("english_summary", []),
            englishSummary=ai_response.get("english_summary", []),
            tamilSummary=ai_response.get("tamil_summary", []),
            monitoringItems=ai_response.get("monitoring_items", []),
            notComparable=[],
            providerUsed=provider_used,
            fallbackTriggered=fallback_triggered,
            fallbackHistory=fallback_history,
            executionLatencyMs=latency_ms,
            auditLogId=audit_id,
            isSingleReport=True
        )

    def _run_multi_report_comparison(
        self,
        patient: PatientProfile,
        sorted_reports: List[ReportRecord],
        analysis_id: str,
        start_time: float,
        user_id: str,
        user_role: str
    ) -> AIAnalysisResult:
        """Executes multi-document chronological comparison across 2, 5, 10 or more reports."""
        pairwise_list: List[PairwiseComparison] = []

        # Step-by-step sequential pairs (e.g. R1->R2, R2->R3, ..., RN-1->RN)
        for i in range(len(sorted_reports) - 1):
            r_before = sorted_reports[i]
            r_after = sorted_reports[i + 1]
            pair_comp = self._compare_two_reports(r_before, r_after)
            pairwise_list.append(pair_comp)
>>>>>>> origin/main

        # Filter out mismatch reports from comparison
        verified_reports = [
            r for r in sorted_reports
            if identity_statuses.get(r.reportId, {}).get("status") not in ("MISMATCH",)
        ]

<<<<<<< HEAD
        if len(verified_reports) < 2:
            # Not enough verified reports for comparison
            pairwise_list = []
            key_parameters = []
            improved_cnt = stable_cnt = monitoring_cnt = worsened_cnt = 0
        else:
            # Step-by-step sequential pairs
            for i in range(len(verified_reports) - 1):
                r_before = verified_reports[i]
                r_after = verified_reports[i+1]
                pair_comp = self._compare_two_reports(r_before, r_after)
                pairwise_list.append(pair_comp)

            # Baseline (First) vs Latest (Last) overall comparison
            baseline_report = verified_reports[0]
            latest_report = verified_reports[-1]
            overall_pairwise = self._compare_two_reports(baseline_report, latest_report)

            # 5. Compile Key Parameters list across the entire timeline
            key_parameters = overall_pairwise.parameters

            # 6. Compute overall statistics
            improved_cnt = sum(1 for p in key_parameters if p.trajectory == "Improved")
            stable_cnt = sum(1 for p in key_parameters if p.trajectory == "Stable")
            monitoring_cnt = sum(1 for p in key_parameters if p.trajectory == "Needs Monitoring")
            worsened_cnt = sum(1 for p in key_parameters if p.trajectory == "Worsened")

            # 7. Populate multi-point trend history
            for param in key_parameters:
                history = []
                canonical_key, _, _ = normalize_parameter_name(param.name)
                for r in verified_reports:
                    val = None
                    for p_data in r.extractedParameters:
                        k, _, _ = normalize_parameter_name(p_data.parameterName)
                        if k == canonical_key:
                            val = p_data.value
                            break
                    if val is not None:
                        history.append({
                            "reportId": r.reportId,
                            "reportDate": r.reportDate,
                            "provider": r.provider,
                            "value": val,
                            "unit": param.unit
                        })
                param.trendHistory = history

        # 8. Execute AI Clinical Interpretation with Fallback Chain
=======
        # Comprehensive key parameters list
        key_parameters = overall_pairwise.parameters

        # Aggregate parameters that appear in any intermediate reports but not both baseline & latest
        seen_keys = {p.canonicalName for p in key_parameters}
        for pair in pairwise_list:
            for p in pair.parameters:
                if p.canonicalName not in seen_keys:
                    seen_keys.add(p.canonicalName)
                    key_parameters.append(p)

        # Overall trajectory statistics
        improved_cnt = sum(1 for p in key_parameters if p.trajectory == "Improved")
        stable_cnt = sum(1 for p in key_parameters if p.trajectory == "Stable")
        monitoring_cnt = sum(1 for p in key_parameters if p.trajectory == "Needs Monitoring")
        worsened_cnt = sum(1 for p in key_parameters if p.trajectory == "Worsened")

        # Multi-point trend timeline across all selected reports
        for param in key_parameters:
            history = []
            canonical_key, _, _ = normalize_parameter_name(param.name)
            for r in sorted_reports:
                val = None
                r_unit = param.unit
                for p_data in r.extractedParameters:
                    k, _, _ = normalize_parameter_name(p_data.parameterName)
                    if k == canonical_key:
                        val = p_data.value
                        r_unit = p_data.unit or param.unit
                        break
                if val is not None:
                    history.append({
                        "reportId": r.reportId,
                        "reportDate": r.reportDate,
                        "provider": r.provider,
                        "value": val,
                        "unit": r_unit
                    })
            param.trendHistory = history

        # Check for evidence-based prediabetes / metabolic conditions in data
        fbs_param = next((p for p in key_parameters if "fasting" in p.canonicalName.lower() or p.canonicalName.lower() == "fasting blood glucose"), None)
        hba1c_param = next((p for p in key_parameters if "hba1c" in p.canonicalName.lower()), None)
        clinical_context_notes = []

        if fbs_param and hba1c_param:
            fbs_val = fbs_param.afterValue or fbs_param.beforeValue
            hba1c_val = hba1c_param.afterValue or hba1c_param.beforeValue
            if fbs_val and hba1c_val:
                # ADA criteria: Fasting glucose 100-125 mg/dL or HbA1c 5.7-6.4% indicates prediabetes range
                if (100.0 <= fbs_val <= 125.0) or (5.7 <= hba1c_val <= 6.4):
                    clinical_context_notes.append(
                        f"Fasting Glucose ({fbs_val} mg/dL) and HbA1c ({hba1c_val}%) fall within commonly used prediabetes ranges for nonpregnant adults. "
                        "These results do not independently establish a diagnosis. Clinical context, test conditions, and physician assessment are required."
                    )

>>>>>>> origin/main
        ai_input = {
            "analysis_type": "LONGITUDINAL_COMPARISON",
            "patient_id": patient.patientId,
            "patient_name": patient.name,
            "selected_reports": [r.reportId for r in sorted_reports],
<<<<<<< HEAD
            "verified_reports": [r.reportId for r in verified_reports],
            "key_parameters": [p.dict() for p in key_parameters],
            "analysis_status": analysis_status,
            "identity_statuses": identity_statuses,
=======
            "total_reports_analyzed": len(sorted_reports),
            "key_parameters": [p.dict() for p in key_parameters],
            "clinical_context_notes": clinical_context_notes,
>>>>>>> origin/main
            "overall_summary": {
                "improved": improved_cnt,
                "stable": stable_cnt,
                "monitoring": monitoring_cnt,
                "worsened": worsened_cnt
            }
        }

        ai_response, provider_used, fallback_triggered, fallback_history = self.ai_engine.execute_with_fallback(ai_input)

        # Ensure evidence-based guideline note is included if detected
        eng_summary = ai_response.get("english_summary", [])
        tam_summary = ai_response.get("tamil_summary", [])

        if clinical_context_notes:
            for note in clinical_context_notes:
                if not any(note[:30] in s for s in eng_summary):
                    eng_summary.insert(0, note)
                    tam_summary.insert(0, "இரத்த சர்க்கரை மற்றும் HbA1c அளவுகள் பொதுவாக முன்நீரிழிவு (prediabetes) வரம்பிற்குள் உள்ளன. இது இறுதி நோயறிதல் அல்ல; மருத்துவரின் நேரடி பரிசோதனை அவசியம்.")

        latency_ms = round((time.time() - start_time) * 1000, 2)
        audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"

        return AIAnalysisResult(
            analysisId=analysis_id,
            patientId=patient.patientId,
            patientName=patient.name,
            selectedReportIds=[r.reportId for r in sorted_reports],
            verifiedReportIds=[r.reportId for r in verified_reports],
            analysisDate=time.strftime("%d %b %Y"),
            analysisStatus=analysis_status,
            comparisonSummary={
                "improved": improved_cnt,
                "stable": stable_cnt,
                "monitoring": monitoring_cnt,
                "worsened": worsened_cnt
            },
            comparisons=pairwise_list,
            keyParameters=key_parameters,
            overallFindings=eng_summary,
            englishSummary=eng_summary,
            tamilSummary=tam_summary,
            monitoringItems=ai_response.get("monitoring_items", []),
            notComparable=[p.dict() for p in key_parameters if not p.isComparable],
            identityStatuses=identity_statuses,
            completeness=completeness,
            providerUsed=provider_used,
            fallbackTriggered=fallback_triggered,
            fallbackHistory=fallback_history,
            executionLatencyMs=latency_ms,
            auditLogId=audit_id
        )

    def _check_completeness(self, reports: List[ReportRecord]) -> Dict[str, Any]:
        """Check analysis completeness: every document processed, all pages attempted, parameters have sources."""
        issues: List[str] = []
        total_pages_expected = 0
        total_pages_processed = 0

        for r in reports:
            if not r.extractionStatus or r.extractionStatus == "Failed":
                issues.append(f"Report {r.reportId} extraction status: {r.extractionStatus or 'unknown'}")
            if r.parameterCount == 0:
                issues.append(f"Report {r.reportId} has zero extracted parameters")
            for p in r.extractedParameters:
                if not p.sourceText:
                    issues.append(f"Parameter {p.parameterName} in {r.reportId} missing source text")
                if p.sourcePage < 1:
                    issues.append(f"Parameter {p.parameterName} in {r.reportId} missing source page")

        complete = len(issues) == 0
        return {
            "complete": complete,
            "issues": issues,
            "totalReports": len(reports),
        }

    def _compare_two_reports(self, r_before: ReportRecord, r_after: ReportRecord) -> PairwiseComparison:
        param_map_before: Dict[str, Any] = {}
        for p in r_before.extractedParameters:
            k, _, _ = normalize_parameter_name(p.parameterName)
            if k != "unknown_param":
                param_map_before[k] = p

        compared_params: List[ParameterComparison] = []
        for p_after in r_after.extractedParameters:
            k, canonical_name, cfg = normalize_parameter_name(p_after.parameterName)
            if k != "unknown_param" and k in param_map_before:
                p_before = param_map_before[k]
                comp = calculate_numerical_comparison(p_before, p_after)
                compared_params.append(comp)

        improved = sum(1 for p in compared_params if p.trajectory == "Improved")
        stable = sum(1 for p in compared_params if p.trajectory == "Stable")
        monitoring = sum(1 for p in compared_params if p.trajectory == "Needs Monitoring")
        worsened = sum(1 for p in compared_params if p.trajectory == "Worsened")

        return PairwiseComparison(
            fromReportId=r_before.reportId,
            fromReportDate=r_before.reportDate,
            toReportId=r_after.reportId,
            toReportDate=r_after.reportDate,
            parameters=compared_params,
            improvedCount=improved,
            stableCount=stable,
            monitoringCount=monitoring,
            worsenedCount=worsened
        )
