import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analyzeResume } from '../../services/resumeAnalyzer.js';
import AnalysisResult from './AnalysisResult.jsx';
import ResumeUpload from './ResumeUpload.jsx';
import Button from '../ui/Button.jsx';
import { useAppContext } from '../../context/AppContext.jsx';
import { useDrives } from '../../hooks/useDrives.js';
import { extractCompanyAndRole } from '../../utils/jdExtractor.js';

const SAMPLE_RESUME = `Python developer with experience in AWS Lambda, Amazon S3, Amazon RDS, MySQL, React, Git, and machine learning projects.
B.Tech in Computer Science & Engineering with 8.4 CGPA.
Built full-stack applications using React, Python, and SQL databases. Experienced with GitHub CI/CD workflows and REST APIs.`;

const SAMPLE_JD = `We are looking for a Software Engineer with experience in:
- Python and backend development
- AWS cloud services (AWS Lambda, S3, RDS)
- SQL and MySQL databases
- Docker and containerization
- Git version control
- Machine learning fundamentals`;

const SAMPLE_CUSTOM_JD = `Company: AptCloud
Role: Cloud Engineer
Location: Remote / Hybrid
Package: 8 - 12 LPA

Job Description:
We are seeking a Cloud Engineer to build and deploy scalable cloud infrastructure on AWS.

Required Skills:
AWS Lambda, Amazon S3, Amazon RDS, Docker, Python, CI/CD, Terraform, SQL, Linux

Key Responsibilities:
- Design, deploy, and maintain serverless applications using AWS Lambda and API Gateway.
- Manage relational databases on Amazon RDS and object storage on Amazon S3.
- Build automated deployment pipelines and containerize services with Docker.`;

/**
 * Helper to format job description text from a placement drive loaded from RDS MySQL
 */
export function formatDriveJD(d, comp) {
  if (!d) return '';
  const compName = comp?.fullName || comp?.name || d.company?.fullName || d.company?.name || 'Company';
  const reqSkills = Array.isArray(d.requiredSkills) ? d.requiredSkills.join(', ') : '';
  const rounds = Array.isArray(d.rounds) ? d.rounds.join(' → ') : '';
  const pkg = d.package ? `Package: ${d.package}\n` : '';
  const loc = d.location ? `Location: ${d.location} (${d.mode || 'Full-time'})\n` : '';

  return `Role: ${d.role}
Company: ${compName}
${loc}${pkg}
Job Description:
${d.description || ''}

Required Skills:
${reqSkills}

Placement Rounds:
${rounds}`.trim();
}

/**
 * ResumeAnalyzer component — powered by Amazon Comprehend NLP Service
 * Supports PDF, DOCX, and TXT document upload with client-side text extraction.
 * Context-bound to selected RDS placement drive for downstream Adaptive Preparation.
 */
