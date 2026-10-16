export type Language = 'en' | 'ta';

export interface TranslationDictionary {
  // Brand & Common
  app_name: string;
  app_tagline: string;
  admin_portal: string;
  clinical_portal: string;
  powered_by: string;
  developed_by: string;
  system_online: string;
  hipaa_compliant: string;
  ssl_encrypted: string;
  loading: string;
  cancel: string;
  save: string;
  delete: string;
  close: string;
  back: string;
  next: string;
  confirm: string;
  search: string;
  filter: string;
  status: string;
  actions: string;
  download: string;
  export_pdf: string;
  share_whatsapp: string;
  copy: string;
  copied: string;
  na: string;
  trend: string;

  // Header & Navbar
  search_patient_placeholder: string;
  audit_logs: string;
  secure_sign_in: string;
  secure_sign_out: string;
  admin_command: string;
  launch_workspace: string;
  switch_language: string;
  role_doctor: string;
  role_staff: string;
  role_admin: string;

  // Navigation Links
  nav_dashboard: string;
  nav_patients: string;
  nav_reports: string;
  nav_analysis: string;
  nav_trends: string;
  nav_clinical_summary: string;
  nav_documents: string;
  nav_history: string;
  nav_appointments: string;
  nav_upload_pdf: string;

  // Admin Navigation
  nav_admin_overview: string;
  nav_admin_doctors: string;
  nav_admin_staff: string;
  nav_admin_patients: string;
  nav_admin_reports: string;
  nav_admin_analyses: string;
  nav_admin_activity: string;
  nav_admin_audit: string;
  nav_admin_analytics: string;
  nav_admin_settings: string;

  // Landing Page
  hero_badge: string;
  hero_subheading: string;
  hero_description: string;
  hero_trust_grade: string;
  hero_trust_traceable: string;
  hero_trust_secure: string;
  journey_heading: string;
  journey_subheading: string;

  // Workflow Cards (Landing Page)
  wf_report_comp_title: string;
  wf_report_comp_desc: string;
  wf_health_track_title: string;
  wf_health_track_desc: string;
  wf_param_analysis_title: string;
  wf_param_analysis_desc: string;
  wf_bilingual_title: string;
  wf_bilingual_desc: string;
  wf_source_insights_title: string;
  wf_source_insights_desc: string;
  wf_secure_records_title: string;
  wf_secure_records_desc: string;
  wf_interactive_trends_title: string;
  wf_interactive_trends_desc: string;
  wf_clinical_support_title: string;
  wf_clinical_support_desc: string;

  // Typewriter phrases
  typewriter_1: string;
  typewriter_2: string;
  typewriter_3: string;
  typewriter_4: string;
  typewriter_5: string;

  // Patient Banner & Demographics
  patient_active: string;
  patient_inactive: string;
  pid_label: string;
  age_label: string;
  years_label: string;
  gender_label: string;
  phone_label: string;
  blood_group_label: string;
  total_reports: string;
  first_report: string;
  latest_report: string;

  // Tabs
  tab_overview: string;
  tab_reports: string;
  tab_analysis: string;
  tab_trends: string;
  tab_clinical_summary: string;
  tab_documents: string;
  tab_history: string;

  // KPI & Stat Cards
  stat_improved: string;
  stat_stable: string;
  stat_monitoring: string;
  stat_worsened: string;

  // Dashboard Page
  dash_switch_patient: string;
  dash_hospital_patients: string;
  dash_add_patient: string;
  dash_launch_analysis: string;
  dash_upload_pdf: string;
  dash_reports_available: string;
  dash_reports_available_sub: string;
  dash_run_comparison: string;
  dash_one_report_msg: string;
  dash_one_report_sub: string;
  dash_no_reports_msg: string;
  dash_no_reports_sub: string;
  dash_ingest_first: string;
  dash_workspaces_title: string;
  dash_reports_library_desc: string;
  dash_ai_comparison_desc: string;
  dash_trend_graphs_desc: string;
  dash_clinical_summary_desc: string;
  dash_recent_reports_snapshot: string;
  dash_no_reports_yet: string;
  dash_view_all_reports: string;

  // Key Parameters Table
  table_title: string;
  table_subtitle: string;
  table_search_placeholder: string;
  table_col_param: string;
  table_col_change: string;
  table_col_status: string;
  table_col_trend: string;
  table_col_action: string;
  table_ref_range: string;
  table_showing_count: string;
  table_download_csv: string;
  status_improved: string;
  status_stable: string;
  status_monitoring: string;
  status_worsened: string;
  status_normal: string;
  status_elevated: string;
  status_low: string;
  status_critical: string;

  // Hologram Body & Biometrics
  hologram_title: string;
  hologram_bpm_normal: string;
  hologram_ecg_lead: string;
  hologram_ecg_normal: string;

  // AI Clinical Summary
  ai_summary_title: string;
  ai_verified_badge: string;
  ai_summary_en_title: string;
  ai_summary_ta_title: string;
  ai_key_findings: string;
  ai_followup_note: string;
  ai_disclaimer_text: string;

  // Analysis Page
  analysis_page_title: string;
  analysis_page_subtitle: string;
  analysis_select_reports_title: string;
  analysis_select_min_two: string;
  analysis_select_all: string;
  analysis_clear_selection: string;
  analysis_run_btn: string;
  analysis_running_btn: string;
  analysis_trajectory_summary: string;
  analysis_key_biomarkers: string;
  analysis_risk_factors: string;
  analysis_recommendations: string;

  // Trends Page
  trends_page_title: string;
  trends_page_subtitle: string;
  trends_select_param: string;
  trends_chart_title: string;
  trends_normal_range: string;
  trends_observed_values: string;

  // Documents Page
  docs_page_title: string;
  docs_page_subtitle: string;
  docs_source_grounding: string;
  docs_view_source: string;
  docs_verification_status: string;

  // History & Audit Page
  history_page_title: string;
  history_page_subtitle: string;
  history_event_type: string;
  history_timestamp: string;
  history_actor: string;
  history_details: string;

