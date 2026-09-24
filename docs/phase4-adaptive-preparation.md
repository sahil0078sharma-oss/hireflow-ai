# HireFlow AI — Phase 4: Adaptive Placement Preparation Engine

## 1. Problem Statement
Campus placement preparation is traditionally static and generic. Students preparing for different companies, job roles, and interview rounds are typically presented with fixed, one-size-fits-all question lists regardless of:
- The actual technical requirements of the placement drive.
- The student's current stage in the recruitment pipeline (e.g., Aptitude Assessment vs. Technical Round vs. HR Round).
- The student's specific resume weaknesses and missing technical skills.

HireFlow AI solves this by introducing a context-aware **Adaptive Placement Preparation & Recommendation Engine** that dynamically personalizes preparation curricula by joining live relational recruitment data from Amazon RDS with NLP skill-gap insights from Amazon Comprehend.

---

## 2. Architecture

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                              REACT FRONTEND                                │
│   AIPrep.jsx  ◄──►  AppContext (applications, missingSkills from Comprehend)│
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ HTTP GET /preparation?driveId=...
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                      AMAZON API GATEWAY (HTTP API v2)                      │
│                                hireflow-api                                │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ AWS_PROXY Integration
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           AWS LAMBDA (Python 3.12)                         │
│                    hireflow-applications-handler                           │
│  - VPC Hyperlane ENI                                                       │
│  - preparation_engine.py                                                   │
│  - question_bank.py                                                        │
└──────────────────┬─────────────────────────────────────┬───────────────────┘
                   │                                     │
                   │ SQL Queries                         │ Ingests Skill Gaps
                   ▼                                     ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────┐
