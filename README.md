# HireFlow AI

**AI-Powered Campus Placement Management and Preparation Platform**

> Built with React, AWS Lambda, Amazon API Gateway, Amazon RDS MySQL, and Amazon Comprehend

---

## Problem Statement

Campus placement is a high-stakes process for engineering students. Students often struggle with:

- **Tracking multiple placement drives** across companies with different deadlines, requirements, and stages
- **Understanding their resume-to-job alignment** without objective, data-driven feedback
- **Preparing for placement interviews** without personalized guidance based on their actual skill gaps
- **Managing applications** and knowing where they stand in each pipeline

HireFlow AI addresses these challenges by providing a unified student-side platform that combines placement drive tracking, NLP-powered resume analysis, and adaptive preparation — all connected to a live AWS serverless backend.

---

## Features

### Student Authentication
- Secure login with PBKDF2-SHA256 password hashing (100,000 iterations)
- Session token stored in RDS MySQL `sessions` table
- Bearer token authorization on all protected API calls
- Session restoration on page reload via `GET /auth/me`
- Protected routes with automatic redirect to login

### Student Dashboard
- Personalized welcome with authenticated student profile
- Real-time statistics: total applications, active applications, selections, ATS score
- Upcoming placement drives sorted by deadline
- Recent application activity feed
- Quick navigation actions

### Placement Drives
- Browse all active drives fetched from RDS MySQL
- Search by company name, role, or required skills
- Filter by company, minimum package, and sort order
- View detailed drive information (eligibility, rounds, description)
- Add new placement drives with automatic company creation
- Apply to drives with server-side duplicate prevention

### Application Pipeline
- Track application status through 6 stages:
  Application → Resume Screening → Aptitude → Technical → HR → Final Result
- Visual pipeline indicator for each application
- Status tracking: Pending Review, In Progress, Selected, Rejected

### Resume Analyzer (Amazon Comprehend NLP)
- Upload resume in PDF, DOCX, or TXT format (client-side extraction)
- Upload or paste job description
- Automatic company name and role detection from JD text
- Backend NLP analysis via Amazon Comprehend:
  - Key phrase extraction from both resume and job description
  - Named entity detection (organizations, titles, skills)
- Application-level skill matching with controlled vocabulary (80+ technical skills)
- Multi-factor ATS scoring:
  - 60% Skill Match Score
  - 25% Key Phrase Relevance Score
  - 15% Entity Relevance Score
- Matched skills, missing skills, and actionable recommendations

### Adaptive Placement Preparation
- Context-aware preparation engine powered by:
  - RDS placement drive data (company, role, required skills)
  - Live application stage tracking
  - Amazon Comprehend resume gap signals
- Curated question bank (50+ questions) across:
  - Technical (Python, SQL, AWS, DSA, React, Docker, etc.)
  - Aptitude (quantitative, logical reasoning)
  - HR and Behavioral (STAR method)
  - Company and Role (contextual questions)
- Question prioritization: resume gap skills first, then required skills, then core CS
- Readiness score with transparent deterministic formula
- Supports both College Drive mode and Custom JD mode
- Graceful offline fallback with explicit indicator

### Custom JD Flow
- Upload any job description (not just college drives)
- Auto-detect company name and role from JD text
- Full resume analysis against custom JD
- Seamless transition to custom preparation mode
- Context preservation across navigation via sessionStorage

---

## Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite 8 | Build tool and dev server |
| React Router DOM 7 | Client-side routing |
| pdfjs-dist | Client-side PDF text extraction |
| mammoth | Client-side DOCX text extraction |
| Vanilla CSS | Styling with CSS custom properties |

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.12 | Lambda runtime |
| PyMySQL | MySQL database driver |
| boto3 | AWS SDK for Python |

### AWS Services (Confirmed in Codebase)
| Service | Purpose |
|---------|---------|
| Amazon API Gateway | HTTP API routing to Lambda functions |
| AWS Lambda | Two serverless functions (main + resume analyzer) |
| Amazon RDS MySQL | Relational database (companies, students, drives, applications, sessions) |
| Amazon Comprehend | Managed NLP (key phrase and entity extraction) |
| AWS IAM | Lambda execution roles and Comprehend permissions |
| Amazon CloudWatch | Application logging |

### Primary AWS Region
`ap-south-1` (Mumbai)

---

## System Architecture

```
React/Vite SPA (Browser)
    |
    | HTTPS + Bearer Token
    v
Amazon API Gateway (HTTP API)
    |
    |-- /auth/*, /drives, /applications, /preparation
    |       |
    |       v
    |   hireflow-main Lambda (Python 3.12)
    |       |
    |       v
    |   Amazon RDS MySQL (hireflow database)
    |
    |-- /resume/analyze
            |
            v
        hireflow-resume-analyzer Lambda (Python 3.12)
            |
            v
        Amazon Comprehend (detect_key_phrases, detect_entities)
```

---

## Project Structure

