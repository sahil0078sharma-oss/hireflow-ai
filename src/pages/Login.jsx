/**
 * Login Page — src/pages/Login.jsx
 *
 * Provides student authentication into the HireFlow AI placement platform.
 * Integrates directly with AuthContext and AWS API Gateway (/auth/login).
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated and not loading, redirect to intended target or dashboard
  if (isAuthenticated && !isLoading) {
    const fromPath = location.state?.from?.pathname || '/';
    return <Navigate to={fromPath} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cleanEmail, password);
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-card__header">
          <div className="login-brand">
            <div className="login-brand__logo" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="login-brand__title">HireFlow AI</h1>
          </div>
          <p className="login-card__subtitle">
            Campus Placement Management & Preparation Platform
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="login-alert" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Student Email
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sahil.sharma@aryacollege.in"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            id="login-submit-button"
          >
            {isSubmitting ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="btn-spinner" aria-hidden="true" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="login-card__footer">
          <span className="login-footer__badge">
            <span className="login-footer__dot" aria-hidden="true" />
            Connected to AWS Serverless Backend
          </span>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          padding: 1.5rem;
          font-family: var(--font-family, sans-serif);
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          background: var(--color-surface, #FFFFFF);
          border-radius: var(--radius-xl, 16px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .login-card__header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .login-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .login-brand__logo {
          width: 40px;
          height: 40px;
          background: var(--color-primary, #2563EB);
          color: white;
          border-radius: var(--radius-lg, 10px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-brand__title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary, #0F172A);
          letter-spacing: -0.025em;
          margin: 0;
        }

        .login-card__subtitle {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #475569);
          margin: 0;
          line-height: 1.4;
        }

        .login-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background-color: var(--color-danger-bg, #FEF2F2);
          border: 1px solid var(--color-danger-border, #FECACA);
          color: var(--color-danger, #DC2626);
          border-radius: var(--radius-md, 8px);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-primary, #0F172A);
        }

        .form-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--color-border, #E2E8F0);
          border-radius: var(--radius-md, 8px);
          background-color: var(--color-surface, #FFFFFF);
          color: var(--color-text-primary, #0F172A);
          font-size: 0.9375rem;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-primary, #2563EB);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .form-input:disabled {
          background-color: var(--color-surface-alt, #F1F5F9);
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .login-card__footer {
          margin-top: 0.5rem;
          display: flex;
          justify-content: center;
        }

        .login-footer__badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-text-muted, #94A3B8);
        }

        .login-footer__dot {
          width: 6px;
          height: 6px;
          background-color: var(--color-success, #16A34A);
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