  // Document Upload Modal (Strict Validation)
  modal_upload_title: string;
  modal_upload_subtitle: string;
  modal_upload_drag_drop: string;
  modal_upload_browse: string;
  modal_upload_supported_formats: string;
  modal_upload_stage_reading: string;
  modal_upload_stage_extracting: string;
  modal_upload_stage_ocr: string;
  modal_upload_stage_verifying: string;
  modal_upload_stage_clinical: string;
  modal_upload_stage_complete: string;
  modal_upload_invalid_title: string;
  modal_upload_invalid_msg: string;
  modal_upload_detected_badge: string;
  modal_upload_try_again: string;
  modal_upload_evidence_title: string;
  modal_upload_extracted_from_doc: string;
  modal_upload_user_provided: string;
  modal_upload_not_detected: string;
  modal_upload_confirm_btn: string;
  modal_upload_save_active: string;

  // Auth & Admin Modal
  auth_login_title: string;
  auth_login_subtitle: string;
  auth_email_label: string;
  auth_password_label: string;
  auth_role_label: string;
  auth_sign_in_btn: string;
  admin_login_title: string;
  admin_login_subtitle: string;
  admin_pin_label: string;
  admin_auth_btn: string;

  // Add Patient Modal
  add_patient_title: string;
  add_patient_subtitle: string;
  patient_fullname: string;
  patient_age: string;
  patient_gender: string;
  patient_phone: string;
  patient_blood_group: string;
  patient_initial_notes: string;
  patient_create_btn: string;

  // Export Report Modal
  export_modal_title: string;
  export_modal_subtitle: string;
  export_doctor_notes: string;
  export_include_tamil: string;
  export_include_graphs: string;
  export_download_pdf: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Brand & Common
    app_name: 'MEDI-TREND AI',
    app_tagline: 'Intelligent Longitudinal Patient Report Analysis',
    admin_portal: 'ADMIN PORTAL',
    clinical_portal: 'CLINICAL PORTAL',
    powered_by: 'Powered by Gemini & Medical Intelligence Engine',
    developed_by: 'Developed by',
    system_online: 'System Online • AI Cloud Active',
    hipaa_compliant: 'HIPAA Compliant',
    ssl_encrypted: '256-Bit SSL Encrypted',
    loading: 'Loading...',
    cancel: 'Cancel',
    save: 'Save Changes',
    delete: 'Delete',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    status: 'Status',
    actions: 'Actions',
    download: 'Download',
    export_pdf: 'Export Official PDF',
    share_whatsapp: 'Share to Patient WhatsApp',
    copy: 'Copy',
    copied: 'Copied!',
    na: 'N/A',
    trend: 'Trend',

    // Header & Navbar
    search_patient_placeholder: 'Search patients by name, ID or phone...',
    audit_logs: 'Audit Logs',
    secure_sign_in: 'Secure Sign In',
    secure_sign_out: 'Secure Sign Out',
    admin_command: 'Admin Command',
    launch_workspace: 'Launch Clinical Workspace',
    switch_language: 'தமிழ்',
    role_doctor: 'DOCTOR',
    role_staff: 'STAFF',
    role_admin: 'ADMINISTRATOR',

    // Navigation Links
    nav_dashboard: 'Dashboard',
    nav_patients: 'Patients',
    nav_reports: 'Reports',
    nav_analysis: 'AI Analysis',
    nav_trends: 'Trends & Insights',
    nav_clinical_summary: 'Clinical Summary',
    nav_documents: 'Documents',
    nav_history: 'History & Audit',
    nav_appointments: 'Appointments',
    nav_upload_pdf: '+ Upload PDF Report',

    // Admin Navigation
    nav_admin_overview: 'Admin Overview',
    nav_admin_doctors: 'Doctors',
    nav_admin_staff: 'Staff Members',
    nav_admin_patients: 'All Patients',
    nav_admin_reports: 'All Reports',
    nav_admin_analyses: 'AI Invocations',
    nav_admin_activity: 'Activity Logs',
    nav_admin_audit: 'Audit Trail',
    nav_admin_analytics: 'Analytics',
    nav_admin_settings: 'Settings',

    // Landing Page
    hero_badge: 'Hospital-Grade Longitudinal Decision-Support Platform',
    hero_subheading: 'Grounded in Real Clinical Laboratory Reports.',
    hero_description:
      'Empowering clinicians and healthcare institutions to ingest, validate, and compare chronological patient medical records across multiple dates. Exact parameter-level trajectory analysis paired with bilingual clinical observations.',
    hero_trust_grade: 'Hospital-Grade Decision Support',
    hero_trust_traceable: 'Document Grounded Traceability',
    hero_trust_secure: 'Encrypted & Access-Controlled',
    journey_heading: "Built Around the Patient's Journey",
    journey_subheading:
      'From the first report to every follow-up visit, MEDI-TREND AI helps organize, compare and understand longitudinal health data in one secure clinical workspace.',

    // Workflow Cards
    wf_report_comp_title: 'Selective Report Comparison',
    wf_report_comp_desc:
      'Select the patient reports you want to compare and review changes across 2, 3, 4, 5 or more visits.',
    wf_health_track_title: 'Longitudinal Health Tracking',
    wf_health_track_desc:
      'Track how important health parameters change across multiple medical visits with clear before-and-after trends.',
    wf_param_analysis_title: 'Parameter-Level Analysis',
    wf_param_analysis_desc:
      'Review individual test values, units, reference ranges and changes between selected reports in one clear view.',
    wf_bilingual_title: 'Bilingual Clinical Summaries',
    wf_bilingual_desc:
      'Get concise, source-based summaries in English and Tamil to make report findings easier to understand.',
    wf_source_insights_title: 'Source-Based Report Insights',
    wf_source_insights_desc:
      'Every reported value and comparison is linked back to the uploaded medical document for easy verification.',
    wf_secure_records_title: 'Secure Patient Records',
    wf_secure_records_desc:
      'Keep patient reports, documents and analysis securely organized with controlled access for authorized users.',
    wf_interactive_trends_title: 'Interactive Health Trends',
    wf_interactive_trends_desc:
      'Visualize parameter changes over time with simple, interactive charts designed for clinical review.',
    wf_clinical_support_title: 'Clinical Review Support',
    wf_clinical_support_desc:
      'Bring reports, comparisons and longitudinal findings together in one workspace for informed clinical review.',

