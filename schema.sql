-- ==========================================================
-- HireFlow AI — MySQL Database Schema
-- Database: hireflow
-- ==========================================================

CREATE DATABASE IF NOT EXISTS hireflow
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hireflow;

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    industry VARCHAR(128),
    location VARCHAR(255),
    website VARCHAR(255),
    avatar VARCHAR(16),
    color VARCHAR(32),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    college VARCHAR(255) NOT NULL,
    degree VARCHAR(64) NOT NULL,
    branch VARCHAR(128) NOT NULL,
    graduation_year INT NOT NULL,
    cgpa DECIMAL(3, 2) NOT NULL,
    skills JSON,
    resume_summary TEXT,
    ats_score INT DEFAULT NULL,
    avatar VARCHAR(16) DEFAULT 'RS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Placement Drives Table
CREATE TABLE IF NOT EXISTS drives (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    role VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    required_skills JSON,
    eligibility JSON,
    deadline DATE NOT NULL,
    package VARCHAR(64) NOT NULL,
    package_value INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    mode VARCHAR(32) NOT NULL DEFAULT 'Hybrid',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    posted_date DATE NOT NULL,
    openings INT NOT NULL,
    drive_type VARCHAR(64) NOT NULL DEFAULT 'On-Campus',
    rounds JSON,
    drive_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    drive_id VARCHAR(64) NOT NULL,
    applied_date DATE NOT NULL,
    current_stage VARCHAR(64) NOT NULL DEFAULT 'application',
    status VARCHAR(64) NOT NULL DEFAULT 'Pending Review',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_student_drive (student_id, drive_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for performance
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_drive ON applications(drive_id);
