import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { NAV_LINKS, APP_NAME } from '../../utils/constants.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getInitials } from '../../utils/formatters.js';

// Simple SVG icon set — avoids adding an icon library dependency
const ICONS = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  'file-text': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  cpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
};

export default function Sidebar({ mobileOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || 'Student';
  const displayBranch = user?.branch || 'CSE';
  const displayGraduationYear = user?.graduationYear || 2026;

  return (
    <>
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`} aria-label="Primary navigation">
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon" aria-hidden="true">HF</div>
          <div className="sidebar__logo-text">
            <span className="sidebar__logo-name">{APP_NAME}</span>
            <span className="sidebar__logo-tag">Campus Placement Platform</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav" role="navigation">
          <span className="sidebar__nav-label">Navigation</span>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
              onClick={onClose}
              aria-current={location.pathname === link.path ? 'page' : undefined}
            >
              <span className="sidebar__link-icon" aria-hidden="true">
                {ICONS[link.icon]}
              </span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar" aria-hidden="true">
              {getInitials(displayName)}
            </div>
            <div className="sidebar__user-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar__user-name">{displayName}</div>
              <div className="sidebar__user-role">
                {displayBranch} · {displayGraduationYear}
              </div>
            </div>
            <button
              className="sidebar__logout-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              id="sidebar-logout-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <style>{`
          .sidebar__logout-btn {
            background: transparent;
            border: none;
            color: var(--color-sidebar-text, #94A3B8);
            padding: 6px;
            border-radius: var(--radius-sm, 6px);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: color 0.15s ease, background 0.15s ease;
            flex-shrink: 0;
          }
          .sidebar__logout-btn:hover {
            color: var(--color-danger, #DC2626);
            background: rgba(220, 38, 38, 0.15);
          }
        `}</style>
      </aside>
    </>
  );
}
