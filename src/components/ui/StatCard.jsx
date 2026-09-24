import React from 'react';

/**
 * StatCard — dashboard metric card
 * @param {string} label
 * @param {string|number} value
 * @param {string} meta - secondary line
 * @param {'blue'|'green'|'amber'|'red'} iconColor
 * @param {React.ReactNode} icon - SVG element
 * @param {'primary'|'success'|'warning'|''} valueColor
 */
export default function StatCard({ label, value, meta, iconColor = 'blue', icon, valueColor = '' }) {
  return (
    <div className="stat-card">
      {icon && (
        <div className={`stat-card__icon stat-card__icon--${iconColor}`} aria-hidden="true">
          {icon}
        </div>
      )}
      <div className={`stat-card__value${valueColor ? ` stat-card__value--${valueColor}` : ''}`}>
        {value}
      </div>
      <div className="stat-card__label">{label}</div>
      {meta && <div className="stat-card__meta">{meta}</div>}
    </div>
  );
}
