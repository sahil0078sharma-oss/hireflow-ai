import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDrives } from '../../hooks/useDrives.js';
import { getPreparationPlan, PREP_CATEGORIES } from '../../services/aiPrep.js';
import { useAppContext } from '../../context/AppContext.jsx';
import QuestionCard from './QuestionCard.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';

/**
 * AIPrep — Adaptive Placement Preparation & Recommendation Engine UI
 *
 * Powered by:
 * - Live Placement Drive data from RDS MySQL
 * - Student Application Stage from RDS MySQL
 * - Amazon Comprehend NLP resume skill-gap signals (context-bound to driveId)
 * - Curated Question Matrix
 */
export default function AIPrep() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDriveId = searchParams.get('driveId');
  const urlMode = searchParams.get('mode');

  const { drives, companies } = useDrives();
  const { applications, hasApplied, latestAnalysis, getAnalysisForDrive } = useAppContext();

  // Determine if active context should be custom mode
  const isCustomModeInitial = urlMode === 'custom' || urlDriveId === 'custom' || (!urlDriveId && latestAnalysis?.source === 'student-uploaded-jd');

  const [selectedDriveId, setSelectedDriveId] = useState(() => {
    if (isCustomModeInitial) return 'custom';
    return urlDriveId || latestAnalysis?.driveId || '';
  });
  const [selectedCategory, setSelectedCategory] = useState('technical');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const isCustomMode = selectedDriveId === 'custom';

  // Synchronize when live drives load from RDS or URL param changes
  useEffect(() => {
    if (urlMode === 'custom' || selectedDriveId === 'custom') {
      if (selectedDriveId !== 'custom') {
        setSelectedDriveId('custom');
      }
      return;
    }

    if (!drives || drives.length === 0) return;

    if (urlDriveId && drives.some((d) => d.id === urlDriveId)) {
      if (selectedDriveId !== urlDriveId) {
        setSelectedDriveId(urlDriveId);
      }
    } else if (!selectedDriveId || (!drives.some((d) => d.id === selectedDriveId) && selectedDriveId !== 'custom')) {
      if (latestAnalysis?.driveId && drives.some((d) => d.id === latestAnalysis.driveId)) {
        setSelectedDriveId(latestAnalysis.driveId);
      } else if (applications && applications.length > 0 && applications[0].driveId && drives.some((d) => d.id === applications[0].driveId)) {
        setSelectedDriveId(applications[0].driveId);
      } else {
        setSelectedDriveId(drives[0]?.id || '');
      }
    }
  }, [drives, urlDriveId, urlMode, latestAnalysis, applications, selectedDriveId]);

  // Context-bound analysis for the currently selected drive
  const boundAnalysis = useMemo(() => {
    return getAnalysisForDrive ? getAnalysisForDrive(selectedDriveId) : null;
  }, [getAnalysisForDrive, selectedDriveId]);

  // Context status determination:
  // Case A: Custom mode with valid custom analysis
  // Case B: Custom mode with no valid custom analysis (recovery state)
  // Case C: Matching RDS drive analysis
  // Case D: Analysis exists but for a different target
  // Case E: No analysis exists at all
  const contextStatus = useMemo(() => {
    if (isCustomMode) {
      if (latestAnalysis && latestAnalysis.source === 'student-uploaded-jd') {
        return {
          type: 'MATCHED_CUSTOM',
          analysis: latestAnalysis,
        };
      }
      return {
        type: 'INVALID_CUSTOM',
      };
    }

    if (boundAnalysis && boundAnalysis.driveId === selectedDriveId) {
      return {
        type: 'MATCHED',
        analysis: boundAnalysis,
      };
    }
    if (latestAnalysis && (latestAnalysis.source === 'student-uploaded-jd' || latestAnalysis.driveId !== selectedDriveId)) {
      return {
        type: 'MISMATCHED',
        otherAnalysis: latestAnalysis,
      };
    }
    return {
      type: 'NONE',
    };
  }, [isCustomMode, boundAnalysis, latestAnalysis, selectedDriveId]);

  // Load preparation plan whenever driveId, category, or context status changes
  useEffect(() => {
    let isCancelled = false;

    async function loadPlan() {
      setLoading(true);
      try {
        if (isCustomMode) {
          if (contextStatus.type !== 'MATCHED_CUSTOM') {
            setPlan(null);
            setLoading(false);
            return;
          }

          const result = await getPreparationPlan(
            'custom',
            selectedCategory,
            contextStatus.analysis.missingSkills || [],
            null,
            contextStatus.analysis.atsScore,
            {
              mode: 'custom',
              company: contextStatus.analysis.company,
              role: contextStatus.analysis.role,
              missingSkills: contextStatus.analysis.missingSkills || [],
              atsScore: contextStatus.analysis.atsScore,
              jdSkills: contextStatus.analysis.requiredSkills || [],
            }
          );

          if (!isCancelled) {
            setPlan(result);
          }
          return;
        }

        // Only send missing skills IF analysis is bound to this selected drive!
        const isLinked = contextStatus.type === 'MATCHED';
        const skillsToSend = isLinked ? contextStatus.analysis.missingSkills || [] : [];
        const analysisDriveId = isLinked ? selectedDriveId : null;
        const atsScore = isLinked ? contextStatus.analysis.atsScore : null;

        const result = await getPreparationPlan(
          selectedDriveId,
          selectedCategory,
          skillsToSend,
          analysisDriveId,
          atsScore
        );

        if (!isCancelled) {
          setPlan(result);
        }
      } catch (err) {
        console.error('Error fetching preparation plan:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    if (selectedDriveId) {
      loadPlan();
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedDriveId, selectedCategory, contextStatus, isCustomMode]);

  // Active drive and company (only applicable in college drive mode)
  const selectedDrive = useMemo(() => {
    if (isCustomMode) return null;
    return drives.find((d) => d.id === selectedDriveId) || drives[0] || null;
  }, [drives, selectedDriveId, isCustomMode]);

  const selectedCompany = useMemo(() => {
    if (isCustomMode) return null;
    return selectedDrive?.company || companies.find((c) => c.id === selectedDrive?.companyId) || { name: 'Company', fullName: 'Company' };
  }, [selectedDrive, companies, isCustomMode]);

  const isCurrentDriveApplied = hasApplied && !isCustomMode ? hasApplied(selectedDriveId) : false;

  // Unified required technical skills for both Custom JD and Placement Drive modes
  const displayedRequiredSkills = useMemo(() => {
    if (plan?.meta?.requiredSkills && Array.isArray(plan.meta.requiredSkills) && plan.meta.requiredSkills.length > 0) {
      return plan.meta.requiredSkills;
    }
    if (isCustomMode && contextStatus.type === 'MATCHED_CUSTOM') {
      if (contextStatus.analysis.requiredSkills && contextStatus.analysis.requiredSkills.length > 0) {
        return contextStatus.analysis.requiredSkills;
      }
      return Array.from(new Set([
        ...(contextStatus.analysis.matchedSkills || []),
        ...(contextStatus.analysis.missingSkills || []),
      ]));
    }
    if (selectedDrive?.requiredSkills && selectedDrive.requiredSkills.length > 0) {
      return selectedDrive.requiredSkills;
    }
    return [];
  }, [plan, isCustomMode, contextStatus, selectedDrive]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Context-Aware Analysis Status Banner */}
      {contextStatus.type === 'MATCHED_CUSTOM' && (
        <div
          className="alert alert--success"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            padding: '1rem 1.25rem',
            borderLeft: '4px solid #8B5CF6',
            background: 'rgba(139, 92, 246, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.1rem', color: '#8B5CF6', fontWeight: 700 }}>✓</span>
            <strong style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
              Custom Job Description Linked
            </strong>
            {typeof contextStatus.analysis.atsScore === 'number' && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-success)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                ATS Score: {contextStatus.analysis.atsScore}%
              </span>
            )}
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#7C3AED',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                marginLeft: 'auto',
              }}
            >
              Student-Uploaded JD
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Your preparation plan is personalized for your target company (
            <strong>
              {contextStatus.analysis.company} — {contextStatus.analysis.role}
            </strong>
            ) using your analyzed ATS skill gaps.
          </p>
          {contextStatus.analysis.missingSkills?.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginTop: '0.25rem',
                paddingTop: '0.4rem',
                borderTop: '1px dashed var(--color-border)',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                Identified skill gaps for this job:
              </span>
              {contextStatus.analysis.missingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#DC2626',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '0.375rem',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {skill} — HIGH
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {contextStatus.type === 'INVALID_CUSTOM' && (
        <div
          className="alert alert--warning"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '1rem 1.25rem',
            borderLeft: '4px solid var(--color-warning)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠</span>
            <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
              Custom JD analysis not found. Return to Resume Analyzer.
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            You requested AI Preparation for a custom Job Description, but no active custom analysis exists in your current session. Please analyze your resume against your target company's Job Description in Resume Analyzer first to generate your ATS score and preparation plan.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.35rem' }}>
            <Button
              id="custom-prep-resume-btn"
              size="sm"
              variant="primary"
              onClick={() => navigate('/resume?driveId=custom')}
            >
              Return to Resume Analyzer →
            </Button>
            {drives.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedDriveId(drives[0].id);
                  setSearchParams({ driveId: drives[0].id });
                }}
              >
                Switch to College Drive ({drives[0].company?.name || 'Accenture'})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Left Selectors + Right Preparation Content */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left Column: Selectors & Drive Details */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Drive & Category Selector Card */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {isCustomMode ? 'Custom Preparation Target' : 'Target Placement Drive'}
            </h3>

            {/* Target Select Dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="prep-drive-select">
                Target Selection
              </label>
              <select
                id="prep-drive-select"
                className="form-select"
                value={selectedDriveId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDriveId(val);
                  if (val === 'custom') {
                    setSearchParams({ mode: 'custom' });
                  } else {
                    setSearchParams({ driveId: val });
                  }
                }}
              >
                {(isCustomMode || latestAnalysis?.source === 'student-uploaded-jd') && (
                  <optgroup label="Student Custom Job Description">
                    <option value="custom">
                      ★ {latestAnalysis?.company || 'Custom Company'} — {latestAnalysis?.role || 'Custom Role'} (Student-Uploaded JD)
                    </option>
                  </optgroup>
                )}
                <optgroup label="Active Placement Drives (RDS MySQL)">
                  {drives.map((d) => {
                    const comp = d.company || companies.find((c) => c.id === d.companyId);
                    const applied = hasApplied ? hasApplied(d.id) : false;
                    const isLinkedDrive = contextStatus.type === 'MATCHED' && selectedDriveId === d.id;
                    return (
                      <option key={d.id} value={d.id}>
                        {comp ? comp.name : 'Company'} — {d.role} {applied ? '✓' : ''} {isLinkedDrive ? '★ (Linked)' : ''}
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>

            {/* Category Selector */}
            <div className="form-group">
              <label className="form-label">Interview Category</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {PREP_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    id={`prep-cat-${cat.key}`}
                    onClick={() => setSelectedCategory(cat.key)}
                    style={{
                      background: selectedCategory === cat.key ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                      color: selectedCategory === cat.key ? 'white' : 'var(--color-text-secondary)',
                      border: `1px solid ${selectedCategory === cat.key ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    aria-pressed={selectedCategory === cat.key}
                  >
                    <span>{cat.label}</span>
                    {selectedCategory === cat.key && <span style={{ fontSize: '0.75rem' }}>●</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Drive Meta Card / Custom Target Meta Card */}
          {isCustomMode ? (
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}
                >
                  {(latestAnalysis?.company || 'JD').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {latestAnalysis?.company || plan?.company || 'Custom Target'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {latestAnalysis?.role || plan?.role || 'Custom Role'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Source:</span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      padding: '1px 8px',
                      borderRadius: '9999px',
                      background: 'rgba(139, 92, 246, 0.12)',
                      color: '#7C3AED',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                    }}
                  >
                    Student-Uploaded JD
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Scope:</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Private Session</span>
                </div>
                {typeof latestAnalysis?.atsScore === 'number' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>ATS Score:</span>
                    <strong style={{ color: 'var(--color-success)' }}>{latestAnalysis.atsScore}%</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>College Drive:</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>None (External)</span>
                </div>
              </div>
            </div>
          ) : (
            selectedCompany && selectedDrive && (
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '0.5rem',
                      background: selectedCompany.color || 'var(--color-primary)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      flexShrink: 0,
                    }}
                  >
                    {selectedCompany.avatar || 'DR'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {selectedCompany.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {selectedDrive.role}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Package:</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{selectedDrive.package}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Location:</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{selectedDrive.location}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Application:</span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '1px 8px',
                        borderRadius: '9999px',
                        background: isCurrentDriveApplied ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-surface-alt)',
                        color: isCurrentDriveApplied ? 'var(--color-success)' : 'var(--color-text-muted)',
                        border: `1px solid ${isCurrentDriveApplied ? 'rgba(16, 185, 129, 0.3)' : 'var(--color-border)'}`,
                      }}
                    >
                      {isCurrentDriveApplied ? 'Applied' : 'Not Applied'}
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right Column: Personalized Plan, Readiness, Recommendations & Questions */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Offline Banner if fallback is active, or Live AWS badge if connected */}
          {plan?.isOffline ? (
            <div
              className="alert alert--warning"
              style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>⚠</span>
              <span>
                <strong>Offline Preparation</strong> — live AWS RDS application sync is currently unavailable. Using offline preparation content.
              </span>
            </div>
          ) : (
            plan && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  color: '#059669',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  width: 'fit-content',
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                Live AWS Preparation
              </div>
            )
          )}

          {/* Loading / Invalid Custom / Plan Display */}
          {contextStatus.type === 'INVALID_CUSTOM' ? (
            <EmptyState
              icon="📄"
              title="Custom JD analysis not found. Return to Resume Analyzer."
              description="You selected custom preparation mode, but no active custom Job Description analysis exists in this session. Analyze your resume against an external Job Description first to calculate your ATS score and generate customized interview questions."
              action={
                <Button
                  id="go-to-resume-analyzer-btn"
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/resume?driveId=custom')}
                >
                  Return to Resume Analyzer →
                </Button>
              }
            />
          ) : loading ? (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div
                className="spinner-border"
                style={{
                  width: 32,
                  height: 32,
                  border: '3px solid var(--color-border)',
                  borderTopColor: 'var(--color-primary)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '1rem',
                }}
              />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Loading preparation...
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Analyzing placement rounds, required skills, and resume skill-gap signals.
              </p>
            </div>
          ) : plan ? (
            <>
              {/* Preparation Readiness & Stage Dashboard Card */}
              <div
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-alt) 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  {/* Readiness Score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        border: '5px solid var(--color-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--color-surface)',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
                        {plan.readinessScore}%
                      </span>
                      <span style={{ fontSize: '0.5625rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        Ready
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Preparation Readiness
                      </div>
                      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0.125rem 0' }}>
                        {plan.company} · {plan.role}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Target Context:</span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '2px 10px',
                            borderRadius: '9999px',
                            background: isCustomMode ? 'rgba(139, 92, 246, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: isCustomMode ? '#7C3AED' : 'var(--color-primary)',
                            border: `1px solid ${isCustomMode ? 'rgba(139, 92, 246, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                          }}
                        >
                          {isCustomMode ? 'Student-Uploaded JD' : plan.applicationStage}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Status: <strong>{isCustomMode ? 'Custom Prep' : plan.applicationStatus}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Required Technical Skills (Unified for both Custom JD and College Drives) */}
                {displayedRequiredSkills.length > 0 && (
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                      REQUIRED TECHNICAL SKILLS:
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {displayedRequiredSkills.map((skill, idx) => {
                        const priorityItem = plan?.prioritySkills?.find(
                          (p) => p.skill.toLowerCase() === skill.toLowerCase()
                        );
                        const isHigh = priorityItem?.priority === 'HIGH';
                        const isMatched = priorityItem?.priority === 'MATCHED';

                        return (
                          <span
                            key={idx}
                            title={priorityItem?.reason || `${skill} required`}
                            style={{
                              fontSize: '0.75rem',
                              padding: '3px 10px',
                              borderRadius: '0.375rem',
                              background: isHigh
                                ? 'rgba(239, 68, 68, 0.12)'
                                : isMatched
                                ? 'rgba(16, 185, 129, 0.12)'
                                : 'var(--color-surface-alt)',
                              border: `1px solid ${
                                isHigh
                                  ? 'rgba(239, 68, 68, 0.3)'
                                  : isMatched
                                  ? 'rgba(16, 185, 129, 0.3)'
                                  : 'var(--color-border)'
                              }`,
                              color: isHigh
                                ? '#DC2626'
                                : isMatched
                                ? '#059669'
                                : 'var(--color-text-primary)',
                              fontWeight: 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <strong>{skill}</strong>
                            {priorityItem && (
                              <span
                                style={{
                                  fontSize: '0.625rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  opacity: 0.85,
                                }}
                              >
                                [{priorityItem.priority}]
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Round Focus Pills */}
                {plan.roundFocus && plan.roundFocus.length > 0 && (
                  <div style={{ paddingTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                      CURRENT ROUND FOCUS:
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {plan.roundFocus.map((topic, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: 'var(--color-surface-alt)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          • {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommendations Box */}
              {plan.recommendations && plan.recommendations.length > 0 && (
                <div
                  className="card"
                  style={{
                    padding: '1rem 1.25rem',
                    borderLeft: '3px solid var(--color-warning)',
                    backgroundColor: 'rgba(245, 158, 11, 0.03)',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                    💡 Preparation Strategy & Recommendations:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    {plan.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Preparation Section Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {PREP_CATEGORIES.find((c) => c.key === selectedCategory)?.label} Preparation Questions
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Calibrated for {plan.company} · {plan.role} · {plan.applicationStage}
                  </p>
                </div>
                {plan.questions && plan.questions.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      border: '1px solid var(--color-primary-mid)',
                      borderRadius: '9999px',
                      padding: '3px 12px',
                    }}
                  >
                    {plan.questions.length} questions
                  </span>
                )}
              </div>

              {/* Question Cards List */}
              {plan.questions && plan.questions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {plan.questions.map((item, idx) => (
                    <QuestionCard key={idx} item={item} index={idx} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🎯"
                  title="No questions found"
                  description="No questions available for this specific category and drive combination."
                />
              )}

              {/* "Why These Topics?" Explanation Card */}
              <div
                className="card"
                style={{
                  padding: '1rem 1.25rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.6,
                  border: '1px dashed var(--color-border)',
                }}
              >
                <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                  ℹ Why These Topics?
                </strong>
                {contextStatus.type === 'MATCHED_CUSTOM' ? (
                  <span>
                    These topics and questions were calibrated specifically for <strong>{plan.company}</strong> ({plan.role}),
                    targeting the skill gaps identified in your analyzed custom Job Description ({contextStatus.analysis.missingSkills?.join(', ') || 'core role competencies'}).
                  </span>
                ) : contextStatus.type === 'MATCHED' ? (
                  <span>
                    These topics and questions were prioritized because they match the selected role ({plan.role}), current
                    placement round ({plan.applicationStage}), required technical competencies, and your identified resume
                    skill gaps from Amazon Comprehend.
                  </span>
                ) : (
                  <span>
                    These topics and questions were calibrated for the selected role ({plan.role}), current placement round ({plan.applicationStage}),
                    and required competencies from the placement drive. Analyze your resume for this drive to further personalize with your specific skill gaps.
                  </span>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
