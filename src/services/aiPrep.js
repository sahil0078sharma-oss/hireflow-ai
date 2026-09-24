/**
 * Adaptive Placement Preparation Service — src/services/aiPrep.js
 *
 * Connects to AWS API Gateway (GET /preparation) backed by:
 * - RDS MySQL (Placement Drives, Companies, Student Application Stage)
 * - Amazon Comprehend NLP skill-gap signals (missingSkills)
 * - Curated Question Matrix
 *
 * Provides graceful offline fallback with explicit user-facing indicator.
 */

import api from '../lib/api.js';
import preparationData from '../data/aiResponses.js';
import { drives } from '../data/drives.js';
import { companies } from '../data/companies.js';

export const PREP_CATEGORIES = [
  { key: 'technical', label: 'Technical' },
  { key: 'aptitude', label: 'Aptitude' },
  { key: 'hr', label: 'HR' },
  { key: 'company-role', label: 'Company & Role' },
];

/**
 * Fetch personalized placement preparation plan from AWS API Gateway.
 * Supports both:
 * - Mode A: College Placement Drive (?driveId=...)
 * - Mode B: Student Custom JD (?mode=custom&customCompany=...&customRole=...)
 *
 * @param {string|object} targetOrDriveId - Target placement drive ID, or config object
 * @param {string} categoryKey - 'technical', 'aptitude', 'hr', 'company-role'
 * @param {string[]} missingSkills - e.g. ['Docker', 'SQL']
 * @param {string} analysisDriveId - Drive ID from resume analysis context
 * @param {number} atsScore - ATS score from resume analysis
 * @param {object} options - Optional parameters { mode, company, role, jdSkills }
 * @returns {Promise<object>} Complete personalized preparation plan
 */
export async function getPreparationPlan(
  targetOrDriveId,
  categoryKey = 'technical',
  missingSkills = [],
  analysisDriveId = null,
  atsScore = null,
  options = {}
) {
  const isTargetObj = typeof targetOrDriveId === 'object' && targetOrDriveId !== null;
  const driveId = isTargetObj ? targetOrDriveId.driveId : targetOrDriveId;
  const mode = options.mode || (isTargetObj ? targetOrDriveId.mode : (driveId === 'custom' || !driveId ? 'custom' : 'drive'));
  const cat = (isTargetObj ? targetOrDriveId.categoryKey : null) || categoryKey || 'technical';
  const missing = (isTargetObj ? targetOrDriveId.missingSkills : null) || missingSkills || [];
  const score = (isTargetObj && typeof targetOrDriveId.atsScore === 'number') ? targetOrDriveId.atsScore : atsScore;
  const company = options.company || (isTargetObj ? targetOrDriveId.company : '') || '';
  const role = options.role || (isTargetObj ? targetOrDriveId.role : '') || '';
  const jdSkills = options.jdSkills || (isTargetObj ? targetOrDriveId.jdSkills : []) || [];

  // Mode B: Student Custom JD
  if (mode === 'custom' || driveId === 'custom') {
    try {
      const params = new URLSearchParams();
      params.append('mode', 'custom');
      if (company) params.append('customCompany', company);
      if (role) params.append('customRole', role);
      if (cat) params.append('category', cat);
      if (missing && missing.length > 0) params.append('missingSkills', missing.join(','));
      if (typeof score === 'number') params.append('atsScore', score.toString());
      if (jdSkills && jdSkills.length > 0) params.append('jdSkills', jdSkills.join(','));

      const response = await api.get(`/preparation?${params.toString()}`);
      return {
        ...response,
        isOffline: false,
      };
    } catch (err) {
      console.warn('Live /preparation API unavailable for custom mode, generating custom fallback plan:', err.message);
      return getCustomFallbackPlan({
        company,
        role,
        categoryKey: cat,
        missingSkills: missing,
        atsScore: score,
        jdSkills,
      });
    }
  }

  // Mode A: College Placement Drive
  try {
    const params = new URLSearchParams();
    if (driveId) params.append('driveId', driveId);
    if (cat) params.append('category', cat);
    if (missing && missing.length > 0) {
      params.append('missingSkills', missing.join(','));
    }
    if (analysisDriveId) {
      params.append('analysisDriveId', analysisDriveId);
    }
    if (typeof score === 'number') {
      params.append('atsScore', score.toString());
    }

    const response = await api.get(`/preparation?${params.toString()}`);
    return {
      ...response,
      isOffline: false,
    };
  } catch (err) {
    console.warn('Live /preparation API unavailable, switching to curated offline fallback:', err.message);
    return getFallbackPlan(driveId, cat, analysisDriveId, missing, score);
  }
}

