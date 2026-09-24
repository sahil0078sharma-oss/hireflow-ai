import { useState, useEffect, useMemo, useCallback } from 'react';
import * as driveService from '../services/driveService.js';

/**
 * useDrives — hook for fetching, searching, and filtering placement drives
 * Connected directly to AWS API Gateway + Lambda + RDS MySQL.
 *
 * @param {object} initialFilters
 * @returns {{
 *   drives: Array,
 *   filteredDrives: Array,
 *   loading: boolean,
 *   error: string|null,
 *   retry: Function,
 *   search: string,
 *   setSearch: Function,
 *   filters: object,
 *   setFilters: Function,
 *   companies: Array
 * }}
 */
export function useDrives(initialFilters = {}) {
  const [drives, setDrives] = useState(() => driveService.getDrives());
  const [loading, setLoading] = useState(() => driveService.getDrives().length === 0);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    minPackage: 0,
    companyId: '',
    ...initialFilters,
  });

  const fetchDrives = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await driveService.loadDrives(forceRefresh);
      setDrives(data);
    } catch (err) {
      console.error('useDrives fetch error:', err);
      setError(err.message || 'Failed to connect to placement drives service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch from live RDS
    fetchDrives();

    // Subscribe to any external updates to drive cache
    const unsubscribe = driveService.subscribe((updated) => {
      setDrives(updated);
    });
    return unsubscribe;
  }, [fetchDrives]);

  const companies = useMemo(() => {
    return driveService.getCompanies();
  }, [drives]);

  const filteredDrives = useMemo(() => {
    let result = [...drives];

    // Text search: match company name/fullName, role, or required skills
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((d) => {
        const companyNameMatch = d.company?.name?.toLowerCase().includes(q);
        const companyFullMatch = d.company?.fullName?.toLowerCase().includes(q);
        const companyIdMatch = d.companyId?.toLowerCase().includes(q);
        const roleMatch = d.role?.toLowerCase().includes(q);
        const skillMatch = Array.isArray(d.requiredSkills) && d.requiredSkills.some((s) => s.toLowerCase().includes(q));
        return companyNameMatch || companyFullMatch || companyIdMatch || roleMatch || skillMatch;
      });
    }

    // Filter by company
    if (filters.companyId) {
      result = result.filter((d) => d.companyId === filters.companyId);
    }

    // Filter by min package
    if (filters.minPackage > 0) {
      result = result.filter((d) => (d.packageValue || 0) >= filters.minPackage);
    }

    // Sort
    if (filters.sortBy === 'package') {
      result.sort((a, b) => (b.packageValue || 0) - (a.packageValue || 0));
    } else if (filters.sortBy === 'posted') {
      result.sort((a, b) => new Date(b.postedDate || 0) - new Date(a.postedDate || 0));
    } else {
      // Default: sort by deadline (nearest first)
      result.sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0));
    }

    return result;
  }, [drives, search, filters]);

  const createDrive = useCallback(
    async (driveData) => {
      const created = await driveService.createDrive(driveData);
      await fetchDrives(true);
      return created;
    },
    [fetchDrives]
  );

  return {
    drives,
    filteredDrives,
    loading,
    error,
    retry: () => fetchDrives(true),
    createDrive,
    search,
    setSearch,
    filters,
    setFilters,
    companies,
    allDrives: drives,
  };
}
