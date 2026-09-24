"""
HireFlow AI — Amazon Comprehend Resume Analyzer Lambda
Runtime: Python 3.12
Region: ap-south-1
VPC: None (direct AWS API access)
"""

import json
import logging
import re
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

comprehend = boto3.client("comprehend", region_name="ap-south-1")

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

# Controlled technical skill vocabulary mapping (normalized key -> canonical display)
CONTROLLED_VOCABULARY = {
    # Programming Languages
    "python": "Python",
    "java": "Java",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "c++": "C++",
    "c#": "C#",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "scala": "Scala",
    "r": "R",

    # Frontend
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "angular": "Angular",
    "vue": "Vue",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "html": "HTML",
    "css": "CSS",
    "redux": "Redux",
    "tailwind": "Tailwind CSS",
    "bootstrap": "Bootstrap",

    # Backend & Frameworks
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express": "Express",
    "expressjs": "Express",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "spring": "Spring",
    "spring boot": "Spring Boot",

    # Databases
    "sql": "SQL",
    "mysql": "MySQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "dynamodb": "DynamoDB",
    "oracle": "Oracle",
    "sqlite": "SQLite",

    # Cloud & DevOps
    "aws": "AWS",
    "lambda": "AWS Lambda",
    "aws lambda": "AWS Lambda",
    "s3": "Amazon S3",
    "amazon s3": "Amazon S3",
    "ec2": "Amazon EC2",
    "amazon ec2": "Amazon EC2",
    "rds": "Amazon RDS",
    "amazon rds": "Amazon RDS",
    "sagemaker": "Amazon SageMaker",
    "amazon sagemaker": "Amazon SageMaker",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "terraform": "Terraform",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "ci/cd": "CI/CD",
    "linux": "Linux",

    # AI, ML & Data
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "opencv": "OpenCV",
    "computer vision": "Computer Vision",
    "data science": "Data Science",

    # APIs & Architecture
    "rest api": "REST API",
    "rest": "REST API",
    "graphql": "GraphQL",
    "microservices": "Microservices",
}


def normalize_phrase(text):
    """Normalize text for consistent comparison: lowercase, remove special characters."""
    cleaned = re.sub(r"[^a-zA-Z0-9\s.+#/]", " ", text.lower())
    return " ".join(cleaned.split())


def extract_skills_from_text(text, nlp_phrases=None):
    """
    Identify technical skills in the text using boundary matching
    enhanced by Amazon Comprehend key phrases.
    """
    normalized_doc = f" {normalize_phrase(text)} "
    found_skills = {}

    # Check against vocabulary
    for vocab_key, canonical in CONTROLLED_VOCABULARY.items():
        # Match using word boundaries or enclosed spaces
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(vocab_key) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, normalized_doc):
            found_skills[canonical] = True

    # If Comprehend identified specific phrases, cross-reference them
    if nlp_phrases:
        for phrase in nlp_phrases:
            phrase_norm = normalize_phrase(phrase)
            if phrase_norm in CONTROLLED_VOCABULARY:
                found_skills[CONTROLLED_VOCABULARY[phrase_norm]] = True

    return list(found_skills.keys())


def calculate_phrase_overlap(resume_phrases, jd_phrases):
    """Calculate normalized semantic Jaccard overlap between key phrases extracted by Comprehend."""
    if not jd_phrases or not resume_phrases:
        return 0.0

    resume_set = {normalize_phrase(p) for p in resume_phrases if len(p.strip()) > 2}
    jd_set = {normalize_phrase(p) for p in jd_phrases if len(p.strip()) > 2}

    if not jd_set:
        return 0.0

    # Direct match or substring overlap
    matches = 0
    for jp in jd_set:
        if jp in resume_set or any(jp in rp or rp in jp for rp in resume_set):
            matches += 1

    return min(100.0, (matches / len(jd_set)) * 100.0)