/**
 * Dynamic Custom Fallback Generator for Student-Uploaded Job Descriptions.
 * Ensures the student's company, role, ATS score, and missing skills are strictly preserved
 * and NEVER falls back to Accenture, Infosys, or another college placement drive.
 */
export function getCustomFallbackPlan({
  company = 'External Organization',
  role = 'Custom Role',
  categoryKey = 'technical',
  missingSkills = [],
  atsScore = null,
  jdSkills = [],
}) {
  const allTechnicalQuestions = [];
  const allAptitudeQuestions = [];
  const allHrQuestions = [];

  Object.values(preparationData).forEach((compObj) => {
    Object.values(compObj).forEach((roleObj) => {
      if (Array.isArray(roleObj.technical)) allTechnicalQuestions.push(...roleObj.technical);
      if (Array.isArray(roleObj.aptitude)) allAptitudeQuestions.push(...roleObj.aptitude);
      if (Array.isArray(roleObj.hr)) allHrQuestions.push(...roleObj.hr);
    });
  });

  let selectedQuestions = [];
  if (categoryKey === 'technical') {
    const missingLower = (missingSkills || []).map((s) => s.toLowerCase());
    const matching = allTechnicalQuestions.filter((q) =>
      missingLower.some((m) => q.question.toLowerCase().includes(m) || q.answer.toLowerCase().includes(m))
    );
    const others = allTechnicalQuestions.filter((q) => !matching.includes(q));
    selectedQuestions = [...matching, ...others].slice(0, 5);
  } else if (categoryKey === 'aptitude') {
    selectedQuestions = allAptitudeQuestions.slice(0, 5);
  } else if (categoryKey === 'hr') {
    selectedQuestions = allHrQuestions.slice(0, 5);
  } else {
    // categoryKey === 'company-role'
    selectedQuestions = [
      {
        question: `Why are you interested in joining ${company} as a ${role}?`,
        answer: `Align your answer with ${company}'s products, scale, and engineering practices. Reference how your technical background in ${(missingSkills.concat(jdSkills)).slice(0, 3).join(', ') || 'cloud and software systems'} directly addresses their requirements.`,
        tips: `Research ${company}'s domain and explain why ${role} aligns with your career trajectory.`,
      },
      {
        question: `Describe an architecture or technical challenge relevant to ${company}'s ${role} position.`,
        answer: `Walk through a concrete architecture you built or optimized. Detail trade-offs between performance, reliability, and cost, explaining how you would apply these lessons at ${company}.`,
        tips: 'Use the STAR method (Situation, Task, Action, Result) with measurable metrics.',
      },
      {
        question: `How do you approach learning and closing skill gaps like ${missingSkills[0] || 'new cloud technologies'} when joining a team?`,
        answer: `Explain your process: analyzing official documentation, creating proof-of-concept prototypes, writing test cases, and collaborating with senior peers.`,
        tips: 'Demonstrate intellectual humility combined with rapid technical adaptability.',
      },
    ];
  }

  const prioritySkills = (missingSkills || []).map((skill) => ({
    skill,
    priority: 'HIGH',
    reason: `Identified gap from analyzed resume for ${company}.`,
  }));

  if (prioritySkills.length === 0 && jdSkills && jdSkills.length > 0) {
    jdSkills.forEach((s) => {
      prioritySkills.push({
        skill: s,
        priority: 'MEDIUM',
        reason: `Target required competency for ${role}.`,
      });
    });
  }

  const effectiveScore = typeof atsScore === 'number' ? atsScore : 68;

  return {
    success: true,
    company: company || 'Custom Target',
    companyId: 'custom',
    driveId: null,
    role: role || 'Target Role',
    applicationStage: 'Preparation (Student-Uploaded JD)',
    applicationStageKey: 'custom',
    applicationStatus: 'Custom Analysis',
    hasApplied: false,
    readinessScore: effectiveScore,
    prioritySkills,
    roundFocus: [
      `${role} Core Competencies`,
      'System Architecture & Design',
      'Problem Solving & Coding',
      `${company} Domain & Cultural Fit`,
    ],
    questions: selectedQuestions.map((q) => ({
      question: q.question,
      answer: q.answer,
      tip: q.tips || q.tip || '',
      topic: role,
      difficulty: 'Intermediate',
    })),
    recommendations: [
      `Review core requirements and technical focus areas for ${role} at ${company}.`,
      prioritySkills.length > 0
        ? `Focus immediate study on identified resume gaps for ${company}: ${prioritySkills.map((p) => p.skill).join(', ')}.`
        : `Prepare concrete project demonstrations illustrating your practical implementation experience for ${role}.`,
      `Structure behavioral responses using the STAR method (Situation, Task, Action, Result) focused on ${role} challenges.`,
    ],
    isOffline: true,
    analysisContext: {
      linked: true,
      mode: 'custom',
      source: 'student-uploaded-jd',
      company,
      role,
      atsScore: effectiveScore,
      missingSkills,
    },
    meta: {
      totalQuestions: selectedQuestions.length,
      selectedCategory: categoryKey,
      source: 'student-uploaded-jd',
      requiredSkills: jdSkills.length > 0 ? jdSkills : missingSkills,
      rounds: ['Technical Screening', 'Domain Interview', 'Managerial / HR'],
      package: 'Competitive / Industry Standard',
      location: 'Custom Location',
    },
  };
}

