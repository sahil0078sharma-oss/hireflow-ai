"""
HireFlow AI — AWS Lambda Application Handler
Runtime: Python 3.12
Database: Amazon RDS for MySQL via PyMySQL
"""

import os
import json
import uuid
import logging
import hashlib
import hmac
from datetime import date, datetime

try:
    import pymysql
except ModuleNotFoundError:
    pymysql = None
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.warning(
        "pymysql is not installed in the local environment. "
        "Install it with: pip install pymysql"
    )

from preparation_engine import generate_preparation_plan

# Configure logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Configured demo student for MVP
DEMO_STUDENT_ID = "student-001"

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if not salt:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    ).hex()
    return hashed, salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    if not password or not hashed or not salt:
        return False
    calculated = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    ).hex()
    return hmac.compare_digest(calculated, hashed)


def get_authenticated_student_id(cursor, event):
    """Extract authenticated student ID from session token, headers, or fallback."""
    if not event:
        return DEMO_STUDENT_ID

    headers = event.get("headers") or {}
    auth_header = headers.get("authorization") or headers.get("Authorization") or ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        cursor.execute("SELECT student_id FROM sessions WHERE token = %s", (token,))
        row = cursor.fetchone()
        if row and row.get("student_id"):
            return row["student_id"]

    student_id = headers.get("x-student-id") or headers.get("X-Student-Id")
    if student_id:
        return student_id

    query_params = event.get("queryStringParameters") or {}
    if query_params.get("studentId"):
        return query_params["studentId"]

    return DEMO_STUDENT_ID

# Pipeline stages definition matching frontend PIPELINE_STAGES
PIPELINE_STAGES = [
    {"key": "application", "label": "Application"},
    {"key": "resume_screening", "label": "Resume Screening"},
    {"key": "aptitude", "label": "Aptitude"},
    {"key": "technical", "label": "Technical Round"},
    {"key": "hr", "label": "HR Round"},
    {"key": "final", "label": "Final Result"},
]

STAGE_KEYS = [s["key"] for s in PIPELINE_STAGES]

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
}

# Global DB connection for warm container reuse
_db_connection = None


def get_db_connection():
    global _db_connection
    if _db_connection is None or not _db_connection.open:
        logger.info("Initializing new MySQL database connection")
        _db_connection = pymysql.connect(
            host=os.environ["DB_HOST"],
            user=os.environ["DB_USER"],
            password=os.environ["DB_PASSWORD"],
            database=os.environ.get("DB_NAME", "hireflow"),
            port=int(os.environ.get("DB_PORT", 3306)),
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=5,
            autocommit=True,
        )
    return _db_connection


def build_stages(current_stage_key, outcome=None):
    """Build the stages array for an application matching the frontend contract."""
    try:
        current_index = STAGE_KEYS.index(current_stage_key)
    except ValueError:
        current_index = 0

    stages = []
    for idx, stage in enumerate(PIPELINE_STAGES):
        if idx < current_index:
            status = "completed"
        elif idx == current_index:
            status = "rejected" if outcome == "rejected" else "current"
        else:
            status = "pending"
        stages.append({**stage, "status": status})
    return stages


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def create_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=json_serial),
    }


def handle_get_applications(cursor, event=None):
    """
    GET /applications
    Retrieves all applications for the authenticated student, joined with drive and company.
    """
    ensure_schema(cursor)
    student_id = get_authenticated_student_id(cursor, event)
    logger.info(f"Fetching applications for student: {student_id}")

    query = """
        SELECT 
            a.id,
            a.student_id AS studentId,
            a.drive_id AS driveId,
            a.applied_date AS appliedDate,
            a.current_stage AS currentStage,
            a.status,
            d.id AS drive_table_id,
            d.role AS drive_role,
            d.package AS drive_package,
            d.location AS drive_location,
            d.mode AS drive_mode,
            d.description AS drive_description,
            d.company_id AS drive_company_id,
            c.id AS company_table_id,
            c.name AS company_name,
            c.full_name AS company_fullName,
            c.avatar AS company_avatar,
            c.color AS company_color
        FROM applications a
        JOIN drives d ON a.drive_id = d.id
        JOIN companies c ON d.company_id = c.id
        WHERE a.student_id = %s
        ORDER BY a.applied_date DESC, a.created_at DESC;
    """
    cursor.execute(query, (student_id,))
    rows = cursor.fetchall()

    results = []
    for r in rows:
        current_stage = r["currentStage"]
        status = r["status"]
        outcome = "rejected" if status == "Rejected" else None
        stages = build_stages(current_stage, outcome)

        app_item = {
            "id": r["id"],
            "studentId": r["studentId"],
            "driveId": r["driveId"],
            "appliedDate": r["appliedDate"].isoformat() if isinstance(r["appliedDate"], (date, datetime)) else str(r["appliedDate"]),
            "currentStage": current_stage,
            "status": status,
            "stages": stages,
            "drive": {
                "id": r["drive_table_id"],
                "role": r["drive_role"],
                "package": r["drive_package"],
                "location": r["drive_location"],
                "mode": r["drive_mode"],
                "companyId": r["drive_company_id"],
                "description": r["drive_description"],
            },
            "company": {
                "id": r["company_table_id"],
                "name": r["company_name"],
                "fullName": r["company_fullName"],
                "avatar": r["company_avatar"],
                "color": r["company_color"],
            }
        }
        results.append(app_item)

    logger.info(f"Retrieved {len(results)} applications for student {student_id}")
    return create_response(200, results)


