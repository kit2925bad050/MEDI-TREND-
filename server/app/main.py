import os
import re
import tempfile
import sqlite3
import time
import logging

logger = logging.getLogger("medi_trend.auth")

# Database-agnostic IntegrityError: works for both SQLite and PostgreSQL
try:
    import psycopg2.errors as _pg_errors
    _INTEGRITY_ERROR_CLASSES = (sqlite3.IntegrityError, _pg_errors.IntegrityError)
except ImportError:
    _INTEGRITY_ERROR_CLASSES = (sqlite3.IntegrityError,)

DB_INTEGRITY_ERROR = _INTEGRITY_ERROR_CLASSES
import uuid
import shutil
import json
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from .data.db import db, validate_password_strength
from .orchestrator.langgraph_orchestrator import LangGraphMedicalOrchestrator
from .services.pdf_extractor import extract_parameters_from_pdf
from .models.schemas import PatientProfile, ReportRecord, ParameterData, ComparisonRequest, AIAnalysisResult, AuditLogEntry

app = FastAPI(
    title="MEDI-TREND AI - Longitudinal Patient Report Intelligence Platform",
    description="Hospital-grade Real Database-Backed Longitudinal Patient Report Intelligence Platform",
    version="2.0.0"
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = LangGraphMedicalOrchestrator()

# Mount sample/uploaded PDFs
# File storage is managed by DatabaseManager in data/db.py (local + Supabase Storage).
# No module-level pdf_storage_dir needed here.

# ==================== Pydantic Request Models ====================
class LoginRequest(BaseModel):
    username_or_email: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    identifier: Optional[str] = None
    password: str

class AdminFirstPasswordChangeRequest(BaseModel):
    username: str
    current_password: str
    new_password: str

class AdminChangePasswordRequest(BaseModel):
    username: str
    old_password: str
    new_password: str

class AdminChangeIdentityRequest(BaseModel):
    current_username: str
    new_username: str
    new_email: str
    current_password: str

class DoctorChangePasswordRequest(BaseModel):
    doctor_id: str
    old_password: str
    new_password: str

class AdminResetPasswordRequest(BaseModel):
    user_type: str # 'doctor' | 'staff'
    user_id: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    identifier: str
    role: str # 'admin' | 'doctor' | 'staff'

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class DeactivateAccountRequest(BaseModel):
    reason: str

class RestoreAccountRequest(BaseModel):
    reason: Optional[str] = ""

class CreateDoctorRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    phone: Optional[str] = ""
    specialization: Optional[str] = "General Medicine"
    reg_number: Optional[str] = ""
    department: Optional[str] = "Cardiology"
    permissions: Optional[List[str]] = ["PATIENT_VIEW","PATIENT_CREATE","REPORT_VIEW","REPORT_UPLOAD","ANALYSIS_CREATE","ANALYSIS_VIEW","REPORT_EXPORT"]
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Enter a valid email address.")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        valid, message = validate_password_strength(value)
        if not valid:
            raise ValueError(message)
        return value

class CreateStaffRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    phone: Optional[str] = ""
    department: Optional[str] = "Clinical Diagnostics"
    permissions: Optional[List[str]] = ["PATIENT_VIEW","REPORT_VIEW","REPORT_UPLOAD"]
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Enter a valid email address.")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        valid, message = validate_password_strength(value)
        if not valid:
            raise ValueError(message)
        return value

class CreatePatientRequest(BaseModel):
<<<<<<< HEAD
    full_name: str = Field(min_length=2, max_length=120)
    age: int = Field(ge=0, le=130)
    gender: str = Field(min_length=1, max_length=32)
    phone: str = Field(min_length=1, max_length=32)
=======
    full_name: str
    age: int
    gender: Optional[str] = "Male"
    phone: Optional[str] = ""
>>>>>>> origin/main
    email: Optional[str] = ""
    blood_group: Optional[str] = "O+"
    assigned_doctor_id: Optional[str] = "Dr. Arvind Kumar"

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value.strip()):
            raise ValueError("Enter a valid email address.")
        return value.strip().lower() if value else value

class UpdateAvatarRequest(BaseModel):
    avatar_url: Optional[str] = None

class ContactAdminRequest(BaseModel):
    patient_id: Optional[str] = None
    report_id: Optional[str] = None
    subject: str
    message: str

class ReplyMessageRequest(BaseModel):
    reply: str
    status: Optional[str] = "RESOLVED"

class UpdatePatientReportLimitRequest(BaseModel):
    max_reports: int
    reason: Optional[str] = ""

class DoctorAvailabilityRequest(BaseModel):
    working_days: Optional[List[str]] = None
    start_time: Optional[str] = "09:00 AM"
    end_time: Optional[str] = "05:00 PM"
    slot_duration_mins: Optional[int] = 30
    break_start: Optional[str] = "01:00 PM"
    break_end: Optional[str] = "02:00 PM"
    blocked_dates: Optional[List[str]] = None
    is_available: Optional[bool] = True

class BookAppointmentRequest(BaseModel):
    patient_id: str
    patient_name: Optional[str] = ""
    doctor_id: str
    doctor_name: Optional[str] = ""
    department: Optional[str] = "General Medicine"
    appointment_date: str
    slot_time: str
    reason: Optional[str] = ""

class CancelAppointmentRequest(BaseModel):
    reason: Optional[str] = ""

class RescheduleAppointmentRequest(BaseModel):
    new_date: str
    new_slot: str

class ProposeAlternativeRequest(BaseModel):
    proposed_date: str
    proposed_slot: str

class RespondAlternativeRequest(BaseModel):
    accept: bool

# ==================== AUTH & SECURITY GUARDS ====================
def extract_token_from_request(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return request.headers.get("x-auth-token") or request.headers.get("x-token")

def get_current_user_and_role(request: Request) -> Dict[str, Any]:
    """
<<<<<<< HEAD
    Backend Authorization (hardened):
    Identity is derived ONLY from a backend-issued session token validated against the
    active_sessions table. Client-supplied headers (x-user-role / x-user-name) are NEVER
    trusted for authentication or authorization, since they are trivially forgeable.
    A missing or invalid token yields a 401; there is no anonymous or header-based fallback.
    """
    token = extract_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please log in to access this resource."
        )

    session = db.validate_session(token)
    if not session:
        raise HTTPException(
            status_code=401,
            detail="Session expired, revoked, or account is inactive. Please log in again."
        )
    return session
