import React, { useState } from 'react';
import Header from '../components/layout/Header.jsx';
import DriveCard from '../components/drives/DriveCard.jsx';
import DriveFilters from '../components/drives/DriveFilters.jsx';
import DriveDetail from '../components/drives/DriveDetail.jsx';
import AddDriveModal from '../components/drives/AddDriveModal.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import { useDrives } from '../hooks/useDrives.js';
import { useAppContext } from '../context/AppContext.jsx';

export default function PlacementDrives() {
  const {
    drives,
    filteredDrives,
    loading,
    error,
    retry,
    createDrive,
    search,
    setSearch,
    filters,
    setFilters,
    companies,
  } = useDrives();
  const { applyToDrive, hasApplied } = useAppContext();

  const [selectedDrive, setSelectedDrive] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }

  async function handleApply(drive) {
    try {
      await applyToDrive(drive.id);
      const companyName = drive.company?.name || drive.companyId.replace('company-', '').toUpperCase();
      showToast('success', `Successfully applied to ${drive.role} at ${companyName}. Check My Applications.`);
    } catch (err) {
      showToast('error', err.message);
    }
  }

  async function handleAddDrive(driveData) {
    const created = await createDrive(driveData);
    const companyName = created.company?.name || driveData.companyName;
    showToast('success', `Successfully added placement drive for ${companyName}!`);
    return created;
  }

  return (
    <>
      <Header
        title="Placement Drives"
        subtitle={loading ? 'Fetching drives from RDS MySQL…' : `${drives.length} active drives · Live from RDS MySQL`}
        badge={loading ? 'Loading…' : `${filteredDrives.length} shown`}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            id="open-add-drive-modal"
          >
            ➕ Add Placement Drive
          </Button>
        }
      />
      <main className="page-content">
        {/* Toast notification */}
        {toast && (
          <div
            className={`alert alert--${toast.type === 'success' ? 'success' : 'danger'}`}
            role="alert"
            style={{ marginBottom: '1.5rem' }}
          >
            <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div
            className="card text-center"
            style={{
              padding: '3.5rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '1rem',
              }}
            />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Loading Placement Drives
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Connecting to RDS MySQL via AWS API Gateway...
            </p>
          </div>
        )}

        {/* Error State with Retry — NEVER silently shows stale demo data */}
        {!loading && error && (
          <div
            className="card"
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              border: '1px solid #fca5a5',
              background: '#fef2f2',
            }}
            role="alert"
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#b91c1c', marginBottom: '0.5rem' }}>
              Failed to Load Placement Drives
            </h3>
            <p style={{ color: '#4b5563', fontSize: '0.875rem', maxWidth: 460, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              {error}
            </p>
            <Button variant="primary" onClick={retry} id="retry-fetch-drives">
              🔄 Retry Connection
            </Button>
          </div>
        )}

        {/* Loaded State */}
        {!loading && !error && (
          <>
            {/* Filters */}
            <DriveFilters
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              onFilterChange={setFilters}
              companies={companies}
            />

            {/* Drive Grid */}
            {filteredDrives.length === 0 ? (
              <EmptyState
                icon="📭"
                title="No drives found"
                description="No placement drives match your search or filters. Try adjusting the search term or filters."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearch('');
                  setFilters({ companyId: '', minPackage: 0 });
                }}
              />
            ) : (
              <div className="grid-3">
                {filteredDrives.map((drive) => (
                  <DriveCard
                    key={drive.id}
                    drive={drive}
                    onViewDetails={setSelectedDrive}
                    onApply={handleApply}
                    alreadyApplied={hasApplied(drive.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Drive Detail Modal */}
        <Modal
          isOpen={!!selectedDrive}
          onClose={() => setSelectedDrive(null)}
          title="Drive Details"
        >
          {selectedDrive && (
            <DriveDetail
              drive={selectedDrive}
              onApply={handleApply}
              alreadyApplied={hasApplied(selectedDrive.id)}
              onClose={() => setSelectedDrive(null)}
            />
          )}
        </Modal>

        {/* Add Placement Drive Modal */}
        <AddDriveModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onDriveCreated={handleAddDrive}
        />
      </main>
    </>
  );
}