def handle_post_applications(cursor, body_str, event=None):
    """
    POST /applications
    Creates a new application for the authenticated student.
    Body: {"driveId": "drive-tcs-02"}
    """
    ensure_schema(cursor)
    student_id = get_authenticated_student_id(cursor, event)

    if not body_str:
        return create_response(400, {"error": "Missing request body"})

    try:
        data = json.loads(body_str)
    except json.JSONDecodeError:
        return create_response(400, {"error": "Invalid JSON in request body"})

    drive_id = data.get("driveId")
    if not drive_id or not isinstance(drive_id, str):
        return create_response(400, {"error": "Field 'driveId' is required and must be a string"})

    # 1. Validate student exists
    cursor.execute("SELECT id FROM students WHERE id = %s", (student_id,))
    if not cursor.fetchone():
        logger.error(f"Student {student_id} not found in database")
        return create_response(404, {"error": f"Student '{student_id}' not found"})

    # 2. Validate drive exists
    cursor.execute("SELECT id, role, package, location, mode, company_id, description FROM drives WHERE id = %s", (drive_id,))
    drive_row = cursor.fetchone()
    if not drive_row:
        logger.warning(f"Drive not found: {drive_id}")
        return create_response(404, {"error": f"Placement drive '{drive_id}' not found"})

    # 3. Check for duplicate application
    cursor.execute(
        "SELECT id FROM applications WHERE student_id = %s AND drive_id = %s",
        (student_id, drive_id),
    )
    if cursor.fetchone():
        logger.warning(f"Duplicate application attempt: student {student_id} for drive {drive_id}")
        return create_response(409, {"error": "You have already applied to this placement drive."})

    # 4. Fetch company info for enrichment
    cursor.execute(
        "SELECT id, name, full_name, avatar, color FROM companies WHERE id = %s",
        (drive_row["company_id"],),
    )
    company_row = cursor.fetchone()

    # 5. Insert new application with UUID
    app_id = f"app-{uuid.uuid4()}"
    today_str = date.today().isoformat()
    current_stage = "application"
    app_status = "Pending Review"

    insert_query = """
        INSERT INTO applications (id, student_id, drive_id, applied_date, current_stage, status)
        VALUES (%s, %s, %s, %s, %s, %s);
    """
    cursor.execute(
        insert_query,
        (app_id, student_id, drive_id, today_str, current_stage, app_status),
    )

    logger.info(f"Successfully created application {app_id} for student {student_id} and drive {drive_id}")

    # 6. Build response
    created_app = {
        "id": app_id,
        "studentId": student_id,
        "driveId": drive_id,
        "appliedDate": today_str,
        "currentStage": current_stage,
        "status": app_status,
        "stages": build_stages(current_stage),
        "drive": {
            "id": drive_row["id"],
            "role": drive_row["role"],
            "package": drive_row["package"],
            "location": drive_row["location"],
            "mode": drive_row["mode"],
            "companyId": drive_row["company_id"],
            "description": drive_row["description"],
        },
        "company": {
            "id": company_row["id"] if company_row else drive_row["company_id"],
            "name": company_row["name"] if company_row else "",
            "fullName": company_row["full_name"] if company_row else "",
            "avatar": company_row["avatar"] if company_row else "",
            "color": company_row["color"] if company_row else "#1E3A8A",
        }
    }

    return create_response(201, created_app)