    // Typewriter phrases
    typewriter_1: 'Longitudinal Medical Intelligence',
    typewriter_2: 'Document-Grounded Laboratory Tracking',
    typewriter_3: 'Multi-Visit Parameter Trajectories',
    typewriter_4: 'Bilingual Clinical Summaries (English & தமிழ்)',
    typewriter_5: 'Chronological Patient Report Analysis',

    // Patient Banner & Demographics
    patient_active: 'Active',
    patient_inactive: 'Inactive',
    pid_label: 'PID',
    age_label: 'Age',
    years_label: 'years',
    gender_label: 'Gender',
    phone_label: 'Phone',
    blood_group_label: 'Blood Group',
    total_reports: 'Total Reports',
    first_report: 'First Report',
    latest_report: 'Latest Report',

    // Tabs
    tab_overview: 'Overview',
    tab_reports: 'Reports',
    tab_analysis: 'Analysis',
    tab_trends: 'Trends',
    tab_clinical_summary: 'Clinical Summary',
    tab_documents: 'Documents',
    tab_history: 'History',

    // KPI & Stat Cards
    stat_improved: 'Parameters Improved',
    stat_stable: 'Parameters Stable',
    stat_monitoring: 'Needs Monitoring',
    stat_worsened: 'Worsened',

    // Dashboard Page
    dash_switch_patient: 'Switch Patient',
    dash_hospital_patients: 'Hospital Patients',
    dash_add_patient: '+ Add Patient',
    dash_launch_analysis: 'Launch Analysis',
    dash_upload_pdf: 'Upload PDF',
    dash_reports_available: 'Reports Available for Multi-Visit Comparison',
    dash_reports_available_sub:
      'Run AI longitudinal comparison to calculate biomarker trajectories (improved, stable, monitoring, worsened).',
    dash_run_comparison: 'Run Comparison',
    dash_one_report_msg: 'Baseline Report Uploaded',
    dash_one_report_sub:
      'Upload a follow-up visit report to enable AI longitudinal tracking and compare before & after health trajectories.',
    dash_no_reports_msg: 'No Medical Reports Uploaded',
    dash_no_reports_sub:
      'Ingest medical laboratory PDF documents to begin structured parameter parsing and tracking.',
    dash_ingest_first: '+ Ingest First Report',
    dash_workspaces_title: 'Clinical Investigation Workspaces',
    dash_reports_library_desc: 'laboratory documents stored with structured parameter parsing.',
    dash_ai_comparison_desc: 'Compare multi-date reports and calculate verified parameter changes.',
    dash_trend_graphs_desc: 'Plot longitudinal biological parameters with shaded reference ranges.',
    dash_clinical_summary_desc: 'Bilingual findings grounded in verified source documents.',
    dash_recent_reports_snapshot: 'Recent Reports Snapshot',
    dash_no_reports_yet: 'No reports uploaded for this patient yet.',
    dash_view_all_reports: 'View All Reports →',

    // Key Parameters Table
    table_title: 'Key Parameters Comparison',
    table_subtitle: 'Showing comparison between',
    table_search_placeholder: 'Search parameters...',
    table_col_param: 'Parameter',
    table_col_change: 'Change',
    table_col_status: 'Status',
    table_col_trend: 'Trend',
    table_col_action: 'Action',
    table_ref_range: 'Ref',
    table_showing_count: 'Showing',
    table_download_csv: 'Download CSV',
    status_improved: 'Improved',
    status_stable: 'Stable',
    status_monitoring: 'Needs Monitoring',
    status_worsened: 'Worsened',
    status_normal: 'Normal',
    status_elevated: 'Elevated',
    status_low: 'Low',
    status_critical: 'Critical',

    // Hologram Body & Biometrics
    hologram_title: 'Anatomical Cardiac Biometric Model',
    hologram_bpm_normal: 'BPM (Normal Sinus)',
    hologram_ecg_lead: 'Lead II • ECG Rhythm',
    hologram_ecg_normal: 'P-QRS-T Normal Sinus',

    // AI Clinical Summary
    ai_summary_title: 'AI Clinical Decision-Support Summary',
    ai_verified_badge: 'AI Verified',
    ai_summary_en_title: 'English Clinical Summary',
    ai_summary_ta_title: 'தமிழ் மருத்துவ சுருக்கம்',
    ai_key_findings: 'key findings',
    ai_followup_note: 'Clinical Follow-up Note',
    ai_disclaimer_text:
      'AI-assisted comparison for clinical review support only. Does not replace physician diagnosis.',

    // Analysis Page
    analysis_page_title: 'AI Longitudinal Report Analysis',
    analysis_page_subtitle:
      'Select 2 or more reports to generate verified parameter trajectories and bilingual clinical summaries.',
    analysis_select_reports_title: 'Selected Medical Reports for Comparison',
    analysis_select_min_two: 'Select at least 2 reports to execute comparative analysis.',
    analysis_select_all: 'Select All',
    analysis_clear_selection: 'Reset Selection',
    analysis_run_btn: 'Run Comparative Analysis',
    analysis_running_btn: 'Analyzing Laboratory Parameters...',
    analysis_trajectory_summary: 'Biomarker Trajectory Overview',
    analysis_key_biomarkers: 'Comparative Biomarkers & Reference Ranges',
    analysis_risk_factors: 'Identified Clinical Risk Factors',
    analysis_recommendations: 'Suggested Clinical Follow-up Actions',

