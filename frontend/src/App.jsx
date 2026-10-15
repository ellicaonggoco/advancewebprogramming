import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import LeaveRequests from './pages/LeaveRequests';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { useAuth } from './context/AuthContext';

import ErrorBoundary from './components/ErrorBoundary';

function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard': return isAdmin ? 'Dashboard Overview' : 'My Workplace Dashboard';
      case '/attendance': return isAdmin ? 'Attendance Records' : 'My Attendance Logs';
      case '/employees': return 'Employee Directory';
      case '/departments': return 'Departments & Structure';
      case '/leaves': return isAdmin ? 'Leave Approvals & Management' : 'My Leave Requests';
      case '/reports': return 'Reports & Analytics';
      case '/settings': return 'Account & Profile Settings';
      default: return 'AttendEase';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar 
          onMenuClick={() => setMobileOpen(true)} 
          title={getPageTitle(location.pathname)} 
        />
        <main className="flex-1 pb-12">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute>
              <AppLayout>
                <Attendance />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/employees" element={
            <ProtectedRoute requireAdmin={true}>
              <AppLayout>
                <Employees />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/departments" element={
            <ProtectedRoute requireAdmin={true}>
              <AppLayout>
                <Departments />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/leaves" element={
            <ProtectedRoute>
              <AppLayout>
                <LeaveRequests />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute requireAdmin={true}>
              <AppLayout>
                <Reports />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
