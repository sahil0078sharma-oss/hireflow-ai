import React from 'react';
import StatusPipeline from './StatusPipeline.jsx';
import { formatDate } from '../../utils/formatters.js';
import { STAGE_LABELS, STATUS_COLORS } from '../../utils/constants.js';

/**
 * ApplicationCard — displays one student application with pipeline
 * @param {object} application - enriched application (with .drive and .company)
 */
export default function ApplicationCard({ application }) {
  const { drive, company, appliedDate, currentStage, status, stages } = application;

  if (!drive || !company) return null;

  const statusClass = STATUS_COLORS[status] || 'status-pending';

  return (
    <article className="app-card">
      {/* Header */}
      <div className="app-card__header">
        <div className="app-card__company">
          <div
            className="app-card__avatar"
            style={{ background: company.color }}
            aria-hidden="true"
          >
            {company.avatar}
          </div>
          <div>
            <div className="app-card__company-name">{company.fullName}</div>
            <div className="app-card__role">{drive.role}</div>
          </div>
        </div>
        <span className={`status-badge ${statusClass}`} role="status">
          {status}
        </span>
      </div>

      {/* Meta */}
      <div className="app-card__meta-row">
        <div className="app-card__meta-item">
          <span className="app-card__meta-label">Applied</span>
          <span className="app-card__meta-value">{formatDate(appliedDate)}</span>
        </div>
        <div className="app-card__meta-item">
          <span className="app-card__meta-label">Current Stage</span>
          <span className="app-card__meta-value" style={{ color: 'var(--color-primary)' }}>
            {STAGE_LABELS[currentStage] || currentStage}
          </span>
        </div>
        <div className="app-card__meta-item">
          <span className="app-card__meta-label">Package</span>
          <span className="app-card__meta-value">{drive.package}</span>
        </div>
        <div className="app-card__meta-item">
          <span className="app-card__meta-label">Location</span>
          <span className="app-card__meta-value">{drive.location}</span>
        </div>
      </div>

      {/* Pipeline */}
      <div>
        <p className="text-xs text-muted mb-2" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Placement Pipeline
        </p>
        <StatusPipeline stages={stages} />
      </div>
    </article>
  );
}
