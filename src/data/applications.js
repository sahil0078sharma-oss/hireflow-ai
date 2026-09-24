// Initial seed applications for the demo student
// These represent pre-existing applications at different pipeline stages.

export const PIPELINE_STAGES = [
  { key: 'application', label: 'Application' },
  { key: 'resume_screening', label: 'Resume Screening' },
  { key: 'aptitude', label: 'Aptitude' },
  { key: 'technical', label: 'Technical Round' },
  { key: 'hr', label: 'HR Round' },
  { key: 'final', label: 'Final Result' },
];

// Stage status values
export const STAGE_STATUS = {
  COMPLETED: 'completed',
  CURRENT: 'current',
  PENDING: 'pending',
  REJECTED: 'rejected',
};

// Overall application status values
export const APP_STATUS = {
  IN_PROGRESS: 'In Progress',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
  PENDING: 'Pending Review',
};

// Build a stage array for a given currentStageKey and overall outcome
export function buildStages(currentStageKey, outcome = null) {
  const stageKeys = PIPELINE_STAGES.map((s) => s.key);
  const currentIndex = stageKeys.indexOf(currentStageKey);

  return PIPELINE_STAGES.map((stage, idx) => {
    let status;
    if (idx < currentIndex) {
      status = STAGE_STATUS.COMPLETED;
    } else if (idx === currentIndex) {
      status = outcome === 'rejected' ? STAGE_STATUS.REJECTED : STAGE_STATUS.CURRENT;
    } else {
      status = STAGE_STATUS.PENDING;
    }
    return { ...stage, status };
  });
}

// Seed application data — pre-existing demo applications
export const seedApplications = [
  {
    id: 'app-002',
    studentId: 'student-001',
    driveId: 'drive-accenture-01',
    appliedDate: '2026-09-06',
    currentStage: 'resume_screening',
    status: APP_STATUS.PENDING,
    stages: buildStages('resume_screening'),
  },
  {
    id: 'app-003',
    studentId: 'student-001',
    driveId: 'drive-infosys-01',
    appliedDate: '2026-09-01',
    currentStage: 'final',
    status: APP_STATUS.SELECTED,
    stages: buildStages('final'),
  },
];