    // Trends Page
    trends_page_title: 'Biomarker Trajectories & Interactive Charts',
    trends_page_subtitle:
      'Visualize longitudinal parameter trends with clinically shaded reference zones across all visit dates.',
    trends_select_param: 'Select Biomarker to Plot',
    trends_chart_title: 'Longitudinal Parameter Trajectory',
    trends_normal_range: 'Normal Reference Zone',
    trends_observed_values: 'Reported Lab Values',

    // Documents Page
    docs_page_title: 'Medical Document Repository',
    docs_page_subtitle: 'All uploaded laboratory reports, clinical notes, and verified source files.',
    docs_source_grounding: 'Document Source Grounding',
    docs_view_source: 'View Source Document',
    docs_verification_status: 'Content Verification',

    // History & Audit Page
    history_page_title: 'Audit Trail & Event History',
    history_page_subtitle: 'Immutable record of all report uploads, AI invocations, and role access events.',
    history_event_type: 'Event Type',
    history_timestamp: 'Timestamp',
    history_actor: 'User / Actor',
    history_details: 'Event Details',

    // Document Upload Modal (Strict Validation)
    modal_upload_title: 'Upload & Verify Medical Report',
    modal_upload_subtitle:
      'Upload genuine medical reports (PDF, PNG, JPG). Content is inspected via OCR and AI clinical verification.',
    modal_upload_drag_drop: 'Drag and drop medical PDF or image here, or browse files',
    modal_upload_browse: 'Browse File',
    modal_upload_supported_formats: 'Supported: Medical PDFs, Scanned Reports, Lab Images (Max 25MB)',
    modal_upload_stage_reading: 'Reading document structure...',
    modal_upload_stage_extracting: 'Extracting digital text & metadata...',
    modal_upload_stage_ocr: 'Running Multimodal Vision OCR on scanned pages...',
    modal_upload_stage_verifying: 'Verifying medical content authenticity with AI...',
    modal_upload_stage_clinical: 'Extracting clinical parameters and reference ranges...',
    modal_upload_stage_complete: 'Medical Document Verified Successfully!',
    modal_upload_invalid_title: 'Invalid Medical Document',
    modal_upload_invalid_msg:
      'This document does not contain sufficient clinical or laboratory content for MEDI-TREND analysis.',
    modal_upload_detected_badge: 'Detected Content',
    modal_upload_try_again: 'Upload a Valid Medical Document',
    modal_upload_evidence_title: 'Verified Document Evidence Breakdown',
    modal_upload_extracted_from_doc: 'Extracted from Document',
    modal_upload_user_provided: 'User Provided',
    modal_upload_not_detected: 'Not Detected',
    modal_upload_confirm_btn: 'Validate & Ingest Report',
    modal_upload_save_active: 'Saving Active Report...',

    // Auth & Admin Modal
    auth_login_title: 'Sign In to Clinical Workspace',
    auth_login_subtitle: 'Access patient records, report comparisons, and AI decision support.',
    auth_email_label: 'Professional Email',
    auth_password_label: 'Password',
    auth_role_label: 'Select Workspace Role',
    auth_sign_in_btn: 'Sign In',
    admin_login_title: 'Administrative Command Center',
    admin_login_subtitle: 'Restricted access for system administrators and clinical directors.',
    admin_pin_label: 'Security PIN / Admin Passcode',
    admin_auth_btn: 'Authenticate Administrator',

    // Add Patient Modal
    add_patient_title: 'Register New Patient Profile',
    add_patient_subtitle: 'Create a permanent medical profile for longitudinal laboratory tracking.',
    patient_fullname: 'Patient Full Name',
    patient_age: 'Age (Years)',
    patient_gender: 'Gender',
    patient_phone: 'Mobile / WhatsApp Phone Number',
    patient_blood_group: 'Blood Group',
    patient_initial_notes: 'Initial Clinical Notes / Diagnosis',
    patient_create_btn: 'Create Patient Record',

