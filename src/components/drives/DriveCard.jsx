import React from 'react';
import Button from '../ui/Button.jsx';
import SkillBadge from '../ui/SkillBadge.jsx';
import { formatDate, daysUntil, deadlineUrgency } from '../../utils/formatters.js';
import { getCompanyById } from '../../services/driveService.js';

/**
 * DriveCard — summary card for a placement drive
 * @param {object} drive
 * @param {Function} onViewDetails
 * @param {Function} onApply
 * @param {boolean} alreadyApplied
 */
export default function DriveCard({ drive, onViewDetails, onApply, alreadyApplied }) {
  const company = drive.company || getCompanyById(drive.companyId);
  if (!company) return null;

  const days = daysUntil(drive.deadline);
  const urgency = deadlineUrgency(drive.deadline);
  const deadlineClass = `deadline-${urgency}`;

  return (
    <article className="drive-card">
      {/* Header */}
      <div className="drive-card__header">
        <div
          className="drive-card__company-avatar"
          style={{ background: company.color }}
          aria-hidden="true"
        >
          {company.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="drive-card__company-name">{company.fullName}</div>
          <div className="drive-card__role">{drive.role}</div>
        </div>
        {alreadyApplied && (
          <span className="status-badge status-progress" role="status">Applied</span>
        )}
      </div>

      {/* Meta Grid */}
      <div className="drive-card__meta">
        <div className="drive-card__meta-item">
          <span className="drive-card__meta-label">Package</span>
          <span className="drive-card__meta-value drive-card__meta-value--highlight">{drive.package}</span>
        </div>
        <div className="drive-card__meta-item">
          <span className="drive-card__meta-label">Location</span>
          <span className="drive-card__meta-value">{drive.location}</span>
        </div>
        <div className="drive-card__meta-item">
          <span className="drive-card__meta-label">Min CGPA</span>
          <span className="drive-card__meta-value">{drive.eligibility?.minCGPA || '—'}</span>
        </div>
        <div className="drive-card__meta-item">
          <span className="drive-card__meta-label">Deadline</span>
          <span className={`drive-card__meta-value ${deadlineClass}`}>
            {formatDate(drive.deadline)}
            {days > 0 ? ` (${days}d left)` : ' (Closed)'}
          </span>
        </div>
      </div>

      {/* Skills */}
      <div className="drive-card__skills">
        {(drive.requiredSkills || []).slice(0, 5).map((skill) => (
          <SkillBadge key={skill} skill={skill} variant="default" />
        ))}
        {(drive.requiredSkills || []).length > 5 && (
          <SkillBadge skill={`+${(drive.requiredSkills || []).length - 5}`} variant="default" />
        )}
      </div>

      {/* Actions */}
      <div className="drive-card__actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onViewDetails(drive)}
          id={`view-drive-${drive.id}`}
        >
          View Details
        </Button>
        <Button
          variant={alreadyApplied ? 'secondary' : 'primary'}
          size="sm"
          disabled={alreadyApplied}
          onClick={() => !alreadyApplied && onApply(drive)}
          id={`apply-drive-${drive.id}`}
          aria-label={alreadyApplied ? `Already applied to ${drive.role} at ${company.name}` : `Apply to ${drive.role} at ${company.name}`}
        >
          {alreadyApplied ? '✓ Applied' : 'Apply Now'}
        </Button>
      </div>
    </article>
  );
}
