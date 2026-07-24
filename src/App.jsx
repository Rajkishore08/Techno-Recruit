import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HistoryProvider } from './context/HistoryContext';
import SidebarDrawer from './components/common/SidebarDrawer';
import FloatingHistoryBtn from './components/common/FloatingHistoryBtn';
import Dashboard from './pages/Dashboard';
import CareerNavigator from './pages/CareerNavigator';
import AtsOptimizer from './pages/AtsOptimizer';
import TalentSearch from './pages/TalentSearch';
import InterviewArchitect from './pages/InterviewArchitect';
import Login from './pages/Login';

function ProtectedLayout({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <SidebarDrawer />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
        <main className="main-content" style={{ flex: 1 }}>
          {children}
        </main>
        <footer style={{
          textAlign: 'center',
          padding: '24px 20px',
          borderTop: '1px solid rgba(59, 130, 246, 0.2)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          fontWeight: 500,
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontWeight: 700, color: '#fff' }}>
                © {new Date().getFullYear()} Techno Recruit
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-secondary)' }}>All Rights Reserved</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>A Product of TS Innovations</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Engineered & Developed by <span style={{ color: 'var(--color-accent, #38bdf8)', fontWeight: 700 }}>Raj Kishore S</span>
            </div>
          </div>
        </footer>
      </div>
      <FloatingHistoryBtn />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HistoryProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/navigator" element={<ProtectedLayout><CareerNavigator /></ProtectedLayout>} />
          <Route path="/ats-optimizer" element={<ProtectedLayout><AtsOptimizer /></ProtectedLayout>} />
          <Route path="/talent-search" element={<ProtectedLayout><TalentSearch /></ProtectedLayout>} />
          <Route path="/architect" element={<ProtectedLayout><InterviewArchitect /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HistoryProvider>
    </AuthProvider>
  );
}