/**
 * Graceful offline fallback content generator for College Placement Drives.
 * Explicitly flags `isOffline: true` and `source: "Offline preparation content"`.
 */
export function getFallbackPlan(
  driveId,
  categoryKey = 'technical',
  analysisDriveId = null,
  missingSkills = [],
  atsScore = null
) {
  const drive = drives.find((d) => d.id === driveId) || drives[0];
  const company = companies.find((c) => c.id === drive.companyId) || companies[0];
  const companyData = preparationData[drive.companyId] || {};
  const roleData = companyData[drive.role] || Object.values(companyData)[0] || {};
  const questions = roleData[categoryKey] || [];

  return {
    success: true,
    company: company.name,
    companyId: company.id,
    driveId: drive.id,
    role: drive.role,
    applicationStage: 'Preparation (Offline Mode)',
    applicationStageKey: 'offline',
    applicationStatus: 'Offline Cache',
    hasApplied: false,
    readinessScore: 65,
    prioritySkills: (drive.requiredSkills || []).map((skill) => ({
      skill,
      priority: 'MEDIUM',
      reason: 'Required skill for this role (offline mode — live gap analysis unavailable).',
    })),
    roundFocus: ['Core Fundamentals', 'Role Requirements', 'Company Awareness'],
    questions: questions.map((q) => ({
      ...q,
      difficulty: 'Intermediate',
      topic: drive.role,
    })),
    recommendations: [
      `Review ${company.name}'s key technical requirements for ${drive.role}.`,
      'Connect to the network to receive live RDS application stage sync and Comprehend gap analysis.',
    ],
    isOffline: true,
    analysisContext:
      analysisDriveId && analysisDriveId === drive.id
        ? {
            linked: true,
            driveId: drive.id,
            atsScore,
            missingSkills,
          }
        : {
            linked: false,
            driveId: null,
            message: 'No resume analysis linked to this placement drive.',
          },
    meta: {
      totalQuestions: questions.length,
      selectedCategory: categoryKey,
      source: 'Offline preparation content',
      requiredSkills: drive.requiredSkills || [],
      rounds: drive.rounds || [],
      package: drive.package,
      location: drive.location,
    },
  };
}

/**
 * Backward compatibility: synchronous lookup into local data.
 */
export function getPreparationContent(companyId, role, categoryKey) {
  const companyData = preparationData[companyId];
  if (!companyData) {
    return { questions: [], meta: { message: 'No preparation content available for this company.' } };
  }

  const roleData = companyData[role];
  if (!roleData) {
    return { questions: [], meta: { message: `No preparation content available for role: ${role}.` } };
  }

  const categoryData = roleData[categoryKey];
  if (!categoryData || categoryData.length === 0) {
    return { questions: [], meta: { message: `No content available for category: ${categoryKey}.` } };
  }

  return {
    questions: categoryData,
    meta: {
      companyId,
      role,
      category: categoryKey,
      totalQuestions: categoryData.length,
      source: 'Offline preparation content',
    },
  };
}

export function getRolesForCompany(companyId) {
  const companyData = preparationData[companyId];
  if (!companyData) return [];
  return Object.keys(companyData);
}

export function getAvailableCompanies() {
  return Object.keys(preparationData);
}