│         AMAZON RDS (MySQL 8.0)       │  │   AMAZON COMPREHEND (Phase 3)    │
│  - drives (role, skills, rounds)     │  │  NLP Resume Skill-Gap Signals    │
│  - applications (live stage, status) │  │  (missingSkills from ATS analysis│
│  - students (profile skills, CGPA)   │  │   run on candidate's resume)     │
│  - companies (culture, background)   │  └──────────────────────────────────┘
└──────────────────────────────────────┘
```

### Distinction Between AI/ML and Application Intelligence
- **Genuine AI/ML/NLP Component**: **Amazon Comprehend** (Phase 3). Comprehend inspects unstructured resume and job description text to perform entity detection and key phrase extraction, calculating the ATS score and isolating specific missing skills (`missingSkills`).
- **Application Intelligence Component**: **Adaptive Preparation & Recommendation Engine**. This is a deterministic, rule-based recommendation and ranking engine running inside AWS Lambda. It evaluates multiple relational signals and Comprehend NLP signals to filter, rank, and score preparation materials. It is **not** an LLM or trained ML model.

---

## 3. Data Flow

1. **User Interaction**: The student selects a target placement drive and interview category (`Technical`, `Aptitude`, `HR`, `Company & Role`).
2. **Context Assembly**: The frontend retrieves the current student's latest `missingSkills` (derived from the Amazon Comprehend resume analysis).
3. **API Request**: The browser issues a `GET /preparation?driveId=drive-xxx&category=xxx&missingSkills=Docker,SQL` request to Amazon API Gateway.
4. **Lambda Processing**:
   - `hireflow-applications-handler` connects to Amazon RDS MySQL.
   - Queries `drives` and `companies` for job role, required skills, package, and rounds.
   - Queries `applications` for the student's active application stage and status.
   - Queries `students` for the candidate's registered profile skills.
5. **Personalization & Filtering**:
   - Evaluates required drive skills against `missingSkills` and student skills.
   - Computes a transparent **Preparation Readiness Score** (0–100).
   - Dynamically selects round-focused topics and priority questions from `question_bank.py`.
6. **Response Delivery**: JSON response returns to React, which updates the UI in under 80ms. If the network or API fails, React gracefully switches to a curated offline fallback with an explicit badge.

---

## 4. Personalization Inputs

The preparation engine accepts and evaluates five primary input dimensions:
1. **Target Placement Drive (`drives.id`)**: Company, role title, required competencies, eligibility criteria, and CTC package.
2. **Placement Rounds (`drives.rounds`)**: The official sequence of selection rounds (e.g., Aptitude Test → Technical Interview → HR).
3. **Application Stage (`applications.current_stage`)**: The candidate's real-time position in the company's recruitment pipeline.
4. **Resume Skill Gaps (`missingSkills`)**: Specific technologies required by the drive that were absent from the candidate's resume during the Amazon Comprehend NLP analysis.
5. **Interview Category**: Technical, Aptitude, HR, or Company & Role.

---

## 5. Stage-Based Recommendation Logic

The engine adapts round focus and recommendations based on the live application stage:

| Application Stage | Focus Topics | Tactical Recommendation |
| :--- | :--- | :--- |
| **Application / Screening** | Resume Alignment, Company Background, Aptitude Warm-up, Core Programming | Emphasize drive keywords on resume and verify eligibility criteria. |
| **Aptitude Assessment** | Quantitative Aptitude, Logical Reasoning, Time/Work Shortcuts, Number Series | Practice timed sections and unit conversions; focus on speed and accuracy. |
| **Technical Round** | Data Structures & Algorithms, System Architecture, Database Optimization (SQL/ACID), Role Tech Stack | Practice live whiteboard coding and prepare two in-depth project trade-off discussions. |
| **HR & Behavioral** | Behavioral Competencies, STAR Method Framing, Company Culture, Situational Judgment | Frame answers around Situation, Task, Action, Result; demonstrate cultural alignment. |
| **Final / Offer** | Executive Alignment, Role Responsibilities, Growth Expectations, Offer Discussion | Review compensation structure, team dynamics, and long-term career trajectory. |

---

## 6. Skill-Gap Integration

When a candidate analyzes their resume using HireFlow's Amazon Comprehend Resume Analyzer, identified missing skills are stored in application context and passed to the preparation engine.

### Priority Tiering
- **`HIGH` Priority**: A skill required by the placement drive that was explicitly flagged as missing in the resume analysis (e.g., `Docker`, `SQL`).
- **`MEDIUM` Priority**: A skill required by the placement drive that is not listed in the candidate's student profile skills.
- **`MATCHED` Priority**: A required skill that is already verified in the student's profile.

### Algorithmic Question Prioritization
In the `Technical` category, questions tagged with `HIGH` priority skills are sorted to the very top of the question stack. For example, if `Docker` and `SQL` are identified as resume gaps, the preparation engine immediately serves containerization and database normalization questions before general CS fundamentals.

---

## 7. Readiness Scoring Methodology

The **Preparation Readiness Score** (0–100) is calculated deterministically:

$$\text{Readiness} = \text{Clamp}_{35}^{95}\Big(\text{Base}(50) + \text{Skill Bonus} + \text{Stage Bonus} + \text{Gap Adjustment}\Big)$$

- **Base Score**: `50`
- **Skill Match Ratio**:
  - $\ge 75\%$ required skills matched: `+20`
  - $\ge 50\%$ required skills matched: `+12`
  - $< 50\%$ required skills matched: `+5`
- **Application Progress**:
  - Has applied to drive: `+5`
  - Reached advanced rounds (`technical`, `hr`, `final`): `+10`
  - Reached early rounds (`resume_screening`, `aptitude`): `+5`
- **Resume Skill Gaps**:
  - Zero missing skills in resume analysis: `+10`
  - Exactly 1 missing skill: `+5`
  - $\ge 2$ missing skills: `-10`

---

## 8. API Contract

### Endpoint
`GET /preparation`

### Query Parameters
- `driveId` (string, required): e.g., `drive-tcs-01`
- `category` (string, optional, default: `technical`): `technical`, `aptitude`, `hr`, `company-role`
- `missingSkills` (string, optional): comma-separated list of skills, e.g., `Docker,SQL`

### Response Payload (200 OK)
```json
{
  "success": true,
  "company": "TCS",
  "companyId": "company-tcs",
  "driveId": "drive-tcs-01",
  "role": "Systems Engineer",
  "applicationStage": "Technical Round",
  "applicationStageKey": "technical",
  "applicationStatus": "In Progress",
  "hasApplied": true,
  "readinessScore": 77,
  "prioritySkills": [
    {
      "skill": "SQL",
      "priority": "HIGH",
      "reason": "Required by this placement drive but identified as a gap in your analyzed resume."
    },
    {
      "skill": "Java",
      "priority": "MEDIUM",
      "reason": "Required by this placement drive; not listed in your profile skills."
    },
    {
      "skill": "Git",
      "priority": "MATCHED",
      "reason": "Confirmed match in your student profile / resume skills."
    }
  ],
  "roundFocus": [
    "Data Structures & Algorithms (Sorting, Trees)",
    "Object-Oriented Programming (OOP)",
    "DBMS & Normalization",
    "RESTful APIs & Web Architecture"
  ],
  "questions": [
    {
      "question": "Explain database normalization up to BCNF and when denormalization is preferred in production.",
      "answer": "Normalization organizes relational schemas to eliminate anomalies...",
      "tip": "State clearly: 'Normalize for transactional write consistency; denormalize selectively for fast analytical reads.'",
      "topic": "SQL",
      "difficulty": "Intermediate"
    }
  ],
  "recommendations": [
    "Focus immediate study on identified resume gaps: SQL.",
    "Be prepared to write code from scratch for key role skills: Java, SQL, Git.",
    "Prepare two concrete project deep-dives detailing system architecture and performance trade-offs."
  ],
  "meta": {
    "totalQuestions": 6,
    "selectedCategory": "technical",
    "requiredSkills": ["Java", "SQL", "Git", "Linux", "REST API"],
    "rounds": ["Aptitude Test", "Technical Interview", "HR Interview"],
    "package": "3.36 LPA",
    "location": "Pan India",
    "source": "HireFlow Adaptive Preparation Engine (RDS + AWS Comprehend Gap Signals)"
  }
}
```

---

## 9. Resume Analysis Context Binding

### Why `driveId` is Stored
When an ATS resume analysis is executed, skill gaps are not absolute; they are relative to the specific job description analyzed. Storing `driveId`, `company`, and `role` alongside the analysis establishes a deterministic association between candidate deficits and a specific placement opportunity.

### Preventing Cross-Drive Contamination
If a candidate analyzes their resume for an external company (e.g., *Paarsiv Technologies*) requiring `Angular` and `C#`, those missing skills must never contaminate a preparation plan for an enterprise Java/SQL drive (e.g., *Infosys* or *TCS*).
- **Frontend Validation**: The AI Preparation UI checks whether `latestAnalysis.driveId === selectedDriveId`. If they do not match, the candidate's missing skills are withheld, and an explicit advisory is displayed:
  > ⚠ *Resume analysis belongs to another placement drive: Your latest analysis was performed for Paarsiv Technologies, while this preparation plan is for Infosys.*
- **Backend Verification**: The Lambda endpoint (`GET /preparation`) verifies that `analysisDriveId === driveId`. If mismatched, incoming missing skills are rejected from the priority scoring algorithm.

### Ephemeral Session Persistence
To balance user experience across page refreshes while preserving data privacy:
- The context binding object (`driveId`, `company`, `role`, `atsScore`, `matchedSkills`, `missingSkills`, `timestamp`) is persisted to **`sessionStorage`** (`hireflow_latest_analysis` and `hireflow_analysis_history`).
- **Raw resume text and job description documents are NEVER stored in browser storage**, ensuring candidate documents exist solely in ephemeral memory during live extraction.

---

## 10. Security & Privacy
- **Zero Credential Exposure**: RDS MySQL credentials, VPC configurations, and database credentials remain securely confined within AWS Lambda environment variables. The browser only communicates with API Gateway over HTTPS.
- **Trusted Student Identity**: The Lambda uses the configured demo student identity (`student-001`) from its server environment, preventing client-side spoofing of student application records.
- **CORS Restricted Headers**: Handled through standardized API Gateway CORS headers and Lambda preflight responses.

---

## 10. Known Limitations
- **Question Matrix Size**: The question bank currently contains a curated set of 25+ high-yield interview questions across 4 categories and 14 technical topics.
- **Fixed Demo Student**: Uses `student-001` for student record correlation in the MVP phase. In a future production iteration, identity will be validated via Amazon Cognito JWT tokens.
- **Stateless Recommendations**: Historical preparation completion metrics are not yet persisted to a separate progress tracking table.

---

## 11. Future Improvements
1. **Cognito User Pool Integration**: Replace static `DEMO_STUDENT_ID` with dynamic claims extracted from JWT authorizers.
2. **Student Performance Tracking**: Allow students to mark questions as "Mastered" or "Needs Review", storing progress in an RDS `student_prep_progress` table.
3. **Direct Coding Sandbox**: Embed a client-side or Lambda-backed code execution runner for real-time coding question evaluation.
