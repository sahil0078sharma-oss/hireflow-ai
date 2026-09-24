/**
 * Authentication Service — src/services/authService.js
 *
 * Encapsulates authentication operations against the AWS API Gateway backend:
 * - POST /auth/login
 * - GET /auth/me
 * - POST /auth/logout
 *
 * Automatically works with the existing Bearer token mechanism in src/lib/api.js.
 */

import api, { ApiError } from '../lib/api.js';

export const AUTH_TOKEN_KEY = 'hireflow_auth_token';

/**
 * Normalizes student profile object across frontend expectations.
 * The backend returns `studentId`, whereas some UI components or models use `id`.
 *
 * @param {object} raw
 * @returns {object}
 */
export function normalizeStudentProfile(raw) {
  if (!raw) return null;
  const studentId = raw.studentId || raw.id || 'student-001';
  return {
    id: studentId,
    studentId: studentId,
    name: raw.name || '',
    email: raw.email || '',
    college: raw.college || '',
    degree: raw.degree || 'B.Tech',
    branch: raw.branch || 'CSE',
    graduationYear: raw.graduationYear || 2026,
    cgpa: typeof raw.cgpa === 'number' ? raw.cgpa : parseFloat(raw.cgpa) || 8.0,
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    avatar: raw.avatar || 'SS',
    resumeSummary: raw.resumeSummary || raw.resume_summary || '',
  };
}

/**
 * Authenticates user credentials via POST /auth/login.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, student: object }>}
 */
export async function login(email, password) {
  if (!email || !email.trim()) {
    throw new Error('Please enter your email address.');
  }
  if (!password) {
    throw new Error('Please enter your password.');
  }

  try {
    const response = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    if (!response || !response.token) {
      throw new Error('Invalid response from authentication server.');
    }

    // Persist token in sessionStorage
    try {
      sessionStorage.setItem(AUTH_TOKEN_KEY, response.token);
    } catch (storageErr) {
      console.warn('Unable to write to sessionStorage:', storageErr);
    }

    const student = normalizeStudentProfile(response.student);
    return {
      token: response.token,
      student,
    };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        throw new Error('Invalid email or password.');
      }
      if (err.status === 400) {
        throw new Error(err.body?.error || 'Email and password are required.');
      }
      throw new Error(err.body?.error || 'Authentication failed. Please try again.');
    }
    throw new Error(err.message || 'Unable to connect to login service. Please check your network.');
  }
}

/**
 * Retrieves the currently authenticated student profile via GET /auth/me.
 * Authorization header is automatically attached by src/lib/api.js using AUTH_TOKEN_KEY.
 *
 * @returns {Promise<object|null>} Normalized student profile, or null if unauthenticated.
 */
export async function getCurrentUser() {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  try {
    const response = await api.get('/auth/me');
    if (response && response.student) {
      return normalizeStudentProfile(response.student);
    }
    return null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      // Token is expired, invalid, or revoked
      clearStoredToken();
      return null;
    }
    console.warn('Failed to verify session token via /auth/me:', err.message);
    clearStoredToken();
    return null;
  }
}

/**
 * Logs out the current session via POST /auth/logout and clears sessionStorage.
 *
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const token = getStoredToken();
    if (token) {
      await api.post('/auth/logout', {});
    }
  } catch (err) {
    // Fail silently on logout network errors — local clearance is paramount
    console.warn('Server logout request warning:', err.message);
  } finally {
    clearStoredToken();
  }
}

/**
 * Reads token from sessionStorage.
 * @returns {string|null}
 */
export function getStoredToken() {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Clears token from sessionStorage.
 */
export function clearStoredToken() {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
}
