import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PlacementDrives from './pages/PlacementDrives.jsx';
import MyApplications from './pages/MyApplications.jsx';
import ResumeAnalyzer from './pages/ResumeAnalyzer.jsx';
import AIPreparation from './pages/AIPreparation.jsx';

import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected application routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/drives" element={<PlacementDrives />} />
              <Route path="/applications" element={<MyApplications />} />
              <Route path="/resume" element={<ResumeAnalyzer />} />
              <Route path="/preparation" element={<AIPreparation />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