def generate_recommendations(missing_skills, matched_skills, jd_phrases):
    """Generate dynamic, actionable recommendations based on actual detected skill gaps."""
    recs = []

    if not missing_skills:
        recs.append("Excellent alignment! Your resume demonstrates the key technical competencies requested.")
        if matched_skills:
            recs.append(f"To stand out further, quantify your project achievements with {', '.join(matched_skills[:3])} (e.g., latency, throughput, scale).")
        return recs

    # Specific missing skills
    if len(missing_skills) <= 3:
        recs.append(f"Add {', '.join(missing_skills)} to your skills or project descriptions if you have practical experience.")
    else:
        top_missing = missing_skills[:4]
        recs.append(f"Prioritize demonstrating experience with key missing skills: {', '.join(top_missing)}.")

    # Category-specific guidance based on missing skills
    cloud_keywords = {"AWS", "AWS Lambda", "Amazon S3", "Amazon EC2", "Amazon RDS", "Docker", "Kubernetes", "Terraform"}
    ml_keywords = {"Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch", "Scikit-Learn"}
    db_keywords = {"SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "DynamoDB"}

    missing_cloud = [s for s in missing_skills if s in cloud_keywords]
    if missing_cloud:
        recs.append(f"Cloud and container skills ({', '.join(missing_cloud)}) are required. Showcase small cloud deployment or containerization projects.")

    missing_ml = [s for s in missing_skills if s in ml_keywords]
    if missing_ml:
        recs.append(f"Machine learning competencies ({', '.join(missing_ml)}) are emphasized in the job description. Highlight model building and evaluation metrics.")

    missing_db = [s for s in missing_skills if s in db_keywords]
    if missing_db:
        recs.append(f"Database expertise with {', '.join(missing_db)} is requested. Ensure your project experience details data schema design and querying.")

    # General phrase alignment recommendation
    recs.append("Align your resume bullet points with the core role responsibilities to maximize ATS keyword relevance.")

    return recs[:5]


def create_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body),
    }


