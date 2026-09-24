-- ==========================================================
-- HireFlow AI — Seed Data for MySQL
-- Database: hireflow
-- Aligns with src/data/companies.js, students.js, drives.js, applications.js
-- ==========================================================

USE hireflow;

-- Clean existing data in reverse foreign key order
DELETE FROM applications;
DELETE FROM drives;
DELETE FROM students;
DELETE FROM companies;

-- 1. Companies Seed Data (Only Accenture and Infosys)
INSERT INTO companies (id, name, full_name, industry, location, website, avatar, color) VALUES
('company-accenture', 'Accenture', 'Accenture India', 'Management & Technology Consulting', 'Bengaluru, India', 'https://www.accenture.com', 'ACN', '#7C3AED'),
('company-infosys', 'Infosys', 'Infosys Limited', 'Enterprise Cloud & Digital Services', 'Bengaluru, India', 'https://www.infosys.com', 'INF', '#0284C7');

-- 2. Demo Student Seed Data (Rahul Sharma)
INSERT INTO students (id, name, email, college, degree, branch, graduation_year, cgpa, skills, resume_summary, ats_score, avatar) VALUES
('student-001', 'Rahul Sharma', 'rahul.sharma@college.edu', 'National Institute of Technology, Delhi', 'B.Tech', 'Computer Science & Engineering', 2025, 8.40,
 '["Python", "JavaScript", "React", "SQL", "Git", "HTML", "CSS", "Node.js", "REST API", "MySQL"]',
 'Final year CSE student with strong programming fundamentals and web development experience.',
 NULL, 'RS');

-- 3. Placement Drives Seed Data (Exactly 2 drives)
INSERT INTO drives (id, company_id, role, description, required_skills, eligibility, deadline, package, package_value, location, mode, status, posted_date, openings, drive_type, rounds) VALUES
('drive-accenture-01', 'company-accenture', 'Associate Software Engineer',
 'Build and maintain software solutions for global clients across industries. [Demo Placement Drive]',
 '["JavaScript", "React", "Node.js", "Git", "REST API", "HTML", "CSS"]',
 '{"degree": ["B.Tech", "B.E", "BCA", "MCA"], "branches": ["CSE", "IT", "ECE"], "minCGPA": 6.5, "backlogs": 0}',
 '2026-10-25', '4.50 LPA', 450000, 'Bengaluru / Mumbai / Hyderabad', 'Hybrid', 'active', '2026-09-05', 300, 'On-Campus',
 '["Communication Test", "Aptitude", "Technical Interview", "HR"]'),

('drive-infosys-01', 'company-infosys', 'Systems Engineer Trainee',
 'Entry-level engineering role with comprehensive 16-week training program. [Demo Placement Drive]',
 '["Java", "Python", "SQL", "Git", "HTML"]',
 '{"degree": ["B.Tech", "B.E", "BCA", "MCA", "B.Sc"], "branches": ["CSE", "IT", "ECE", "EEE", "Mechanical"], "minCGPA": 6.0, "backlogs": 0}',
 '2026-10-30', '3.60 LPA', 360000, 'Pan India', 'Hybrid', 'active', '2026-09-02', 1000, 'On-Campus',
 '["HackerRank Test", "Aptitude", "Technical Interview", "HR"]');

-- 4. Initial Demo Applications Seed Data (References the 2 drives)
INSERT INTO applications (id, student_id, drive_id, applied_date, current_stage, status) VALUES
('app-002', 'student-001', 'drive-accenture-01', '2026-09-06', 'resume_screening', 'Pending Review'),
('app-003', 'student-001', 'drive-infosys-01', '2026-09-01', 'final', 'Selected');

