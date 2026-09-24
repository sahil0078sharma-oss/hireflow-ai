/**
 * Application Service — src/services/applicationService.js
 *
 * Single source of truth for student application state.
 * Backed by AWS API Gateway + Lambda + RDS MySQL.
 */

import api from '../lib/api.js';
import { buildStages, PIPELINE_STAGES, APP_STATUS } from '../data/applications.js';

// ─── In-memory cache synced with AWS ───────────────────────────────────────
let applications = [];
let isInitialized = false;

// Pub/sub listeners — AppContext subscribes here so React re-renders on writes.
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn([...applications]));
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Subscribe to application state changes.
 * @param {Function} fn - callback: (applications: Application[]) => void
 * @returns {Function} unsubscribe
 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Load applications from AWS backend.
 * Called when AppContext mounts.
 * @returns {Promise<Application[]>}
 */
export async function loadApplications() {
  try {
    const data = await api.get('/applications');
    if (Array.isArray(data)) {
      applications = data;
      isInitialized = true;
      notifyListeners();
    }
    return [...applications];
  } catch (err) {
    console.error('Failed to load applications from AWS backend:', err);
    throw err;
  }
}

/**
 * Get all current applications (synchronous snapshot).
 * @returns {Application[]}
 */
export function getApplications() {
  return [...applications];
}

/**
 * Get a single application by its ID.
 * @param {string} id
 * @returns {Application|null}
 */
export function getApplicationById(id) {
  return applications.find((a) => a.id === id) || null;
}

/**
 * Check whether the current student has already applied to a drive.
 * @param {string} driveId
 * @returns {boolean}
 */
export function hasApplied(driveId) {
  return applications.some(
    (a) => a.driveId === driveId
  );
}

/**
 * Create a new application for the current student via AWS API.
 * @param {string} driveId
 * @returns {Promise<Application>}
 */
export async function applyToDrive(driveId) {
  if (hasApplied(driveId)) {
    throw new Error('You have already applied to this placement drive.');
  }

  try {
    const newApp = await api.post('/applications', {
      driveId,
    });

    // Prepend new application to cached list and notify React subscribers
    applications = [newApp, ...applications];
    notifyListeners();
    return newApp;
  } catch (err) {
    console.error('Failed to apply to drive on AWS:', err);
    throw err;
  }
}

/**
 * Advance or update an application's current placement stage.
 * (Local stage updater helper for UI demonstrations)
 */
export function updateApplicationStage(id, stageKey, outcome = null) {
  const validStageKeys = PIPELINE_STAGES.map((s) => s.key);
  if (!validStageKeys.includes(stageKey)) {
    throw new Error(`Invalid stage key: "${stageKey}". Valid keys: ${validStageKeys.join(', ')}`);
  }

  const index = applications.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error(`Application not found: ${id}`);
  }

  let newStatus;
  if (outcome === 'rejected') {
    newStatus = APP_STATUS.REJECTED;
  } else if (stageKey === 'final') {
    newStatus = APP_STATUS.SELECTED;
  } else {
    newStatus = stageKey === 'application' ? APP_STATUS.PENDING : APP_STATUS.IN_PROGRESS;
  }

  const updated = {
    ...applications[index],
    currentStage: stageKey,
    status: newStatus,
    stages: buildStages(stageKey, outcome),
  };

  applications = [
    ...applications.slice(0, index),
    updated,
    ...applications.slice(index + 1),
  ];

  notifyListeners();
  return updated;
}

/**
 * Resets cached applications state on logout.
 */
export function clearApplicationsCache() {
  applications = [];
  isInitialized = false;
  notifyListeners();
}
