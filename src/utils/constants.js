// Application-wide constants

export const APP_NAME = 'HireFlow AI';
export const APP_TAGLINE = 'AI-Powered Campus Placement Platform';

export const NAV_LINKS = [
  { path: '/', label: 'Dashboard', icon: 'grid' },
  { path: '/drives', label: 'Placement Drives', icon: 'briefcase' },
  { path: '/applications', label: 'My Applications', icon: 'file-text' },
  { path: '/resume', label: 'Resume Analyzer', icon: 'search' },
  { path: '/preparation', label: 'AI Preparation', icon: 'cpu' },
];

export const STAGE_LABELS = {
  application: 'Application',
  resume_screening: 'Resume Screening',
  aptitude: 'Aptitude',
  technical: 'Technical Round',
  hr: 'HR Round',
  final: 'Final Result',
};

export const STATUS_COLORS = {
  'In Progress': 'status-progress',
  'Selected': 'status-selected',
  'Rejected': 'status-rejected',
  'Pending Review': 'status-pending',
};

export const DRIVE_FILTERS = {
  STATUS: ['active', 'closed'],
  SORT: [
    { value: 'deadline', label: 'Deadline (Nearest)' },
    { value: 'package', label: 'Package (Highest)' },
    { value: 'posted', label: 'Recently Posted' },
  ],
};
