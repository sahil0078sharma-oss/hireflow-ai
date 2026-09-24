# HireFlow AI — Phase 3: AI/ML Resume Analyzer Architecture & Technical Documentation

## 1. Problem Statement
Campus placement drives evaluate hundreds of resumes against stringent technical job requirements. Traditional keyword search tools rely on brittle substring matching that frequently misses variations, cannot distinguish context, and fails to identify semantic domain entities.

HireFlow AI replaces static substring matching with a cloud-native, Machine Learning-backed Natural Language Processing (NLP) pipeline powered by **Amazon Comprehend**.

---

## 2. Target Architecture

```
[ React + Vite Frontend (Browser) ]
                 │
                 ▼ HTTPS POST /resume/analyze
[ Amazon API Gateway (HTTP API: hireflow-api, ID: d9nizxaxf9) ]
                 │
                 ▼ Lambda Proxy Integration (Payload v2.0)
[ AWS Lambda: hireflow-resume-analyzer (Python 3.12, ap-south-1) ]
                 │  (No VPC attachment — zero NAT Gateway or VPC Endpoint cost)
                 ├──► Amazon Comprehend: detect_key_phrases(resumeText)
                 ├──► Amazon Comprehend: detect_key_phrases(jobDescription)
                 ├──► Amazon Comprehend: detect_entities(resumeText)
                 └──► Amazon Comprehend: detect_entities(jobDescription)
                 │
                 ▼ Application Scoring & Gap Engine
[ Multi-Factor ATS Score + Dynamic Recommendations + Key Phrases JSON ]
                 │
                 ▼
[ React ResumeAnalyzer & AnalysisResult Component UI ]
```

### Key Architectural Decisions
- **No VPC for Resume Analyzer Lambda:** Unlike database-connected Lambdas, `hireflow-resume-analyzer` only communicates with public AWS endpoints (API Gateway and Amazon Comprehend). Placing it outside a VPC completely eliminates the need for expensive NAT Gateways (~$32/month) or PrivateLink endpoints while providing sub-250ms execution times.
- **Dedicated Least-Privilege IAM Role (`HireFlowComprehendLambdaRole`):** Confined strictly to `comprehend:DetectKeyPhrases` and `comprehend:DetectEntities`, adhering to the AWS principle of least privilege.

---

## 3. Why Amazon Comprehend?
1. **Authentic Pre-Trained Machine Learning Models:** Amazon Comprehend utilizes deep learning models trained on vast text corpora for linguistic syntax, entity detection, and noun phrase extraction.
2. **Predictable Sub-Second Latency:** Average invocation latency is 150–250ms, ideal for synchronous interactive web applications.
3. **Zero Idle Compute Cost:** 100% serverless pay-per-request model with 50,000 units/month free under the AWS Free Tier.
4. **Reliability for Academic Demonstrations:** Unlike Amazon Bedrock (which requires manual model access approval workflows) or Amazon SageMaker (which requires 24/7 dedicated hosting instances at ~$35–$100/mo), Comprehend works immediately out of the box with zero delay.

---

## 4. What Amazon Comprehend Does vs. What HireFlow Does

> [!IMPORTANT]
> **Technical Transparency:**
> **Amazon Comprehend does NOT calculate ATS scores or evaluate job suitability.**
> Amazon Comprehend performs raw Natural Language Processing (NLP) extraction. HireFlow AI's backend application logic processes those extracted linguistic features to compute ATS compatibility and generate actionable recommendations.

### Division of Responsibility

| Capability | Provided By | Method / Details |
|---|---|---|
| **Linguistic Noun Phrase Extraction** | **Amazon Comprehend** | `detect_key_phrases(Text=...)` identifies candidate competencies, tooling, and domain phrases. |
| **Named Entity Recognition (NER)** | **Amazon Comprehend** | `detect_entities(Text=...)` classifies titles, organizations, and commercial technologies. |
| **Confidence Filtering** | **HireFlow AI Lambda** | Discards NLP extractions with confidence score `< 0.70`. |
| **Phrase Normalization** | **HireFlow AI Lambda** | Cleans punctuation, handles case folding, and resolves aliases (e.g. `react.js` → `React`). |
| **Controlled Skill Vocabulary** | **HireFlow AI Lambda** | Matches extracted phrases against a curated taxonomy of 80+ engineering competencies. |
| **Multi-Factor ATS Compatibility** | **HireFlow AI Lambda** | Mathematical weighted formula combining skills (60%), key phrase relevance (25%), and entity relevance (15%). |
| **Dynamic Gap Recommendations** | **HireFlow AI Lambda** | Identifies specific missing skills and produces customized resume enhancement recommendations. |

---

## 5. ATS Scoring Methodology