def handle_get_preparation(cursor, event):
    """
    GET /preparation
    Query parameters:
      - mode (optional): 'drive' or 'custom'
      - driveId (required for drive mode): e.g. 'drive-tcs-01'
      - customCompany (required for custom mode): e.g. 'AptCloud'
      - customRole (required for custom mode): e.g. 'Cloud Engineer'
      - jdSkills (optional): comma-separated string
      - category (optional): 'technical', 'aptitude', 'hr', 'company-role'
      - missingSkills (optional): comma-separated string, e.g. 'Docker,SQL'
      - analysisDriveId (optional): context drive ID from resume analysis
      - atsScore (optional): ATS score from resume analysis
    """
    ensure_schema(cursor)
    student_id = get_authenticated_student_id(cursor, event)
    query_params = event.get("queryStringParameters") or {}
    mode = query_params.get("mode", "drive")
    drive_id = query_params.get("driveId")
    custom_company = query_params.get("customCompany")
    custom_role = query_params.get("customRole")
    jd_skills = query_params.get("jdSkills", "")
    category = query_params.get("category", "technical")
    missing_skills = query_params.get("missingSkills", "")
    analysis_drive_id = query_params.get("analysisDriveId")
    ats_score = query_params.get("atsScore")

    logger.info(
        f"Preparation request for student {student_id}: mode={mode}, driveId={drive_id}, "
        f"customCompany={custom_company}, customRole={custom_role}, "
        f"category={category}, missingSkills={missing_skills}, "
        f"analysisDriveId={analysis_drive_id}, atsScore={ats_score}"
    )

    status_code, body = generate_preparation_plan(
        cursor=cursor,
        student_id=student_id,
        drive_id=drive_id,
        category=category,
        missing_skills_param=missing_skills,
        analysis_drive_id=analysis_drive_id,
        ats_score_param=ats_score,
        mode=mode,
        custom_company=custom_company,
        custom_role=custom_role,
        jd_skills_param=jd_skills,
    )
    return create_response(status_code, body)


