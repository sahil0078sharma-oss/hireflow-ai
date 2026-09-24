/**
 * Drive Service — src/services/driveService.js
 *
 * Single source of truth for placement drives and companies.
 * Backed by AWS API Gateway + Lambda + RDS MySQL.
 */

import api from '../lib/api.js';

// ─── In-memory cache synced with AWS RDS ───────────────────────────────────
let cachedDrives = [];
let cachedCompanies = [];
let isInitialized = false;

// Pub/sub listeners — React hooks/components subscribe here for reactive updates.
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn([...cachedDrives]));
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Subscribe to drive state changes.
 * @param {Function} fn - callback: (drives: Drive[]) => void
 * @returns {Function} unsubscribe
 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Load placement drives from live AWS RDS backend.
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<Drive[]>}
 */
export async function loadDrives(forceRefresh = false) {
  if (isInitialized && !forceRefresh && cachedDrives.length > 0) {
    return [...cachedDrives];
  }

  try {
    const data = await api.get('/drives');
    if (Array.isArray(data)) {
      cachedDrives = data;
      isInitialized = true;

      // Also extract and populate company records from joined drive objects
      const companiesMap = new Map();
      cachedDrives.forEach((d) => {
        if (d.company && d.company.id) {
          companiesMap.set(d.company.id, d.company);
        }
      });
      cachedCompanies = Array.from(companiesMap.values());

      notifyListeners();
    }
    return [...cachedDrives];
  } catch (err) {
    console.error('Failed to load placement drives from RDS backend:', err);
    throw err;
  }
}

/**
 * Synchronous snapshot of all current cached drives.
 * @returns {Drive[]}
 */
export function getDrives() {
  return [...cachedDrives];
}

/**
 * Find a drive by ID from cache.
 * @param {string} id
 * @returns {Drive|null}
 */
export function getDriveById(id) {
  return cachedDrives.find((d) => d.id === id) || null;
}

/**
 * Get all known companies from RDS drives.
 * @returns {Company[]}
 */
export function getCompanies() {
  if (cachedCompanies.length > 0) {
    return [...cachedCompanies];
  }
  // Fallback to extracting from drives if direct companies list isn't set yet
  const companiesMap = new Map();
  cachedDrives.forEach((d) => {
    if (d.company && d.company.id) {
      companiesMap.set(d.company.id, d.company);
    }
  });
  return Array.from(companiesMap.values());
}

export function getCompanyById(id) {
  if (!id) return null;
  const directMatch = cachedCompanies.find((c) => c.id === id);
  if (directMatch) return directMatch;

  const driveMatch = cachedDrives.find((d) => d.companyId === id || d.company?.id === id);
  return driveMatch?.company || null;
}

/**
 * Create a new placement drive via live AWS API Gateway + Lambda + RDS.
 * @param {object} driveData
 * @returns {Promise<Drive>}
 */
export async function createDrive(driveData) {
  try {
    const newDrive = await api.post('/drives', driveData);
    if (newDrive && newDrive.id) {
      cachedDrives = [newDrive, ...cachedDrives];
      if (newDrive.company && !cachedCompanies.some((c) => c.id === newDrive.company.id)) {
        cachedCompanies = [newDrive.company, ...cachedCompanies];
      }
      notifyListeners();
    }
    return newDrive;
  } catch (err) {
    console.error('Failed to create placement drive on RDS:', err);
    throw err;
  }
}

