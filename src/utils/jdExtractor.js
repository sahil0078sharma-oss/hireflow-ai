/**
 * HireFlow AI — Deterministic Job Description Metadata Extractor
 * src/utils/jdExtractor.js
 *
 * Extracts Company Name and Job Role from uploaded or pasted Job Descriptions
 * and campus placement notices using structured rule-based NLP extraction.
 *
 * Designed to filter out institutional noise (e.g. college names, T&P cells,
 * platforms) and identify real hiring organizations and technical roles.
 */

// Institutional noise and non-company entities to strictly exclude
const BLACKLIST_COMPANIES = [
  /college/i,
  /university/i,
  /institute/i,
  /campus/i,
  /training\s*(?:&|and)\s*placement/i,
  /\bt&p\b/i,
  /placement\s*cell/i,
  /placement\s*department/i,
  /placement\s*office/i,
  /placement\s*notice/i,
  /placement\s*drive/i,
  /recruitment\s*notice/i,
  /recruitment\s*drive/i,
  /job\s*description/i,
  /\bnotice\b/i,
  /announcement/i,
  /dear\s*students/i,
  /hireflow/i,
  /google\s*form/i,
  /superset/i,
  /unstop/i,
  /linkedin/i,
  /naukri/i,
  /internshala/i,
  /eligibility/i,
  /requirements/i,
  /selection\s*process/i,
  /interview\s*schedule/i,
];

function isBlacklistedCompany(str) {
  if (!str || typeof str !== 'string' || str.trim().length < 2) return true;
  return BLACKLIST_COMPANIES.some((rgx) => rgx.test(str));
}

