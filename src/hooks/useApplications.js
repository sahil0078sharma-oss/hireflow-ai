import { useAppContext } from '../context/AppContext.jsx';
import { getDriveById, getCompanyById } from '../services/driveService.js';

/**
 * useApplications — convenience hook for reading application state
 *
 * Enriches raw application records with company + drive data.
 */
export function useApplications() {
  const { applications, applyToDrive, hasApplied } = useAppContext();

  const enrichedApplications = applications.map((app) => {
    const drive = app.drive || getDriveById(app.driveId);
    const company = app.company || (drive ? getCompanyById(drive.companyId) : null);
    return { ...app, drive, company };
  });

  return { applications: enrichedApplications, applyToDrive, hasApplied, count: applications.length };
}
