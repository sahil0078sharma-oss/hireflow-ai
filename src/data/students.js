// Demo student profile — single student for this phase.
// This fallback data is aligned with the RDS source of truth
// (maintained by Lambda ensure_schema()). When authentication is
// implemented, this will be replaced by the /auth/me API response.
export const currentStudent = {
  id: 'student-001',
  name: 'Sahil Sharma',
  email: 'sahil.sharma@aryacollege.in',
  college: 'Arya College of Engineering',
  degree: 'B.Tech',
  branch: 'CSE',
  graduationYear: 2026,
  cgpa: 8.0,
  skills: [
    'Python', 'JavaScript', 'React', 'SQL', 'Git', 'HTML', 'CSS',
    'Node.js', 'REST API', 'MySQL',
  ],
  resume: {
    summary: 'Final year CSE student at Arya College of Engineering with strong programming fundamentals and cloud experience.',
    experience: [],
    projects: [
      {
        name: 'Smart Attendance System',
        tech: ['Python', 'OpenCV', 'MySQL'],
        description: 'Face-recognition based attendance using OpenCV and Python.',
      },
      {
        name: 'E-Commerce Portal',
        tech: ['React', 'Node.js', 'MongoDB'],
        description: 'Full-stack e-commerce application with cart and payment UI.',
      },
    ],
  },
  atsScore: null, // populated after first resume analysis
  avatar: 'SS',
};
