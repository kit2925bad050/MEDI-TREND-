-- ==========================================================
-- MEDI-TREND AI – Longitudinal Patient Report Intelligence
-- Production Database Schema (PostgreSQL / Supabase Compatible)
-- ==========================================================

-- 1. Admin Users Table (Single Designated Authority)
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Doctors Table (Created & Managed Exclusively by Admin)
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(64) PRIMARY KEY,
    doctor_id VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    phone VARCHAR(32),
    password_hash VARCHAR(256) NOT NULL,
    specialization VARCHAR(128) DEFAULT 'General Medicine',
    reg_number VARCHAR(64),
    department VARCHAR(128) DEFAULT 'Cardiology',
    status VARCHAR(32) DEFAULT 'ACTIVE',
    avatar_url TEXT,
    permissions JSONB DEFAULT '["PATIENT_VIEW","PATIENT_CREATE","REPORT_VIEW","REPORT_UPLOAD","ANALYSIS_CREATE","ANALYSIS_VIEW","REPORT_EXPORT"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Staff Table (Created & Managed Exclusively by Admin)
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(64) PRIMARY KEY,
    staff_id VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    phone VARCHAR(32),
    password_hash VARCHAR(256) NOT NULL,
    department VARCHAR(128) DEFAULT 'Clinical Diagnostics',
    status VARCHAR(32) DEFAULT 'ACTIVE',
    avatar_url TEXT,
    permissions JSONB DEFAULT '["PATIENT_VIEW","REPORT_VIEW","REPORT_UPLOAD"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Patients Table (Real Grounded Medical Patient Records)
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    age INTEGER,
    gender VARCHAR(16),
    phone VARCHAR(32),
    email VARCHAR(128),
    blood_group VARCHAR(16) DEFAULT 'O+',
    status VARCHAR(32) DEFAULT 'Active',
    avatar_url TEXT,
    assigned_doctor_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Medical Reports Table (Strict Document Grounding & Validation Status)
CREATE TABLE IF NOT EXISTS medical_reports (
    id VARCHAR(64) PRIMARY KEY,
    report_id VARCHAR(32) NOT NULL,
    patient_id VARCHAR(32) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    report_date VARCHAR(32) NOT NULL,
    upload_date VARCHAR(64) NOT NULL,
    provider VARCHAR(128) NOT NULL,
    file_path TEXT,
    category VARCHAR(128) DEFAULT 'Biochemistry & Hematology',
    parameter_count INTEGER DEFAULT 0,
    extraction_status VARCHAR(64) DEFAULT 'Verified',
    validation_status VARCHAR(64) DEFAULT 'VALIDATED',
    validation_reason TEXT,
    uploaded_by VARCHAR(128) DEFAULT 'Authorized Clinician',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Report Parameters Table (Grounded Extracted Numerical Lab Values)
CREATE TABLE IF NOT EXISTS report_parameters (
    id VARCHAR(64) PRIMARY KEY,
    report_id VARCHAR(32) NOT NULL,
    patient_id VARCHAR(32) NOT NULL,
    parameter_name VARCHAR(128) NOT NULL,
    canonical_name VARCHAR(128) NOT NULL,
    value NUMERIC NOT NULL,
    unit VARCHAR(32),
    reference_range VARCHAR(64),
    status VARCHAR(32),
    source_page INTEGER DEFAULT 1,
    source_text TEXT,
    category VARCHAR(64) DEFAULT 'General'
);

-- 7. Longitudinal AI Analyses Table
CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(64) PRIMARY KEY,
    analysis_id VARCHAR(64) UNIQUE NOT NULL,
    patient_id VARCHAR(32) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    selected_report_ids JSONB NOT NULL,
    analysis_date VARCHAR(32) NOT NULL,
    improved_count INTEGER DEFAULT 0,
    stable_count INTEGER DEFAULT 0,
    monitoring_count INTEGER DEFAULT 0,
    worsened_count INTEGER DEFAULT 0,
    key_parameters_json JSONB NOT NULL,
    english_summary_json JSONB NOT NULL,
    tamil_summary_json JSONB NOT NULL,
    monitoring_items_json JSONB,
    provider_used VARCHAR(64),
    fallback_history_json JSONB,
    latency_ms NUMERIC DEFAULT 0,
    created_by VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Activity Logs Table (Audit & Human Operations)
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    user_role VARCHAR(32) NOT NULL,
    action_text TEXT NOT NULL,
    entity_type VARCHAR(64),
    entity_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Security & Compliance Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    log_id VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    user_role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64),
    entity_id VARCHAR(64),
    provider VARCHAR(64),
    status VARCHAR(32) DEFAULT 'SUCCESS',
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. AI Provider Configuration & Health Registry
CREATE TABLE IF NOT EXISTS ai_providers (
    id VARCHAR(64) PRIMARY KEY,
    provider_key VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    model VARCHAR(64) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    total_requests INTEGER DEFAULT 0,
    fallback_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_active VARCHAR(64)
);

-- 11. Wound Assessments Table (AI-Assisted Wound & Ulcer Progress Monitoring)
CREATE TABLE IF NOT EXISTS wound_assessments (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) UNIQUE NOT NULL,
    patient_id VARCHAR(32) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    image_filename VARCHAR(256) NOT NULL,
    image_mime_type VARCHAR(64) NOT NULL,
    image_size_bytes INTEGER NOT NULL,
    visit_date VARCHAR(32) NOT NULL,
    upload_date VARCHAR(64) NOT NULL,
    uploaded_by VARCHAR(128) NOT NULL,
    wound_location VARCHAR(128),
    wound_type_tag VARCHAR(128),
    visible_characteristics JSONB,
    severity_indicator VARCHAR(64),
    dimensions_info JSONB,
    categories_considered JSONB,
    limitations_notes JSONB,
    warning_signs JSONB,
    clinical_recommendations JSONB,
    linked_report_summary JSONB,
    doctor_notes TEXT,
    review_status VARCHAR(64) DEFAULT 'PENDING',
    reviewed_by VARCHAR(128),
    reviewed_at VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Wound Monthly Visits Table