    // Export Report Modal
    export_modal_title: 'Export Official Longitudinal Health Summary',
    export_modal_subtitle: 'Generate a hospital-grade bilingual PDF report or share directly with the patient.',
    export_doctor_notes: 'Clinician Remarks & Guidance',
    export_include_tamil: 'Include Medical Tamil Summary (தமிழ் சுருக்கம்)',
    export_include_graphs: 'Include Visual Trajectory Charts',
    export_download_pdf: 'Download Official PDF',
  },

  ta: {
    // Brand & Common
    app_name: 'மீடி-டிரெண்ட் AI',
    app_tagline: 'அறிவார்ந்த நீண்டகால நோயாளி அறிக்கை பகுப்பாய்வு',
    admin_portal: 'நிர்வாக போர்ட்டல்',
    clinical_portal: 'மருத்துவ போர்ட்டல்',
    powered_by: 'ஜெமினி மற்றும் மருத்துவ நுண்ணறிவு தளத்தால் இயக்கப்படுகிறது',
    developed_by: 'உருவாக்கியவர்',
    system_online: 'கணினி நேரலையில் உள்ளது • AI கிளவுட் செயலில் உள்ளது',
    hipaa_compliant: 'HIPAA மருத்துவ பாதுகாப்பு இணக்கமானது',
    ssl_encrypted: '256-பிட் SSL மறைகுறியாக்கப்பட்ட பாதுகாப்பு',
    loading: 'ஏற்றப்படுகிறது...',
    cancel: 'ரத்து செய்',
    save: 'மாற்றங்களைச் சேமி',
    delete: 'நீக்கு',
    close: 'மூடு',
    back: 'பின்செல்',
    next: 'அடுத்து',
    confirm: 'உறுதி செய்',
    search: 'தேடுக',
    filter: 'வடிகட்டி',
    status: 'நிலை',
    actions: 'செயல்கள்',
    download: 'பதிவிறக்கு',
    export_pdf: 'அதிகாரப்பூர்வ PDF ஏற்றுமதி',
    share_whatsapp: 'வாட்ஸ்அப்பில் நோயாளிக்கு அனுப்புக',
    copy: 'நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது!',
    na: 'கிடைக்கவில்லை',
    trend: 'போக்கு',

    // Header & Navbar
    search_patient_placeholder: 'பெயர், நோயாளி எண் அல்லது தொலைபேசி மூலம் தேடுக...',
    audit_logs: 'தணிக்கை பதிவுகள்',
    secure_sign_in: 'பாதுகாப்பான உள்நுழைவு',
    secure_sign_out: 'வெளியேறு',
    admin_command: 'நிர்வாக அணுகல்',
    launch_workspace: 'மருத்துவ பணியிடத்தைத் தொடங்கு',
    switch_language: 'English',
    role_doctor: 'மருத்துவர்',
    role_staff: 'பணியாளர்',
    role_admin: 'முதன்மை நிர்வாகி',

    // Navigation Links
    nav_dashboard: 'டாஷ்போர்டு',
    nav_patients: 'நோயாளிகள்',
    nav_reports: 'மருத்துவ அறிக்கைகள்',
    nav_analysis: 'AI பகுப்பாய்வு',
    nav_trends: 'போக்குகள் & நுண்ணறிவு',
    nav_clinical_summary: 'மருத்துவ சுருக்கம்',
    nav_documents: 'ஆவணங்கள்',
    nav_history: 'வரலாறு & தணிக்கை',
    nav_appointments: 'மருத்துவ சந்திப்புகள் (Appointments)',
    nav_upload_pdf: '+ அறிக்கை பதிவேற்றுக',

    // Admin Navigation
    nav_admin_overview: 'நிர்வாக கண்ணோட்டம்',
    nav_admin_doctors: 'மருத்துவர்கள்',
    nav_admin_staff: 'பணியாளர்கள்',
    nav_admin_patients: 'அனைத்து நோயாளிகள்',
    nav_admin_reports: 'அனைத்து அறிக்கைகள்',
    nav_admin_analyses: 'AI பகுப்பாய்வுகள்',
    nav_admin_activity: 'செயல்பாட்டுப் பதிவுகள்',
    nav_admin_audit: 'தணிக்கைப் பாதை',
    nav_admin_analytics: 'பகுப்பாய்வுத் தரவுகள்',
    nav_admin_settings: 'அமைப்புகள்',

    // Landing Page
    hero_badge: 'மருத்துவமனை தர நீண்டகால மருத்துவ முடிவு ஆதரவு தளம்',
    hero_subheading: 'உண்மையான மருத்துவ ஆய்வக அறிக்கைகளின் அடிப்படையில்.',
    hero_description:
      'நோயாளிகளின் தொடர் மருத்துவ ஆய்வக அறிக்கைகளை பதிவேற்றி, சரிபார்த்து, பல்வேறு தேதிகளுக்கு இடையிலான மாற்றங்களை ஒப்பிட்டு பகுப்பாய்வு செய்ய மருத்துவர்களுக்கு உதவும் அதிநவீன தளம். துல்லியமான அளவுரு போக்குகள் மற்றும் தமிழ்-ஆங்கில மருத்துவ சுருக்கங்கள்.',
    hero_trust_grade: 'மருத்துவமனை தர முடிவு ஆதரவு',
    hero_trust_traceable: 'ஆவண அடிப்படையிலான சரிபார்ப்பு',
    hero_trust_secure: 'மறைகுறியாக்கப்பட்ட பாதுகாப்பான தளம்',
    journey_heading: 'நோயாளியின் நலன் மற்றும் தொடர் கண்காணிப்புக்கான தளம்',
    journey_subheading:
      'முதல் மருத்துவ அறிக்கை முதல் ஒவ்வொரு தொடர் பரிசோதனை வரை, அனைத்து மருத்துவ தரவுகளையும் ஒரே பாதுகாப்பான பணியிடத்தில் ஒழுங்கமைத்து புரிந்துகொள்ள MEDI-TREND AI உதவுகிறது.',

    // Workflow Cards
    wf_report_comp_title: 'தேர்ந்தெடுக்கப்பட்ட அறிக்கை ஒப்பீடு',
    wf_report_comp_desc:
      'நீங்கள் ஒப்பிட விரும்பும் அறிக்கைகளைத் தேர்ந்தெடுத்து, 2, 3, 4, 5 அல்லது அதற்கு மேற்பட்ட வருகைகளின் மாற்றங்களை மதிப்பாய்வு செய்யுங்கள்.',
    wf_health_track_title: 'நீண்டகால உடல்நலக் கண்காணிப்பு',
    wf_health_track_desc:
      'பல்வேறு மருத்துவ வருகைகளில் முக்கிய உடல்நல அளவுருக்கள் எவ்வாறு மாறுகின்றன என்பதை தெளிவான முன்-பின் போக்குகளுடன் கண்காணிக்கவும்.',
    wf_param_analysis_title: 'அளவுரு அளவிலான விரிவான பகுப்பாய்வு',
    wf_param_analysis_desc:
      'தனிப்பட்ட பரிசோதனை மதிப்புகள், அலகுகள், இயல்பான வரம்புகள் மற்றும் அறிக்கைகளுக்கு இடையிலான மாற்றங்களை ஒரே பார்வையில் காண்க.',
    wf_bilingual_title: 'இருமொழி மருத்துவ சுருக்கங்கள் (தமிழ் & ஆங்கிலம்)',
    wf_bilingual_desc:
      'அறிக்கையின் முக்கிய முடிவுகளை எளிதாகப் புரிந்துகொள்ள தமிழ் மற்றும் ஆங்கிலத்தில் சுருக்கமான மருத்துவ விளக்கங்களைப் பெறுங்கள்.',
    wf_source_insights_title: 'ஆதார ஆவண சரிபார்ப்பு',
    wf_source_insights_desc:
      'ஒவ்வொரு பரிசோதனை மதிப்பும் நீங்கள் பதிவேற்றிய மருத்துவ ஆவணத்துடன் நேரடியாக இணைக்கப்பட்டு நம்பகத்தன்மை உறுதி செய்யப்படுகிறது.',
    wf_secure_records_title: 'பாதுகாப்பான நோயாளி ஆவணங்கள்',
    wf_secure_records_desc:
      'நோயாளி அறிக்கைகள், ஆவணங்கள் மற்றும் பகுப்பாய்வுகளை அங்கீகரிக்கப்பட்ட பயனர்களுக்கு மட்டுமே கட்டுப்படுத்தப்பட்ட அணுகலுடன் பாதுகாப்பாக வைத்திருங்கள்.',
    wf_interactive_trends_title: 'ஊடாடும் சுகாதார வரைபடங்கள்',
    wf_interactive_trends_desc:
      'மருத்துவ மதிப்பாய்வுக்கு உதவும் வகையில் காலப்போக்கில் அளவுருக்களின் மாற்றங்களை எளிய, ஊடாடும் வரைபடங்களுடன் காண்க.',
    wf_clinical_support_title: 'மருத்துவ மதிப்பாய்வு ஆதரவு',
    wf_clinical_support_desc:
      'மருத்துவ அறிக்கைகள், ஒப்பீடுகள் மற்றும் நீண்டகால கண்டுபிடிப்புகளை ஒரே பணியிடத்தில் ஒருங்கிணைத்து சிறந்த மருத்துவ முடிவுகளை எடுங்கள்.',

    // Typewriter phrases
    typewriter_1: 'நீண்டகால மருத்துவ நுண்ணறிவு',
    typewriter_2: 'ஆவண அடிப்படையிலான ஆய்வக கண்காணிப்பு',
    typewriter_3: 'பல்வேறு வருகை அளவுரு போக்குகள்',
    typewriter_4: 'இருமொழி மருத்துவ சுருக்கங்கள் (English & தமிழ்)',
    typewriter_5: 'காலவரிசை நோயாளி அறிக்கை பகுப்பாய்வு',

    // Patient Banner & Demographics
    patient_active: 'செயலில் உள்ளார்',
    patient_inactive: 'செயலற்றவர்',
    pid_label: 'நோயாளி எண்',
    age_label: 'வயது',
    years_label: 'வயது',
    gender_label: 'பாலினம்',
    phone_label: 'தொலைபேசி',
    blood_group_label: 'இரத்த வகை',
    total_reports: 'மொத்த அறிக்கைகள்',
    first_report: 'முதல் அறிக்கை',
    latest_report: 'கடைசி அறிக்கை',

    // Tabs
    tab_overview: 'கண்ணோட்டம்',
    tab_reports: 'அறிக்கைகள்',
    tab_analysis: 'பகுப்பாய்வு',
    tab_trends: 'போக்குகள்',
    tab_clinical_summary: 'மருத்துவ சுருக்கம்',
    tab_documents: 'ஆவணங்கள்',
    tab_history: 'வரலாறு',

    // KPI & Stat Cards
    stat_improved: 'முன்னேற்றமடைந்த அளவுருக்கள்',
    stat_stable: 'நிலையான அளவுருக்கள்',
    stat_monitoring: 'கண்காணிப்பு தேவைப்படுபவை',
    stat_worsened: 'தீவிரமடைந்த அளவுருக்கள்',

    // Dashboard Page
    dash_switch_patient: 'நோயாளி தேர்வு',
    dash_hospital_patients: 'மருத்துவமனை நோயாளிகள்',
    dash_add_patient: '+ புதிய நோயாளி',
    dash_launch_analysis: 'பகுப்பாய்வைத் தொடங்கு',
    dash_upload_pdf: 'PDF பதிவேற்றுக',
    dash_reports_available: 'அறிக்கைகள் ஒப்பீட்டிற்கு தயாராக உள்ளன',
    dash_reports_available_sub:
      'அளவுருக்களின் நீண்டகால மாற்றங்களை (முன்னேற்றம், நிலைப்புத்தன்மை, கண்காணிப்பு, தீவிரம்) கணக்கிட AI ஒப்பீட்டை இயக்கவும்.',
    dash_run_comparison: 'ஒப்பீட்டை இயக்கு',
    dash_one_report_msg: 'ஆரம்ப அறிக்கை பதிவேற்றப்பட்டது',
    dash_one_report_sub:
      'முன்-பின் மாற்றங்களை ஒப்பிட்டு பார்க்க தொடர் பரிசோதனை அறிக்கையை பதிவேற்றவும்.',
    dash_no_reports_msg: 'மருத்துவ அறிக்கைகள் எதுவும் பதிவேற்றப்படவில்லை',
    dash_no_reports_sub:
      'அளவுருக்களை தானாக பிரித்தெடுத்து கண்காணிக்க மருத்துவ ஆய்வக PDF அறிக்கையை பதிவேற்றவும்.',
    dash_ingest_first: '+ முதல் அறிக்கையை பதிவேற்றுக',
    dash_workspaces_title: 'மருத்துவ ஆய்வு பணியிடங்கள்',
    dash_reports_library_desc: 'ஆய்வக ஆவணங்கள் அளவுருக்களுடன் பாதுகாப்பாக சேமிக்கப்பட்டுள்ளன.',
    dash_ai_comparison_desc: 'பல்வேறு தேதிகளின் அறிக்கைகளை ஒப்பிட்டு துல்லியமான மாற்றங்களைக் கணக்கிடுங்கள்.',
    dash_trend_graphs_desc: 'இயல்பான வரம்புகளுடன் நீண்டகால அளவுரு வரைபடங்களை காண்க.',
    dash_clinical_summary_desc: 'உண்மையான ஆவணங்களை அடிப்படையாகக் கொண்ட இருமொழி மருத்துவ கண்டுபிடிப்புகள்.',
    dash_recent_reports_snapshot: 'சமீபத்திய அறிக்கைகள்',
    dash_no_reports_yet: 'இந்த நோயாளிக்கு இதுவரை அறிக்கைகள் எதுவும் இல்லை.',
    dash_view_all_reports: 'அனைத்து அறிக்கைகளையும் காண்க →',

    // Key Parameters Table
    table_title: 'முக்கிய அளவுருக்கள் ஒப்பீடு',
    table_subtitle: 'ஒப்பீட்டு அறிக்கைகள்',
    table_search_placeholder: 'அளவுருக்களைத் தேடுக...',
    table_col_param: 'பரிசோதனை அளவுரு',
    table_col_change: 'மாற்றம்',
    table_col_status: 'நிலை',
    table_col_trend: 'போக்கு',
    table_col_action: 'செயல்',
    table_ref_range: 'இயல்பு வரம்பு',
    table_showing_count: 'காட்டப்படுகிறது',
    table_download_csv: 'CSV பதிவிறக்கு',
    status_improved: 'முன்னேற்றம்',
    status_stable: 'நிலையானது',
    status_monitoring: 'கண்காணிப்பு தேவை',
    status_worsened: 'தீவிரமானது',
    status_normal: 'இயல்பு நிலை',
    status_elevated: 'அதிகரித்துள்ளது',
    status_low: 'குறைந்துள்ளது',
    status_critical: 'ஆபத்தான நிலை',

    // Hologram Body & Biometrics
    hologram_title: 'இதய மற்றும் உடல் உறுப்பு உயிரியல் மாதிரி',
    hologram_bpm_normal: 'BPM (இயல்பான இதயத் துடிப்பு)',
    hologram_ecg_lead: 'லீட் II • ECG இதய துடிப்பு வரைபடம்',
    hologram_ecg_normal: 'P-QRS-T இயல்பான துடிப்பு',

    // AI Clinical Summary
    ai_summary_title: 'AI மருத்துவ முடிவு ஆதரவு சுருக்கம்',
    ai_verified_badge: 'AI சரிபார்க்கப்பட்டது',
    ai_summary_en_title: 'English Clinical Summary',
    ai_summary_ta_title: 'தமிழ் மருத்துவ சுருக்கம்',
    ai_key_findings: 'முக்கிய கண்டறிதல்கள்',
    ai_followup_note: 'மருத்துவ தொடர் கண்காணிப்பு குறிப்பு',
    ai_disclaimer_text:
      'இது மருத்துவர்களின் மதிப்பாய்வு ஆதரவிற்கான AI ஒப்பீடு மட்டுமே. மருத்துவரின் நேரடி முடிவுக்கு மாற்றாகாது.',

    // Analysis Page
    analysis_page_title: 'AI நீண்டகால அறிக்கை ஒப்பீட்டு பகுப்பாய்வு',
    analysis_page_subtitle:
      'துல்லியமான அளவுரு போக்குகள் மற்றும் இருமொழி சுருக்கங்களைப் பெற 2 அல்லது அதற்கு மேற்பட்ட அறிக்கைகளைத் தேர்ந்தெடுக்கவும்.',
    analysis_select_reports_title: 'ஒப்பீட்டிற்காக தேர்ந்தெடுக்கப்பட்ட அறிக்கைகள்',
    analysis_select_min_two: 'ஒப்பீட்டை இயக்க குறைந்தபட்சம் 2 அறிக்கைகளைத் தேர்ந்தெடுக்கவும்.',
    analysis_select_all: 'அனைத்தையும் தேர்ந்தெடு',
    analysis_clear_selection: 'தேர்வை மீட்டமை',
    analysis_run_btn: 'ஒப்பீட்டு பகுப்பாய்வை இயக்கு',
    analysis_running_btn: 'ஆய்வக அளவுருக்கள் பகுப்பாய்வு செய்யப்படுகின்றன...',
    analysis_trajectory_summary: 'அளவுரு போக்குகள் கண்ணோட்டம்',
    analysis_key_biomarkers: 'ஒப்பீட்டு பயோமார்க்கர்கள் & இயல்பு வரம்புகள்',
    analysis_risk_factors: 'கண்டறியப்பட்ட மருத்துவ அபாயக் காரணிகள்',
    analysis_recommendations: 'பரிந்துரைக்கப்பட்ட மருத்துவ தொடர் நடவடிக்கைகள்',

    // Trends Page
    trends_page_title: 'அளவுரு போக்குகள் & ஊடாடும் வரைபடங்கள்',
    trends_page_subtitle:
      'அனைத்து வருகை தேதிகளிலும் இயல்பான வரம்புகளுடன் கூடிய நீண்டகால அளவுரு போக்குகளை வரைபடத்தில் காண்க.',
    trends_select_param: 'வரைபடத்தில் பார்க்க அளவுருவைத் தேர்ந்தெடுக்கவும்',
    trends_chart_title: 'நீண்டகால அளவுரு போக்கு வரைபடம்',
    trends_normal_range: 'இயல்பான குறிப்பு வரம்பு',
    trends_observed_values: 'அறிக்கையிடப்பட்ட ஆய்வக மதிப்புகள்',

    // Documents Page
    docs_page_title: 'மருத்துவ ஆவண களஞ்சியம்',
    docs_page_subtitle: 'பதிவேற்றப்பட்ட அனைத்து ஆய்வக அறிக்கைகள், மருத்துவ குறிப்புகள் மற்றும் ஆதார கோப்புகள்.',
    docs_source_grounding: 'ஆதார ஆவண சரிபார்ப்பு',
    docs_view_source: 'மூல ஆவணத்தைக் காண்க',
    docs_verification_status: 'உள்ளடக்க சரிபார்ப்பு நிலை',

    // History & Audit Page
    history_page_title: 'தணிக்கைப் பாதை & நிகழ்வு வரலாறு',
    history_page_subtitle: 'அறிக்கை பதிவேற்றங்கள், AI பகுப்பாய்வுகள் மற்றும் அணுகல் நிகழ்வுகளின் மாற்ற முடியாத பதிவு.',
    history_event_type: 'நிகழ்வு வகை',
    history_timestamp: 'நேர முத்திரை',
    history_actor: 'பயனர் / மருத்துவர்',
    history_details: 'நிகழ்வு விவரங்கள்',

    // Document Upload Modal (Strict Validation)
    modal_upload_title: 'மருத்துவ அறிக்கையை பதிவேற்றி சரிபார்க்கவும்',
    modal_upload_subtitle:
      'உண்மையான மருத்துவ அறிக்கைகளை (PDF, PNG, JPG) பதிவேற்றவும். உள்ளடக்கங்கள் OCR மற்றும் AI மூலம் பரிசோதிக்கப்படுகின்றன.',
    modal_upload_drag_drop: 'மருத்துவ PDF அல்லது படத்தை இங்கே இழுத்து விடவும், அல்லது கோப்பைத் தேர்ந்தெடுக்கவும்',
    modal_upload_browse: 'கோப்பைத் தேர்வுசெய்க',
    modal_upload_supported_formats: 'ஆதரிக்கப்படும் வடிவங்கள்: மருத்துவ PDF, ஸ்கேன் செய்த அறிக்கைகள், படங்கள் (அதிகபட்சம் 25MB)',
    modal_upload_stage_reading: 'ஆவண அமைப்பை வாசிக்கிறது...',
    modal_upload_stage_extracting: 'உரை மற்றும் தரவுகளை பிரித்தெடுக்கிறது...',
    modal_upload_stage_ocr: 'ஸ்கேன் செய்யப்பட்ட பக்கங்களில் Multimodal OCR இயங்குகிறது...',
    modal_upload_stage_verifying: 'AI மூலம் மருத்துவ உள்ளடக்கத்தின் நம்பகத்தன்மையை சரிபார்க்கிறது...',
    modal_upload_stage_clinical: 'மருத்துவ அளவுருக்கள் மற்றும் வரம்புகளை பிரித்தெடுக்கிறது...',
    modal_upload_stage_complete: 'மருத்துவ ஆவணம் வெற்றிகரமாக சரிபார்க்கப்பட்டது!',
    modal_upload_invalid_title: 'செல்லுபடியாகாத மருத்துவ ஆவணம்',
    modal_upload_invalid_msg:
      'இந்த ஆவணத்தில் MEDI-TREND பகுப்பாய்விற்கான மருத்துவ அல்லது ஆய்வக தகவல்கள் இல்லை.',
    modal_upload_detected_badge: 'கண்டறியப்பட்ட ஆவணம்',
    modal_upload_try_again: 'சரியான மருத்துவ அறிக்கையை பதிவேற்றவும்',
    modal_upload_evidence_title: 'சரிபார்க்கப்பட்ட ஆவண ஆதாரங்களின் விவரம்',
    modal_upload_extracted_from_doc: 'ஆவணத்திலிருந்து கண்டறியப்பட்டது',
    modal_upload_user_provided: 'பயனரால் வழங்கப்பட்டது',
    modal_upload_not_detected: 'கண்டறியப்படவில்லை',
    modal_upload_confirm_btn: 'அறிக்கையை உறுதிசெய்து சேமிக்கவும்',
    modal_upload_save_active: 'அறிக்கை சேமிக்கப்படுகிறது...',

    // Auth & Admin Modal
    auth_login_title: 'மருத்துவ பணியிடத்தில் உள்நுழையவும்',
    auth_login_subtitle: 'நோயாளி ஆவணங்கள், அறிக்கை ஒப்பீடுகள் மற்றும் AI முடிவு ஆதரவை அணுகவும்.',
    auth_email_label: 'தொழில்முறை மின்னஞ்சல் முகவரி',
    auth_password_label: 'கடவுச்சொல்',
    auth_role_label: 'பணியிட பொறுப்பைத் தேர்வுசெய்க',
    auth_sign_in_btn: 'உள்நுழைக',
    admin_login_title: 'நிர்வாக கட்டுப்பாட்டு மையம்',
    admin_login_subtitle: 'கணினி நிர்வாகிகள் மற்றும் மருத்துவ இயக்குநர்களுக்கான பிரத்யேக அணுகல்.',
    admin_pin_label: 'பாதுகாப்பு பின் / நிர்வாக கடவுச்சொல்',
    admin_auth_btn: 'நிர்வாகியாக உள்நுழைக',

    // Add Patient Modal
    add_patient_title: 'புதிய நோயாளி பதிவை உருவாக்கவும்',
    add_patient_subtitle: 'நீண்டகால ஆய்வக கண்காணிப்பிற்காக ஒரு நிரந்தர மருத்துவ சுயவிவரத்தை உருவாக்கவும்.',
    patient_fullname: 'நோயாளியின் முழுப் பெயர்',
    patient_age: 'வயது (ஆண்டுகள்)',
    patient_gender: 'பாலினம்',
    patient_phone: 'கைபேசி / வாட்ஸ்அப் எண்',
    patient_blood_group: 'இரத்த வகை',
    patient_initial_notes: 'ஆரம்ப மருத்துவ குறிப்புகள் / நோயறிதல்',
    patient_create_btn: 'நோயாளி பதிவை உருவாக்கு',

    // Export Report Modal
    export_modal_title: 'அதிகாரப்பூர்வ நீண்டகால மருத்துவ சுருக்கத்தை ஏற்றுமதி செய்',
    export_modal_subtitle: 'மருத்துவமனை தர இருமொழி PDF அறிக்கையை பதிவிறக்குங்கள் அல்லது நோயாளிக்கு பகிருங்கள்.',
    export_doctor_notes: 'மருத்துவரின் கருத்துக்கள் மற்றும் வழிகாட்டுதல்',
    export_include_tamil: 'தமிழ் மருத்துவ சுருக்கத்தை சேர்க்கவும் (தமிழ் சுருக்கம்)',
    export_include_graphs: 'காட்சி போக்கு வரைபடங்களை சேர்க்கவும்',
    export_download_pdf: 'அதிகாரப்பூர்வ PDF பதிவிறக்கு',
  },
};
