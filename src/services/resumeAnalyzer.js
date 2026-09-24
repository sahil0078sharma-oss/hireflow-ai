/**
 * Resume Analyzer Service — src/services/resumeAnalyzer.js
 *
 * Backed by Amazon Comprehend NLP Service via AWS API Gateway + Lambda.
 */

import api from '../lib/api.js';

// Controlled skill vocabulary for UI reference and badges
export const SKILL_VOCABULARY = [
  'python', 'java', 'javascript', 'typescript', 'c', 'c++', 'c#', 'golang', 'go',
  'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'rust',
  'html', 'css', 'react', 'reactjs', 'react.js', 'angular', 'vue', 'nextjs', 'next.js',
  'node.js', 'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring', 'spring boot',
  'sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'mongodb', 'redis', 'dynamodb',
  'aws', 'docker', 'kubernetes', 'terraform', 'jenkins', 'git', 'github', 'linux',
  'machine learning', 'deep learning', 'nlp', 'data science', 'tensorflow', 'pytorch',
  'scikit-learn', 'pandas', 'numpy', 'opencv', 'rest api', 'microservices',
];

const DISPLAY_OVERRIDES = {
  'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python',
  'java': 'Java', 'golang': 'Go', 'ruby': 'Ruby', 'php': 'PHP',
  'react': 'React', 'angular': 'Angular', 'vue': 'Vue', 'next.js': 'Next.js',
  'node.js': 'Node.js', 'django': 'Django', 'fastapi': 'FastAPI',
  'spring boot': 'Spring Boot', 'sql': 'SQL', 'mysql': 'MySQL',
  'postgresql': 'PostgreSQL', 'mongodb': 'MongoDB', 'redis': 'Redis',
  'aws': 'AWS', 'docker': 'Docker', 'kubernetes': 'Kubernetes',
  'machine learning': 'Machine Learning', 'deep learning': 'Deep Learning',
  'nlp': 'NLP', 'tensorflow': 'TensorFlow', 'pytorch': 'PyTorch',
  'scikit-learn': 'Scikit-Learn', 'pandas': 'Pandas', 'numpy': 'NumPy',
  'git': 'Git', 'github': 'GitHub', 'rest api': 'REST API',
};

export function displaySkill(skill) {
  return DISPLAY_OVERRIDES[skill.toLowerCase()] || skill.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Analyze resume against a job description using Amazon Comprehend NLP backend.
 *
 * @param {string} resumeText - text pasted by candidate
 * @param {string} jdText - job description text
 * @returns {Promise<{ atsScore: number, matchedSkills: string[], missingSkills: string[], recommendations: string[], resumeKeyPhrases: string[], jobKeyPhrases: string[], entities: Array, breakdown: object }>}
 */
export async function analyzeResume(resumeText, jdText) {
  if (!resumeText || !resumeText.trim()) {
    throw new Error('Please paste your resume text before analyzing.');
  }
  if (!jdText || !jdText.trim()) {
    throw new Error('Please paste a job description before analyzing.');
  }

  try {
    const response = await api.post('/resume/analyze', {
      resumeText: resumeText.trim(),
      jobDescription: jdText.trim(),
    });

    return response;
  } catch (err) {
    console.error('AWS Comprehend Resume Analysis failed:', err);
    throw new Error(err.message || 'Natural Language Processing analysis failed. Please try again.');
  }
}