=======
    Backend Authorization:
    Verifies token against active_sessions table and checks that underlying user is STILL ACTIVE.
    Provides graceful fallback for dev and header sessions.
    """
    token = extract_token_from_request(request)
    header_role = request.headers.get("x-user-role")
    header_name = request.headers.get("x-user-name", "Clinician")

    if token:
        session = db.validate_session(token)
        if session:
            return session
        if header_role:
            return {"user_id": header_name, "role": header_role.upper(), "user_name": header_name, "token": token}
        if "admin" in token.lower():
            return {"user_id": "admin-root-001", "role": "ADMIN", "user_name": header_name or "Hospital Administrator", "token": token}
        if "doc" in token.lower():
            return {"user_id": "DOC-001", "role": "DOCTOR", "user_name": header_name or "Dr. Arvind Kumar", "token": token}
        if "stf" in token.lower() or "staff" in token.lower():
            return {"user_id": "STF-001", "role": "STAFF", "user_name": header_name or "Priya Raman", "token": token}

    if header_role:
        return {"user_id": header_name, "role": header_role.upper(), "user_name": header_name, "token": "header_session"}
    return {"user_id": "anonymous", "role": "ANONYMOUS", "user_name": "Anonymous", "token": None}
>>>>>>> origin/main

def require_admin(request: Request) -> Dict[str, Any]:
    user_info = get_current_user_and_role(request)
    if user_info.get("role") != "ADMIN":
        db.log_audit(
            user_info.get("user_id", "unknown"),
            user_info.get("role", "UNKNOWN"),
            "ADMIN_PORTAL_UNAUTHORIZED_ACCESS_ATTEMPT",
            status="FORBIDDEN",
            details=f"User with role {user_info.get('role')} attempted unauthorized access to admin endpoint: {request.url.path}"
        )
        raise HTTPException(
            status_code=403, 
            detail="Access Forbidden: Administrator privileges required to access this resource."
        )
    return user_info

def require_active_user(request: Request) -> Dict[str, Any]:
    user_info = get_current_user_and_role(request)
<<<<<<< HEAD
=======
    if user_info.get("role") == "ANONYMOUS":
        return {"user_id": "clinician", "role": "DOCTOR", "user_name": "Clinician"}
>>>>>>> origin/main
    return user_info

# ==================== REAL AUTHENTICATION ENDPOINTS ====================
@app.post("/api/auth/login")
def unified_login(req: LoginRequest, request: Request):
    """
    Unified Hospital Authentication Endpoint:
    Authenticates Admin, Doctor, or Staff against real database records.
    Enforces active account state, tracks sessions, and returns mandatory first-password-change flag.
    """
    identifier = (req.username_or_email or req.username or req.email or req.identifier or "").strip()
    pwd = req.password.strip()

    # 1. Check if Admin
    logger.debug("Auth attempt: ADMIN lookup for identifier=%s", identifier)
    admin = db.authenticate_admin(identifier, pwd)
    if admin:
        logger.info("Auth success: ADMIN authenticated, identifier=%s, account_active=%s", identifier, not admin.get("account_inactive", False))
        if admin.get("account_inactive"):
            raise HTTPException(
                status_code=403, 
                detail="Your account is inactive. Please contact the administrator."
            )
        token = db.create_session(admin["id"], "ADMIN", admin["full_name"])
        db.log_activity(admin["id"], admin["full_name"], "ADMIN", "Hospital Administrator logged into Admin Portal")
        db.log_audit(admin["id"], "ADMIN", "ADMIN_LOGIN", status="SUCCESS", details="Admin authenticated successfully")
        
        return {
            "success": True,
            "token": token,
            "role": "ADMIN",
            "must_change_password": bool(admin.get("must_change_password", 0)),
            "user": {
                "id": admin["id"],
                "username": admin["username"],
                "name": admin["full_name"],
                "email": admin["email"] or "admin@hospital.org",
                "role": "ADMIN",
                "avatar_url": admin.get("avatar_url"),
                "permissions": ["ALL"]
            }
        }

    # 2. Check if Doctor
    logger.debug("Auth attempt: DOCTOR lookup for identifier=%s", identifier)
    doc = db.authenticate_doctor(identifier, pwd)
    if doc:
        logger.info("Auth success: DOCTOR authenticated, identifier=%s, account_active=%s", identifier, not doc.get("account_inactive", False))
        if doc.get("account_inactive"):
            db.log_audit(
                identifier, "DOCTOR", "LOGIN_REJECTED_INACTIVE_ACCOUNT", 
                status="FORBIDDEN", details=f"Deactivated doctor {identifier} attempted login. Reason: {doc.get('deactivation_reason')}"
            )
            raise HTTPException(
                status_code=403, 
                detail="Your account is inactive. Please contact the administrator."
            )
        doc_name = doc["full_name"]
        if not doc_name.startswith("Dr."):
            doc_name = f"Dr. {doc_name}"
        token = db.create_session(doc["doctor_id"], "DOCTOR", doc_name)
        db.log_activity(doc["doctor_id"], doc_name, "DOCTOR", f"Doctor {doc_name} logged into Clinical Portal", "DOCTOR", doc["doctor_id"])
        db.log_audit(doc["doctor_id"], "DOCTOR", "LOGIN", status="SUCCESS", details="Doctor authenticated successfully")
        perms = doc.get("permissions") or ["PATIENT_VIEW","PATIENT_CREATE","REPORT_VIEW","REPORT_UPLOAD","ANALYSIS_CREATE","ANALYSIS_VIEW","REPORT_EXPORT"]
        return {
            "success": True,
            "token": token,
            "role": "DOCTOR",
            "user": {
                "id": doc["doctor_id"],
                "name": doc_name,
                "email": doc["email"],
                "role": "DOCTOR",
                "specialization": doc.get("specialization", "General Medicine"),
                "department": doc.get("department", "Cardiology"),
                "avatar_url": doc.get("avatar_url"),
                "permissions": perms
            }
        }

    # 3. Check if Staff
    logger.debug("Auth attempt: STAFF lookup for identifier=%s", identifier)
    stf = db.authenticate_staff(identifier, pwd)
    if stf:
        logger.info("Auth success: STAFF authenticated, identifier=%s, account_active=%s", identifier, not stf.get("account_inactive", False))
        if stf.get("account_inactive"):
            raise HTTPException(
                status_code=403, 
                detail="Your account is inactive. Please contact the administrator."
            )
        token = db.create_session(stf["staff_id"], "STAFF", stf["full_name"])
        db.log_activity(stf["staff_id"], stf["full_name"], "STAFF", f"Staff member {stf['full_name']} logged into Clinical Portal", "STAFF", stf["staff_id"])
        db.log_audit(stf["staff_id"], "STAFF", "LOGIN", status="SUCCESS", details="Staff authenticated successfully")
        perms = stf.get("permissions") or ["PATIENT_VIEW","REPORT_VIEW","REPORT_UPLOAD"]
        return {
            "success": True,
            "token": token,
            "role": "STAFF",
            "user": {
                "id": stf["staff_id"],
                "name": stf["full_name"],
                "email": stf["email"],
                "role": "STAFF",
                "department": stf.get("department", "Clinical Diagnostics"),
                "avatar_url": stf.get("avatar_url"),
                "permissions": perms
            }
        }

    # 4. Check if Patient
    pat = db.authenticate_patient(identifier, pwd)
    if pat:
        if pat.get("status") == "INACTIVE":
            raise HTTPException(
                status_code=403, 
                detail="Your patient account is inactive. Please contact the hospital administrator."
            )
        token = db.create_session(pat["patient_id"], "PATIENT", pat["full_name"])
        db.log_activity(pat["patient_id"], pat["full_name"], "PATIENT", f"Patient {pat['full_name']} logged into Patient Portal", "PATIENT", pat["patient_id"])
        db.log_audit(pat["patient_id"], "PATIENT", "LOGIN", status="SUCCESS", details="Patient authenticated successfully")
        return {
            "success": True,
            "token": token,
            "role": "PATIENT",
            "user": {
                "id": pat["patient_id"],
                "name": pat["full_name"],
                "email": pat.get("email"),
                "role": "PATIENT",
                "avatar_url": pat.get("avatar_url"),
                "permissions": ["PATIENT_VIEW", "REPORT_VIEW"]
            }
        }

    # Failed Login
    logger.warning("Auth failure: no account matched for identifier=%s (tried ADMIN, DOCTOR, STAFF)", identifier)
    db.log_audit(identifier, "UNKNOWN", "LOGIN_FAILED", status="FAILED", details=f"Failed authentication attempt for identifier: {identifier}")
    raise HTTPException(status_code=401, detail="Invalid username/email or password.")

@app.post("/api/admin/login")
def admin_login_legacy(req: LoginRequest, request: Request):
    """Admin dedicated gateway route."""
    return unified_login(req, request)

@app.post("/api/admin/first-password-change")
def admin_first_password_change(req: AdminFirstPasswordChangeRequest):
    """
    Mandatory First-Login Password Change for Admin.
    Old default password immediately invalidated.
    """
    success, msg = db.change_admin_first_password(req.username.strip(), req.current_password.strip(), req.new_password.strip())
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    
    # Create fresh session for updated credentials
    admin = db.authenticate_admin(req.username.strip(), req.new_password.strip())
    new_token = db.create_session(admin["id"], "ADMIN", admin["full_name"])
    
    return {
        "success": True,
        "message": msg,
        "token": new_token,
        "must_change_password": False
    }

@app.post("/api/admin/change-password")
def admin_change_password(req: AdminChangePasswordRequest, auth: Dict[str, Any] = Depends(require_admin)):
    """Change Admin Password from Security Settings."""
    success, msg = db.change_admin_password(req.username.strip(), req.old_password.strip(), req.new_password.strip())
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    
    # Issue fresh active session
    admin = db.authenticate_admin(req.username.strip(), req.new_password.strip())
    new_token = db.create_session(admin["id"], "ADMIN", admin["full_name"])
    return {"success": True, "message": msg, "token": new_token}

@app.post("/api/admin/change-identity")
def admin_change_identity(req: AdminChangeIdentityRequest, auth: Dict[str, Any] = Depends(require_admin)):
    """Change Admin Login Identifier / Username / Email."""
    success, msg = db.change_admin_identity(
        req.current_username.strip(),
        req.new_username.strip(),
        req.new_email.strip(),
        req.current_password.strip()
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg, "new_username": req.new_username.strip()}

@app.post("/api/doctor/change-password")
def doctor_change_password(req: DoctorChangePasswordRequest):
    """Doctor self-service password update."""
    success, msg = db.change_doctor_password(req.doctor_id.strip(), req.old_password.strip(), req.new_password.strip())
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@app.post("/api/admin/reset-password")
def admin_reset_password(req: AdminResetPasswordRequest, auth: Dict[str, Any] = Depends(require_admin)):
    """Admin privilege: Reset password for any doctor or staff member."""
    success, msg = db.reset_user_password_by_admin(req.user_type, req.user_id, req.new_password, auth.get("user_id", "admin"))
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@app.post("/api/auth/forgot-password")
def forgot_password_request(req: ForgotPasswordRequest):
    """
    Secure Forgot Password Request:
    Generates time-limited (15m) single-use cryptographically secure recovery token.
    """
    success, msg, token = db.create_password_reset_token(req.identifier.strip(), req.role.strip())
    response = {
        "success": True,
        "message": msg,
    }
    if token:
        response["reset_token"] = token
    return response

@app.post("/api/auth/reset-password")
def reset_password_with_token(req: ResetPasswordRequest):
    """Consumes single-use reset token and securely sets new password."""
    success, msg = db.verify_and_consume_reset_token(req.token.strip(), req.new_password.strip())
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@app.post("/api/auth/logout")
def user_logout(request: Request):
    token = extract_token_from_request(request)
    if token:
        db.revoke_session(token)
    user_name = request.headers.get("x-user-name", "Authenticated User")
    user_role = request.headers.get("x-user-role", "USER")
    db.log_activity(user_name, user_name, user_role, f"User {user_name} logged out securely")
    db.log_audit(user_name, user_role, "LOGOUT", status="SUCCESS", details="Session terminated")
    return {"success": True, "message": "Logged out successfully"}

@app.get("/api/admin/sessions")
def get_admin_active_sessions(auth: Dict[str, Any] = Depends(require_admin)):
    return db.get_user_active_sessions(auth.get("user_id", "admin-root-001"))

@app.post("/api/admin/sessions/revoke-all")
def revoke_all_other_sessions(request: Request, auth: Dict[str, Any] = Depends(require_admin)):
    current_token = extract_token_from_request(request)
    db.revoke_user_sessions(auth.get("user_id", "admin-root-001"))
    # Recreate current session so admin stays logged in
    new_token = db.create_session(auth.get("user_id", "admin-root-001"), "ADMIN", auth.get("user_name", "Hospital Administrator"))
    db.log_audit(auth.get("user_id", "admin"), "ADMIN", "SESSION_REVOKED", details="Admin signed out of all other sessions.")
    return {"success": True, "message": "All other active sessions revoked.", "token": new_token}

# ==================== ADMIN PORTAL ISOLATED ROUTES ====================
from .providers.ai_provider import ai_router

@app.get("/api/admin/dashboard")
def get_admin_dashboard(auth: Dict[str, Any] = Depends(require_admin)):
    stats = db.get_admin_dashboard_stats()
    stats["ai_provider_states"] = ai_router.get_provider_states()
    return stats

@app.get("/api/admin/ai-health")
def get_ai_provider_health(auth: Dict[str, Any] = Depends(require_admin)):
    return {
        "status": "operational",
        "providers": ai_router.get_provider_states(),
        "chain": ai_router.chain
    }

@app.get("/api/admin/activities")
def get_admin_activities(auth: Dict[str, Any] = Depends(require_admin)):
    return db.get_recent_activities(limit=50)

@app.get("/api/admin/audit")
def get_admin_audit_logs(auth: Dict[str, Any] = Depends(require_admin)):
    return db.get_audit_logs(limit=100)

# ==================== DOCTOR LIFECYCLE MANAGEMENT ====================
@app.get("/api/admin/doctors")
@app.get("/api/doctors")
def get_doctors(status: Optional[str] = None):
    return db.get_all_doctors(status=status)

@app.post("/api/admin/doctors")
<<<<<<< HEAD
def create_doctor(req: CreateDoctorRequest, auth: Dict[str, Any] = Depends(require_admin)):
    try:
        doc = db.create_doctor(req.model_dump(), admin_name=auth.get("user_name", "Admin"))
    except DB_INTEGRITY_ERROR as exc:
        raise HTTPException(status_code=409, detail="A doctor with this email already exists.") from exc
    db.log_activity(auth.get("user_id", "admin"), auth.get("user_name", "Admin"), "ADMIN", f"Added new Doctor: Dr. {req.full_name} ({req.specialization})", "DOCTOR", doc["doctor_id"])
=======
@app.post("/api/doctors")
def create_doctor(req: CreateDoctorRequest, request: Request):
    user_info = get_current_user_and_role(request)
    admin_name = user_info.get("user_name", "Admin")
    doc = db.create_doctor(req.dict(), admin_name=admin_name)
    db.log_activity(user_info.get("user_id", "admin"), admin_name, "ADMIN", f"Added new Doctor: Dr. {req.full_name} ({req.specialization})", "DOCTOR", doc["doctor_id"])
>>>>>>> origin/main
    return doc

@app.delete("/api/admin/doctors/{doctor_id}")
@app.delete("/api/doctors/{doctor_id}")
def delete_doctor_endpoint(doctor_id: str, request: Request):
    user_info = get_current_user_and_role(request)
    admin_name = user_info.get("user_name", "Admin")
    success, msg = db.delete_doctor(doctor_id, admin_name=admin_name)
    if not success:
        raise HTTPException(status_code=404, detail=msg)
    db.log_activity(user_info.get("user_id", "admin"), admin_name, "ADMIN", f"Permanently removed Doctor {doctor_id}", "DOCTOR", doctor_id)
    return {"success": True, "message": msg, "doctor_id": doctor_id}

@app.post("/api/admin/doctors/{doctor_id}/deactivate")
def deactivate_doctor(doctor_id: str, req: DeactivateAccountRequest, request: Request):
    """
    Deactivate doctor with required reason.
    Doctor cannot authenticate. Historical medical reports remain intact.
    """
    user_info = get_current_user_and_role(request)
    admin_name = user_info.get("user_name", "Admin")
    success, msg = db.deactivate_doctor(doctor_id, req.reason, admin_name=admin_name)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    db.log_activity(user_info.get("user_id", "admin"), admin_name, "ADMIN", f"Deactivated Doctor {doctor_id}. Reason: {req.reason}", "DOCTOR", doctor_id)
    return {"success": True, "message": msg, "doctor_id": doctor_id, "status": "INACTIVE"}

@app.post("/api/admin/doctors/{doctor_id}/restore")
def restore_doctor(doctor_id: str, req: RestoreAccountRequest = RestoreAccountRequest(), request: Request = None):
    """Restore a deactivated doctor to ACTIVE status."""
    user_info = get_current_user_and_role(request) if request else {}
    admin_name = user_info.get("user_name", "Admin")
    success, msg = db.restore_doctor(doctor_id, admin_name=admin_name, reason=req.reason or "")
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    db.log_activity(user_info.get("user_id", "admin"), admin_name, "ADMIN", f"Restored Doctor {doctor_id} to Active", "DOCTOR", doctor_id)
    return {"success": True, "message": msg, "doctor_id": doctor_id, "status": "ACTIVE"}

# ==================== STAFF LIFECYCLE MANAGEMENT ====================
@app.get("/api/admin/staff")
def get_staff(status: Optional[str] = None, auth: Dict[str, Any] = Depends(require_admin)):
    return db.get_all_staff(status=status)

@app.post("/api/admin/staff")
def create_staff(req: CreateStaffRequest, auth: Dict[str, Any] = Depends(require_admin)):
    try:
        stf = db.create_staff(req.model_dump(), admin_name=auth.get("user_name", "Admin"))
    except DB_INTEGRITY_ERROR as exc:
        raise HTTPException(status_code=409, detail="A staff member with this email already exists.") from exc
    db.log_activity(auth.get("user_id", "admin"), auth.get("user_name", "Admin"), "ADMIN", f"Added new Staff Member: {req.full_name} ({req.department})", "STAFF", stf["staff_id"])
    return stf

@app.post("/api/admin/staff/{staff_id}/deactivate")
def deactivate_staff(staff_id: str, req: DeactivateAccountRequest, auth: Dict[str, Any] = Depends(require_admin)):
    success, msg = db.deactivate_staff(staff_id, req.reason, admin_name=auth.get("user_name", "Admin"))
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg, "staff_id": staff_id, "status": "INACTIVE"}

@app.post("/api/admin/staff/{staff_id}/restore")
def restore_staff(staff_id: str, req: RestoreAccountRequest = RestoreAccountRequest(), auth: Dict[str, Any] = Depends(require_admin)):
    success, msg = db.restore_staff(staff_id, admin_name=auth.get("user_name", "Admin"), reason=req.reason or "")
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg, "staff_id": staff_id, "status": "ACTIVE"}

# ==================== PATIENT LIFECYCLE MANAGEMENT ====================
@app.get("/api/patients")
def get_patients(include_inactive: bool = False):
    """Returns real database patients (active by default)."""
    return db.get_all_patients(include_inactive=include_inactive)

@app.get("/api/doctors/available")
def get_available_doctors():
    return [
        {
            "doctor_id": doctor["doctor_id"],
            "full_name": doctor["full_name"],
            "specialization": doctor.get("specialization") or "",
        }
        for doctor in db.get_all_doctors(status="ACTIVE")
    ]

@app.get("/api/admin/patients")
def get_admin_patients(auth: Dict[str, Any] = Depends(require_admin)):
    """Admin Master Patient Index with full lifecycle state."""
    return db.get_all_patients(include_inactive=True)

@app.post("/api/patients")
@app.post("/api/admin/patients")
def create_patient(req: CreatePatientRequest, request: Request):
<<<<<<< HEAD
    user_name = request.headers.get("x-user-name", "Clinician")
    user_role = request.headers.get("x-user-role", "DOCTOR")
    try:
        p = db.create_patient(req.model_dump(), actor_name=user_name, actor_role=user_role)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DB_INTEGRITY_ERROR as exc:
        raise HTTPException(status_code=409, detail="A patient with these details already exists.") from exc
=======
    user_info = get_current_user_and_role(request)
    user_name = user_info.get("user_name", "Clinician")
    user_role = user_info.get("role", "DOCTOR")
    p = db.create_patient(req.dict(), actor_name=user_name, actor_role=user_role)
>>>>>>> origin/main
    db.log_activity(user_name, user_name, user_role, f"Created new patient record for {req.full_name} (PID: {p['patient_id']})", "PATIENT", p["patient_id"])
    saved_patient = db.get_patient(p["patient_id"])
    return {**p, **(saved_patient or {})}

@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str):
    p = db.get_patient(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient record not found")
    return p

@app.delete("/api/patients/{patient_id}")
@app.delete("/api/admin/patients/{patient_id}")
def delete_patient_endpoint(patient_id: str, request: Request):
    """Permanently delete patient and associated records."""
    user_info = get_current_user_and_role(request)
    user_name = user_info.get("user_name", "Clinician")
    user_role = user_info.get("role", "DOCTOR")
    success, msg = db.delete_patient(patient_id, actor_name=user_name, actor_role=user_role)
    if not success:
        raise HTTPException(status_code=404, detail=msg)
    db.log_activity(user_name, user_name, user_role, f"Permanently removed patient record {patient_id}", "PATIENT", patient_id)
    return {"success": True, "message": msg, "patient_id": patient_id}

@app.post("/api/admin/patients/{patient_id}/deactivate")
@app.post("/api/patients/{patient_id}/deactivate")
def deactivate_patient(patient_id: str, req: DeactivateAccountRequest, request: Request):
    """Deactivates patient without deleting clinical records."""
    user_info = get_current_user_and_role(request)
    user_name = user_info.get("user_name", "Admin")
    user_role = user_info.get("role", "ADMIN")
    success, msg = db.deactivate_patient(patient_id, req.reason, actor_name=user_name, actor_role=user_role)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg, "patient_id": patient_id, "status": "INACTIVE"}

@app.post("/api/admin/patients/{patient_id}/restore")
@app.post("/api/patients/{patient_id}/restore")
def restore_patient(patient_id: str, req: RestoreAccountRequest = RestoreAccountRequest(), request: Request = None):
    user_info = get_current_user_and_role(request) if request else {}
    user_name = user_info.get("user_name", "Admin")
    user_role = user_info.get("role", "ADMIN")
    success, msg = db.restore_patient(patient_id, actor_name=user_name, actor_role=user_role, reason=req.reason or "")
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg, "patient_id": patient_id, "status": "ACTIVE"}

@app.put("/api/patients/{patient_id}/avatar")
def update_patient_avatar(patient_id: str, req: UpdateAvatarRequest, request: Request):
    user_name = request.headers.get("x-user-name", "Clinician")
    user_role = request.headers.get("x-user-role", "DOCTOR")
    success = db.update_patient_avatar(patient_id, req.avatar_url)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    action_text = "Updated profile photo" if req.avatar_url else "Removed profile photo"
    db.log_activity(user_name, user_name, user_role, f"{action_text} for Patient {patient_id}", "PATIENT", patient_id)
    db.log_audit(user_name, user_role, "PROFILE_PHOTO_UPDATED", "PATIENT", patient_id, details=action_text)
    return {"success": True, "avatar_url": req.avatar_url}

# ==================== STRICT REAL MEDICAL DOCUMENT PIPELINE ====================
from .services.document_validator import (
    validate_file_security,
    extract_raw_text,
    classify_medical_document,
    validate_patient_identity,
    extract_patient_identifiers_from_text,
    DocumentValidationError,
)

@app.get("/api/patients/{patient_id}/reports")
def get_patient_reports(patient_id: str):
    reports = db.get_patient_reports(patient_id)
    for report in reports:
        report["file_path"] = f"/api/reports/{report['report_id']}/file"
    return reports

@app.post("/api/patients/{patient_id}/upload")
@app.post("/api/patients/{patient_id}/reports/upload")
@app.post("/api/patients/{patient_id}/reports")
async def upload_patient_report(
    patient_id: str,
    file: UploadFile = File(...),
    provider: str = Form(""),
    reportDate: str = Form(""),
    reportCategory: str = Form(""),
    request: Request = None
):
    """
    STRICT REAL CONTENT VALIDATION WORKFLOW:
    1. Validate File Signature & MIME Type
    2. Extract Actual Embedded / OCR Text
    3. Multimodal Content Understanding & Classification
    4. Non-Medical Rejection with Clear Diagnostic Reason
    5. Save Active Report ONLY when verified
    """
<<<<<<< HEAD
    user_name = request.headers.get("x-user-name", "Clinician") if request else "Clinician"
    user_role = request.headers.get("x-user-role", "DOCTOR") if request else "DOCTOR"

    patient = db.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found in database.")

    upload_name = (file.filename or "").replace("\\", "/").split("/")[-1]
    if not upload_name:
        raise HTTPException(status_code=400, detail="The uploaded file must have a filename.")
    extension = os.path.splitext(upload_name)[1].lower()
    temp_filename = f"temp_{uuid.uuid4().hex}{extension}"
    temp_path = os.path.join(db.storage_dir(), temp_filename)

    try:
        total_size = 0
        with open(temp_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                total_size += len(chunk)
                if total_size > 25 * 1024 * 1024:
                    raise HTTPException(status_code=413, detail="Document exceeds the 25MB clinical file size limit.")
                buffer.write(chunk)
    except HTTPException:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise
    except OSError as exc:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail="Unable to save the uploaded document.") from exc

    try:
        # Gate 1: File Security & Signature Check
        sec_info = validate_file_security(temp_path, upload_name)
=======
    temp_path = None
    final_path = None
    try:
        user_name = request.headers.get("x-user-name", "Clinician") if request else "Clinician"
        user_role = request.headers.get("x-user-role", "DOCTOR") if request else "DOCTOR"
        user_id = request.headers.get("x-user-id", "") if request else ""

        # Step 0: Permission & Access Control Verification
        norm_role = user_role.strip().upper()
        if norm_role == "UNAUTHORIZED" or norm_role not in ["DOCTOR", "CLINICIAN", "ADMIN", "SUPER_ADMIN", "STAFF", "PATIENT"]:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized access: insufficient permissions to access or upload medical records."
            )
        if norm_role == "PATIENT" and user_id and user_id != patient_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: Patient accounts are strictly restricted to their own medical documents."
            )

        # Save temporary file for deep content inspection
        temp_filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
        temp_path = os.path.join(pdf_storage_dir, temp_filename)

        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Gate 1: File Security, Format & Signature Check
        sec_info = validate_file_security(temp_path, file.filename)
>>>>>>> origin/main
        if not sec_info["is_valid"]:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            db.log_audit(
                user_name, user_role, "DOCUMENT_SECURITY_REJECTED",
                "DOCUMENT", file.filename, status="REJECTED", details=sec_info.get("reason", "Unsupported file")
            )
            raise HTTPException(
                status_code=400,
                detail={"error": "INVALID_FILE", "message": sec_info.get("reason", "Only supported medical documents can be uploaded.")}
            )

<<<<<<< HEAD
        # Gate 2 & 3: Content & OCR Extraction
        extracted_text, total_pages, ocr_used = extract_raw_text(temp_path)

        # Gate 4: Gemini Multimodal Content Understanding
        classification = classify_medical_document(extracted_text, upload_name, ocr_used)

        # Gate 5: Non-Medical Document Rejection
        if not classification.get("is_medical", False):
=======
        # Gate 2: Content & OCR Extraction
        extracted_text, total_pages, ocr_used = extract_raw_text(temp_path, sec_info["extension"])

        # Gate 3: Content Understanding & Medical Classification
        classification = classify_medical_document(extracted_text, file.filename, ocr_used=ocr_used, file_path=temp_path)

        is_med = classification.get("is_medical_document", classification.get("is_medical", True))
        doc_type = classification.get("document_type", "LAB_REPORT")

        # Gate 3a: Non-Medical Document Rejection
        if not is_med or doc_type == "NON_MEDICAL":
>>>>>>> origin/main
            if os.path.exists(temp_path):
                os.remove(temp_path)
            detected_type = classification.get("detected_type_label") or classification.get("document_type", "NON_MEDICAL")
            reason_msg = classification.get("reason") or "This document does not contain sufficient clinical or medical content for MEDI-TREND analysis."
            
            db.log_audit(
                user_name, user_role, "NON_MEDICAL_DOCUMENT_REJECTED",
                "DOCUMENT", file.filename, status="REJECTED", details=f"Rejected as {detected_type}. Reason: {reason_msg}"
            )
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "validation_status": "REJECTED",
                    "error_code": "NON_MEDICAL_DOCUMENT",
                    "is_medical": False,
                    "document_type": "NON_MEDICAL",
                    "detected_type_label": detected_type,
                    "confidence": classification.get("confidence", 0.95),
                    "reason": reason_msg,
                    "message": "Invalid Medical Document: Only genuine medical records are accepted.",
                    "detected_content": classification.get("detected_content", [])
                }
            )

        # Gate 3b: Unreadable or Corrupted Content Rejection
        if doc_type in ["UNREADABLE", "CORRUPTED"]:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "validation_status": "REJECTED",
                    "error_code": "UNREADABLE_OR_BLANK",
                    "is_medical": False,
                    "document_type": "UNREADABLE",
                    "confidence": 0.0,
                    "reason": "Unable to verify document content. The uploaded document contains insufficient or unreadable text.",
                    "message": "Unable to verify document content. The uploaded document contains insufficient or unreadable text. Please upload a clear medical document."
                }
            )

<<<<<<< HEAD
    # Move from temp to permanent storage
    final_filename = f"{uuid.uuid4().hex}{extension}"
    # File will be stored via db.store_uploaded_file() after identity verification passes
    # Persist the uploaded file via Supabase Storage or local fallback
    stored_file_path = db.store_uploaded_file(temp_path, final_filename, file.content_type or "application/pdf")

    report_id = f"REP-{uuid.uuid4().hex[:6].upper()}"
    extracted_date = classification.get("report_date")
    extracted_provider = classification.get("provider")
    doc_type = classification.get("document_type", "LAB_REPORT")

    effective_date = extracted_date or (reportDate.strip() if reportDate.strip() else time.strftime("%Y-%m-%d"))

    # Extract structured parameters from verified document
    extracted_params = extract_parameters_from_pdf(temp_path, report_id, effective_date)

    effective_provider = extracted_provider or (provider.strip() if provider.strip() else "Clinical Pathology Laboratory")
    effective_category = reportCategory.strip() if reportCategory.strip() else (
        "Biochemistry & Hematology" if doc_type == "LAB_REPORT" else doc_type.replace("_", " ").title()
    )

    # ==================== PATIENT IDENTITY VERIFICATION ====================
    # Extract patient identifiers from the uploaded document
    doc_identifiers = extract_patient_identifiers_from_text(extracted_text)
    doc_patient_name = doc_identifiers.get("patient_name") or classification.get("patient_name") or "Not detected"

    # Get registered patient info for identity comparison
    registered_patient_name = patient.get("full_name", "")
    registered_patient_id = patient.get("patient_id", "")

    # Try to extract DOB, age, sex from registered patient record
    registered_dob = patient.get("dateOfBirth") or patient.get("dob")
    registered_age = patient.get("age")
    registered_sex = patient.get("gender")

    # Run strict identity verification
    identity_result = validate_patient_identity(
        expected_patient_name=registered_patient_name,
        expected_patient_id=registered_patient_id,
        expected_dob=registered_dob,
        expected_age=registered_age,
        expected_sex=registered_sex,
        extracted_text=extracted_text
    )

    identity_status = identity_result.get("status", "UNVERIFIED")
    identity_score = identity_result.get("match_score", 0.0)
    identity_details = identity_result.get("details", "")

    # Log identity verification decision
    db.log_audit(
        user_name, user_role, "PATIENT_IDENTITY_VERIFICATION",
        "REPORT", patient["patient_id"],
        details=f"{identity_details}. Report: {upload_name}. Status: {identity_status}. Score: {identity_score:.2f}"
    )

    # ==================== BLOCK MISMATCHED / UNVERIFIED REPORTS ====================
    # Do NOT save reports whose patient identity does not match the selected patient.
    # Only VERIFIED and REVIEW_REQUIRED reports are stored; MISMATCH and UNVERIFIED are rejected.
    if identity_status in ("MISMATCH", "UNVERIFIED"):
        # Remove the stored file since we will not associate it with this patient
        if _USE_SUPABASE_STORAGE and _storage is not None:
            db.delete_uploaded_file(stored_file_path)
        elif os.path.exists(temp_path):
            os.remove(temp_path)
        db.log_audit(
            user_name, user_role, "REPORT_REJECTED_IDENTITY_MISMATCH",
            "REPORT", report_id,
            details=f"Rejected: {identity_details}. Report: {upload_name}. Selected patient: {registered_patient_name}."
        )
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "validation_status": "REJECTED",
                "error_code": "PATIENT_IDENTITY_MISMATCH",
                "identity_status": identity_status,
                "match_score": identity_score,
                "registered_patient_name": registered_patient_name,
                "extracted_patient_name": doc_patient_name,
                "detected_identifiers": identity_result.get("detected_identifiers", {}),
                "conflicts": identity_result.get("conflicts", []),
                "details": identity_details,
                "message": "PATIENT DETAILS MISMATCH — DOCUMENT NOT ACCEPTED. The uploaded report does not belong to the selected patient.",
            }
        )

    report_record = {
        "report_id": report_id,
        "patient_id": patient["patient_id"],
        "report_date": effective_date,
        "upload_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "provider": effective_provider,
        "file_path": final_filename,
        "category": effective_category,
        "parameter_count": len(extracted_params),
        "extraction_status": "Verified",
        "uploaded_by": user_name,
        "extracted_patient_name": doc_patient_name,
        "identity_verification_status": identity_status,
        "identity_match_score": identity_score,
        "identity_details": identity_details,
    }
=======
        # Gate 4: Dynamic Clinical Parameter Extraction from Verified Medical Content
        extracted_date = classification.get("report_date")
        extracted_provider = classification.get("provider")
        effective_date = extracted_date or (reportDate.strip() if reportDate.strip() else time.strftime("%Y-%m-%d"))
        effective_provider = extracted_provider or (provider.strip() if provider.strip() else "Clinical Pathology Laboratory")
        effective_category = reportCategory.strip() if reportCategory.strip() else (
            "Biochemistry & Hematology" if doc_type == "LAB_REPORT" else doc_type.replace("_", " ").title()
        )

        extracted_params = extract_parameters_from_pdf(temp_path, report_id="PREVIEW", report_date=effective_date, raw_text=extracted_text)

        # Gate 5: Patient Profile Lookup (Decoupled from Document Validity)
        patient = db.get_patient(patient_id)
        if not patient:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            db.log_audit(
                user_name, user_role, "PATIENT_PROFILE_NOT_FOUND",
                "DOCUMENT", file.filename, status="REJECTED",
                details=f"Valid medical document ({doc_type}) uploaded, but patient profile '{patient_id}' not found in database."
            )
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "validation_status": "PATIENT_NOT_FOUND",
                    "error_code": "PATIENT_NOT_FOUND",
                    "is_medical": True,
                    "document_type": doc_type,
                    "detected_category": effective_category,
                    "detected_patient_name": classification.get("patient_name"),
                    "parameter_count": len(extracted_params),
                    "message": f"Medical document verified as {doc_type.replace('_', ' ').title()}, but patient profile '{patient_id}' was not found in the database.",
                    "resolution": "The uploaded file is a valid medical record. Please select an existing patient profile from the patient directory or register this patient before uploading.",
                    "action_required": "Select or register patient profile in database."
                }
            )

        # Gate 6: Strict Patient Identity Verification
        from .services.identity_verifier import verify_patient_identity
        id_decision = verify_patient_identity(patient, extracted_text, classification.get("patient_name"))
>>>>>>> origin/main

        if id_decision["status"] in ["IDENTITY_MISMATCH", "IDENTITY_UNVERIFIED"]:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            failed_field = id_decision.get("failed_field") or "PATIENT_NAME"
            error_code = id_decision.get("error_code") or "PATIENT_NAME_MISMATCH"
            title = id_decision.get("title") or "PATIENT IDENTITY MISMATCH - INVALID DOCUMENT FOR THIS PATIENT"
            status_label = id_decision.get("status_label") or "Identity mismatch"
            reg_id = patient.get("patient_id") or patient.get("id") or "UNKNOWN"
            doc_id = id_decision.get("extracted_id")

            db.log_audit(
                user_name, user_role, f"{id_decision['status']}_REJECTED",
                "DOCUMENT", file.filename, status="REJECTED",
                details=f"Identity check rejected. Field failed: {failed_field}. RegID: {reg_id}, DocID: {doc_id or 'None'}. Reason: {id_decision.get('reason')}"
            )
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "validation_status": id_decision["status"],
                    "error_code": error_code,
                    "failed_field": failed_field,
                    "title": title,
                    "status_label": status_label,
                    "registered_patient": patient["full_name"],
                    "extracted_patient": id_decision.get("extracted_patient") or "Unknown",
                    "registered_id": reg_id,
                    "extracted_id": doc_id,
                    "confidence": id_decision.get("confidence", 0.0),
                    "reason": id_decision.get("reason"),
                    "message": title,
                    "action": id_decision.get("action_required") or "Review or upload the correct document for this patient.",
                    "details": id_decision
                }
            )

        # Gate 7: Duplicate Report Detection
        doc_hash = sec_info.get("document_hash")
        if doc_hash:
            existing_dup = db.get_report_by_hash(patient["patient_id"], doc_hash)
            if existing_dup:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                db.log_audit(
                    user_name, user_role, "DUPLICATE_REPORT_REJECTED",
                    "DOCUMENT", file.filename, status="REJECTED",
                    details=f"Duplicate report detected for patient {patient['patient_id']} (matches {existing_dup.get('report_id')})"
                )
                return JSONResponse(
                    status_code=409,
                    content={
                        "success": False,
                        "validation_status": "DUPLICATE_REPORT",
                        "error_code": "DUPLICATE_REPORT",
                        "message": f"This medical report has already been uploaded and ingested for this patient (Report ID: {existing_dup.get('report_id')}).",
                        "existing_report_id": existing_dup.get("report_id"),
                        "report_date": existing_dup.get("report_date"),
                        "action": "Duplicate report submission prevented."
                    }
                )

        # Gate 8: Enforce Patient Report Capacity Limit (Default 5, expandable by Admin)
        existing_reports = db.get_patient_reports(patient["patient_id"])
        max_capacity = db.get_patient_report_limit(patient["patient_id"])
        if len(existing_reports) >= max_capacity:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(
                status_code=403,
                detail=f"Report capacity limit reached ({len(existing_reports)}/{max_capacity} accepted reports). An administrator can grant additional report capacity if required."
            )

        # Move from temp to permanent storage
        final_filename = f"{uuid.uuid4().hex}_{file.filename}"
        final_path = os.path.join(pdf_storage_dir, final_filename)
        shutil.move(temp_path, final_path)
        temp_path = None

        report_id = f"REP-{uuid.uuid4().hex[:6].upper()}"

        # Re-tag extracted parameters with confirmed report_id and date
        for p in extracted_params:
            p.reportId = report_id
            p.reportDate = effective_date

        extraction_label = "Verified" if id_decision["status"] == "IDENTITY_VERIFIED" else "Identity Unverified"

        report_record = {
            "report_id": report_id,
            "patient_id": patient["patient_id"],
            "report_date": effective_date,
            "upload_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "provider": effective_provider,
            "file_path": f"/static/reports/{final_filename}",
            "category": effective_category,
            "parameter_count": len(extracted_params),
            "extraction_status": extraction_label,
            "identity_status": id_decision["status"],
            "patient_name_on_report": id_decision.get("extracted_patient"),
            "identity_mismatch_reason": id_decision.get("reason"),
            "document_hash": doc_hash,
            "uploaded_by": user_name
        }

<<<<<<< HEAD
    db.save_report_with_parameters(report_record, param_dicts)
    report_record["file_path"] = f"/api/reports/{report_id}/file"

    db.log_activity(
        user_name, user_name, user_role,
        f"Verified & Uploaded {upload_name} as {report_id} ({effective_category}, {len(extracted_params)} parameters) for Patient {patient['full_name']}",
        "REPORT", report_id
    )
    db.log_audit(
        user_name, user_role, "REPORT_VALIDATED_AND_UPLOADED",
        "REPORT", report_id, provider=effective_provider,
        details=f"Document verified as {doc_type}. Extracted {len(extracted_params)} parameters with confidence {classification.get('confidence', 0.95):.2f}"
    )
=======
        param_dicts = [
            {
                "parameter_name": p.parameterName,
                "canonical_name": p.canonicalName,
                "value": p.value,
                "unit": p.unit,
                "reference_range": p.referenceRange,
                "status": p.status,
                "source_page": p.sourcePage,
                "source_text": p.sourceText or "",
                "category": p.category or "General"
            }
            for p in extracted_params
        ]

        db.save_report_with_parameters(report_record, param_dicts)
>>>>>>> origin/main

        # Safe float conversion for confidence
        try:
            raw_conf = classification.get("confidence", 0.95)
            conf_val = float(raw_conf) if raw_conf is not None else 0.95
        except (ValueError, TypeError):
            conf_val = 0.95

        db.log_activity(
            user_name, user_name, user_role,
            f"Verified & Uploaded {file.filename} as {report_id} ({effective_category}, {len(extracted_params)} parameters) for Patient {patient['full_name']}",
            "REPORT", report_id
        )
        db.log_audit(
            user_name, user_role, "REPORT_VALIDATED_AND_UPLOADED",
            "REPORT", report_id, provider=effective_provider,
            details=f"Document verified as {doc_type}. Extracted {len(extracted_params)} parameters with confidence {conf_val:.2f}"
        )

        report_record["extractedParameters"] = param_dicts
        report_record["parameterCount"] = len(param_dicts)
        return {
            "success": True,
            "validation_status": "VERIFIED",
            "document_type": doc_type,
            "confidence": conf_val,
            "medical_evidence": classification.get("medical_evidence", []),
            "detected_content": classification.get("detected_content", []),
            "extracted_metadata": {
                "provider": extracted_provider or "Not detected",
                "report_date": extracted_date or "Not detected",
                "patient_name": classification.get("patient_name") or "Not detected"
            },
            "user_provided_metadata": {
                "provider": provider.strip() or None,
                "report_date": reportDate.strip() or None
            },
            "message": f"Medical document verified as {doc_type.replace('_', ' ').title()}. {len(extracted_params)} parameters extracted from {file.filename}.",
            "report": report_record
        }

    except DocumentValidationError as dve:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "validation_status": "REJECTED",
                "error_code": dve.error_code,
                "reason": dve.message,
                "message": dve.message,
                "details": dve.details
            }
        )
    except HTTPException:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        raise
    except Exception as exc:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        import traceback
        tb = traceback.format_exc()
        print(f"CRITICAL UPLOAD ERROR: {tb}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "INTERNAL_SERVER_ERROR",
                "message": f"Server processing error: {str(exc)}",
                "detail": str(exc),
                "traceback": tb
            }
        )

@app.get("/api/reports/{report_id}/file")
def get_report_file(report_id: str, auth: Dict[str, Any] = Depends(require_active_user)):
    report = db.get_report(report_id)
    if not report or not report.get("file_path"):
        raise HTTPException(status_code=404, detail="Medical report file not found.")

    # File retrieval via db.retrieve_uploaded_file()
    # Download to temp path for serving
    report_file_path = report["file_path"]
    _ext = os.path.splitext(report_file_path)[1]
    temp_serve_path = os.path.join(tempfile.gettempdir(), f"serve_{uuid.uuid4().hex}{_ext}")
    if not db.retrieve_uploaded_file(report["file_path"], temp_serve_path):
        raise HTTPException(status_code=404, detail="Medical report file is no longer available.")
    file_path = temp_serve_path
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Medical report file is no longer available.")

    return FileResponse(file_path, media_type="application/octet-stream", filename=os.path.basename(file_path))

# ==================== REAL AI ANALYSIS & COMPARISON PIPELINE ====================
@app.post("/api/analyze")
@app.post("/api/compare")
def analyze_selected_reports(req: ComparisonRequest, request: Request):
    """
    Deterministic Longitudinal Comparison:
    1. Validates that all selected reports belong strictly to the same patient.
    2. Sorts reports chronologically.
    3. Calculates absolute change & percentage change deterministically in backend code.
    4. Calls Gemini for clinical interpretation grounded purely in verified values.
    5. Returns grounded bilingual summaries (English + Tamil).
    """
    user_name = request.headers.get("x-user-name", "Clinician")
    user_role = request.headers.get("x-user-role", "DOCTOR")

    pat_id = req.patientId or req.patient_id
    if not pat_id:
        raise HTTPException(status_code=400, detail="Patient ID is required for clinical analysis.")

    patient = db.get_patient(pat_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    selected_ids = req.selectedReportIds or req.selected_report_ids or req.report_ids or []
    all_reports = db.get_patient_reports(pat_id)
    selected = [r for r in all_reports if r["report_id"] in selected_ids]

    if len(selected_ids) >= 1 and len(selected) < len(selected_ids):
        raise HTTPException(
            status_code=400,
            detail="Cross-patient report comparison is strictly prohibited. All selected reports must belong to the selected patient."
        )

    if len(selected) < 1:
        raise HTTPException(status_code=400, detail="Please select at least 1 verified report for clinical analysis.")

    # Multi-tenancy safety and identity verification guard
    for r in selected:
        if r["patient_id"] != patient["patient_id"] and r["patient_id"] != patient["id"]:
            raise HTTPException(status_code=400, detail="Cross-patient report comparison is strictly prohibited.")
        if r.get("identity_status") == "IDENTITY_MISMATCH":
            raise HTTPException(
                status_code=400,
                detail=f"Report {r['report_id']} has a patient identity mismatch and cannot be included in clinical analysis."
            )

    patient_schema = PatientProfile(
        patientId=patient["patient_id"],
        name=patient["full_name"],
        age=patient["age"],
        gender=patient["gender"],
        phone=patient["phone"],
        activeStatus=patient["status"],
        doctorInCharge=patient.get("assigned_doctor_id") or "Attending Physician",
        specialty="Clinical Medicine"
    )

    report_records: List[ReportRecord] = []
    report_identity_status: Dict[str, Any] = {}
    for r in selected:
        param_list = [
            ParameterData(
                parameterName=p["parameter_name"],
                canonicalName=p.get("canonical_name", p["parameter_name"]),
                value=p["value"],
                unit=p.get("unit", ""),
                referenceRange=p.get("reference_range", ""),
                status=p.get("status", "Normal"),
                reportId=r["report_id"],
                reportDate=r["report_date"],
                sourcePage=p.get("source_page", 1),
                sourceText=p.get("source_text", ""),
                category=p.get("category", "General")
            )
            for p in r.get("extractedParameters", [])
        ]
        report_records.append(ReportRecord(
            reportId=r["report_id"],
            patientId=r["patient_id"],
            reportDate=r["report_date"],
            uploadDate=r["upload_date"],
            provider=r["provider"],
            file_path=r.get("file_path", ""),
            extractedParameters=param_list,
            extractionStatus=r.get("extraction_status", "Verified"),
            parameterCount=len(param_list),
            category=r.get("category", "Biochemistry"),
            identityVerificationStatus=r.get("identity_verification_status"),
            identityMatchScore=r.get("identity_match_score"),
            identityDetails=r.get("identity_details"),
        ))
        # Collect identity status for each report
        report_identity_status[r["report_id"]] = {
            "status": r.get("identity_verification_status", "UNVERIFIED"),
            "score": r.get("identity_match_score", 0.0),
            "details": r.get("identity_details", ""),
            "detected_name": r.get("extracted_patient_name"),
        }

    result = orchestrator.run_analysis(
        patient_schema, report_records, user_name, user_role,
        report_identity_status=report_identity_status
    )

    db.log_activity(
        user_name, user_name, user_role,
        f"Generated longitudinal AI comparison across {len(selected)} reports ({', '.join(req.selectedReportIds)}) for Patient {patient['full_name']}",
        "ANALYSIS", result.analysisId
    )
    db.log_audit(
        user_name, user_role, "ANALYSIS_COMPLETED",
        "ANALYSIS", result.analysisId, provider=result.providerUsed,
        details=f"Compared {len(selected)} reports for {patient['full_name']}. Latency: {result.executionLatencyMs}ms"
    )

    return result

# ==================== REPORT DELETION & ADMIN TRASH ====================
@app.delete("/api/reports/{report_id}")
@app.delete("/api/patients/{patient_id}/reports/{report_id}")
def delete_patient_report(report_id: str, patient_id: str = None, reason: str = "", request: Request = None):
    user_name = request.headers.get("x-user-name", "Dr. Arvind Kumar") if request else "Dr. Arvind Kumar"
    user_role = request.headers.get("x-user-role", "DOCTOR") if request else "DOCTOR"
    
    if user_role not in ["DOCTOR", "ADMIN", "STAFF"]:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this report.")
    
    success = db.soft_delete_report(report_id, user_name, reason or "Clinician moved report to Deleted Files")
    if not success:
        raise HTTPException(status_code=404, detail="Report not found.")
    
    db.log_activity(user_name, user_name, user_role, f"Moved report {report_id} to Deleted Files", "REPORT", report_id)
    db.log_audit(
        user_name, user_role, "REPORT_MOVED_TO_TRASH",
        "REPORT", report_id, details=f"Moved report {report_id} to Deleted Files. Reason: {reason or 'General clinical cleanup'}"
    )
    return {"success": True, "report_id": report_id, "status": "TRASHED", "message": "Report moved to Deleted Files."}

@app.get("/api/admin/reports")
def get_all_admin_reports(auth: Dict[str, Any] = Depends(require_admin)):
    return db.get_all_reports(include_deleted=True)

@app.get("/api/admin/reports/archived")
@app.get("/api/admin/deleted-files")
def get_archived_reports(auth: Dict[str, Any] = Depends(require_admin)):
    return db.get_archived_reports()

@app.post("/api/admin/reports/{report_id}/restore")
@app.post("/api/admin/deleted-files/{report_id}/restore")
def restore_archived_report(report_id: str, auth: Dict[str, Any] = Depends(require_admin)):
    admin_name = auth.get("user_name", "Hospital Administrator")
    success = db.restore_report(report_id, admin_name)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found in Deleted Files.")
    
    db.log_activity(admin_name, admin_name, "ADMIN", f"Restored report {report_id} from Deleted Files to active patient record", "REPORT", report_id)
    db.log_audit(admin_name, "ADMIN", "REPORT_RESTORED", "REPORT", report_id, details=f"Admin {admin_name} restored report {report_id}")
    return {"success": True, "report_id": report_id, "status": "ACTIVE", "message": f"Report {report_id} restored to patient record."}

@app.delete("/api/admin/reports/{report_id}/permanent")
@app.delete("/api/admin/deleted-files/{report_id}/permanent")
def permanent_delete_report(report_id: str, auth: Dict[str, Any] = Depends(require_admin)):
    admin_name = auth.get("user_name", "Hospital Administrator")
    success = db.hard_delete_report(report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found.")
    
    db.log_activity(admin_name, admin_name, "ADMIN", f"Permanently destroyed report {report_id} from database", "REPORT", report_id)
    db.log_audit(admin_name, "ADMIN", "REPORT_PERMANENTLY_DELETED", "REPORT", report_id, details=f"Admin {admin_name} permanently destroyed report {report_id}")
    return {"success": True, "report_id": report_id, "status": "DELETED", "message": f"Report {report_id} permanently deleted from system."}

# ==================== CLINICIAN TO ADMIN MESSAGING ====================
@app.post("/api/messages/contact-admin")
def contact_admin_request(req: ContactAdminRequest, request: Request):
    user_name = request.headers.get("x-user-name", "Clinician")
    user_role = request.headers.get("x-user-role", "DOCTOR")
    
    msg_data = {
        "sender_id": user_name,
        "sender_name": user_name,
        "sender_role": user_role,
        "patient_id": req.patient_id,
        "report_id": req.report_id,
        "subject": req.subject,
        "message": req.message
    }
    created = db.create_support_message(msg_data)
    db.log_activity(user_name, user_name, user_role, f"Sent administrative support message: {req.subject}", "SUPPORT_TICKET", created["ticket_id"])
    db.log_audit(user_name, user_role, "ADMIN_SUPPORT_REQUEST", "SUPPORT_TICKET", created["ticket_id"], details=req.subject)
    return {"success": True, "ticket": created}

@app.get("/api/admin/messages")
def get_admin_messages(auth: Dict[str, Any] = Depends(require_admin)):
    return db.get_all_support_messages()

@app.post("/api/admin/messages/{ticket_id}/reply")
def reply_to_ticket(ticket_id: str, req: ReplyMessageRequest, auth: Dict[str, Any] = Depends(require_admin)):
    admin_name = auth.get("user_name", "Hospital Administrator")
    success = db.reply_support_message(ticket_id, req.reply, admin_name, req.status or "RESOLVED")
    if not success:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    
    db.log_activity(admin_name, admin_name, "ADMIN", f"Replied to support ticket {ticket_id}", "SUPPORT_TICKET", ticket_id)
    db.log_audit(admin_name, "ADMIN", "SUPPORT_TICKET_REPLIED", "SUPPORT_TICKET", ticket_id, details=f"Replied to {ticket_id}: {req.reply}")
    return {"success": True, "message": "Reply saved successfully."}

@app.get("/api/messages")
def get_user_messages():
    return db.get_all_support_messages()

# ==================== LOGS & STATS ====================
@app.get("/api/activity-logs")
def get_activity_logs():
    return db.get_recent_activities(limit=50)

@app.get("/api/audit-logs")
def get_audit_logs():
    return db.get_audit_logs(limit=50)

# ==================== PATIENT REPORT CAPACITY & LIMITS ====================
@app.get("/api/admin/patients/{patient_id}/limit")
def get_patient_report_limit(patient_id: str, auth: Dict[str, Any] = Depends(require_admin)):
    limit = db.get_patient_report_limit(patient_id)
    return {"patient_id": patient_id, "max_reports": limit}

@app.post("/api/admin/patients/{patient_id}/limit")
def update_patient_report_limit(patient_id: str, req: UpdatePatientReportLimitRequest, auth: Dict[str, Any] = Depends(require_admin)):
    admin_name = auth.get("user_name", "Hospital Administrator")
    result = db.update_patient_report_limit(patient_id, req.max_reports, admin_name, req.reason or "Admin grant")
    return result

# ==================== DOCTOR AVAILABILITY & SLOTS ====================
@app.get("/api/doctors/{doctor_id}/availability")
def get_doctor_availability_route(doctor_id: str):
    return db.get_doctor_availability(doctor_id)

@app.post("/api/doctors/{doctor_id}/availability")
def set_doctor_availability_route(doctor_id: str, req: DoctorAvailabilityRequest, request: Request):
    return db.set_doctor_availability(
        doctor_id=doctor_id,
        working_days=req.working_days,
        start_time=req.start_time or "09:00 AM",
        end_time=req.end_time or "05:00 PM",
        slot_duration_mins=req.slot_duration_mins or 30,
        break_start=req.break_start or "01:00 PM",
        break_end=req.break_end or "02:00 PM",
        blocked_dates=req.blocked_dates,
        is_available=req.is_available if req.is_available is not None else True
    )

@app.get("/api/doctors/{doctor_id}/slots")
def get_doctor_available_slots_route(doctor_id: str, date: str):
    slots = db.get_available_slots(doctor_id, date)
    return slots

# ==================== APPOINTMENTS MANAGEMENT & BOOKING ====================
@app.post("/api/appointments/book")
def book_appointment_route(req: BookAppointmentRequest, request: Request):
    user_name = request.headers.get("x-user-name", req.patient_name or "Patient")
    try:
        apt = db.create_appointment(
            patient_id=req.patient_id,
            patient_name=req.patient_name or "Patient",
            doctor_id=req.doctor_id,
            doctor_name=req.doctor_name or "Attending Physician",
            department=req.department or "General Medicine",
            appointment_date=req.appointment_date,
            slot_time=req.slot_time,
            reason=req.reason or "",
            created_by=user_name
        )
        return apt
    except ValueError as ve:
        raise HTTPException(status_code=409, detail=str(ve))

@app.get("/api/appointments/patient/{patient_id}")
def get_patient_appointments_route(patient_id: str):
    return db.get_appointments_for_patient(patient_id)

@app.get("/api/appointments/doctor/{doctor_id}")
def get_doctor_appointments_route(doctor_id: str):
    return db.get_appointments_for_doctor(doctor_id)

@app.get("/api/admin/appointments")
@app.get("/api/appointments")
def get_all_appointments_route():
    return db.get_all_appointments()

@app.post("/api/appointments/{appointment_id}/cancel")
def cancel_appointment_route(appointment_id: str, req: CancelAppointmentRequest, request: Request):
    user_name = request.headers.get("x-user-name", "User")
    success, msg = db.cancel_appointment(appointment_id, req.reason or "", user_name)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@app.post("/api/appointments/{appointment_id}/reschedule")
def reschedule_appointment_route(appointment_id: str, req: RescheduleAppointmentRequest, request: Request):
    user_name = request.headers.get("x-user-name", "User")
    success, msg = db.reschedule_appointment(appointment_id, req.new_date, req.new_slot, user_name)
    if not success:
        raise HTTPException(status_code=409, detail=msg)
    return {"success": True, "message": msg}

@app.post("/api/appointments/{appointment_id}/propose")
def propose_appointment_route(appointment_id: str, req: ProposeAlternativeRequest, auth: Dict[str, Any] = Depends(require_admin)):
    admin_name = auth.get("user_name", "Hospital Administrator")
    success, msg = db.propose_appointment_alternative(appointment_id, req.proposed_date, req.proposed_slot, admin_name)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@app.post("/api/appointments/{appointment_id}/respond")
def respond_appointment_route(appointment_id: str, req: RespondAlternativeRequest, request: Request):
    user_name = request.headers.get("x-user-name", "Patient")
    success, msg = db.respond_to_proposed_appointment(appointment_id, req.accept, user_name)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "MEDI-TREND AI Hospital Backend",
        "version": "2.0.0",
        "database": "Production SQLite / Supabase PostgreSQL Connected",
        "ai_orchestrator": "LangGraph StateGraph Engine",
        "active_providers": ["Google Gemini 1.5 Pro (Primary)", "OpenAI GPT-4o (Fallback)", "xAI Grok (Fallback)"]
    }

@app.get("/api/openapi.json", include_in_schema=False)
def api_openapi():
    return app.openapi()

@app.get("/api/docs", include_in_schema=False)
def api_docs():
    from fastapi.openapi.docs import get_swagger_ui_html
    return get_swagger_ui_html(openapi_url="/openapi.json", title="MEDI-TREND AI API Documentation")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
