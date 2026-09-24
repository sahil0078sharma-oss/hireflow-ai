import React from 'react';

/**
 * SkillBadge — renders a single skill tag
 * variant: 'default' | 'primary' | 'success' | 'danger'
 */
export default function SkillBadge({ skill, variant = 'default' }) {
  return (
    <span className={`skill-badge skill-badge--${variant}`}>
      {skill}
    </span>
  );
}
