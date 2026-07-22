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
          padding: '24px 0',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(11, 17, 32, 0.4)',
          color: 'var(--text-muted)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.05em'
        }}>
          Developed by <span style={{ color: 'var(--color-accent)' }}>Raj Kishore S</span>
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