The ATS compatibility score is a composite metric clamped between `5` and `100`:

$$\text{ATS Score} = 0.60 \times S_{\text{skills}} + 0.25 \times S_{\text{phrases}} + 0.15 \times S_{\text{entities}}$$

### 1. Skill Match Score ($S_{\text{skills}}$ — 60% Weight)
Measures the percentage of required technical competencies in the job description that are present in the candidate's resume:
$$S_{\text{skills}} = \frac{|\text{Matched Skills}|}{|\text{Total JD Skills}|} \times 100$$

### 2. NLP Key Phrase Relevance ($S_{\text{phrases}}$ — 25% Weight)
Measures semantic vocabulary overlap between key noun phrases identified by Amazon Comprehend in the resume vs. the job description:
$$S_{\text{phrases}} = \frac{|\text{Resume Phrases} \cap \text{JD Phrases}|}{|\text{JD Phrases}|} \times 100$$

### 3. Entity Relevance ($S_{\text{entities}}$ — 15% Weight)
Measures domain entity alignment (titles, platforms, commercial technologies) identified by Comprehend's entity recognizer.

---

## 6. API Contract

### Endpoint: `POST /resume/analyze`

#### Request Body
```json
{
  "resumeText": "Python developer with experience in AWS Lambda, S3, RDS, MySQL, React, Git, and machine learning projects.",
  "jobDescription": "Looking for a software engineer with Python, AWS Lambda, S3, SQL, Docker, Git, and machine learning experience."
}
```

#### Response Body (`200 OK`)
```json
{
  "atsScore": 62,
  "matchedSkills": ["Python", "AWS", "AWS Lambda", "Amazon S3", "Git", "Machine Learning"],
  "missingSkills": ["SQL", "Docker"],
  "recommendations": [
    "Add SQL, Docker to your skills or project descriptions if you have practical experience.",
    "Cloud and container skills (Docker) are required. Showcase small cloud deployment or containerization projects.",
    "Database expertise with SQL is requested. Ensure your project experience details data schema design and querying.",
    "Align your resume bullet points with the core role responsibilities to maximize ATS keyword relevance."
  ],
  "resumeKeyPhrases": [
    "Python developer",
    "experience",
    "AWS Lambda, S3, RDS, MySQL, React, Git, and machine",
    "projects"
  ],
  "jobKeyPhrases": [
    "a software engineer",
    "Python,",
    "AWS Lambda, S3, SQL, Docker, Git, and machine learning"
  ],
  "entities": [
    {"text": "Python", "type": "TITLE", "score": 0.862},
    {"text": "AWS", "type": "ORGANIZATION", "score": 0.785},
    {"text": "Lambda", "type": "TITLE", "score": 0.821}
  ],
  "breakdown": {
    "skillMatchScore": 75.0,
    "phraseRelevanceScore": 33.3,
    "entityRelevanceScore": 60.0
  },
  "nlpMetadata": {
    "engine": "Amazon Comprehend",
    "region": "ap-south-1",
    "extractedPhrasesCount": 4,
    "extractedEntitiesCount": 5
  }
}
```

---

## 7. Security Architecture
- **No Embedded Credentials:** Zero AWS access keys, secret keys, or IAM credentials exist in frontend code.
- **Least-Privilege Role:** `HireFlowComprehendLambdaRole` is granted permissions strictly for `comprehend:DetectKeyPhrases` and `comprehend:DetectEntities`.
- **Input Sanitization & Character Limiting:** Amazon Comprehend enforces a 5,000 byte request limit. The Lambda safely truncates oversized payloads to 4,500 characters, preventing runtime errors or denial-of-service attempts.

---

## 8. Verification & Test Evidence
All automated integration tests passed:
1. **Valid Resume + JD:** Returned HTTP 200 with 62% ATS score, 6 matched skills, 2 missing skills, and dynamic recommendations.
2. **Missing Resume / Missing JD:** Returned HTTP 400 with descriptive error messages.
3. **Oversized Input (>9,000 characters):** Truncated and processed safely with HTTP 200.
4. **CloudWatch Metrics:** Invocations logged under `/aws/lambda/hireflow-resume-analyzer` with an average execution duration of ~240ms.
5. **Regression Verification:** Existing `GET /applications` and `POST /applications` placement workflows remain completely operational.

---

## 9. Known Limitations & Future Improvements
- **Document Formats:** The current implementation processes plain text pasted by the student. Future iterations can integrate Amazon Textract or Amazon S3 presigned URLs to directly extract text from PDF/DOCX files.
- **Language Scope:** Comprehend is invoked with `LanguageCode="en"` for English language resumes.
- **Custom Entity Recognition:** Future phases can train an Amazon Comprehend Custom Entity Recognizer specifically on college tech curricula.
