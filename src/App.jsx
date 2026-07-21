import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HistoryProvider } from './context/HistoryContext';
import SidebarDrawer from './components/common/SidebarDrawer';
import FloatingHistoryBtn from './components/common/FloatingHistoryBtn';
import Dashboard from './pages/Dashboard';
import CareerNavigator from './pages/CareerNavigator';
import AtsOptimizer from './pages/AtsOptimizer';
import TalentSearch from './pages/TalentSearch';
import InterviewArchitect from './pages/InterviewArchitect';

export default function App() {
  return (
    <AuthProvider>
      <HistoryProvider>
        <div className="app-layout">
          <SidebarDrawer />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/navigator" element={<CareerNavigator />} />
              <Route path="/ats-optimizer" element={<AtsOptimizer />} />
              <Route path="/talent-search" element={<TalentSearch />} />
              <Route path="/architect" element={<InterviewArchitect />} />
            </Routes>
          </main>
          <FloatingHistoryBtn />
        </div>
      </HistoryProvider>
    </AuthProvider>
  );
}