CREATE TABLE IF NOT EXISTS wound_visits (
    id VARCHAR(64) PRIMARY KEY,
    visit_id VARCHAR(64) UNIQUE NOT NULL,
    patient_id VARCHAR(32) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    visit_date VARCHAR(32) NOT NULL,
    visit_month VARCHAR(64) NOT NULL,
    wound_location VARCHAR(128) DEFAULT 'Unspecified',
    wound_type_tag VARCHAR(128) DEFAULT 'Unspecified',
    status VARCHAR(32) DEFAULT 'PENDING',
    doctor_notes TEXT DEFAULT '',
    uploaded_by VARCHAR(128) NOT NULL,
    analysis_result JSONB,
    analyzed_at VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Wound Visit Photos Table (1 to 10 photos per monthly visit)
CREATE TABLE IF NOT EXISTS wound_visit_photos (
    id VARCHAR(64) PRIMARY KEY,
    photo_id VARCHAR(64) UNIQUE NOT NULL,
    visit_id VARCHAR(64) NOT NULL REFERENCES wound_visits(visit_id) ON DELETE CASCADE,
    patient_id VARCHAR(32) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    image_filename VARCHAR(256) NOT NULL,
    image_mime_type VARCHAR(64) NOT NULL,
    image_size_bytes INTEGER NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- SEED INITIAL DESIGNATED ADMINISTRATIVE & CLINICAL ACCOUNTS
-- ==========================================================

-- 1. Initial Designated Admin Account (admin / admin1315)
-- Password hash: SHA-256("admin1315" + "medi_trend_secure_salt_2026")
INSERT INTO admin_users (id, username, password_hash, full_name, email, avatar_url)
VALUES (
    'admin-root-001',
    'admin',
    'f087ea0b571ce16930a0586e372579b9ae7d9d0689b60b73010b9911e8609537',
    'Hospital Administrator',
    'admin@hospital.org',
    NULL
) ON CONFLICT (username) DO NOTHING;

-- 2. Initial Designated Active Doctor Account (dr.arvind@hospital.org / doctor1315)
-- Password hash: SHA-256("doctor1315" + "medi_trend_secure_salt_2026")
INSERT INTO doctors (id, doctor_id, full_name, email, phone, password_hash, specialization, reg_number, department, status, avatar_url, permissions)
VALUES (
    'doc-root-001',
    'DOC-001',
    'Dr. Arvind Kumar',
    'dr.arvind@hospital.org',
    '+91 98401 12345',
    '965c276326e11894d0dcce0c7bb09c91629851722cb455f4fc39655079ad51b5',
    'Cardiology & Internal Medicine',
    'MCI-2015-8890',
    'Cardiovascular Sciences',
    'ACTIVE',
    NULL,
    '["PATIENT_VIEW","PATIENT_CREATE","REPORT_VIEW","REPORT_UPLOAD","ANALYSIS_CREATE","ANALYSIS_VIEW","REPORT_EXPORT"]'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- 3. Initial Designated Active Staff Account (priya.staff@hospital.org / staff1315)
-- Password hash: SHA-256("staff1315" + "medi_trend_secure_salt_2026")
INSERT INTO staff (id, staff_id, full_name, email, phone, password_hash, department, status, avatar_url, permissions)
VALUES (
    'staff-root-001',
    'STF-001',
    'Priya Raman',
    'priya.staff@hospital.org',
    '+91 98402 67890',
    'ffdd2e6fa78dc926ef91550fc1b017122119ef0b809a7b9ddfe1e48bc30f612d',
    'Clinical Diagnostics & Pathology',
    'ACTIVE',
    NULL,
    '["PATIENT_VIEW","REPORT_VIEW","REPORT_UPLOAD"]'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- 4. Initial Grounded Patient Profile (S. Gurumurthy / PT-E77688)
INSERT INTO patients (id, patient_id, full_name, age, gender, phone, email, blood_group, status, avatar_url, assigned_doctor_id)
VALUES (
    '5a3c3dd8-4dd1-4a96-ad93-d9afaad2fe22',
    'PT-E77688',
    'S. Gurumurthy',
    58,
    'Male',
    '+91 98400 54321',
    'gurumurthy@example.com',
    'B+',
    'Active',
    NULL,
    'Dr. Arvind Kumar'
) ON CONFLICT (patient_id) DO NOTHING;

-- 5. AI Providers Health Registry
INSERT INTO ai_providers (id, provider_key, name, model, is_primary, is_active, total_requests, fallback_count, error_count, last_active)
VALUES 
    ('prov-001', 'gemini', 'Google Gemini Intelligence', 'gemini-2.0-flash', TRUE, TRUE, 0, 0, 0, 'Active'),
    ('prov-002', 'grok', 'xAI Grok Engine', 'grok-beta', FALSE, TRUE, 0, 0, 0, 'Standby Fallback'),
    ('prov-003', 'openrouter', 'OpenRouter Multi-Model Gateway', 'openai/gpt-4o', FALSE, TRUE, 0, 0, 0, 'Standby Fallback'),
    ('prov-004', 'grounded', 'Deterministic Clinical Rule Engine', 'deterministic-v2', FALSE, TRUE, 0, 0, 0, 'Always Available')
ON CONFLICT (provider_key) DO NOTHING;