def parse_json_safely(val, default):
    if not val:
        return default
    if isinstance(val, (list, dict)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return default


def ensure_schema(cursor):
    """Ensure optional columns exist in RDS without breaking existing tables."""
    try:
        cursor.execute("""
            SELECT COUNT(*) AS cnt 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'description'
        """)
        row = cursor.fetchone()
        if row and row["cnt"] == 0:
            logger.info("Adding description column to companies table")
            cursor.execute("ALTER TABLE companies ADD COLUMN description TEXT;")

        cursor.execute("""
            SELECT COUNT(*) AS cnt 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'drives' AND COLUMN_NAME = 'drive_date'
        """)
        row = cursor.fetchone()
        if row and row["cnt"] == 0:
            logger.info("Adding drive_date column to drives table")
            cursor.execute("ALTER TABLE drives ADD COLUMN drive_date DATE;")

        # Ensure password_hash and password_salt columns in students table
        cursor.execute("""
            SELECT COUNT(*) AS cnt 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'password_hash'
        """)
        row = cursor.fetchone()
        if row and row["cnt"] == 0:
            logger.info("Adding password_hash and password_salt to students table")
            cursor.execute("ALTER TABLE students ADD COLUMN password_hash VARCHAR(255) NULL, ADD COLUMN password_salt VARCHAR(64) NULL;")

        # Ensure sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token VARCHAR(64) PRIMARY KEY,
                student_id VARCHAR(64) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NULL,
                INDEX idx_student (student_id)
            );
        """)

        # Demo student account credentials (secure PBKDF2 hash)
        demo_salt = "4f9e1b2c3d4e5f6a"
        demo_hash = "207717ab4b8f476df6dc395d80578cbc5c3538c1e48328731f18629126ea30de"

        # Ensure Sahil Sharma demo student record is present and updated
        cursor.execute("""
            INSERT INTO students (id, name, email, college, degree, branch, graduation_year, cgpa, skills, resume_summary, ats_score, avatar, password_hash, password_salt)
            VALUES ('student-001', 'Sahil Sharma', 'sahil.sharma@aryacollege.in', 'Arya College of Engineering', 'B.Tech', 'CSE', 2026, 8.0,
                    '["Python", "JavaScript", "React", "SQL", "Git", "HTML", "CSS", "Node.js", "REST API", "MySQL"]',
                    'Final year CSE student at Arya College of Engineering with strong programming fundamentals and cloud experience.',
                    NULL, 'SS', %s, %s)
            ON DUPLICATE KEY UPDATE
                name = 'Sahil Sharma',
                email = 'sahil.sharma@aryacollege.in',
                college = 'Arya College of Engineering',
                branch = 'CSE',
                degree = 'B.Tech',
                cgpa = 8.0,
                avatar = 'SS',
                password_hash = IFNULL(password_hash, VALUES(password_hash)),
                password_salt = IFNULL(password_salt, VALUES(password_salt));
        """, (demo_hash, demo_salt))

    except Exception as e:
        logger.warning(f"Schema ensure check warning: {e}")


def handle_login(cursor, body_str):
    """
    POST /auth/login
    Request: {"email": "...", "password": "..."}
    Response: { "success": true, "token": "...", "student": { ... } }
    """
    ensure_schema(cursor)
    if not body_str:
        return create_response(400, {"error": "Missing request body."})

    try:
        data = json.loads(body_str)
    except json.JSONDecodeError:
        return create_response(400, {"error": "Invalid JSON in request body."})

    email = data.get("email")
    password = data.get("password")

    if not email or not isinstance(email, str) or not email.strip():
        return create_response(400, {"error": "Email is required."})

    if not password or not isinstance(password, str):
        return create_response(400, {"error": "Password is required."})

    email_clean = email.strip().lower()

    # Query student by email
    cursor.execute("""
        SELECT id, name, email, college, degree, branch, graduation_year, cgpa, skills, resume_summary, ats_score, avatar, password_hash, password_salt
        FROM students
        WHERE LOWER(email) = %s
        LIMIT 1;
    """, (email_clean,))
    student_row = cursor.fetchone()

    if not student_row:
        logger.warning(f"Login failed: email not found '{email_clean}'")
        return create_response(401, {"error": "Invalid email or password."})

    pwd_hash = student_row.get("password_hash")
    pwd_salt = student_row.get("password_salt")

    if not pwd_hash or not pwd_salt or not verify_password(password, pwd_hash, pwd_salt):
        logger.warning(f"Login failed: invalid password for student '{student_row['id']}'")
        return create_response(401, {"error": "Invalid email or password."})

    # Create session token
    session_token = f"hf-sess-{uuid.uuid4().hex}"
    cursor.execute("""
        INSERT INTO sessions (token, student_id)
        VALUES (%s, %s);
    """, (session_token, student_row["id"]))

    logger.info(f"Student '{student_row['id']}' successfully logged in")

    student_profile = {
        "studentId": student_row["id"],
        "name": student_row["name"],
        "email": student_row["email"],
        "college": student_row["college"],
        "degree": student_row["degree"] or "B.Tech",
        "branch": student_row["branch"] or "CSE",
        "graduationYear": student_row["graduation_year"] or 2026,
        "cgpa": float(student_row["cgpa"]) if student_row.get("cgpa") is not None else 8.0,
        "skills": parse_json_safely(student_row["skills"], []),
        "avatar": student_row["avatar"] or "SS",
    }

    return create_response(200, {
        "success": True,
        "token": session_token,
        "student": student_profile,
    })


def handle_get_me(cursor, event):
    """
    GET /auth/me
    Returns current authenticated student from session token in Authorization header.
    """
    ensure_schema(cursor)
    headers = event.get("headers") or {}
    auth_header = headers.get("authorization") or headers.get("Authorization") or ""
    if not auth_header.startswith("Bearer "):
        return create_response(401, {"error": "Unauthorized. Please log in."})

    token = auth_header[7:].strip()
    cursor.execute("""
        SELECT s.id, s.name, s.email, s.college, s.degree, s.branch, s.graduation_year, s.cgpa, s.skills, s.avatar
        FROM sessions sess
        JOIN students s ON sess.student_id = s.id
        WHERE sess.token = %s;
    """, (token,))
    row = cursor.fetchone()
    if not row:
        return create_response(401, {"error": "Session expired or invalid. Please log in again."})

    student_profile = {
        "studentId": row["id"],
        "name": row["name"],
        "email": row["email"],
        "college": row["college"],
        "degree": row["degree"] or "B.Tech",
        "branch": row["branch"] or "CSE",
        "graduationYear": row["graduation_year"] or 2026,
        "cgpa": float(row["cgpa"]) if row.get("cgpa") is not None else 8.0,
        "skills": parse_json_safely(row["skills"], []),
        "avatar": row["avatar"] or "SS",
    }

    return create_response(200, {
        "authenticated": True,
        "student": student_profile,
    })


def handle_logout(cursor, event):
    """
    POST /auth/logout
    Deletes the session token from the database.
    """
    ensure_schema(cursor)
    headers = event.get("headers") or {}
    auth_header = headers.get("authorization") or headers.get("Authorization") or ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        cursor.execute("DELETE FROM sessions WHERE token = %s;", (token,))

    return create_response(200, {"success": True, "message": "Logged out successfully."})


def handle_get_drives(cursor):
    """
    GET /drives
    Retrieves all placement drives joined with their company details from RDS.
    """
    logger.info("Fetching placement drives from RDS")
    ensure_schema(cursor)
    query = """
        SELECT 
            d.id,
            d.company_id AS companyId,
            d.role,
            d.description,
            d.required_skills AS requiredSkills,
            d.eligibility,
            d.deadline,
            d.package,
            d.package_value AS packageValue,
            d.location,
            d.mode,
            d.status,
            d.posted_date AS postedDate,
            d.openings,
            d.drive_type AS driveType,
            d.rounds,
            d.drive_date AS driveDate,
            c.id AS company_id,
            c.name AS company_name,
            c.full_name AS company_fullName,
            c.industry AS company_industry,
            c.location AS company_headquarters,
            c.website AS company_website,
            c.avatar AS company_avatar,
            c.color AS company_color,
            c.description AS company_description
        FROM drives d
        JOIN companies c ON d.company_id = c.id
        ORDER BY d.deadline ASC;
    """
    cursor.execute(query)
    rows = cursor.fetchall()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "companyId": r["companyId"],
            "role": r["role"],
            "description": r["description"],
            "requiredSkills": parse_json_safely(r["requiredSkills"], []),
            "eligibility": parse_json_safely(r["eligibility"], {}),
            "deadline": r["deadline"].isoformat() if isinstance(r["deadline"], (date, datetime)) else str(r["deadline"]),
            "driveDate": r["driveDate"].isoformat() if isinstance(r["driveDate"], (date, datetime)) else (str(r["driveDate"]) if r["driveDate"] else None),
            "package": r["package"],
            "packageValue": r["packageValue"],
            "location": r["location"],
            "mode": r["mode"],
            "status": r["status"],
            "postedDate": r["postedDate"].isoformat() if isinstance(r["postedDate"], (date, datetime)) else str(r["postedDate"]),
            "openings": r["openings"],
            "driveType": r["driveType"],
            "rounds": parse_json_safely(r["rounds"], []),
            "company": {
                "id": r["company_id"],
                "name": r["company_name"],
                "fullName": r["company_fullName"],
                "industry": r["company_industry"],
                "headquarters": r["company_headquarters"],
                "website": r["company_website"],
                "avatar": r["company_avatar"],
                "color": r["company_color"],
                "description": r["company_description"] or "",
            }
        })
    logger.info(f"Retrieved {len(results)} placement drives from RDS")
    return create_response(200, results)


def handle_post_drives(cursor, body_str):
    """
    POST /drives
    Dynamically creates a new placement drive and company (if not existing) in RDS.
    """
    if not body_str:
        return create_response(400, {"error": "Missing request body"})

    try:
        data = json.loads(body_str)
    except json.JSONDecodeError:
        return create_response(400, {"error": "Invalid JSON in request body"})

    company_name = str(data.get("companyName") or "").strip()
    company_desc = str(data.get("companyDescription") or "").strip()
    role = str(data.get("role") or "").strip()
    job_desc = str(data.get("jobDescription") or data.get("description") or "").strip()
    package = str(data.get("package") or "").strip()
    location = str(data.get("location") or "").strip()
    mode = str(data.get("mode") or "Hybrid").strip()
    deadline = str(data.get("deadline") or "").strip()
    drive_date = str(data.get("driveDate") or data.get("postedDate") or date.today().isoformat()).strip()

    # Required fields validation
    missing = []
    if not company_name:
        missing.append("companyName")
    if not role:
        missing.append("role")
    if not job_desc:
        missing.append("jobDescription")
    if not package:
        missing.append("package")
    if not location:
        missing.append("location")
    if not deadline:
        missing.append("deadline")

    if missing:
        return create_response(400, {
            "error": f"Missing required fields: {', '.join(missing)}"
        })

    ensure_schema(cursor)

    # 1. Parse and format package and package_value
    import re
    clean_pkg = package.upper().replace(",", "").replace("₹", "").replace("INR", "").strip()
    match = re.search(r"(\d+(\.\d+)?)", clean_pkg)
    if match:
        val = float(match.group(1))
        if "LPA" in clean_pkg or val < 100:
            package_value = int(val * 100000)
            if not package.upper().endswith("LPA"):
                package = f"{val:.2f} LPA"
        else:
            package_value = int(val)
    else:
        package_value = 500000

    # 2. Company lookup (reuse existing or create new)
    cursor.execute(
        """
        SELECT id, name, full_name, industry, location, website, avatar, color, description 
        FROM companies 
        WHERE LOWER(name) = LOWER(%s) OR LOWER(full_name) = LOWER(%s)
        LIMIT 1
        """,
        (company_name, company_name)
    )
    existing_company = cursor.fetchone()

    if existing_company:
        company_id = existing_company["id"]
        company_info = {
            "id": existing_company["id"],
            "name": existing_company["name"],
            "fullName": existing_company["full_name"],
            "industry": existing_company.get("industry") or "Technology & Services",
            "headquarters": existing_company.get("location") or location,
            "website": existing_company.get("website") or "",
            "avatar": existing_company.get("avatar") or "CO",
            "color": existing_company.get("color") or "#2563EB",
            "description": existing_company.get("description") or company_desc,
        }
        logger.info(f"Reusing existing company '{existing_company['name']}' ({company_id})")
    else:
        # Generate slug-based ID
        slug = re.sub(r"[^a-z0-9]+", "-", company_name.lower()).strip("-")
        company_id = f"company-{slug}"
        cursor.execute("SELECT id FROM companies WHERE id = %s", (company_id,))
        if cursor.fetchone():
            company_id = f"company-{slug}-{uuid.uuid4().hex[:4]}"

        # Avatar initials
        words = [w for w in re.split(r"\s+", company_name) if w]
        if len(words) >= 2:
            avatar = (words[0][0] + words[1][0]).upper()
        elif len(words) == 1 and len(words[0]) >= 2:
            avatar = words[0][:2].upper()
        else:
            avatar = "CO"

        # Curated vibrant palette
        colors = ["#2563EB", "#059669", "#7C3AED", "#D97706", "#DC2626", "#0284C7", "#4F46E5", "#0891B2"]
        import hashlib
        color_idx = int(hashlib.md5(company_name.encode()).hexdigest(), 16) % len(colors)
        color = colors[color_idx]

        industry = str(data.get("industry") or "Technology & Software Solutions").strip()
        comp_location = str(data.get("companyLocation") or location).strip()
        website = str(data.get("website") or f"https://www.{slug}.com").strip()

        cursor.execute(
            """
            INSERT INTO companies (id, name, full_name, industry, location, website, avatar, color, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (company_id, company_name, company_name, industry, comp_location, website, avatar, color, company_desc)
        )
        company_info = {
            "id": company_id,
            "name": company_name,
            "fullName": company_name,
            "industry": industry,
            "headquarters": comp_location,
            "website": website,
            "avatar": avatar,
            "color": color,
            "description": company_desc,
        }
        logger.info(f"Created new company '{company_name}' ({company_id})")

    # 3. Duplicate placement drive check
    cursor.execute(
        """
        SELECT id FROM drives 
        WHERE company_id = %s AND LOWER(role) = LOWER(%s) AND deadline = %s
        """,
        (company_id, role, deadline)
    )
    if cursor.fetchone():
        logger.warning(f"Duplicate drive rejected: {company_id} - {role} - {deadline}")
        return create_response(409, {
            "error": f"A placement drive for {company_info['name']} - {role} with deadline {deadline} already exists."
        })

    # 4. Generate unique Drive ID
    comp_slug = company_id.replace("company-", "")
    role_slug = re.sub(r"[^a-z0-9]+", "-", role.lower()).strip("-")[:16]
    drive_id = f"drive-{comp_slug}-{role_slug}"
    cursor.execute("SELECT id FROM drives WHERE id = %s", (drive_id,))
    if cursor.fetchone():
        drive_id = f"drive-{comp_slug}-{uuid.uuid4().hex[:6]}"

    # Optional fields with defaults
    required_skills = data.get("requiredSkills")
    if not required_skills or not isinstance(required_skills, list):
        required_skills = ["Problem Solving", "Communication", "Data Structures"]

    eligibility = data.get("eligibility")
    if not eligibility or not isinstance(eligibility, dict):
        min_cgpa = float(data.get("minCGPA") or 6.5)
        eligibility = {
            "degree": ["B.Tech", "B.E", "MCA"],
            "branches": ["CSE", "IT", "ECE"],
            "minCGPA": min_cgpa,
            "backlogs": 0
        }

    rounds = data.get("rounds")
    if not rounds or not isinstance(rounds, list):
        rounds = ["Aptitude Test", "Technical Interview", "HR Interview"]

    openings = int(data.get("openings") or 50)
    drive_type = str(data.get("driveType") or "On-Campus").strip()
    posted_date = date.today().isoformat()

    # 5. Insert drive record
    insert_sql = """
        INSERT INTO drives (
            id, company_id, role, description, required_skills, eligibility,
            deadline, package, package_value, location, mode, status,
            posted_date, openings, drive_type, rounds, drive_date
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(
        insert_sql,
        (
            drive_id,
            company_id,
            role,
            job_desc,
            json.dumps(required_skills),
            json.dumps(eligibility),
            deadline,
            package,
            package_value,
            location,
            mode,
            "active",
            posted_date,
            openings,
            drive_type,
            json.dumps(rounds),
            drive_date,
        )
    )

    logger.info(f"Successfully created drive '{drive_id}' for company '{company_id}'")

    created_drive = {
        "id": drive_id,
        "companyId": company_id,
        "role": role,
        "description": job_desc,
        "requiredSkills": required_skills,
        "eligibility": eligibility,
        "deadline": deadline,
        "driveDate": drive_date,
        "package": package,
        "packageValue": package_value,
        "location": location,
        "mode": mode,
        "status": "active",
        "postedDate": posted_date,
        "openings": openings,
        "driveType": drive_type,
        "rounds": rounds,
        "company": company_info,
    }

    return create_response(201, created_drive)


def handle_get_companies(cursor):
    """
    GET /companies
    Retrieves all companies from RDS.
    """
    logger.info("Fetching companies from RDS")
    ensure_schema(cursor)
    query = """
        SELECT 
            id,
            name,
            full_name AS fullName,
            industry,
            location AS headquarters,
            website,
            avatar,
            color,
            description
        FROM companies
        ORDER BY name ASC;
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    return create_response(200, rows)


