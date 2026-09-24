/**
 * Authentication Context — src/context/AuthContext.jsx
 *
 * Provides application-wide authentication state:
 * - user: Authenticated student profile (or null)
 * - token: Active session token (or null)
 * - isAuthenticated: boolean
 * - isLoading: boolean (true while validating existing session)
 * - error: string | null
 * - login: (email, password) => Promise<object>
 * - logout: () => Promise<void>
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService.js';
import { clearApplicationsCache } from '../services/applicationService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => authService.getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and validate existing session from sessionStorage on mount
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const storedToken = authService.getStoredToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const studentProfile = await authService.getCurrentUser();
        if (isMounted) {
          if (studentProfile) {
            setUser(studentProfile);
            setToken(storedToken);
          } else {
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.login(email, password);
      setUser(result.student);
      setToken(result.token);
      return result.student;
    } catch (err) {
      setUser(null);
      setToken(null);
      const cleanMessage = err.message || 'Login failed. Please check your credentials.';
      setError(cleanMessage);
      throw new Error(cleanMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout exception ignored:', err);
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
      clearApplicationsCache();
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
