import React from 'react';

export default function Header({ title, subtitle, badge, actions, onMenuToggle }) {
  return (
    <header className="header" role="banner">
      {/* Mobile hamburger */}
      <button
        className="btn btn--ghost btn--sm"
        onClick={onMenuToggle}
        aria-label="Toggle navigation menu"
        style={{ display: 'none' }} // shown via CSS at mobile breakpoints
        id="header-menu-toggle"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div style={{ flex: 1 }}>
        {title && <h1 className="header__title">{title}</h1>}
        {subtitle && <p className="header__subtitle">{subtitle}</p>}
      </div>

      {badge && <span className="header__badge">{badge}</span>}
      {actions && <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>{actions}</div>}
    </header>
  );
}