def run_migration_seed(cursor):
    """
    Reseed database to enforce:
    - Only 2 companies: Infosys and Accenture
    - Only 2 drives: drive-accenture-01 and drive-infosys-01
    - Clean applications referencing only these drives
    """
    logger.info("Starting RDS database seed migration")
    cursor.execute("DELETE FROM applications;")
    cursor.execute("DELETE FROM drives;")
    cursor.execute("DELETE FROM companies;")

    # 1. Companies
    cursor.execute("""
        INSERT INTO companies (id, name, full_name, industry, location, website, avatar, color) VALUES
        ('company-accenture', 'Accenture', 'Accenture India', 'Management & Technology Consulting', 'Bengaluru, India', 'https://www.accenture.com', 'ACN', '#7C3AED'),
        ('company-infosys', 'Infosys', 'Infosys Limited', 'Enterprise Cloud & Digital Services', 'Bengaluru, India', 'https://www.infosys.com', 'INF', '#0284C7');
    """)

    # 2. Demo Student
    cursor.execute("""
        INSERT INTO students (id, name, email, college, degree, branch, graduation_year, cgpa, skills, resume_summary, ats_score, avatar) VALUES
        ('student-001', 'Rahul Sharma', 'rahul.sharma@college.edu', 'National Institute of Technology, Delhi', 'B.Tech', 'Computer Science & Engineering', 2025, 8.40,
         '["Python", "JavaScript", "React", "SQL", "Git", "HTML", "CSS", "Node.js", "REST API", "MySQL"]',
         'Final year CSE student with strong programming fundamentals and web development experience.',
         NULL, 'RS')
        ON DUPLICATE KEY UPDATE name=VALUES(name);
    """)

    # 3. Exactly Two Drives
    cursor.execute("""
        INSERT INTO drives (id, company_id, role, description, required_skills, eligibility, deadline, package, package_value, location, mode, status, posted_date, openings, drive_type, rounds) VALUES
        ('drive-accenture-01', 'company-accenture', 'Associate Software Engineer',
         'Build and maintain software solutions for global clients across industries. [Demo Placement Drive]',
         '["JavaScript", "React", "Node.js", "Git", "REST API", "HTML", "CSS"]',
         '{"degree": ["B.Tech", "B.E", "BCA", "MCA"], "branches": ["CSE", "IT", "ECE"], "minCGPA": 6.5, "backlogs": 0}',
         '2026-10-25', '4.50 LPA', 450000, 'Bengaluru / Mumbai / Hyderabad', 'Hybrid', 'active', '2026-09-05', 300, 'On-Campus',
         '["Communication Test", "Aptitude", "Technical Interview", "HR"]'),
        ('drive-infosys-01', 'company-infosys', 'Systems Engineer Trainee',
         'Entry-level engineering role with comprehensive 16-week training program. [Demo Placement Drive]',
         '["Java", "Python", "SQL", "Git", "HTML"]',
         '{"degree": ["B.Tech", "B.E", "BCA", "MCA", "B.Sc"], "branches": ["CSE", "IT", "ECE", "EEE", "Mechanical"], "minCGPA": 6.0, "backlogs": 0}',
         '2026-10-30', '3.60 LPA', 360000, 'Pan India', 'Hybrid', 'active', '2026-09-02', 1000, 'On-Campus',
         '["HackerRank Test", "Aptitude", "Technical Interview", "HR"]');
    """)

    # 4. Applications for remaining drives
    cursor.execute("""
        INSERT INTO applications (id, student_id, drive_id, applied_date, current_stage, status) VALUES
        ('app-002', 'student-001', 'drive-accenture-01', '2026-09-06', 'resume_screening', 'Pending Review'),
        ('app-003', 'student-001', 'drive-infosys-01', '2026-09-01', 'final', 'Selected');
    """)

    return {"message": "RDS migration completed successfully: 2 companies, 2 drives, 2 applications reseeded."}


