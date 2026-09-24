import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import SkillBadge from '../ui/SkillBadge.jsx';
import { formatDate, daysUntil } from '../../utils/formatters.js';
import { getCompanyById } from '../../services/driveService.js';

/**
 * DriveDetail — full detail view rendered inside a modal
 */
export default function DriveDetail({ drive, onApply, alreadyApplied, onClose }) {
  const navigate = useNavigate();
  const company = drive.company || getCompanyById(drive.companyId);
  if (!company) return null;

  const days = daysUntil(drive.deadline);

  return (
    <div>
      {/* Company + Role header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: '0.75rem',
            background: company.color, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1rem', flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {company.avatar}
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {company.fullName} · {drive.driveType}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2 }}>
            {drive.role}
          </div>
          <div style={{ marginTop: 4 }}>
            <span
              style={{
                fontSize: '0.75rem', fontWeight: 600,
                background: 'var(--color-success-bg)', color: 'var(--color-success)',
                border: '1px solid var(--color-success-border)',
                borderRadius: '9999px', padding: '2px 10px',
              }}
            >
              {drive.package}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
        {drive.description}
      </p>

      {/* Meta Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
        background: 'var(--color-surface-alt)', borderRadius: '0.75rem',
        padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--color-border)',
      }}>
        {[
          ['Location', drive.location],
          ['Mode', drive.mode],
          ['Openings', drive.openings],
          ['Deadline', `${formatDate(drive.deadline)}${days > 0 ? ` (${days} days left)` : ' — Closed'}`],
          ...(drive.driveDate ? [['Drive Date', formatDate(drive.driveDate)]] : []),
          ['Min CGPA', drive.eligibility?.minCGPA || '—'],
          ['Allowed Backlogs', drive.eligibility?.backlogs ?? '0'],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {String(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Eligible Degrees & Branches */}
      {(drive.eligibility?.degree || []).length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Eligible Degrees
          </h4>
          <div className="skill-list">
            {(drive.eligibility?.degree || []).map((d) => <SkillBadge key={d} skill={d} variant="default" />)}
          </div>
        </div>
      )}

      {(drive.eligibility?.branches || []).length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Eligible Branches
          </h4>
          <div className="skill-list">
            {(drive.eligibility?.branches || []).map((b) => <SkillBadge key={b} skill={b} variant="default" />)}
          </div>
        </div>
      )}

      {/* Required Skills */}
      {(drive.requiredSkills || []).length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Required Skills
          </h4>
          <div className="skill-list">
            {(drive.requiredSkills || []).map((s) => <SkillBadge key={s} skill={s} variant="primary" />)}
          </div>
        </div>
      )}

      {/* Rounds */}
      {(drive.rounds || []).length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
            Placement Rounds
          </h4>
          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {(drive.rounds || []).map((r, i) => (
              <li key={i} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{r}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Demo note */}
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '1rem' }}>
        ⚠ Demo Placement Drive — this record is for demonstration purposes only.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={onClose} id="drive-detail-close">
          Close
        </Button>
        <Button
          id="drive-detail-analyze-btn"
          variant="secondary"
          onClick={() => {
            navigate(`/resume?driveId=${drive.id}`);
            if (onClose) onClose();
          }}
        >
          🔍 Analyze Resume for This Drive
        </Button>
        <Button
          variant={alreadyApplied ? 'secondary' : 'primary'}
          disabled={alreadyApplied}
          onClick={() => { if (!alreadyApplied) { onApply(drive); onClose(); } }}
          id={`drive-detail-apply-${drive.id}`}
          style={{ flex: 1, minWidth: '160px' }}
        >
          {alreadyApplied ? '✓ Already Applied' : `Apply for ${drive.role}`}
        </Button>
      </div>
    </div>
  );
}
