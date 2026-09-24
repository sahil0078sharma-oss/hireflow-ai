# Changelog — HireFlow AI

All notable changes to this project are documented in this file.
This changelog is organized by development phase rather than exact dates, as precise commit timestamps are not available (Git repository is not yet initialized).

---

## Phase 4 — Adaptive Placement Preparation

### Added
- **Adaptive Preparation Engine** (`backend/preparation_engine.py`) generating context-aware preparation plans using RDS drive data, application stage, and Amazon Comprehend resume gap signals
- **Curated Question Bank** (`backend/question_bank.py`) with 50+ questions across Technical (Python, SQL, AWS, DSA, React, Docker), Aptitude, HR, and Company-Role categories
- **Custom JD Preparation Mode** supporting student-uploaded job descriptions with company/role context preservation
- **Question Prioritization** — technical questions sorted by resume gap skills first, then required drive skills, then core CS
- **Readiness Score Calculation** with transparent deterministic formula: base + skill match bonus + stage bonus + gap adjustment
- **Round Focus Generation** — dynamic study focus areas based on current application stage and role type
- **Priority Skills Classification** — skills classified as HIGH (resume gap), MEDIUM (not in profile), MATCHED (confirmed)
- **Context-Binding Protection** — mismatched analysisDriveId prevents foreign skill gaps from being applied to unrelated drives
- **Offline Fallback** — frontend generates fallback preparation from local data files when API is unreachable, explicitly marked `isOffline: true`
- **AI Preparation Page** (`src/pages/AIPreparation.jsx`) and component (`src/components/ai/AIPrep.jsx`)
- **Question Card Component** (`src/components/ai/QuestionCard.jsx`) with expandable answer/tip sections
- **Custom JD flow integration** — analysis results flow seamlessly into custom preparation mode

### Changed
- **AppContext** expanded to store analysis history per drive, support custom mode context, and persist to sessionStorage
- **Frontend services** (`src/services/aiPrep.js`) updated with dual-mode preparation API calls and fallback generators

---

## Phase 3 — AI Resume Analyzer (Amazon Comprehend)

### Added
- **Resume Analyzer Lambda** (`backend_resume/lambda_function.py`) with Amazon Comprehend NLP integration
- **Amazon Comprehend Integration** — `detect_key_phrases()` and `detect_entities()` on both resume and JD text
- **Controlled Vocabulary** — 80+ technical skill entries with canonical display names and alias mapping
- **Multi-Factor ATS Scoring** — weighted composite: 60% skill match + 25% key phrase relevance + 15% entity relevance
- **Dynamic Recommendations** — actionable suggestions categorized by cloud, ML, and database skill gaps
- **Client-Side Document Extraction** (`src/utils/documentExtractor.js`) — PDF (pdfjs-dist), DOCX (mammoth), TXT
- **JD Metadata Extractor** (`src/utils/jdExtractor.js`) — rule-based company name and role detection from job description text
- **Resume Upload Component** (`src/components/resume/ResumeUpload.jsx`) with drag-and-drop and file type validation
- **Analysis Results Component** (`src/components/resume/AnalysisResult.jsx`) displaying ATS score, skill breakdown, entities, and recommendations
- **Resume Analyzer Page** (`src/pages/ResumeAnalyzer.jsx`) orchestrating the complete analysis workflow
- **Test Suite** (`backend_resume/test_suite.py`) with 5+ test cases covering valid input, missing fields, oversized input, and regression checks
- **Sample test documents** in `test_docs/` (PDF, DOCX, TXT formats for both resume and JD)

---

## Phase 2 — AWS Backend Integration

### Added
- **Main Lambda Function** (`backend/lambda_function.py`) handling all API routes
- **Amazon RDS MySQL** database with schema for companies, students, drives, applications, sessions
- **Authentication System** — PBKDF2-SHA256 password hashing, session token management, Bearer auth
- **Auth Endpoints** — `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- **Drives Endpoints** — `GET /drives` (with company JOIN), `POST /drives` (with company auto-creation)
- **Applications Endpoints** — `GET /applications`, `POST /applications` (with validation and duplicate prevention)
- **Companies Endpoint** — `GET /companies`
- **Database Migration** — `ensure_schema()` auto-adds missing columns and creates sessions table
- **Seed Data** (`seed.sql`) — 2 companies (Accenture, Infosys), 2 drives, demo student, demo applications
- **Frontend AuthContext** (`src/context/AuthContext.jsx`) with login, logout, session restoration
- **AuthService** (`src/services/authService.js`) with API integration and error handling
- **Protected Routes** (`src/components/auth/ProtectedRoute.jsx`) with loading state
- **Login Page** (`src/pages/Login.jsx`) with form validation and error display
- **HTTP Client** (`src/lib/api.js`) with Bearer token injection, error normalization, and JSON handling
- **Drive Service** (`src/services/driveService.js`) with in-memory cache and pub/sub
- **Application Service** (`src/services/applicationService.js`) with cache and pub/sub
- **Frontend updated** to use live API instead of static data

### Changed
- All frontend services migrated from static data to live AWS API calls
- Data files (`src/data/`) retained as offline fallback only

---

## Phase 1 — Frontend Foundation

### Added
- **Project initialization** with Vite + React 19
- **Application shell** with sidebar navigation and responsive layout
- **Dashboard page** with statistics cards and quick actions
- **Placement Drives page** with drive cards, filters, and detail modal
- **My Applications page** with application cards and status pipeline
- **Reusable UI components** — Button, Modal, StatCard, EmptyState, SkillBadge
- **Drive components** — DriveCard, DriveDetail, DriveFilters, AddDriveModal
- **Application components** — ApplicationCard, StatusPipeline
- **Layout components** — AppShell, Sidebar, Header
- **CSS design system** (`src/styles/variables.css`, `src/styles/global.css`) with custom properties
- **Routing** with React Router DOM (5 routes + catch-all)
- **Configuration** (`src/config.js`) with environment variable support
- **Constants** (`src/utils/constants.js`) with navigation links, stage labels, and status colors
- **Formatters** (`src/utils/formatters.js`) for dates, deadlines, initials, and package display
- **Static data files** for offline/demo operation
- **SEO meta tags** in index.html
- **Environment configuration** with `.env.example` template

---

## Known Limitations

- No college/admin portal — drive creation is available from student UI as a development convenience
- No student self-registration — only pre-seeded demo account
- No password reset or change functionality
- No session token expiration (persists until logout)
- No S3 integration for resume file storage
- Custom JD analysis stored in sessionStorage only, not persisted in RDS
- Rule-based skill matching (not semantic similarity/embeddings)
- Company/role detection from JD uses regex heuristics with variable accuracy
- No automated CI/CD testing pipeline
- CORS configured with wildcard origin (suitable for development, not production)

---

## Future Work

- College/admin portal with role-based access control
- Student self-registration with email verification
- Password reset functionality
- Session token expiration and refresh
- Amazon S3 integration for resume file persistence
- Semantic similarity using sentence embeddings
- Fine-tuned NER model for improved skill extraction
- Persistent custom JD analysis history in RDS
- Expanded question bank
- Automated testing pipeline (Vitest + pytest)
- Rate limiting on authentication endpoints
- Email/push notifications for drive deadlines
- Mobile-optimized responsive design