export default function ResumeAnalyzer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDriveId = searchParams.get('driveId');

  const { drives, companies, loading: drivesLoading } = useDrives();
  const { setAtsScore, setMissingSkills, setLatestAnalysis, latestAnalysis } = useAppContext();

  // Placement Drive Context — default from URL param, latestAnalysis, or empty until drives load
  const [selectedDriveId, setSelectedDriveId] = useState(() => {
    if (urlDriveId === 'custom' || (!urlDriveId && latestAnalysis?.source === 'student-uploaded-jd')) {
      return 'custom';
    }
    return urlDriveId || latestAnalysis?.driveId || '';
  });

  // Custom JD metadata extraction & override state (fresh per document)
  const [extractedMetadata, setExtractedMetadata] = useState(null);
  const [customCompany, setCustomCompany] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [showManualEdit, setShowManualEdit] = useState(false);

  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Resume document extraction state
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const [uploadedResumeInfo, setUploadedResumeInfo] = useState(null);

  // Job Description document extraction state
  const [isExtractingJd, setIsExtractingJd] = useState(false);
  const [uploadedJdInfo, setUploadedJdInfo] = useState(null);

  // Track which drive ID auto-populated jdText
  const activeJdDriveIdRef = useRef(null);

  const isCustomMode = selectedDriveId === 'custom' || selectedDriveId.startsWith('custom-');

  // Synchronize drive selection and auto-populate JD when drives are loaded or URL changes
  useEffect(() => {
    if (!drives || drives.length === 0) return;

    let targetId = selectedDriveId;
    if (urlDriveId === 'custom' || (!urlDriveId && latestAnalysis?.source === 'student-uploaded-jd')) {
      targetId = 'custom';
    } else if (urlDriveId && drives.some((d) => d.id === urlDriveId)) {
      targetId = urlDriveId;
    } else if (!targetId || (!drives.some((d) => d.id === targetId) && targetId !== 'custom')) {
      if (latestAnalysis?.driveId && drives.some((d) => d.id === latestAnalysis.driveId)) {
        targetId = latestAnalysis.driveId;
      } else {
        targetId = drives[0].id;
      }
    }

    if (targetId !== selectedDriveId) {
      setSelectedDriveId(targetId);
    }

    // Auto-populate Job Description from RDS drive if not manually filled or if drive changed
    if (targetId !== 'custom' && !targetId.startsWith('custom-')) {
      const driveObj = drives.find((d) => d.id === targetId);
      if (driveObj && (!jdText.trim() || activeJdDriveIdRef.current !== targetId)) {
        const comp = driveObj.company || companies.find((c) => c.id === driveObj.companyId);
        setJdText(formatDriveJD(driveObj, comp));
        activeJdDriveIdRef.current = targetId;
        setUploadedJdInfo(null);
      }
    }
  }, [drives, urlDriveId, companies, latestAnalysis]);

  // Selected drive & company lookup
  const selectedDrive = useMemo(() => {
    if (isCustomMode) return null;
    return drives.find((d) => d.id === selectedDriveId) || null;
  }, [drives, selectedDriveId, isCustomMode]);

  const selectedCompany = useMemo(() => {
    if (isCustomMode) return null;
    return selectedDrive?.company || companies.find((c) => c.id === selectedDrive?.companyId) || null;
  }, [selectedDrive, companies, isCustomMode]);

  function handleDriveChange(newDriveId) {
    setSelectedDriveId(newDriveId);

    // Invalidate previous analysis if switching targets
    if (result && result.driveId !== newDriveId) {
      setResult(null);
    }

    if (newDriveId === 'custom') {
      setSearchParams({ driveId: 'custom' });
      // If previous text was from an RDS drive, clear for student's custom input
      if (activeJdDriveIdRef.current && activeJdDriveIdRef.current.startsWith('drive-')) {
        setJdText('');
        setExtractedMetadata(null);
        setCustomCompany('');
        setCustomRole('');
      } else if (jdText.trim()) {
        const extracted = extractCompanyAndRole(jdText);
        setExtractedMetadata(extracted);
        setCustomCompany(extracted.companyName || '');
        setCustomRole(extracted.jobRole || '');
      }
      activeJdDriveIdRef.current = 'custom';
      setUploadedJdInfo(null);
    } else {
      setSearchParams({ driveId: newDriveId });
      const driveObj = drives.find((d) => d.id === newDriveId);
      if (driveObj) {
        const comp = driveObj.company || companies.find((c) => c.id === driveObj.companyId);
        setJdText(formatDriveJD(driveObj, comp));
        activeJdDriveIdRef.current = newDriveId;
        setUploadedJdInfo(null);
      }
    }
  }

  async function handleAnalyze() {
    setError('');

    if (!resumeText.trim()) {
      setError('Please upload a resume document or paste your resume text before analyzing.');
      return;
    }
    if (!jdText.trim()) {
      setError('Please upload a job description document or select a placement drive to load the JD.');
      return;
    }

    // Resolve effective company and role from automatic extraction or optional manual override
    const effectiveCompany =
      customCompany.trim() ||
      extractedMetadata?.companyName ||
      (isCustomMode ? 'Target Organization' : (selectedCompany?.name || 'Company'));

    const effectiveRole =
      customRole.trim() ||
      extractedMetadata?.jobRole ||
      (isCustomMode ? 'Software Engineer' : (selectedDrive?.role || 'Role'));

    setLoading(true);
    try {
      const analysisResult = await analyzeResume(resumeText, jdText);

      const matched = analysisResult.matchedSkills || [];
      const missing = analysisResult.missingSkills || [];
      const required = Array.from(new Set([...matched, ...missing]));

      const boundAnalysis = isCustomMode
        ? {
            mode: 'custom',
            source: 'student-uploaded-jd',
            driveId: null,
            company: effectiveCompany,
            role: effectiveRole,
            companyConfidence: extractedMetadata?.companyConfidence || (customCompany.trim() ? 'manual' : 'none'),
            jobRoleConfidence: extractedMetadata?.jobRoleConfidence || (customRole.trim() ? 'manual' : 'none'),
            jobDescriptionSource: uploadedJdInfo?.fileName
              ? `File: ${uploadedJdInfo.fileName}`
              : 'Student-Uploaded JD',
            atsScore: analysisResult.atsScore,
            matchedSkills: matched,
            missingSkills: missing,
            requiredSkills: required,
            resumeKeyPhrases: analysisResult.resumeKeyPhrases || [],
            jobKeyPhrases: analysisResult.jobKeyPhrases || [],
            timestamp: new Date().toISOString(),
          }
        : {
            mode: 'drive',
            source: 'college-placement-drive',
            driveId: selectedDriveId,
            company: selectedCompany?.name || 'Company',
            role: selectedDrive?.role || 'Role',
            jobDescriptionSource: uploadedJdInfo?.fileName
              ? `File: ${uploadedJdInfo.fileName}`
              : selectedDrive
              ? 'placement-drive'
              : 'Pasted / Custom JD',
            atsScore: analysisResult.atsScore,
            matchedSkills: matched,
            missingSkills: missing,
            requiredSkills: selectedDrive?.requiredSkills || required,
            resumeKeyPhrases: analysisResult.resumeKeyPhrases || [],
            jobKeyPhrases: analysisResult.jobKeyPhrases || [],
            timestamp: new Date().toISOString(),
          };

      // Enrich analysis result with target context for UI rendering
      analysisResult.driveId = isCustomMode ? null : selectedDriveId;
      analysisResult.mode = boundAnalysis.mode;
      analysisResult.source = boundAnalysis.source;
      analysisResult.company = boundAnalysis.company;
      analysisResult.role = boundAnalysis.role;
      analysisResult.requiredSkills = boundAnalysis.requiredSkills;

      setResult(analysisResult);

      if (typeof setAtsScore === 'function' && analysisResult.atsScore) {
        setAtsScore(analysisResult.atsScore);
      }
      if (typeof setMissingSkills === 'function' && Array.isArray(analysisResult.missingSkills)) {
        setMissingSkills(analysisResult.missingSkills);
      }
      if (typeof setLatestAnalysis === 'function') {
        setLatestAnalysis(boundAnalysis);
      }
    } catch (err) {
      setError(err.message || 'AWS Comprehend analysis failed. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleResumeExtracted({ text, fileName, charCount }) {
    setResumeText(text);
    setUploadedResumeInfo({ fileName, charCount });
    setError('');
  }

  function handleJdExtracted({ text, fileName, charCount }) {
    setJdText(text);
    setUploadedJdInfo({ fileName, charCount });
    activeJdDriveIdRef.current = null;
    setError('');
    setResult(null); // Reset stale analysis results immediately

    // Automatic extraction of Company Name and Job Role
    if (isCustomMode) {
      const extracted = extractCompanyAndRole(text);
      setExtractedMetadata(extracted);
      setCustomCompany(extracted.companyName || '');
      setCustomRole(extracted.jobRole || '');
      setShowManualEdit(false);
    }
  }

  function handleClear() {
    setResumeText('');
    setJdText('');
    setResult(null);
    setError('');
    setUploadedResumeInfo(null);
    setUploadedJdInfo(null);
    activeJdDriveIdRef.current = null;
    setExtractedMetadata(null);
    setCustomCompany('');
    setCustomRole('');
    setShowManualEdit(false);
  }

  function handleLoadSample() {
    setResumeText(SAMPLE_RESUME);
    if (isCustomMode) {
      setJdText(SAMPLE_CUSTOM_JD);
      const extracted = extractCompanyAndRole(SAMPLE_CUSTOM_JD);
      setExtractedMetadata(extracted);
      setCustomCompany(extracted.companyName || 'AptCloud');
      setCustomRole(extracted.jobRole || 'Cloud Engineer');
      activeJdDriveIdRef.current = 'custom';
    } else if (selectedDrive) {
      const comp = selectedDrive.company || companies.find((c) => c.id === selectedDrive.companyId);
      setJdText(formatDriveJD(selectedDrive, comp));
      activeJdDriveIdRef.current = selectedDrive.id;
    } else {
      setJdText(SAMPLE_JD);
      activeJdDriveIdRef.current = null;
    }
    setResult(null);
    setError('');
    setUploadedResumeInfo(null);
    setUploadedJdInfo(null);
  }

  const isAnyExtracting = isExtractingResume || isExtractingJd;

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      {/* Input Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Info Banner with accurate NLP description */}
        <div className="alert alert--info" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚡</span>
          <div style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
            <div>
              <strong>AI/ML-Powered Resume Screening:</strong> Extracts key phrases and entities from your resume and compares them with the target job description to identify skills, gaps, and ATS compatibility.
            </div>
            <div style={{ marginTop: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
              <em>Amazon Comprehend performs NLP extraction. HireFlow's scoring engine converts these signals into an ATS compatibility score and skill-gap analysis.</em>
            </div>
          </div>
        </div>

        {/* Target Placement Drive / Custom JD Selector */}
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.625rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <label className="form-label" htmlFor="analysis-drive-select" style={{ marginBottom: 0, fontWeight: 600 }}>
              🎯 Target Placement Drive or Custom JD
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {isCustomMode ? 'Student Custom Mode' : 'Live from AWS RDS MySQL'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              id="analysis-drive-select"
              className="form-select"
              style={{ flex: 1, minWidth: 260 }}
              value={selectedDriveId}
              onChange={(e) => handleDriveChange(e.target.value)}
              disabled={loading || isAnyExtracting || drivesLoading}
            >
              <optgroup label="Student Custom Job Description">
                <option value="custom">★ Upload / Paste Custom JD (e.g. AptCloud, Startups, External Jobs)</option>
              </optgroup>
              <optgroup label="Active Placement Drives (RDS MySQL)">
                {drives.map((d) => {
                  const comp = d.company || companies.find((c) => c.id === d.companyId);
                  return (
                    <option key={d.id} value={d.id}>
                      {comp ? comp.name : 'Company'} — {d.role} ({d.package})
                    </option>
                  );
                })}
              </optgroup>
            </select>

            {selectedDriveId.startsWith('drive-') && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={loading || isAnyExtracting}
                onClick={() => {
                  const d = drives.find((item) => item.id === selectedDriveId);
                  if (d) {
                    const comp = d.company || companies.find((c) => c.id === d.companyId);
                    setJdText(formatDriveJD(d, comp));
                    activeJdDriveIdRef.current = selectedDriveId;
                    setUploadedJdInfo(null);
                  }
                }}
              >
                Reload Drive JD
              </Button>
            )}
          </div>

          {/* Custom JD Automatic Extraction Preview (Phase 2 & 5) */}
          {isCustomMode && (
            <div
              style={{
                marginTop: '0.875rem',
                paddingTop: '0.875rem',
                borderTop: '1px dashed var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    ✦ Detected from Uploaded Job Description
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualEdit((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  {showManualEdit ? 'Hide manual edit' : 'Edit / Confirm details'}
                </button>
              </div>

              {/* Extraction Preview Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  background: 'rgba(59, 130, 246, 0.04)',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Company Name
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.875rem', color: customCompany ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {customCompany || 'Company not detected'}
                    </strong>
                    {extractedMetadata?.companyConfidence === 'high' && (
                      <span style={{ fontSize: '0.625rem', fontWeight: 600, padding: '1px 6px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        Detected automatically
                      </span>
                    )}
                    {extractedMetadata?.companyConfidence === 'medium' && (
                      <span style={{ fontSize: '0.625rem', fontWeight: 600, padding: '1px 6px', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-primary)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        Detected
                      </span>
                    )}
                    {!customCompany && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                        (Optional confirmation)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Job Role
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.875rem', color: customRole ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {customRole || 'Job role not detected'}
                    </strong>
                    {extractedMetadata?.jobRoleConfidence === 'high' && (
                      <span style={{ fontSize: '0.625rem', fontWeight: 600, padding: '1px 6px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        Detected automatically
                      </span>
                    )}
                    {extractedMetadata?.jobRoleConfidence === 'medium' && (
                      <span style={{ fontSize: '0.625rem', fontWeight: 600, padding: '1px 6px', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-primary)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        Detected
                      </span>
                    )}
                    {!customRole && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                        (Optional confirmation)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Manual Override Input Fields */}
              {(showManualEdit || (!customCompany && !customRole && jdText.trim())) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="custom-company-input" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      Company Name (Override / Confirm)
                    </label>
                    <input
                      id="custom-company-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 75WAY Technologies"
                      value={customCompany}
                      onChange={(e) => {
                        setCustomCompany(e.target.value);
                        if (error) setError('');
                      }}
                      disabled={loading || isAnyExtracting}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="custom-role-input" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      Job Role (Override / Confirm)
                    </label>
                    <input
                      id="custom-role-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Associate Software Engineer"
                      value={customRole}
                      onChange={(e) => {
                        setCustomRole(e.target.value);
                        if (error) setError('');
                      }}
                      disabled={loading || isAnyExtracting}
                    />
                  </div>
                </div>
              )}

              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                Extraction Source: Uploaded Job Description ({uploadedJdInfo?.fileName || 'Pasted / Uploaded Text'}) · Scoped to your session
              </span>
            </div>
          )}

          {/* Selected Drive Context Metadata */}
          {selectedDrive && (
            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed var(--color-border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.5rem',
                fontSize: '0.75rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Company: </span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedCompany?.name || 'Company'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Role: </span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedDrive.role}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Package: </span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedDrive.package}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>JD Source: </span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>RDS MySQL (Auto-loaded)</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload Resume Control (PDF, DOCX, TXT) */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            Upload Resume Document
          </label>
          <ResumeUpload
            label="Upload Resume"
            dropzoneText="Drag & drop resume here"
            fileTypeLabel="resume"
            successPrefix="Resume loaded:"
            inputId="resume-file-input"
            onTextExtracted={handleResumeExtracted}
            isExtracting={isExtractingResume}
            setIsExtracting={setIsExtractingResume}
            onError={setError}
            uploadedFileInfo={uploadedResumeInfo}
            onClearFile={() => setUploadedResumeInfo(null)}
          />
        </div>

        {/* Resume Text Input (Editable extracted or pasted text) */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
            <label className="form-label" htmlFor="resume-input" style={{ marginBottom: 0 }}>
              Resume Text
            </label>
            {resumeText && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {resumeText.length.toLocaleString()} characters
              </span>
            )}
          </div>
          <textarea
            id="resume-input"
            className="form-textarea"
            rows={8}
            placeholder="Upload a PDF/DOCX/TXT above, or paste your resume text directly here…"
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              if (error) setError('');
            }}
            disabled={loading || isAnyExtracting}
            aria-describedby="resume-hint"
          />
          <span id="resume-hint" className="form-hint">
            You can freely review and edit the extracted text above before running analysis.
          </span>
        </div>

        {/* Upload Job Description Control (PDF, DOCX, TXT) */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            Upload Job Description Document
          </label>
          <ResumeUpload
            label="Upload Job Description"
            dropzoneText="Drag & drop job description here"
            fileTypeLabel="job description"
            successPrefix="Job description loaded:"
            inputId="jd-file-input"
            onTextExtracted={handleJdExtracted}
            isExtracting={isExtractingJd}
            setIsExtracting={setIsExtractingJd}
            onError={setError}
            uploadedFileInfo={uploadedJdInfo}
            onClearFile={() => setUploadedJdInfo(null)}
          />
        </div>

        {/* Job Description Input */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
            <label className="form-label" htmlFor="jd-input" style={{ marginBottom: 0 }}>
              Target Job Description
            </label>
            {jdText && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {jdText.length.toLocaleString()} characters
              </span>
            )}
          </div>
          <textarea
            id="jd-input"
            className="form-textarea"
            rows={8}
            placeholder="Upload a PDF/DOCX/TXT above, select a placement drive, or paste the target job description directly here…"
            value={jdText}
            onChange={(e) => {
              const val = e.target.value;
              setJdText(val);
              activeJdDriveIdRef.current = null;
              if (error) setError('');
              if (result) setResult(null);

              if (isCustomMode) {
                const extracted = extractCompanyAndRole(val);
                setExtractedMetadata(extracted);
                setCustomCompany(extracted.companyName || '');
                setCustomRole(extracted.jobRole || '');
              }
            }}
            disabled={loading || isAnyExtracting}
            aria-describedby="jd-hint"
          />
          <span id="jd-hint" className="form-hint">
            {selectedDrive
              ? `Auto-loaded from ${selectedCompany?.name || 'RDS'} drive specification. You can customize before analyzing.`
              : 'Include the full requirements and skills section for optimal NLP extraction accuracy.'}
          </span>
        </div>

        {/* Error State with Retry */}
        {error && (
          <div className="alert alert--danger" role="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span>⚠</span> {error}
            </div>
            <Button size="sm" variant="secondary" onClick={handleAnalyze} disabled={loading || isAnyExtracting}>
              Retry
            </Button>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            id="analyze-btn"
            variant="primary"
            size="lg"
            onClick={handleAnalyze}
            disabled={loading || isAnyExtracting || !resumeText.trim() || !jdText.trim()}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  className="spinner-border"
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Analyzing with Amazon Comprehend...
              </span>
            ) : (
              '⚡ Analyze Resume with AWS NLP'
            )}
          </Button>

          <Button
            id="load-sample-btn"
            variant="secondary"
            onClick={handleLoadSample}
            disabled={loading || isAnyExtracting}
          >
            Load Sample Data
          </Button>

          {(resumeText || jdText) && (
            <Button id="clear-btn" variant="ghost" onClick={handleClear} disabled={loading || isAnyExtracting}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Result Panel */}
      <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {result ? (
          <>
            <AnalysisResult result={result} />
            <Button
              id="goto-prep-btn"
              variant="primary"
              size="md"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                if (isCustomMode) {
                  navigate('/preparation?mode=custom');
                } else {
                  navigate(`/preparation?driveId=${selectedDriveId}`);
                }
              }}
            >
              {isCustomMode
                ? `🎯 Prepare for ${result.company || customCompany || extractedMetadata?.companyName || 'This Job'} (${result.role || customRole || extractedMetadata?.jobRole || 'Custom Role'}) →`
                : '🎯 Prepare for This Drive →'}
            </Button>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.35 }}>📄</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              AWS NLP Analysis Results
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Select a target placement drive to load its official Job Description from RDS MySQL, provide your resume text or document, and click <strong>Analyze Resume with AWS NLP</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