def lambda_handler(event, context):
    logger.info("Incoming request to hireflow-resume-analyzer")

    # Handle OPTIONS preflight
    http_ctx = event.get("requestContext", {}).get("http", {})
    method = http_ctx.get("method") or event.get("httpMethod", "")
    if method == "OPTIONS":
        return create_response(200, {"message": "OK"})

    # Parse and validate request body
    body_raw = event.get("body")
    if not body_raw:
        return create_response(400, {"error": "Request body is required."})

    try:
        data = json.loads(body_raw)
    except Exception:
        return create_response(400, {"error": "Invalid JSON in request body."})

    resume_text = data.get("resumeText")
    jd_text = data.get("jobDescription") or data.get("jdText")

    # Validation: exists, strings, non-empty
    if not isinstance(resume_text, str) or not resume_text.strip():
        return create_response(400, {"error": "Field 'resumeText' is required and must be a non-empty string."})

    if not isinstance(jd_text, str) or not jd_text.strip():
        return create_response(400, {"error": "Field 'jobDescription' is required and must be a non-empty string."})

    # Safe oversized input handling (Amazon Comprehend has a 5,000 byte limit per call)
    MAX_CHAR_LIMIT = 4500
    resume_processed = resume_text.strip()[:MAX_CHAR_LIMIT]
    jd_processed = jd_text.strip()[:MAX_CHAR_LIMIT]

    logger.info(f"Analyzing resume ({len(resume_processed)} chars) against JD ({len(jd_processed)} chars)")

    try:
        # 1. Amazon Comprehend NLP Extraction: Resume
        resume_kp_resp = comprehend.detect_key_phrases(Text=resume_processed, LanguageCode="en")
        resume_entities_resp = comprehend.detect_entities(Text=resume_processed, LanguageCode="en")

        resume_key_phrases = [
            kp["Text"] for kp in resume_kp_resp.get("KeyPhrases", []) if kp.get("Score", 0) >= 0.70
        ]
        resume_entities = [
            {"text": ent["Text"], "type": ent["Type"], "score": round(ent.get("Score", 0), 3)}
            for ent in resume_entities_resp.get("Entities", []) if ent.get("Score", 0) >= 0.70
        ]

        # 2. Amazon Comprehend NLP Extraction: Job Description
        jd_kp_resp = comprehend.detect_key_phrases(Text=jd_processed, LanguageCode="en")
        jd_entities_resp = comprehend.detect_entities(Text=jd_processed, LanguageCode="en")

        jd_key_phrases = [
            kp["Text"] for kp in jd_kp_resp.get("KeyPhrases", []) if kp.get("Score", 0) >= 0.70
        ]
        jd_entities = [
            {"text": ent["Text"], "type": ent["Type"], "score": round(ent.get("Score", 0), 3)}
            for ent in jd_entities_resp.get("Entities", []) if ent.get("Score", 0) >= 0.70
        ]

    except Exception as e:
        logger.error(f"Amazon Comprehend invocation failed: {str(e)}", exc_info=True)
        return create_response(500, {"error": "Natural Language Processing analysis failed. Please try again."})

    # 3. Application-Level Skill Extraction (combining text and Comprehend NLP phrases)
    resume_skills = extract_skills_from_text(resume_processed, resume_key_phrases)
    jd_skills = extract_skills_from_text(jd_processed, jd_key_phrases)

    matched_skills = [s for s in jd_skills if s in resume_skills]
    missing_skills = [s for s in jd_skills if s not in resume_skills]

    # 4. Transparent Multi-Factor ATS Scoring Calculation
    # Component 1: Skill Match Score (60% weight)
    if jd_skills:
        skill_score = (len(matched_skills) / len(jd_skills)) * 100.0
    else:
        skill_score = 50.0  # Fallback if no specific skills recognized in JD

    # Component 2: Key Phrase Relevance (25% weight)
    phrase_score = calculate_phrase_overlap(resume_key_phrases, jd_key_phrases)

    # Component 3: Entity Relevance Signal (15% weight)
    # Check overlap in detected organization/title/commercial item entities
    jd_entity_texts = {normalize_phrase(e["text"]) for e in jd_entities}
    resume_entity_texts = {normalize_phrase(e["text"]) for e in resume_entities}
    if jd_entity_texts:
        entity_matches = len(jd_entity_texts.intersection(resume_entity_texts))
        entity_score = min(100.0, (entity_matches / len(jd_entity_texts)) * 100.0)
    else:
        entity_score = phrase_score

    # Weighted Composite ATS Score (Clamped between 5 and 100)
    raw_ats_score = (0.60 * skill_score) + (0.25 * phrase_score) + (0.15 * entity_score)
    ats_score = max(5, min(100, round(raw_ats_score)))

    # 5. Dynamic Recommendations generated from detected gaps
    recommendations = generate_recommendations(missing_skills, matched_skills, jd_key_phrases)

    # Format deduplicated top key phrases for UI display
    display_resume_phrases = list(dict.fromkeys(resume_key_phrases))[:10]
    display_jd_phrases = list(dict.fromkeys(jd_key_phrases))[:10]

    # Filter top entities
    display_entities = resume_entities[:8]

    result = {
        "atsScore": ats_score,
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "recommendations": recommendations,
        "resumeKeyPhrases": display_resume_phrases,
        "jobKeyPhrases": display_jd_phrases,
        "entities": display_entities,
        "totalJdSkills": len(jd_skills),
        "resumeSkillsFound": resume_skills,
        "breakdown": {
            "skillMatchScore": round(skill_score, 1),
            "phraseRelevanceScore": round(phrase_score, 1),
            "entityRelevanceScore": round(entity_score, 1),
        },
        "nlpMetadata": {
            "engine": "Amazon Comprehend",
            "region": "ap-south-1",
            "extractedPhrasesCount": len(resume_key_phrases),
            "extractedEntitiesCount": len(resume_entities),
        }
    }

    logger.info(f"Analysis complete. Calculated ATS score: {ats_score} (matched: {len(matched_skills)}, missing: {len(missing_skills)})")
    return create_response(200, result)
