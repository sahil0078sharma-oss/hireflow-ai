import React from 'react';
import Header from '../components/layout/Header.jsx';
import ApplicationCard from '../components/applications/ApplicationCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import { useApplications } from '../hooks/useApplications.js';
import { useNavigate } from 'react-router-dom';
import { APP_STATUS } from '../data/applications.js';

export default function MyApplications() {
  const { applications } = useApplications();
  const navigate = useNavigate();

  const inProgress = applications.filter(
    (a) => a.status === APP_STATUS.IN_PROGRESS || a.status === APP_STATUS.PENDING
  );
  const completed = applications.filter(
    (a) => a.status === APP_STATUS.SELECTED || a.status === APP_STATUS.REJECTED
  );

  return (
    <>
      <Header
        title="My Applications"
        subtitle="Track your placement pipeline across all applied drives"
        badge={`${applications.length} total`}
      />
      <main className="page-content">
        {applications.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No applications yet"
            description="You haven't applied to any placement drives yet. Explore available drives and apply to get started."
            actionLabel="Explore Drives"
            onAction={() => navigate('/drives')}
          />
        ) : (
          <>
            {/* Active */}
            {inProgress.length > 0 && (
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-info)', display: 'inline-block' }} />
                  Active Applications ({inProgress.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {inProgress.map((app) => (
                    <ApplicationCard key={app.id} application={app} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <section>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-muted)', display: 'inline-block' }} />
                  Completed ({completed.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {completed.map((app) => (
                    <ApplicationCard key={app.id} application={app} />
                  ))}
                </div>
              </section>
            )}

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <Button variant="secondary" onClick={() => navigate('/drives')} id="explore-more-drives">
                + Explore More Drives
              </Button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