function cleanCompanyName(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let clean = raw.trim()
    .replace(/^[:\-–—|*~#\s]+|[:\-–—|*~#\s]+$/g, '')
    .split(/\n|\r/)[0]
    .replace(/\s+/g, ' ')
    .trim();

  // Strip trailing locations or parentheticals e.g. "75WAY Technologies (Mohali / Chandigarh)"
  clean = clean.replace(/\s*\([^)]*\)\s*$/, '').trim();

  // Strip trailing action verbs e.g. "is hiring", "is conducting", "invites applications"
  clean = clean.replace(/\s+(?:is\s+hiring|is\s+conducting|is\s+recruiting|invites\s+applications|announces|conducts).*$/i, '').trim();

  // Strip legal entity suffixes cleanly e.g. "Pvt. Ltd.", "Private Limited"
  clean = clean.replace(/,\s*(?:Pvt\.?\s*Ltd\.?|Private\s+Limited|LLC|Inc\.?|Corp\.?)$/i, '').trim();
  clean = clean.replace(/\s+(?:Pvt\.?\s*Ltd\.?|Private\s+Limited)$/i, '').trim();

  if (isBlacklistedCompany(clean)) return null;
  if (clean.length < 2 || clean.length > 60) return null;

  return clean;
}

function cleanRoleName(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let clean = raw.trim()
    .replace(/^[:\-–—|*~#\s]+|[:\-–—|*~#\s]+$/g, '')
    .split(/\n|\r/)[0]
    .replace(/\s+/g, ' ')
    .trim();

  // Strip trailing compensation, batch, or location metadata
  clean = clean.replace(/\s*[-–—|]\s*(?:\d+(?:\.\d+)?\s*(?:LPA|CTC|Stipend)|remote|bangalore|pune|delhi|mohali|noida|hyderabad|chennai|mumbai).*$/i, '').trim();
  clean = clean.replace(/\s*\([^)]*\)\s*$/, '').trim();

  // Ignore degree names erroneously parsed as roles
  if (/^(?:b\.?tech|mca|bca|m\.?tech|b\.?e|engineering|fresher|freshers|batch|all\s+branches)$/i.test(clean)) {
    return null;
  }

  if (clean.length < 3 || clean.length > 60) return null;
  return clean;
}

const COMMON_ROLES = [
  'Associate Software Engineer',
  'Software Engineer',
  'Software Developer',
  'Full Stack Developer',
  'Full Stack Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Web Developer',
  'Cloud Engineer',
  'Cloud Software Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Salesforce Intern',
  'Salesforce Developer',
  'Data Analyst',
  'Data Scientist',
  'Data Engineer',
  'Machine Learning Engineer',
  'AI Engineer',
  'QA Engineer',
  'Software Tester',
  'Automation Engineer',
  'Systems Engineer',
  'Graduate Engineer Trainee',
  'Software Engineering Intern',
  'Java Developer',
  'Python Developer',
  'React Developer',
  'Node.js Developer',
];

/**
 * Extracts company name and job role from job description text.
 *
 * @param {string} jdText - Raw or parsed job description / placement notice text
 * @returns {{
 *   companyName: string|null,
 *   companyConfidence: 'high'|'medium'|'none',
 *   jobRole: string|null,
 *   jobRoleConfidence: 'high'|'medium'|'none',
 *   source: string
 * }}
 */
export function extractCompanyAndRole(jdText) {
  if (!jdText || typeof jdText !== 'string' || !jdText.trim()) {
    return {
      companyName: null,
      companyConfidence: 'none',
      jobRole: null,
      jobRoleConfidence: 'none',
      source: 'none',
    };
  }

  const text = jdText.trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let detectedCompany = null;
  let companyConfidence = 'none';

  // 1. Explicit Company Label (Highest Confidence)
  // e.g. "Company Name: 75WAY Technologies", "Company: Paarsiv Technologies", "Client: AptCloud"
  const compLabelMatch = text.match(/(?:company(?:\s+name)?|organization|employer|hiring\s+company|client|firm)\s*[:\-–—|]\s*([^\n\r,;()]+)/i);
  if (compLabelMatch) {
    const cleaned = cleanCompanyName(compLabelMatch[1]);
    if (cleaned) {
      detectedCompany = cleaned;
      companyConfidence = 'high';
    }
  }

  // 2. Drive / Recruitment by [Company]
  // e.g. "Placement Drive by 75WAY Technologies", "Campus Recruitment by Paarsiv Technologies"
  if (!detectedCompany) {
    const driveByMatch = text.match(/(?:placement\s+drive\s+(?:by|for)|campus\s+(?:recruitment|placement|drive)\s+(?:by|for)|recruitment\s+drive\s+(?:by|for)|drive\s+by)\s*[:\-–—|]?\s*([A-Za-z0-9&.,\s'-]+?)(?:\s+for|\s+on|\s+is|\.|\n|$)/i);
    if (driveByMatch) {
      const cleaned = cleanCompanyName(driveByMatch[1]);
      if (cleaned) {
        detectedCompany = cleaned;
        companyConfidence = 'high';
      }
    }
  }

  // 3. Action sentence: "[Company] is hiring" or "[Company] invites applications"
  // e.g. "75WAY Technologies is hiring for Full Stack Developer"
  if (!detectedCompany) {
    const actionMatch = text.match(/([A-Z0-9][A-Za-z0-9&.,\s'-]+?)\s+(?:is\s+hiring|is\s+recruiting|invites\s+applications|is\s+conducting\s+(?:a\s+)?placement\s+drive|announces\s+(?:campus\s+)?placement)/i);
    if (actionMatch) {
      const cleaned = cleanCompanyName(actionMatch[1]);
      if (cleaned) {
        detectedCompany = cleaned;
        companyConfidence = 'medium';
      }
    }
  }

  // 4. "About [Company]" section
  // e.g. "About 75WAY Technologies: ...", "About the Company: 75WAY Technologies is a ..."
  if (!detectedCompany) {
    const aboutMatch = text.match(/(?:about\s+the\s+company\s*[:\-–—]?\s*|about\s+)([A-Z0-9][A-Za-z0-9&.,\s'-]+?)(?:\s*[:\-–—\n\r]|\s+is\s+|\s+delivers|\s+provides|\s+was\s+founded)/i);
    if (aboutMatch) {
      const candidate = aboutMatch[1].replace(/^(?:the\s+company|company|organization|us)\s*[:\-–—]?/i, '').trim();
      const cleaned = cleanCompanyName(candidate);
      if (cleaned) {
        detectedCompany = cleaned;
        companyConfidence = 'medium';
      }
    }
  }

  // 5. Header line inspection (first 3 non-empty lines with corporate suffix)
  // e.g. "75WAY Technologies Pvt. Ltd."
  if (!detectedCompany) {
    const CORP_SUFFIX_REGEX = /\b(?:Technologies|Tech|Solutions|Systems|Software|Infotech|Innovations|Labs|Consulting|Services|Enterprises|Pvt\.?\s*Ltd\.?|Private\s+Limited|LLC|Inc\.?)\b/i;
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      const line = lines[i];
      if (CORP_SUFFIX_REGEX.test(line) && !isBlacklistedCompany(line)) {
        const cleaned = cleanCompanyName(line);
        if (cleaned) {
          detectedCompany = cleaned;
          companyConfidence = 'medium';
          break;
        }
      }
    }
  }

  // -------------------------------------------------------------
  // Role Extraction
  // -------------------------------------------------------------
  let detectedRole = null;
  let jobRoleConfidence = 'none';

  // 1. Explicit Role / Position Label (Highest Confidence)
  // e.g. "Job Role: Associate Software Engineer", "Position: Salesforce Intern", "Job Title: Full Stack Developer"
  const roleLabelMatch = text.match(/(?:job\s+role|role|position|job\s+title|title|designation|hiring\s+for|vacancy(?:\s+for)?|post)\s*[:\-–—|]\s*([^\n\r,;]+)/i);
  if (roleLabelMatch) {
    const cleaned = cleanRoleName(roleLabelMatch[1]);
    if (cleaned) {
      detectedRole = cleaned;
      jobRoleConfidence = 'high';
    }
  }

  // 2. Action clause: "is hiring for [Role]"
  // e.g. "75WAY Technologies is hiring for Full Stack Developer"
  if (!detectedRole) {
    const hiringForMatch = text.match(/(?:is\s+hiring|recruiting|looking\s+for|invites\s+applications)\s+(?:for\s+)?(?:a\s+|an\s+)?([A-Za-z0-9/&.\s'-]+?)(?:\s+role|\s+position|\s+internship|\s+to\s+join|\s+with|\s+at|\.|\n|$)/i);
    if (hiringForMatch) {
      const cleaned = cleanRoleName(hiringForMatch[1]);
      if (cleaned) {
        detectedRole = cleaned;
        jobRoleConfidence = 'medium';
      }
    }
  }

  // 3. Position clause: "for the position of [Role]"
  if (!detectedRole) {
    const positionOfMatch = text.match(/(?:for\s+the\s+position\s+of|for\s+the\s+role\s+of)\s+([A-Za-z0-9/&.\s'-]+?)(?:\s+at|\.|\n|$)/i);
    if (positionOfMatch) {
      const cleaned = cleanRoleName(positionOfMatch[1]);
      if (cleaned) {
        detectedRole = cleaned;
        jobRoleConfidence = 'medium';
      }
    }
  }

  // 4. Lexicon scan: Match known standard industry roles in document
  if (!detectedRole) {
    for (const r of COMMON_ROLES) {
      const rgx = new RegExp(`\\b${r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (rgx.test(text)) {
        detectedRole = r;
        jobRoleConfidence = 'medium';
        break;
      }
    }
  }

  return {
    companyName: detectedCompany,
    companyConfidence,
    jobRole: detectedRole,
    jobRoleConfidence,
    source: detectedCompany || detectedRole ? 'document_text' : 'none',
  };
}
