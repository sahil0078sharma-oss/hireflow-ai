import React, { useState } from 'react';
import SkillBadge from '../ui/SkillBadge.jsx';

/**
 * AnalysisResult — renders output from Amazon Comprehend Resume Analyzer
 * @param {object} result - { atsScore, matchedSkills, missingSkills, recommendations, resumeKeyPhrases, jobKeyPhrases, entities, breakdown, nlpMetadata }
 */
export default function AnalysisResult({ result }) {
  const {
    atsScore = 0,
    matchedSkills = [],
    missingSkills = [],
    recommendations = [],
    resumeKeyPhrases = [],
    entities = [],
    breakdown,
    nlpMetadata,
    company,
    role,
    source,
  } = result;

  const [showNlpDetails, setShowNlpDetails] = useState(false);

  // Score color
  const scoreColor =
    atsScore >= 75 ? 'var(--color-success)' :
    atsScore >= 50 ? 'var(--color-warning)' :
    'var(--color-danger)';

  const scoreLabel =
    atsScore >= 75 ? 'Strong Match' :
    atsScore >= 50 ? 'Moderate Match' :
    'Low Match';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Score Card */}
      <div className="card" style={{ textAlign: 'center', padding: '1.75rem 1.5rem' }}>
        {company && (
          <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {company}
            </div>
            {role && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {role}
              </div>
            )}
            <div style={{ marginTop: '0.4rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: source === 'student-uploaded-jd' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                  color: source === 'student-uploaded-jd' ? '#7C3AED' : 'var(--color-primary)',
                  border: `1px solid ${source === 'student-uploaded-jd' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                }}
              >
                {source === 'student-uploaded-jd' ? '★ Student-Uploaded JD' : 'College Placement Drive'}
              </span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '0.75rem' }}>
          <svg width="120" height="120" viewBox="0 0 120 120" aria-label={`ATS Score: ${atsScore}%`}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(atsScore / 100) * 327} 327`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
            <text x="60" y="55" textAnchor="middle" fill="var(--color-text-primary)"
              fontSize="28" fontWeight="700" fontFamily="Inter, sans-serif">
              {atsScore}%
            </text>
            <text x="60" y="74" textAnchor="middle" fill="var(--color-text-muted)"
              fontSize="11" fontFamily="Inter, sans-serif">
              ATS Score
            </text>
          </svg>
        </div>

        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: scoreColor }}>{scoreLabel}</div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
          {matchedSkills.length} of {matchedSkills.length + missingSkills.length} identified skills matched
        </div>

        {/* Breakdown bars */}
        {breakdown && (
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', textAlign: 'left' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Scoring Weights
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 3 }}>
              <span>Technical Skills (60%)</span>
              <span style={{ fontWeight: 600 }}>{breakdown.skillMatchScore}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 3 }}>
              <span>NLP Phrase Relevance (25%)</span>
              <span style={{ fontWeight: 600 }}>{breakdown.phraseRelevanceScore}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <span>Entity Match (15%)</span>
              <span style={{ fontWeight: 600 }}>{breakdown.entityRelevanceScore}%</span>
            </div>
          </div>
        )}

        {/* Engine Badge */}
        <div style={{ marginTop: '0.75rem', fontSize: '0.6875rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(59, 130, 246, 0.08)', padding: '3px 8px', borderRadius: 4, fontWeight: 500 }}>
          <span>⚡</span> {nlpMetadata?.engine || 'Amazon Comprehend'} ({nlpMetadata?.region || 'ap-south-1'})
        </div>
      </div>

      {/* Matched Skills */}
      {matchedSkills.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✓</span> Matched Skills ({matchedSkills.length})
          </h3>
          <div className="skill-list">
            {matchedSkills.map((skill) => (
              <SkillBadge key={skill} skill={skill} variant="success" />
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✗</span> Missing Skills ({missingSkills.length})
          </h3>
          <div className="skill-list">
            {missingSkills.map((skill) => (
              <SkillBadge key={skill} skill={skill} variant="danger" />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
            💡 Actionable Recommendations
          </h3>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recommendations.map((rec, i) => (
              <li key={i} style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comprehend NLP Insights (Collapsible) */}
      {(resumeKeyPhrases.length > 0 || entities.length > 0) && (
        <div className="card" style={{ background: 'var(--color-surface-alt)' }}>
          <div
            onClick={() => setShowNlpDetails(!showNlpDetails)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              🔍 Amazon Comprehend NLP Insights
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {showNlpDetails ? 'Hide ▲' : 'View ▼'}
            </span>
          </div>

          {showNlpDetails && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              {resumeKeyPhrases.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Extracted Key Phrases ({resumeKeyPhrases.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {resumeKeyPhrases.map((phrase, i) => (
                      <span key={i} style={{ fontSize: '11px', background: 'var(--color-surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {entities.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Detected Entities ({entities.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {entities.map((ent, i) => (
                      <span key={i} style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.08)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(59, 130, 246, 0.2)', color: 'var(--color-primary)' }}>
                        {ent.text} <small style={{ opacity: 0.7 }}>({ent.type})</small>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
