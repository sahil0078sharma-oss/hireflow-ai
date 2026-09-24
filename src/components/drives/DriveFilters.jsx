import React from 'react';
import { getCompanies } from '../../services/driveService.js';

/**
 * DriveFilters — search box + filter controls for placement drives page
 */
export default function DriveFilters({ search, onSearchChange, filters, onFilterChange, companies: propCompanies }) {
  const companiesList = (propCompanies && propCompanies.length > 0) ? propCompanies : getCompanies();
  return (
    <div className="filter-bar">
      {/* Search */}
      <div className="search-box" style={{ flex: 2 }}>
        <svg
          className="search-box__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          id="drives-search"
          type="search"
          className="form-input"
          placeholder="Search by company, role, or skill…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search placement drives"
        />
      </div>

      {/* Company Filter */}
      <select
        id="drives-filter-company"
        className="form-select"
        style={{ maxWidth: 180 }}
        value={filters.companyId}
        onChange={(e) => onFilterChange({ ...filters, companyId: e.target.value })}
        aria-label="Filter by company"
      >
        <option value="">All Companies</option>
        {companiesList.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Sort */}
      <select
        id="drives-sort"
        className="form-select"
        style={{ maxWidth: 180 }}
        value={filters.sortBy || 'deadline'}
        onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
        aria-label="Sort drives"
      >
        <option value="deadline">Deadline (Nearest)</option>
        <option value="package">Package (Highest)</option>
        <option value="posted">Recently Posted</option>
      </select>

      {/* Min Package */}
      <select
        id="drives-filter-package"
        className="form-select"
        style={{ maxWidth: 180 }}
        value={filters.minPackage || 0}
        onChange={(e) => onFilterChange({ ...filters, minPackage: Number(e.target.value) })}
        aria-label="Filter by minimum package"
      >
        <option value={0}>Any Package</option>
        <option value={350000}>3.5 LPA+</option>
        <option value={500000}>5 LPA+</option>
        <option value={700000}>7 LPA+</option>
        <option value={900000}>9 LPA+</option>
      </select>
    </div>
  );
}
