// Companies — Aligned with RDS MySQL hireflow.companies
// RDS is the single source of truth; this file retains only the 2 official demo companies.

import { getCompanyById as getCompanyFromService } from '../services/driveService.js';

export const companies = [
  {
    id: 'company-accenture',
    name: 'Accenture',
    fullName: 'Accenture India',
    avatar: 'ACN',
    color: '#7C3AED',
    description:
      'Global professional services company in digital, cloud, and security. Demo Placement Drive.',
    website: 'https://www.accenture.com',
    industry: 'Management & Technology Consulting',
    headquarters: 'Bengaluru, India',
  },
  {
    id: 'company-infosys',
    name: 'Infosys',
    fullName: 'Infosys Limited',
    avatar: 'INF',
    color: '#0284C7',
    description:
      'Global leader in next-generation digital services and consulting. Demo Placement Drive.',
    website: 'https://www.infosys.com',
    industry: 'Enterprise Cloud & Digital Services',
    headquarters: 'Bengaluru, India',
  },
];

export const getCompanyById = (id) => getCompanyFromService(id) || companies.find((c) => c.id === id) || null;
