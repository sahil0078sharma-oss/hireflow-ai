"""
HireFlow AI — Adaptive Placement Preparation Engine
Generates context-aware, personalized preparation plans using:
- RDS Placement Drive details & required skills
- Live Student Application stage
- Amazon Comprehend resume skill-gap signals (missingSkills)
- Curated Question Bank
"""

import json
import logging
from question_bank import QUESTION_BANK

logger = logging.getLogger()
logger.setLevel(logging.INFO)

STAGE_LABELS = {
    "application": "Application & Screening",
    "resume_screening": "Resume Screening",
    "aptitude": "Aptitude Assessment",
    "technical": "Technical Round",
    "hr": "HR & Behavioral Round",
    "final": "Final Interview / Offer",
}


def parse_json_safely(val, default):
    if not val:
        return default
    if isinstance(val, (list, dict)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return default


def generate_preparation_plan(
    cursor,
    student_id,
    drive_id=None,
    category="technical",
    missing_skills_param="",
    analysis_drive_id=None,
    ats_score_param=None,
    mode="drive",
    custom_company=None,
    custom_role=None,
    jd_skills_param="",
):
    """
    Generates a personalized preparation response for the given student.
    Supports TWO modes:
    - Mode A: College Placement Drive (drive_id -> RDS drives table)
    - Mode B: Student Custom JD (custom_company, custom_role, missing_skills, ats_score -> dynamic plan)
    """
    # ─── MODE B: STUDENT CUSTOM JD ──────────────────────────────────────────
    if mode == "custom" or drive_id == "custom" or (not drive_id and custom_company):
        company_name = (custom_company or "External Organization").strip()
        role = (custom_role or "Software Engineer").strip()
        company_id = "custom"

        # Fetch student profile skills from RDS
        student_query = "SELECT skills FROM students WHERE id = %s;"
        cursor.execute(student_query, (student_id,))
        student_row = cursor.fetchone()
        student_skills = parse_json_safely(student_row["skills"] if student_row else None, [])
        student_skills_lower = {s.lower().strip() for s in student_skills}

        # Parse ATS score
        ats_score_int = None
        if ats_score_param:
            try:
                ats_score_int = int(ats_score_param)
            except (ValueError, TypeError):
                ats_score_int = None

        # Parse missing skills from resume analysis
        missing_skills = [
            s.strip() for s in missing_skills_param.split(",") if s.strip()
        ] if missing_skills_param else []
        missing_skills_lower = {s.lower().strip() for s in missing_skills}

        # Parse JD skills or establish foundational role competencies
        jd_skills = [
            s.strip() for s in jd_skills_param.split(",") if s.strip()
        ] if jd_skills_param else []

        combined_skills = list(dict.fromkeys(missing_skills + jd_skills))
        if not combined_skills:
            role_lower = role.lower()
            if "cloud" in role_lower or "devops" in role_lower:
                combined_skills = ["AWS", "Docker", "Python", "Linux", "SQL"]
            elif "data" in role_lower:
                combined_skills = ["Python", "SQL", "Machine Learning", "Git"]
            else:
                combined_skills = ["Python", "SQL", "React", "Docker", "Git"]
        required_skills = combined_skills

        # Build priority skills
        priority_skills = []
        for req_skill in required_skills:
            skill_lower = req_skill.lower().strip()
            if skill_lower in missing_skills_lower:
                priority_skills.append({
                    "skill": req_skill,
                    "priority": "HIGH",
                    "reason": f"Required for {company_name} but identified as a gap in your analyzed resume."
                })
            elif skill_lower in student_skills_lower:
                priority_skills.append({
                    "skill": req_skill,
                    "priority": "MATCHED",
                    "reason": "Confirmed match in your student profile / resume skills."
                })
            else:
                priority_skills.append({
                    "skill": req_skill,
                    "priority": "MEDIUM",
                    "reason": f"Target competency for {role} at {company_name}."
                })

        priority_order = {"HIGH": 0, "MEDIUM": 1, "MATCHED": 2}
        priority_skills.sort(key=lambda x: priority_order.get(x["priority"], 3))

        # Readiness score
        if ats_score_int is not None:
            readiness_score = max(35, min(95, ats_score_int))
        else:
            readiness_score = 68

        # Round focus tailored by role
        role_lower = role.lower()
        if "cloud" in role_lower or "devops" in role_lower:
            round_focus = [
                "AWS Cloud Architecture (Lambda, S3, RDS)",
                "Docker Containerization & CI/CD",
                "Linux Systems & Shell Scripting",
                f"{company_name} Infrastructure Requirements",
            ]
        elif "data" in role_lower:
            round_focus = [
                "SQL Query Optimization & Database Indexing",
                "Python Data Engineering & Pipelines",
                "Relational Data Modeling",
                f"{company_name} Data Scale & Architecture",
            ]
        else:
            round_focus = [
                "Core Software Engineering & OOP",
                "Data Structures & Problem Solving",
                "RESTful APIs & Web Architecture",
                f"{company_name} Role Competencies",
            ]

        # Recommendations
        recommendations = []
        high_priority = [p["skill"] for p in priority_skills if p["priority"] == "HIGH"]
        if high_priority:
            recommendations.append(
                f"Focus immediate study on identified resume gaps for {company_name}: {', '.join(high_priority)}."
            )
        recommendations.append(
            f"Prepare concrete project walkthroughs demonstrating your practical experience for {role}."
        )
        recommendations.append(
            f"Review {company_name}'s domain, scale, and technology stack for behavioral and architectural questions."
        )

        # Question selection from question bank
        normalized_category = category.lower().strip() if category else "technical"
        valid_categories = ["technical", "aptitude", "hr", "company-role"]
        if normalized_category not in valid_categories:
            normalized_category = "technical"

        candidate_questions = [q for q in QUESTION_BANK if q["category"] == normalized_category]
        filtered_questions = []

        if normalized_category == "technical":
            high_skills_set = {s.lower() for s in high_priority}
            req_skills_set = {s.lower() for s in required_skills}

            def question_priority(q):
                topic = q.get("topic", "").lower()
                if topic in high_skills_set:
                    return 0  # Highest priority (resume gap)
                if topic in req_skills_set:
                    return 1  # Required JD skill
                return 2      # Core CS

            candidate_questions.sort(key=question_priority)
            filtered_questions = candidate_questions[:6]

        elif normalized_category == "company-role":
            filtered_questions = [
                {
                    "question": f"Why are you interested in joining {company_name} as a {role}?",
                    "answer": f"Connect your technical capabilities in {', '.join(required_skills[:3])} directly to {company_name}'s mission, technical challenges, and industry position.",
                    "tip": f"Research {company_name}'s recent work and explain how {role} aligns with your engineering goals.",
                    "topic": role,
                    "difficulty": "Intermediate",
                },
                {
                    "question": f"Describe a complex technical challenge you overcame that prepares you for the {role} position at {company_name}.",
                    "answer": "Walk through a real project using the STAR method (Situation, Task, Action, Result). Detail design trade-offs, testing, and production deployment.",
                    "tip": "Highlight quantifiable outcomes (e.g. latency reduction, cost savings, reliability).",
                    "topic": role,
                    "difficulty": "Advanced",
                },
                {
                    "question": f"How would you approach ramping up on {company_name}'s architecture during your first 90 days as {role}?",
                    "answer": "Focus on understanding system architecture, documentation, test suites, shadowing deployments, and delivering quick incremental improvements.",
                    "tip": "Emphasize team collaboration, systematic debugging, and operational excellence.",
                    "topic": role,
                    "difficulty": "Intermediate",
                },
            ]
        else:
            filtered_questions = candidate_questions[:5]

        formatted_questions = [
            {
                "question": q["question"],
                "answer": q["answer"],
                "tip": q.get("tip", ""),
                "topic": q.get("topic", role),
                "difficulty": q.get("difficulty", "Intermediate"),
            }
            for q in filtered_questions
        ]

        analysis_context = {
            "linked": True,
            "mode": "custom",
            "source": "student-uploaded-jd",
            "company": company_name,
            "role": role,
            "atsScore": ats_score_int,
            "missingSkills": missing_skills,
        }

        response_body = {
            "success": True,
            "company": company_name,
            "companyId": "custom",
            "driveId": None,
            "role": role,
            "applicationStage": "Preparation (Student-Uploaded JD)",
            "applicationStageKey": "custom",
            "applicationStatus": "Custom Analysis",
            "hasApplied": False,
            "readinessScore": readiness_score,
            "prioritySkills": priority_skills,
            "roundFocus": round_focus,
            "questions": formatted_questions,
            "recommendations": recommendations,
            "analysisContext": analysis_context,
            "meta": {
                "totalQuestions": len(formatted_questions),
                "selectedCategory": normalized_category,
                "requiredSkills": required_skills,
                "rounds": ["Technical Screening", "Domain Interview", "Managerial / HR"],
                "package": "Industry Competitive",
                "location": "Custom Location",
                "source": "HireFlow AI Preparation (Student-Uploaded JD Context)",
            },
        }
        return 200, response_body

    # ─── MODE A: COLLEGE PLACEMENT DRIVE ────────────────────────────────────
    if not drive_id:
        return 400, {"error": "Missing required query parameter: 'driveId'"}

    # 1. Fetch drive and company from RDS
    query = """
        SELECT 
            d.id AS drive_id,
            d.role AS drive_role,
            d.description AS drive_description,
            d.required_skills AS drive_required_skills,
            d.eligibility AS drive_eligibility,
            d.rounds AS drive_rounds,
            d.package AS drive_package,
            d.location AS drive_location,
            d.mode AS drive_mode,
            c.id AS company_id,
            c.name AS company_name,
            c.full_name AS company_full_name,
            c.avatar AS company_avatar,
            c.color AS company_color
        FROM drives d
        JOIN companies c ON d.company_id = c.id
        WHERE d.id = %s;
    """
    cursor.execute(query, (drive_id,))
    drive_row = cursor.fetchone()
    if not drive_row:
        logger.warning(f"Preparation requested for non-existent drive: {drive_id}")
        return 404, {"error": f"Placement drive '{drive_id}' not found"}

    company_name = drive_row["company_name"]
    company_id = drive_row["company_id"]
    role = drive_row["drive_role"]
    required_skills = parse_json_safely(drive_row["drive_required_skills"], [])
    drive_rounds = parse_json_safely(drive_row["drive_rounds"], [])

    # 2. Fetch student's application for this drive
    app_query = """
        SELECT id, current_stage, status, applied_date
        FROM applications
        WHERE student_id = %s AND drive_id = %s;
    """
    cursor.execute(app_query, (student_id, drive_id))
    app_row = cursor.fetchone()

    if app_row:
        has_applied = True
        stage_key = app_row["current_stage"]
        stage_label = STAGE_LABELS.get(stage_key, stage_key.replace("_", " ").title())
        app_status = app_row["status"]
    else:
        has_applied = False
        stage_key = "application"
        stage_label = "Pre-Application (Discovery)"
        app_status = "Not Applied"

    # 3. Fetch student profile skills from RDS
    student_query = "SELECT skills FROM students WHERE id = %s;"
    cursor.execute(student_query, (student_id,))
    student_row = cursor.fetchone()
    student_skills = parse_json_safely(student_row["skills"] if student_row else None, [])
    student_skills_lower = {s.lower().strip() for s in student_skills}

    # 4. Context-Binding Check: Validate if missing skills belong to THIS drive
    ats_score_int = None
    if ats_score_param:
        try:
            ats_score_int = int(ats_score_param)
        except (ValueError, TypeError):
            ats_score_int = None

    if analysis_drive_id:
        if analysis_drive_id == drive_id:
            effective_missing_skills = [
                s.strip() for s in missing_skills_param.split(",") if s.strip()
            ] if missing_skills_param else []
            analysis_context = {
                "linked": True,
                "driveId": drive_id,
                "atsScore": ats_score_int,
                "missingSkills": effective_missing_skills,
            }
        else:
            # Mismatched analysis drive! Do NOT apply foreign skill gaps.
            effective_missing_skills = []
            analysis_context = {
                "linked": False,
                "driveId": None,
                "message": f"Resume analysis was conducted for '{analysis_drive_id}', not matching selected drive '{drive_id}'."
            }
    elif missing_skills_param:
        # missingSkills provided directly
        effective_missing_skills = [
            s.strip() for s in missing_skills_param.split(",") if s.strip()
        ]
        analysis_context = {
            "linked": True,
            "driveId": drive_id,
            "atsScore": ats_score_int,
            "missingSkills": effective_missing_skills,
        }
    else:
        effective_missing_skills = []
        analysis_context = {
            "linked": False,
            "driveId": None,
            "message": "No resume analysis linked to this placement drive."
        }

    missing_skills = effective_missing_skills
    missing_skills_lower = {s.lower().strip() for s in missing_skills}

    # 5. Build priority skills breakdown
    priority_skills = []
    matched_count = 0

    for req_skill in required_skills:
        skill_lower = req_skill.lower().strip()
        if skill_lower in missing_skills_lower:
            priority_skills.append({
                "skill": req_skill,
                "priority": "HIGH",
                "reason": "Required by this placement drive but identified as a gap in your analyzed resume."
            })
        elif skill_lower in student_skills_lower:
            matched_count += 1
            priority_skills.append({
                "skill": req_skill,
                "priority": "MATCHED",
                "reason": "Confirmed match in your student profile / resume skills."
            })
        else:
            priority_skills.append({
                "skill": req_skill,
                "priority": "MEDIUM",
                "reason": "Required by this placement drive; not listed in your profile skills."
            })

    # Sort priority: HIGH -> MEDIUM -> MATCHED
    priority_order = {"HIGH": 0, "MEDIUM": 1, "MATCHED": 2}
    priority_skills.sort(key=lambda x: priority_order.get(x["priority"], 3))

    # 6. Compute Preparation Readiness Score (0-100)
    # Transparent deterministic formula:
    # Base: 50
    # + Skill match ratio (up to +20)
    # + Application state (up to +15)
    # + Resume gap penalty / bonus (-10 to +10)
    base_readiness = 50
    total_req = len(required_skills) if len(required_skills) > 0 else 1
    match_ratio = matched_count / total_req

    if match_ratio >= 0.75:
        skill_bonus = 20
    elif match_ratio >= 0.5:
        skill_bonus = 12
    else:
        skill_bonus = 5

    stage_bonus = 0
    if has_applied:
        stage_bonus += 5
        if stage_key in ["technical", "hr", "final"]:
            stage_bonus += 10
        elif stage_key in ["resume_screening", "aptitude"]:
            stage_bonus += 5

    gap_adjustment = 0
    if missing_skills_param is not None and len(missing_skills_param) > 0:
        if len(missing_skills) == 0:
            gap_adjustment = 10
        elif len(missing_skills) == 1:
            gap_adjustment = 5
        else:
            gap_adjustment = -10

    raw_readiness = base_readiness + skill_bonus + stage_bonus + gap_adjustment
    readiness_score = max(35, min(95, raw_readiness))

    # 7. Determine Round Focus based on application stage & role
    if stage_key in ["application", "resume_screening"]:
        round_focus = [
            "Resume Alignment & Keywords",
            "Company Background & Values",
            "Aptitude & Logical Foundations",
            "Core Programming Basics"
        ]
    elif stage_key == "aptitude":
        round_focus = [
            "Quantitative Aptitude (Time, Work, Speed)",
            "Logical Reasoning & Pattern Analysis",
            "Data Interpretation & Analysis",
            "Basic Algorithm Tracing"
        ]
    elif stage_key == "technical":
        # Role-specific technical focus
        if "data" in role.lower():
            round_focus = [
                "SQL Query Optimization & Indexing",
                "Python Data Pipelines & ETL",
                "Relational Database Design (ACID)",
                "Data Structures & Algorithmic Efficiency"
            ]
        elif "cloud" in role.lower() or "infrastructure" in role.lower():
            round_focus = [
                "AWS Cloud Architecture (Lambda, S3, RDS)",
                "Docker Containerization & Networking",
                "Linux OS & Shell Scripting",
                "CI/CD Pipelines & Version Control"
            ]
        else:
            round_focus = [
                "Data Structures & Algorithms (Sorting, Trees)",
                "Object-Oriented Programming (OOP)",
                "DBMS & Normalization",
                "RESTful APIs & Web Architecture"
            ]
    elif stage_key == "hr":
        round_focus = [
            "Behavioral Questions (STAR Method)",
            f"{company_name} Culture & Core Values",
            "Conflict Resolution & Team Dynamics",
            "Long-term Career Objectives & Strengths"
        ]
    else:  # final
        round_focus = [
            "Executive Alignment & Professionalism",
            "Role Responsibilities & Expectations",
            "Compensation Structure & Offer Details",
            "Project Portfolio & Architecture Review"
        ]

    # 8. Generate Contextual Recommendations
    recommendations = []
    high_priority = [p["skill"] for p in priority_skills if p["priority"] == "HIGH"]
    if high_priority:
        recommendations.append(
            f"Focus immediate study on identified resume gaps: {', '.join(high_priority)}."
        )

    if stage_key == "technical":
        recommendations.append(
            f"Be prepared to write code from scratch for key role skills: {', '.join(required_skills[:3])}."
        )
        recommendations.append(
            "Prepare two concrete project deep-dives detailing system architecture and performance trade-offs."
        )
    elif stage_key == "aptitude":
        recommendations.append(
            "Practice timed sections: focus on unit conversions, work-rate shortcuts, and number series."
        )
    elif stage_key in ["hr", "final"]:
        recommendations.append(
            f"Research recent news and major client initiatives at {company_name}."
        )
        recommendations.append(
            "Structure behavioral answers using Situation, Task, Action, Result (STAR)."
        )
    else:
        recommendations.append(
            f"Verify your resume highlights {', '.join(required_skills[:3])} to pass the initial screening."
        )

    # 9. Filter and prioritize questions based on category & topics
    normalized_category = category.lower().strip() if category else "technical"
    valid_categories = ["technical", "aptitude", "hr", "company-role"]
    if normalized_category not in valid_categories:
        normalized_category = "technical"

    # Collect questions from bank matching the requested category
    candidate_questions = [q for q in QUESTION_BANK if q["category"] == normalized_category]

    filtered_questions = []
    if normalized_category == "technical":
        # Strategy: Prioritize questions matching HIGH priority skills (resume gaps),
        # then matching drive required skills, then core CS topics.
        high_skills_set = {s.lower() for s in high_priority}
        req_skills_set = {s.lower() for s in required_skills}

        def question_priority(q):
            topic = q.get("topic", "").lower()
            if topic in high_skills_set:
                return 0  # Highest priority (resume gap)
            if topic in req_skills_set:
                return 1  # Required drive skill
            return 2      # Core CS

        candidate_questions.sort(key=question_priority)
        filtered_questions = candidate_questions[:6]

    elif normalized_category == "company-role":
        # Filter for the target company first, fallback to general company-role
        comp_questions = [q for q in candidate_questions if q.get("topic", "").lower() == company_name.lower()]
        other_comp_questions = [q for q in candidate_questions if q.get("topic", "").lower() != company_name.lower()]
        filtered_questions = (comp_questions + other_comp_questions)[:5]

    else:
        # Aptitude or HR: Return up to 5 diverse questions
        filtered_questions = candidate_questions[:5]

    # Format questions response
    formatted_questions = [
        {
            "question": q["question"],
            "answer": q["answer"],
            "tip": q.get("tip", ""),
            "topic": q.get("topic", ""),
            "difficulty": q.get("difficulty", "Intermediate"),
        }
        for q in filtered_questions
    ]

    response_body = {
        "success": True,
        "company": company_name,
        "companyId": company_id,
        "driveId": drive_id,
        "role": role,
        "applicationStage": stage_label,
        "applicationStageKey": stage_key,
        "applicationStatus": app_status,
        "hasApplied": has_applied,
        "readinessScore": readiness_score,
        "prioritySkills": priority_skills,
        "roundFocus": round_focus,
        "questions": formatted_questions,
        "recommendations": recommendations,
        "analysisContext": analysis_context,
        "meta": {
            "totalQuestions": len(formatted_questions),
            "selectedCategory": normalized_category,
            "requiredSkills": required_skills,
            "rounds": drive_rounds,
            "package": drive_row["drive_package"],
            "location": drive_row["drive_location"],
            "source": "HireFlow Adaptive Preparation Engine (RDS + AWS Comprehend Gap Signals)",
        },
    }

    return 200, response_body
