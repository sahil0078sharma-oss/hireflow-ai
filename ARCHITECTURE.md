# HireFlow AI — System Architecture

## Overview

HireFlow AI uses a serverless architecture on AWS with a React single-page application frontend. The system is composed of two independently deployed Lambda functions sharing a single API Gateway, with Amazon RDS MySQL as the persistence layer and Amazon Comprehend as the managed NLP service.

---

## Architecture Diagram

```
                    ┌──────────────────────────────┐
                    │     Student Browser           │
                    │     React / Vite SPA          │
                    │                               │
                    │  ┌─────────────────────────┐  │
                    │  │ Client-Side Processing   │  │
                    │  │ - PDF extraction (pdfjs) │  │
                    │  │ - DOCX extraction (mammoth)│ │
                    │  │ - JD company/role regex   │  │
                    │  │ - sessionStorage cache    │  │
                    │  └─────────────────────────┘  │
                    └──────────────┬─────────────────┘
                                   │
                                   │ HTTPS REST API
                                   │ Bearer Token Auth
                                   │
                    ┌──────────────▼─────────────────┐
                    │   Amazon API Gateway            │
                    │   HTTP API (ap-south-1)          │
                    └──────┬────────────┬─────────────┘
                           │            │
            ┌──────────────▼──┐   ┌─────▼──────────────────┐
            │  Main Lambda     │   │  Resume Analyzer Lambda │
            │  (Python 3.12)   │   │  (Python 3.12)          │
            │                  │   │                          │
            │  Routes:         │   │  Route:                  │
            │  /auth/login     │   │  POST /resume/analyze    │
            │  /auth/me        │   │                          │
            │  /auth/logout    │   │  Uses:                   │
            │  /drives         │   │  - boto3                 │
            │  /applications   │   │  - Amazon Comprehend     │
            │  /preparation    │   │    detect_key_phrases()  │
            │  /companies      │   │    detect_entities()     │
            │                  │   │                          │
            │  Uses:           │   └──────────┬───────────────┘
            │  - PyMySQL       │              │
            │  - preparation   │              │
            │    _engine.py    │              │
            │  - question      │              ▼
            │    _bank.py      │   ┌──────────────────────────┐
            │                  │   │  Amazon Comprehend        │
            └────────┬─────────┘   │  Managed NLP Service      │
                     │             │  (ap-south-1)              │
                     │             └──────────────────────────┘
                     │
                     ▼
            ┌──────────────────────────┐
            │  Amazon RDS MySQL         │
            │  Database: hireflow       │
            │                           │
            │  Tables:                  │
            │  - companies              │
            │  - students               │
            │  - drives                 │
            │  - applications           │
            │  - sessions               │
            └──────────────────────────┘
```

---

## Component Details

### Frontend (React/Vite SPA)

**Technology:** React 19 + Vite 8 + React Router DOM 7

**Architecture Pattern:** Context-based state management with service layer abstraction

| Layer | Files | Purpose |
|-------|-------|---------|
| Pages | `src/pages/*.jsx` | Route-level components (Login, Dashboard, PlacementDrives, MyApplications, ResumeAnalyzer, AIPreparation) |
| Components | `src/components/**/*.jsx` | Reusable UI components organized by domain (auth, layout, ui, drives, applications, resume, ai) |
| Context | `src/context/AuthContext.jsx`, `AppContext.jsx` | Application-wide state: authentication, analysis results, applications |
| Services | `src/services/*.js` | API communication layer with caching and pub/sub |
| Hooks | `src/hooks/*.js` | React hooks for drives and applications |
| Lib | `src/lib/api.js` | HTTP client wrapper with Bearer token injection |
| Utils | `src/utils/*.js` | Document extraction, JD parsing, formatting |
| Data | `src/data/*.js` | Offline fallback data and type definitions |

**Client-Side Processing:**
- PDF text extraction via `pdfjs-dist` (no server upload)
- DOCX text extraction via `mammoth` (no server upload)
- TXT reading via native File API
- JD company/role detection via regex-based `jdExtractor.js`
- Analysis state persistence via `sessionStorage`

### API Gateway

**Type:** HTTP API (not REST API)
**Region:** ap-south-1

