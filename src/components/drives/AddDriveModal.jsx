import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

export default function AddDriveModal({ isOpen, onClose, onDriveCreated }) {
  const [formData, setFormData] = useState({
    companyName: '',
    companyDescription: '',
    role: '',
    jobDescription: '',
    package: '',
    location: '',
    mode: 'Hybrid',
    deadline: '',
    driveDate: '',
    skills: 'React, Python, SQL, AWS',
    minCGPA: '6.5',
    openings: '50',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Client-side required field validation
    const { companyName, role, jobDescription, package: pkg, location, deadline, driveDate } = formData;
    if (!companyName.trim() || !role.trim() || !jobDescription.trim() || !pkg.trim() || !location.trim() || !deadline) {
      setError('Please fill in all required fields (Company Name, Role, Job Description, Package, Location, and Deadline).');
      return;
    }

    setLoading(true);

    try {
      // Parse skills from comma-separated string
      const requiredSkills = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        companyName: companyName.trim(),
        companyDescription: formData.companyDescription.trim(),
        role: role.trim(),
        jobDescription: jobDescription.trim(),
        package: pkg.trim(),
        location: location.trim(),
        mode: formData.mode,
        deadline,
        driveDate: driveDate || deadline,
        requiredSkills: requiredSkills.length > 0 ? requiredSkills : ['Problem Solving', 'Data Structures', 'Communication'],
        openings: Number(formData.openings) || 50,
        driveType: 'On-Campus',
        eligibility: {
          degree: ['B.Tech', 'B.E', 'MCA'],
          branches: ['CSE', 'IT', 'ECE'],
          minCGPA: Number(formData.minCGPA) || 6.5,
          backlogs: 0,
        },
        rounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
      };

      const created = await onDriveCreated(payload);
      // Reset form on success
      setFormData({
        companyName: '',
        companyDescription: '',
        role: '',
        jobDescription: '',
        package: '',
        location: '',
        mode: 'Hybrid',
        deadline: '',
        driveDate: '',
        skills: 'React, Python, SQL, AWS',
        minCGPA: '6.5',
        openings: '50',
      });
      onClose();
      return created;
    } catch (err) {
      console.error('Error in AddDriveModal submission:', err);
      // Show actual error message from backend
      setError(err.message || 'Failed to create placement drive. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="Add Placement Drive"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && (
          <div className="alert alert--danger" role="alert" style={{ marginBottom: '0.5rem' }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Company Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="add-company-name">
              Company Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="add-company-name"
              name="companyName"
              type="text"
              className="form-input"
              placeholder="e.g. TechNova Solutions"
              value={formData.companyName}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <span className="form-hint">Reuses company if it already exists</span>
          </div>

          {/* Job Role */}
          <div className="form-group">
            <label className="form-label" htmlFor="add-role">
              Job Role <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="add-role"
              name="role"
              type="text"
              className="form-input"
              placeholder="e.g. Full Stack Cloud Engineer"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Company Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="add-company-desc">
            Company Description
          </label>
          <input
            id="add-company-desc"
            name="companyDescription"
            type="text"
            className="form-input"
            placeholder="e.g. Enterprise AI & Cloud Transformation Solutions"
            value={formData.companyDescription}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        {/* Job Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="add-job-desc">
            Job Description <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            id="add-job-desc"
            name="jobDescription"
            rows="3"
            className="form-textarea"
            placeholder="Describe key responsibilities, role expectations, and technical stack…"
            value={formData.jobDescription}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          {/* Package */}
          <div className="form-group">
            <label className="form-label" htmlFor="add-package">
              Package (LPA) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="add-package"
              name="package"
              type="text"
              className="form-input"
              placeholder="e.g. 8.50 LPA"
              value={formData.package}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="add-location">
              Location <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="add-location"
              name="location"
              type="text"
              className="form-input"
              placeholder="e.g. Bengaluru / Pune"
              value={formData.location}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Mode */}
          <div className="form-group">
            <label className="form-label" htmlFor="add-mode">
              Work Mode <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="add-mode"
              name="mode"
              className="form-select"
              value={formData.mode}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="Hybrid">Hybrid</option>
              <option value="On-Site">On-Site</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Application Deadline */}
          <div className="form-group">
            <label className="form-label" htmlFor="add-deadline">
              Application Deadline <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="add-deadline"
              name="deadline"
              type="date"
              className="form-input"
              value={formData.deadline}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* Drive Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="add-drive-date">
              Drive Date <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="add-drive-date"
              name="driveDate"
              type="date"
              className="form-input"
              value={formData.driveDate}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          {/* Required Skills */}
          <div className="form-group">
            <label className="form-label" htmlFor="add-skills">
              Required Skills
            </label>
            <input
              id="add-skills"
              name="skills"
              type="text"
              className="form-input"
              placeholder="e.g. React, Python, AWS, Docker"
              value={formData.skills}
              onChange={handleChange}
              disabled={loading}
            />
            <span className="form-hint">Comma-separated</span>
          </div>

          {/* Min CGPA */}
          <div className="form-group">
            <label className="form-label" htmlFor="add-min-cgpa">
              Min CGPA
            </label>
            <input
              id="add-min-cgpa"
              name="minCGPA"
              type="number"
              step="0.1"
              min="0"
              max="10"
              className="form-input"
              value={formData.minCGPA}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Openings */}
          <div className="form-group">
            <label className="form-label" htmlFor="add-openings">
              Openings
            </label>
            <input
              id="add-openings"
              name="openings"
              type="number"
              min="1"
              className="form-input"
              value={formData.openings}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            id="cancel-add-drive"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            id="submit-add-drive"
          >
            {loading ? 'Creating Placement Drive…' : 'Create Placement Drive'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
