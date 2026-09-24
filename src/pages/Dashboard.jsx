import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Button from '../components/ui/Button.jsx';
import { useApplications } from '../hooks/useApplications.js';
import { useAppContext } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDrives } from '../hooks/useDrives.js';
import { formatDate, daysUntil } from '../utils/formatters.js';
import { getCompanyById } from '../services/driveService.js';
import { APP_STATUS } from '../data/applications.js';

// Icon SVGs
const Icons = {
  briefcase: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  trending: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  target: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { applications } = useApplications();
  const { drives } = useDrives();
  const { atsScore } = useAppContext();
  const { user } = useAuth();

  const studentName = user?.name || 'Student';
  const firstName = studentName.split(' ')[0];
  const college = user?.college || 'Arya College of Engineering';
  const degree = user?.degree || 'B.Tech';
  const branch = user?.branch || 'CSE';
  const cgpa = user?.cgpa != null ? user.cgpa : 8.0;
  const graduationYear = user?.graduationYear || 2026;
  const skills = Array.isArray(user?.skills) && user.skills.length > 0 ? user.skills : [];

  // Stats derived from data layer
  const totalApplications = applications.length;
  const activeApplications = applications.filter(
    (a) => a.status === APP_STATUS.IN_PROGRESS || a.status === APP_STATUS.PENDING
  ).length;
  const selectedApplications = applications.filter((a) => a.status === APP_STATUS.SELECTED).length;

  // Upcoming drives (sorted by deadline, nearest first, deadline in future)
  const upcomingDrives = useMemo(() => {
    return drives
      .filter((d) => daysUntil(d.deadline) > 0)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 3);
  }, [drives]);

  // Recent activity — last 3 applications by date
  const recentActivity = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
      .slice(0, 3);
  }, [applications]);

  const displayAtsScore = atsScore !== null ? `${atsScore}%` : '—';

  return (
    <>
      <Header
        title={`Welcome back, ${firstName} 👋`}
        subtitle={`${degree} · ${branch} · ${college}`}
        badge="Authenticated"
      />
      <main className="page-content">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          <StatCard
            label="Total Applications"
            value={totalApplications}
            meta="All placement drives applied"
            iconColor="blue"
            valueColor="primary"
            icon={Icons.briefcase}
          />
          <StatCard
            label="Active Applications"
            value={activeApplications}
            meta="Currently in progress"
            iconColor="amber"
            valueColor="warning"
            icon={Icons.trending}
          />
          <StatCard
            label="Offers / Selected"
            value={selectedApplications}
            meta="Final selections received"
            iconColor="green"
            valueColor="success"
            icon={Icons.check}
          />
          <StatCard
            label="ATS Score"
            value={displayAtsScore}
            meta={atsScore !== null ? 'From last resume analysis' : 'Run Resume Analyzer to get score'}
            iconColor="blue"
            icon={Icons.target}
          />
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              id="quick-action-resume"
              variant="primary"
              onClick={() => navigate('/resume')}
            >
              🔍 Analyze Resume
            </Button>
            <Button
              id="quick-action-prep"
              variant="secondary"
              onClick={() => navigate('/preparation')}
            >
              🤖 Prepare with AI
            </Button>
            <Button
              id="quick-action-drives"
              variant="secondary"
              onClick={() => navigate('/drives')}
            >
              📋 Explore Drives
            </Button>
            <Button
              id="quick-action-applications"
              variant="ghost"
              onClick={() => navigate('/applications')}
            >
              📄 My Applications
            </Button>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {/* Upcoming Drives */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <h2 className="section-title" style={{ fontSize: '1rem' }}>Upcoming Drives</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/drives')} id="view-all-drives">
                View all →
              </Button>
            </div>

            {upcomingDrives.length === 0 ? (
              <p className="text-sm text-muted">No upcoming drives found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcomingDrives.map((drive) => {
                  const company = drive.company || getCompanyById(drive.companyId);
                  const days = daysUntil(drive.deadline);
                  return (
                    <div
                      key={drive.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem', borderRadius: '0.5rem',
                        background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '0.5rem',
                        background: company?.color, color: 'white', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {company?.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {drive.role}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {company?.name} · {drive.package}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        color: days <= 7 ? 'var(--color-danger)' : days <= 14 ? 'var(--color-warning)' : 'var(--color-text-muted)',
                        whiteSpace: 'nowrap',
                      }}>
                        {days}d left
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <h2 className="section-title" style={{ fontSize: '1rem' }}>Recent Activity</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/applications')} id="view-all-apps">
                View all →
              </Button>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted">No applications yet. Explore placement drives to apply.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentActivity.map((app) => {
                  const statusColors = {
                    'In Progress': 'var(--color-info)',
                    'Selected': 'var(--color-success)',
                    'Rejected': 'var(--color-danger)',
                    'Pending Review': 'var(--color-warning)',
                  };
                  return (
                    <div
                      key={app.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem', borderRadius: '0.5rem',
                        background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '0.5rem',
                        background: app.company?.color, color: 'white', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {app.company?.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.drive?.role}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {app.company?.name} · Applied {formatDate(app.appliedDate)}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        color: statusColors[app.status] || 'var(--color-text-muted)',
                        whiteSpace: 'nowrap',
                      }}>
                        {app.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Student Profile Summary */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 className="section-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Your Profile</h2>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>College</span>
              <span className="text-sm font-medium">{college}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Degree</span>
              <span className="text-sm font-medium">{degree} · {branch}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>CGPA</span>
              <span className="text-sm font-medium">{cgpa}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Graduation</span>
              <span className="text-sm font-medium">{graduationYear}</span>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Skills</span>
              <div className="skill-list">
                {skills.length > 0 ? (
                  skills.map((s) => (
                    <span key={s} className="skill-badge skill-badge--primary">{s}</span>
                  ))
                ) : (
                  <span className="text-xs text-muted">No skills listed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