def lambda_handler(event, context):
    """
    AWS Lambda Entrypoint
    Supports HTTP API v2 and REST API payload formats
    """
    logger.info(f"Incoming event route: {event.get('routeKey') or event.get('httpMethod')}")

    # Determine HTTP Method and Path
    # HTTP API v2: event['requestContext']['http']['method'], event['rawPath']
    # REST API: event['httpMethod'], event['path']
    http_ctx = event.get("requestContext", {}).get("http", {})
    method = http_ctx.get("method") or event.get("httpMethod", "")
    path = event.get("rawPath") or event.get("path", "")

    # CORS Preflight
    if method == "OPTIONS":
        return create_response(200, {"message": "OK"})

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Direct invocation migration action
            if event.get("action") == "run_migration":
                result = run_migration_seed(cursor)
                return create_response(200, result)

            if event.get("action") == "clean_temp_drive":
                drive_id = event.get("driveId")
                cursor.execute("DELETE FROM drives WHERE id = %s", (drive_id,))
                return create_response(200, {"message": f"Deleted {drive_id}"})

            # Route matching
            if method == "POST" and ("/auth/login" in path):
                body = event.get("body")
                return handle_login(cursor, body)

            elif method == "GET" and ("/auth/me" in path):
                return handle_get_me(cursor, event)

            elif method == "POST" and ("/auth/logout" in path):
                return handle_logout(cursor, event)

            elif method == "GET" and ("/applications" in path):
                return handle_get_applications(cursor, event)

            elif method == "POST" and ("/applications" in path):
                body = event.get("body")
                return handle_post_applications(cursor, body, event)

            elif method == "GET" and ("/preparation" in path):
                return handle_get_preparation(cursor, event)

            elif method == "GET" and ("/drives" in path):
                return handle_get_drives(cursor)

            elif method == "POST" and ("/drives" in path):
                body = event.get("body")
                return handle_post_drives(cursor, body)

            elif method == "GET" and ("/companies" in path):
                return handle_get_companies(cursor)

            else:
                logger.warning(f"Unmatched route: {method} {path}")
                return create_response(404, {"error": f"Route not found: {method} {path}"})

    except Exception as e:
        logger.error(f"Internal server error processing request: {str(e)}", exc_info=True)
        # Note: Sanitized error response - no credentials exposed
        return create_response(500, {"error": "Internal server error occurred. Please try again later."})

