import React from 'react';
import { PIPELINE_STAGES } from '../../data/applications.js';

const CHECK = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const X_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const DOT = <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />;

/**
 * StatusPipeline — visual placement round tracker
 * @param {Array} stages - array of { key, label, status }
 */
export default function StatusPipeline({ stages }) {
  if (!stages || stages.length === 0) return null;

  return (
    <div className="pipeline" role="list" aria-label="Application pipeline">
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1;
        const prevCompleted =
          idx === 0 || stages[idx - 1].status === 'completed';

        return (
          <React.Fragment key={stage.key}>
            <div
              className={`pipeline__stage pipeline__stage--${stage.status}`}
              role="listitem"
              aria-label={`${stage.label}: ${stage.status}`}
            >
              <div className="pipeline__stage-dot" aria-hidden="true">
                {stage.status === 'completed' && CHECK}
                {stage.status === 'rejected' && X_ICON}
                {stage.status === 'current' && DOT}
              </div>
              <span className="pipeline__stage-label">{stage.label}</span>
            </div>

            {!isLast && (
              <div
                className={`pipeline__connector${
                  stage.status === 'completed' ? ' pipeline__connector--completed' : ''
                }`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
