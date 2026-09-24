import React from 'react';
import Button from './Button.jsx';

/**
 * EmptyState — shown when a list or section has no content
 * @param {string} icon - emoji or character
 * @param {string} title
 * @param {string} description
 * @param {string} actionLabel - optional CTA button label
 * @param {Function} onAction
 */
export default function EmptyState({ icon = '📭', title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-state__icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} id="empty-state-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
