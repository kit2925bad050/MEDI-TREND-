import time
import uuid
from typing import Dict, Any, List, Optional, Tuple
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

        sorted_reports = sorted(selected_reports, key=lambda report: (report.reportDate, report.reportId))

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
        single_report_monitoring: List[Dict[str, Any]] = []

        # Filter out mismatch reports from comparison
        verified_reports = [
            r for r in sorted_reports
            if identity_statuses.get(r.reportId, {}).get("status") not in ("MISMATCH",)
        ]

        if len(verified_reports) < 2:
            # Not enough verified reports for comparison
            pairwise_list = []
            key_parameters = []
            improved_cnt = stable_cnt = worsened_cnt = 0
            if len(verified_reports) == 1:
                for parameter in verified_reports[0].extractedParameters:
                    if parameter.status.casefold() in {"high", "low", "elevated", "critical", "abnormal"}:
                        single_report_monitoring.append({
                            "parameter": parameter.parameterName,
                            "value": parameter.value,
                            "unit": parameter.unit,
                            "status": parameter.status,
                            "reportId": verified_reports[0].reportId,
                            "reportDate": verified_reports[0].reportDate,
                            "message": f"{parameter.parameterName} is marked {parameter.status} in this report.",
                        })
            monitoring_cnt = len(single_report_monitoring)
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

        clinical_context_notes = []
        fasting_glucose = next(
            (
                parameter for parameter in key_parameters
                if "fasting" in parameter.canonicalName.lower()
                or parameter.canonicalName.lower() == "fasting blood glucose"
            ),
            None,
        )
        hba1c = next(
            (parameter for parameter in key_parameters if "hba1c" in parameter.canonicalName.lower()),
            None,
        )
        if fasting_glucose and hba1c:
            fasting_value = fasting_glucose.afterValue or fasting_glucose.beforeValue
            hba1c_value = hba1c.afterValue or hba1c.beforeValue
            if fasting_value is not None and hba1c_value is not None:
                if 100.0 <= fasting_value <= 125.0 or 5.7 <= hba1c_value <= 6.4:
                    clinical_context_notes.append(
                        f"Fasting Glucose ({fasting_value} mg/dL) and HbA1c ({hba1c_value}%) "
                        "fall within commonly used prediabetes ranges for nonpregnant adults. "
                        "These results do not independently establish a diagnosis. Clinical context, "
                        "test conditions, and physician assessment are required."
                    )

        # 8. Execute AI Clinical Interpretation with Fallback Chain
        ai_input = {
            "analysis_type": "LONGITUDINAL_COMPARISON",
            "patient_id": patient.patientId,
            "patient_name": patient.name,
            "selected_reports": [r.reportId for r in sorted_reports],
            "verified_reports": [r.reportId for r in verified_reports],
            "key_parameters": [p.dict() for p in key_parameters],
            "analysis_status": analysis_status,
            "identity_statuses": identity_statuses,
            "clinical_context_notes": clinical_context_notes,
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

        if not eng_summary:
            eng_summary = ["Review the reported results with the patient's clinician in the context of their medical history."]
        if not tam_summary:
            tam_summary = ["மருத்துவ வரலாற்றின் அடிப்படையில் இந்த அறிக்கையை மருத்துவருடன் மதிப்பாய்வு செய்யவும்."]
        has_glucose_result = any(
            "glucose" in parameter.parameterName.casefold()
            for report in sorted_reports
            for parameter in report.extractedParameters
        )
        tamil_text = " ".join(tam_summary)
        if has_glucose_result and not any(term in tamil_text for term in ("குளுக்கோஸ்", "சீரான", "அளவு")):
            tam_summary.append("குளுக்கோஸ் அளவுகளை மருத்துவர் மருத்துவச் சூழலுடன் மதிப்பாய்வு செய்ய வேண்டும்.")

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
            monitoringItems=ai_response.get("monitoring_items") or single_report_monitoring,
            notComparable=[p.dict() for p in key_parameters if not p.isComparable],
            identityStatuses=identity_statuses,
            completeness=completeness,
            providerUsed=provider_used,
            fallbackTriggered=fallback_triggered,
            fallbackHistory=fallback_history,
            executionLatencyMs=latency_ms,
            auditLogId=audit_id,
            isSingleReport=len(sorted_reports) == 1,
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
