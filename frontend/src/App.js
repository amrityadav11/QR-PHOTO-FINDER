import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Guest event pages
import GuestEventPage from './pages/guest/GuestEventPage';
import SelfiePage from './pages/guest/SelfiePage';
import PhotoResultsPage from './pages/guest/PhotoResultsPage';

// Dashboard pages
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import EventsListPage from './pages/dashboard/EventsListPage';
import CreateEventPage from './pages/dashboard/CreateEventPage';
import EventDetailPage from './pages/dashboard/EventDetailPage';
import EventPhotosPage from './pages/dashboard/EventPhotosPage';
import EventAnalyticsPage from './pages/dashboard/EventAnalyticsPage';
import ProfilePage from './pages/dashboard/ProfilePage';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              duration: 5000,
            },
          }}
        />

        <Routes>
          {/* ── Public Routes ───────────────────────────── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Guest Event Routes (no auth) ─────────────── */}
          <Route path="/e/:slug" element={<GuestEventPage />} />
          <Route path="/e/:slug/search" element={<SelfiePage />} />
          <Route path="/e/:slug/photos" element={<PhotoResultsPage />} />

          {/* ── Protected Dashboard Routes ───────────────── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="events" element={<EventsListPage />} />
            <Route path="events/create" element={<CreateEventPage />} />
            <Route path="events/:id" element={<EventDetailPage />} />
            <Route path="events/:id/photos" element={<EventPhotosPage />} />
            <Route path="events/:id/analytics" element={<EventAnalyticsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ── Fallback ─────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
