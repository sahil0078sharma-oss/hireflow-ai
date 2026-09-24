/**
 * AppContext — shared application state
 *
 * Provides:
 * - applications (current list, synced with AWS backend)
 * - applyToDrive (async action calling AWS API)
 * - hasApplied (check)
 * - latestAnalysis (latest bound resume analysis with driveId context)
 * - setLatestAnalysis (saves context & persists to sessionStorage)
 * - getAnalysisForDrive (retrieves analysis for a specific driveId)
 * - atsScore (convenience getter from latestAnalysis)
 * - setAtsScore
 * - missingSkills (convenience getter from latestAnalysis)
 * - setMissingSkills
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as appService from '../services/applicationService.js';

const AppContext = createContext(null);

const STORAGE_KEY_LATEST = 'hireflow_latest_analysis';
const STORAGE_KEY_HISTORY = 'hireflow_analysis_history';

function loadFromSession(key, defaultVal) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (err) {
    console.warn(`Failed to read ${key} from sessionStorage:`, err);
    return defaultVal;
  }
}

export function AppProvider({ children }) {
  const [applications, setApplications] = useState(() => appService.getApplications());

  // Initialize analysis context from sessionStorage if available
  const [latestAnalysis, setLatestAnalysisState] = useState(() => loadFromSession(STORAGE_KEY_LATEST, null));
  const [analysisHistory, setAnalysisHistory] = useState(() => loadFromSession(STORAGE_KEY_HISTORY, {}));

  // Maintain convenience getters for backward compatibility
  const [atsScore, setAtsScoreState] = useState(() => latestAnalysis?.atsScore || null);
  const [missingSkills, setMissingSkillsState] = useState(() => latestAnalysis?.missingSkills || []);

  // Subscribe to service updates and load initial applications from AWS RDS backend
  useEffect(() => {
    appService.loadApplications().catch((err) => {
      console.warn('Initial application fetch from AWS backend:', err.message);
    });

    const unsubscribe = appService.subscribe((updated) => {
      setApplications(updated);
    });
    return unsubscribe;
  }, []);

  const setLatestAnalysis = useCallback((analysis) => {
    if (!analysis) {
      setLatestAnalysisState(null);
      setAtsScoreState(null);
      setMissingSkillsState([]);
      try {
        sessionStorage.removeItem(STORAGE_KEY_LATEST);
      } catch {}
      return;
    }

    // Only persist lightweight contextual fields — NEVER store raw resume or JD text in storage
    const sanitized = {
      driveId: analysis.driveId || null,
      mode: analysis.mode || (analysis.driveId ? 'college' : 'custom'),
      source: analysis.source || (analysis.driveId ? 'college-placement-drive' : 'student-uploaded-jd'),
      company: analysis.company || '',
      role: analysis.role || '',
      jobDescriptionSource: analysis.jobDescriptionSource || 'Pasted / Uploaded Text',
      atsScore: typeof analysis.atsScore === 'number' ? analysis.atsScore : null,
      matchedSkills: Array.isArray(analysis.matchedSkills) ? analysis.matchedSkills : [],
      missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [],
      requiredSkills: Array.isArray(analysis.requiredSkills)
        ? analysis.requiredSkills
        : Array.from(new Set([
            ...(Array.isArray(analysis.matchedSkills) ? analysis.matchedSkills : []),
            ...(Array.isArray(analysis.missingSkills) ? analysis.missingSkills : []),
          ])),
      resumeKeyPhrases: Array.isArray(analysis.resumeKeyPhrases) ? analysis.resumeKeyPhrases.slice(0, 15) : [],
      jobKeyPhrases: Array.isArray(analysis.jobKeyPhrases) ? analysis.jobKeyPhrases.slice(0, 15) : [],
      timestamp: analysis.timestamp || new Date().toISOString(),
    };

    setLatestAnalysisState(sanitized);
    setAtsScoreState(sanitized.atsScore);
    setMissingSkillsState(sanitized.missingSkills);

    // Save latest analysis to sessionStorage
    try {
      sessionStorage.setItem(STORAGE_KEY_LATEST, JSON.stringify(sanitized));
    } catch (err) {
      console.warn('sessionStorage write error for latest analysis:', err);
    }

    // Also update history map by driveId if driveId is present
    if (sanitized.driveId) {
      setAnalysisHistory((prev) => {
        const updated = { ...prev, [sanitized.driveId]: sanitized };
        try {
          sessionStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
        } catch (err) {
          console.warn('sessionStorage write error for analysis history:', err);
        }
        return updated;
      });
    }
  }, []);

  const getAnalysisForDrive = useCallback(
    (driveId) => {
      if (driveId === 'custom' || (!driveId && latestAnalysis?.mode === 'custom')) {
        return latestAnalysis;
      }
      if (!driveId) return null;
      if (latestAnalysis && latestAnalysis.driveId === driveId) {
        return latestAnalysis;
      }
      return analysisHistory[driveId] || null;
    },
    [latestAnalysis, analysisHistory]
  );

  const setAtsScore = useCallback((score) => {
    setAtsScoreState(score);
  }, []);

  const setMissingSkills = useCallback((skills) => {
    setMissingSkillsState(skills);
  }, []);

  const applyToDrive = useCallback(async (driveId) => {
    return await appService.applyToDrive(driveId);
  }, []);

  const hasApplied = useCallback(
    (driveId) => {
      return appService.hasApplied(driveId);
    },
    [applications]
  );

  return (
    <AppContext.Provider
      value={{
        applications,
        applyToDrive,
        hasApplied,
        atsScore,
        setAtsScore,
        missingSkills,
        setMissingSkills,
        latestAnalysis,
        setLatestAnalysis,
        analysisHistory,
        getAnalysisForDrive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
