// Placement Drives — Aligned with RDS MySQL hireflow.drives
// RDS is the single source of truth; this file retains only the 2 official demo drives.

import { getDriveById as getDriveFromService } from '../services/driveService.js';

export const drives = [
  {
    id: 'drive-accenture-01',
    companyId: 'company-accenture',
    role: 'Associate Software Engineer',
    description:
      'Build and maintain software solutions for global clients across industries. [Demo Placement Drive]',
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'Git', 'REST API', 'HTML', 'CSS'],
    eligibility: {
      degree: ['B.Tech', 'B.E', 'BCA', 'MCA'],
      branches: ['CSE', 'IT', 'ECE'],
      minCGPA: 6.5,
      backlogs: 0,
    },
    deadline: '2026-10-25',
    package: '4.50 LPA',
    packageValue: 450000,
    location: 'Bengaluru / Mumbai / Hyderabad',
    mode: 'Hybrid',
    status: 'active',
    postedDate: '2026-09-05',
    openings: 300,
    driveType: 'On-Campus',
    rounds: ['Communication Test', 'Aptitude', 'Technical Interview', 'HR'],
  },
  {
    id: 'drive-infosys-01',
    companyId: 'company-infosys',
    role: 'Systems Engineer Trainee',
    description:
      'Entry-level engineering role with comprehensive 16-week training program. [Demo Placement Drive]',
    requiredSkills: ['Java', 'Python', 'SQL', 'Git', 'HTML'],
    eligibility: {
      degree: ['B.Tech', 'B.E', 'BCA', 'MCA', 'B.Sc'],
      branches: ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'],
      minCGPA: 6.0,
      backlogs: 0,
    },
    deadline: '2026-10-30',
    package: '3.60 LPA',
    packageValue: 360000,
    location: 'Pan India',
    mode: 'Hybrid',
    status: 'active',
    postedDate: '2026-09-02',
    openings: 1000,
    driveType: 'On-Campus',
    rounds: ['HackerRank Test', 'Aptitude', 'Technical Interview', 'HR'],
  },
];

export const getDriveById = (id) => getDriveFromService(id) || drives.find((d) => d.id === id) || null;