```
hire-flow/
├── index.html                      # HTML entry point with SEO meta tags
├── package.json                    # Frontend dependencies and scripts
├── vite.config.js                  # Vite configuration
├── schema.sql                      # RDS MySQL database schema
├── seed.sql                        # Database seed data
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules
│
├── src/                            # Frontend source code
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Router and provider setup
│   ├── config.js                   # API base URL configuration
│   │
│   ├── context/
│   │   ├── AuthContext.jsx         # Authentication state management
│   │   └── AppContext.jsx          # Application state (analysis, applications)
│   │
│   ├── pages/
│   │   ├── Login.jsx               # Login page
│   │   ├── Dashboard.jsx           # Student dashboard
│   │   ├── PlacementDrives.jsx     # Browse and manage drives
│   │   ├── MyApplications.jsx      # Application pipeline tracker
│   │   ├── ResumeAnalyzer.jsx      # Resume analysis page
│   │   └── AIPreparation.jsx       # Adaptive preparation page
│   │
│   ├── components/
│   │   ├── auth/ProtectedRoute.jsx
│   │   ├── layout/ (AppShell, Sidebar, Header)
│   │   ├── ui/ (Button, Modal, StatCard, EmptyState, SkillBadge)
│   │   ├── drives/ (DriveCard, DriveDetail, DriveFilters, AddDriveModal)
│   │   ├── applications/ (ApplicationCard, StatusPipeline)
│   │   ├── resume/ (ResumeAnalyzer, ResumeUpload, AnalysisResult)
│   │   └── ai/ (AIPrep, QuestionCard)
│   │
│   ├── services/
│   │   ├── authService.js          # Authentication API calls
│   │   ├── driveService.js         # Placement drives API
│   │   ├── applicationService.js   # Applications API
│   │   ├── resumeAnalyzer.js       # Resume analysis API
│   │   └── aiPrep.js              # Preparation API with offline fallback
│   │
│   ├── lib/api.js                  # HTTP client with Bearer auth
│   ├── hooks/ (useDrives, useApplications)
│   ├── utils/ (documentExtractor, jdExtractor, formatters, constants)
│   ├── data/ (aiResponses, drives, companies, applications, students)
│   └── styles/ (global.css, variables.css)
│
├── backend/                        # Main Lambda function
│   ├── lambda_function.py          # Auth, drives, applications, preparation handler
│   ├── preparation_engine.py       # Adaptive preparation plan generator
│   ├── question_bank.py            # Curated question bank (50+ questions)
│   └── requirements.txt            # PyMySQL dependency
│
├── backend_resume/                 # Resume analyzer Lambda function
│   ├── lambda_function.py          # Amazon Comprehend integration
│   └── test_suite.py               # API integration tests
│
├── test_docs/                      # Test scripts and sample documents
│   ├── test_auth_api.py
│   ├── test_drives_live.py
│   ├── test_phase3d.py
│   ├── test_phase4b_full.py
│   ├── test_phase4c.py
│   ├── sample_resume.pdf/docx/txt
│   └── sample_jd.pdf/docx/txt
│
└── docs/                           # Development phase documentation
    ├── phase3-ai-resume-analyzer.md
    └── phase4-adaptive-preparation.md
```

---

## Installation and Local Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.12 (for backend reference/testing)
- AWS account with API Gateway, Lambda, RDS MySQL, and Comprehend configured

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/hireflow-ai.git
cd hireflow-ai

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your API Gateway URL

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API Gateway invoke URL | `https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com` |

### Backend Deployment

The backend consists of two AWS Lambda functions deployed via the AWS Console or CLI:

1. **hireflow-main**: `backend/lambda_function.py` + `preparation_engine.py` + `question_bank.py`
   - Runtime: Python 3.12
   - Dependencies: `PyMySQL` (packaged in deployment zip)
   - Environment variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
   - VPC: Must be in the same VPC as RDS

2. **hireflow-resume-analyzer**: `backend_resume/lambda_function.py`
   - Runtime: Python 3.12
   - Dependencies: `boto3` (included in Lambda runtime)
   - IAM Role: Requires `comprehend:DetectKeyPhrases` and `comprehend:DetectEntities` permissions
   - No VPC required

### Database Setup

```sql
-- Execute schema.sql to create tables
source schema.sql;

-- Execute seed.sql to populate demo data
source seed.sql;
```

---

## Testing

### Manual API Tests
```bash
# Run resume analyzer test suite
python backend_resume/test_suite.py

# Run authentication tests
python test_docs/test_auth_api.py

# Run placement drives tests
python test_docs/test_drives_live.py
```

### Frontend Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

---

## Current Limitations

- **Student-side only** — no college/admin portal for managing drives
- **No student registration** — only pre-seeded accounts
- **No password reset** functionality
- **No session expiration** — tokens persist until manual logout
- **Client-side file extraction only** — no S3 upload for resume persistence
- **Custom JD analysis** stored in sessionStorage only (not persisted in RDS)
- **Rule-based skill matching** — not semantic similarity
- **Company/role detection** from JD uses regex heuristics, accuracy varies

---

## Future Scope

- College/admin portal with role-based access control
- Student self-registration and password management
- Resume upload to Amazon S3 with retrieval
- Semantic similarity using sentence embeddings for improved matching
- Fine-tuned NER model for skill extraction
- Persistent custom JD analysis history in RDS
- Expanded question bank with more technologies and industries
- Automated CI/CD testing pipeline
- Email/push notifications for drive deadlines

---

## Author

**Sahil Sharma**
- B.Tech Computer Science and Engineering
- Arya College of Engineering, Jaipur
- Training Domain: AWS Machine Learning Engineer

---

## License

This project is developed as part of an academic training program. All rights reserved.
