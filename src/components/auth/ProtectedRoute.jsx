/**
 * Protected Route Component — src/components/auth/ProtectedRoute.jsx
 *
 * Guards routes against unauthenticated access.
 * While session validation is in progress, renders a full-page loading view.
 * If unauthenticated, redirects to /login preserving the requested location.
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--color-bg, #F8FAFC)',
          fontFamily: 'var(--font-family, sans-serif)',
          color: 'var(--color-text-secondary, #475569)',
          padding: '1.5rem',
        }}
        role="status"
        aria-label="Validating authentication session"
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            border: '3px solid var(--color-border, #E2E8F0)',
            borderTop: '3px solid var(--color-primary, #2563EB)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '1rem',
          }}
        />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <p style={{ fontSize: '0.925rem', fontWeight: 500 }}>
          Authenticating HireFlow session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children || <Outlet />;
}