Routes are split between two Lambda integrations:
- Main Lambda handles: `/auth/*`, `/drives`, `/applications`, `/preparation`, `/companies`
- Resume Lambda handles: `/resume/analyze`

CORS is handled at the Lambda level with wildcard `Access-Control-Allow-Origin: *`.

### Main Lambda Function

**File:** `backend/lambda_function.py` + `preparation_engine.py` + `question_bank.py`
**Runtime:** Python 3.12
**Dependency:** PyMySQL

**Responsibilities:**
1. **Authentication** — Login (PBKDF2 verification), session management, profile retrieval, logout
2. **Drives CRUD** — List drives with company JOIN, create new drives with company creation
3. **Applications** — Create applications with validation, list student applications with enrichment
4. **Preparation** — Generate context-aware preparation plans using RDS data and question bank

**Database Connection:** Global connection reuse for warm Lambda container optimization.

**Schema Migration:** `ensure_schema()` function automatically adds missing columns and creates the sessions table on first invocation.

### Resume Analyzer Lambda Function

**File:** `backend_resume/lambda_function.py`
**Runtime:** Python 3.12
**Dependency:** boto3 (included in Lambda runtime)

**Processing Pipeline:**
1. Receive resume text + job description text
2. Call Amazon Comprehend `detect_key_phrases()` on resume (score threshold >= 0.70)
3. Call Amazon Comprehend `detect_entities()` on resume (score threshold >= 0.70)
4. Call Amazon Comprehend `detect_key_phrases()` on JD
5. Call Amazon Comprehend `detect_entities()` on JD
6. Extract skills using controlled vocabulary + Comprehend phrase cross-reference
7. Calculate ATS score: `0.60 * skill_match + 0.25 * phrase_overlap + 0.15 * entity_overlap`
8. Generate dynamic recommendations based on missing skill categories
9. Return complete analysis result

**Input Handling:** Text is truncated to 4,500 characters per document (Comprehend limit is 5,000 bytes per call).

### Amazon RDS MySQL

**Database:** `hireflow`
**Engine:** MySQL (InnoDB)
**Character Set:** utf8mb4

**Schema (5 tables):**

```sql
companies (id PK, name, full_name, industry, location, website, avatar, color, description)
    ↑
drives (id PK, company_id FK, role, description, required_skills JSON, eligibility JSON,
        deadline, package, package_value, location, mode, status, rounds JSON)
    ↑
applications (id PK, student_id FK, drive_id FK, applied_date, current_stage, status)
    ↓
students (id PK, name, email UNIQUE, college, degree, branch, graduation_year, cgpa,
          skills JSON, password_hash, password_salt)

sessions (token PK, student_id, created_at)
```

### Amazon Comprehend

**APIs Used:**
- `detect_key_phrases(Text, LanguageCode="en")` — Extracts significant phrases
- `detect_entities(Text, LanguageCode="en")` — Detects named entities (ORGANIZATION, TITLE, etc.)

**Role:** Provides NLP signals that enhance the application-level skill matching and ATS scoring. Comprehend does NOT independently calculate the ATS score. The score is computed by the Lambda function using Comprehend outputs as inputs.

---

## Data Flow Summary

### Authentication Flow
```
Browser → sessionStorage token → api.js (Bearer header) → API Gateway → Lambda
  → sessions table lookup → student profile retrieval → response
```

### Resume Analysis Flow
```
Browser file upload → pdfjs/mammoth extraction → POST /resume/analyze
  → Lambda → Comprehend (4 API calls) → skill matching → ATS calculation
  → response → AppContext → sessionStorage
```

### Preparation Flow
```
AppContext (latestAnalysis) → GET /preparation?driveId&missingSkills&atsScore
  → Lambda → RDS (drive + company + application + student)
  → preparation_engine.py → question_bank.py → prioritized response
```

---

## Security Architecture

| Layer | Implementation |
|-------|---------------|
| Transport | HTTPS via API Gateway |
| Authentication | PBKDF2-SHA256 password hashing, session tokens in RDS |
| Authorization | Bearer token in Authorization header, validated against sessions table |
| CORS | Wildcard origin (development configuration) |
| Input Validation | Server-side validation of all request parameters |
| Credential Storage | Lambda environment variables for DB credentials (not in source code) |
| Error Handling | Sanitized error responses (no stack traces or credentials exposed) |
