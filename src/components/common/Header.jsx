import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Compass, FileCheck2, SearchCode, BrainCircuit, LogIn, LogOut, HelpCircle, Swords, Mic, User, Briefcase, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title, subtitle, onStartTour }) {
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const location = useLocation();

  // Suite Mode state: 'candidate' | 'recruiter' | 'all'
  const [suiteMode, setSuiteMode] = useState(() => {
    const saved = localStorage.getItem('techno_suite_mode');
    if (saved && ['candidate', 'recruiter', 'all'].includes(saved)) {
      return saved;
    }
    if (['/battlecard', '/talent-search', '/architect'].includes(location.pathname)) {
      return 'recruiter';
    }
    return 'all';
  });

  useEffect(() => {
    localStorage.setItem('techno_suite_mode', suiteMode);
  }, [suiteMode]);

  // Auto-switch view if navigating directly to a route in a different suite
  useEffect(() => {
    if (['/battlecard', '/talent-search', '/architect'].includes(location.pathname) && suiteMode === 'candidate') {
      setSuiteMode('recruiter');
    } else if (['/navigator', '/ats-optimizer', '/voice-interview'].includes(location.pathname) && suiteMode === 'recruiter') {
      setSuiteMode('candidate');
    }
  }, [location.pathname]);

  const isCandidateActive = suiteMode === 'candidate' || suiteMode === 'all';
  const isRecruiterActive = suiteMode === 'recruiter' || suiteMode === 'all';

  return (
    <header className="top-header" style={{ marginBottom: '20px' }}>
      {/* Banner */}
      <div 
        className="header-banner card" 
        style={{ 
          background: suiteMode === 'recruiter' 
            ? 'linear-gradient(135deg, rgba(24, 16, 42, 0.9), rgba(15, 23, 42, 0.9))' 
            : suiteMode === 'candidate'
            ? 'linear-gradient(135deg, rgba(12, 30, 48, 0.9), rgba(15, 23, 42, 0.9))'
            : 'rgba(17, 24, 39, 0.85)', 
          backdropFilter: 'blur(18px)',
          border: suiteMode === 'recruiter' 
            ? '1px solid rgba(192, 132, 252, 0.35)' 
            : suiteMode === 'candidate'
            ? '1px solid rgba(56, 189, 248, 0.35)'
            : '1px solid rgba(59, 130, 246, 0.25)', 
          padding: '22px 28px', 
          marginBottom: '14px',
          boxShadow: suiteMode === 'recruiter'
            ? '0 10px 30px rgba(15, 23, 42, 0.6), 0 0 24px rgba(168, 85, 247, 0.2)'
            : suiteMode === 'candidate'
            ? '0 10px 30px rgba(15, 23, 42, 0.6), 0 0 24px rgba(56, 189, 248, 0.2)'
            : '0 10px 30px rgba(15, 23, 42, 0.6), 0 0 20px rgba(59, 130, 246, 0.15)',
          borderRadius: 'var(--radius-lg, 16px)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Dynamic Glow Accent */}
        <div 
          style={{ 
            position: 'absolute', 
            top: '-50px', 
            right: '-50px', 
            width: '240px', 
            height: '240px', 
            background: suiteMode === 'recruiter'
              ? 'radial-gradient(circle, rgba(192, 132, 252, 0.25) 0%, rgba(0,0,0,0) 70%)'
              : 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(0,0,0,0) 70%)', 
            pointerEvents: 'none',
            transition: 'all 0.3s ease'
          }} 
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <img 
              src="/logo.png?v=2" 
              alt="Techno Recruit Logo" 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: suiteMode === 'recruiter' ? '2px solid #c084fc' : '2px solid #38bdf8', 
                boxShadow: suiteMode === 'recruiter' ? '0 0 22px rgba(192, 132, 252, 0.45)' : '0 0 22px rgba(56, 189, 248, 0.45)',
                flexShrink: 0,
                transition: 'all 0.3s ease'
              }} 
            />
            <div style={{ maxWidth: '720px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span 
                  className="badge-active" 
                  style={{ 
                    background: suiteMode === 'recruiter' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)', 
                    color: suiteMode === 'recruiter' ? '#c084fc' : '#38bdf8', 
                    border: suiteMode === 'recruiter' ? '1px solid #c084fc' : '1px solid #38bdf8', 
                    fontSize: '11px', 
                    padding: '3px 10px', 
                    fontWeight: 800, 
                    borderRadius: '9999px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {suiteMode === 'recruiter' ? '👔 RECRUITER COMMAND CENTER' : suiteMode === 'candidate' ? '👤 CANDIDATE INTELLIGENCE SUITE' : '✨ MULTI-AGENT TALENT INTELLIGENCE PLATFORM'}
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '23px', fontWeight: 800, color: '#fff', margin: '0 0 4px 0', lineHeight: 1.25 }}>
                {title || (suiteMode === 'recruiter' ? 'Techno Recruit — Recruiter AI Suite' : suiteMode === 'candidate' ? 'Techno Recruit — Candidate Career Navigator' : 'Techno Recruit — Enterprise AI Candidate Screening & Career Matcher')}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.45, margin: 0 }}>
                {subtitle || "Evaluate candidate suitability across specialized roles (Flutter, DevOps, Product Designer, Full Stack), extract verified leadership & hackathons, audit ATS keyword gaps, and generate rubric-graded technical interview guides."}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginLeft: 'auto' }}>
            {/* Mode Switcher Toggle (Like Light/Dark Theme Switcher) */}
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '4px',
                borderRadius: '9999px',
                gap: '3px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
              }}
            >
              <button
                type="button"
                onClick={() => setSuiteMode('candidate')}
                title="Switch to Candidate View Mode"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: suiteMode === 'candidate' 
                    ? 'linear-gradient(135deg, #0284c7, #38bdf8)' 
                    : 'transparent',
                  color: suiteMode === 'candidate' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: suiteMode === 'candidate' ? '0 0 14px rgba(56, 189, 248, 0.45)' : 'none'
                }}
              >
                <User size={14} />
                <span>Candidate</span>
              </button>

              <button
                type="button"
                onClick={() => setSuiteMode('recruiter')}
                title="Switch to Recruiter View Mode"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: suiteMode === 'recruiter' 
                    ? 'linear-gradient(135deg, #7e22ce, #c084fc)' 
                    : 'transparent',
                  color: suiteMode === 'recruiter' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: suiteMode === 'recruiter' ? '0 0 14px rgba(192, 132, 252, 0.45)' : 'none'
                }}
              >
                <Briefcase size={14} />
                <span>Recruiter</span>
              </button>

              <button
                type="button"
                onClick={() => setSuiteMode('all')}
                title="Show All Tools & Modules"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '7px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: suiteMode === 'all' 
                    ? 'rgba(255, 255, 255, 0.16)' 
                    : 'transparent',
                  color: suiteMode === 'all' ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                <Sparkles size={13} />
                <span>All</span>
              </button>
            </div>

            {/* Auth Profile / Google Sign-In */}
            <div className="header-auth">
              {!currentUser ? (
                <button className="btn-primary" onClick={signInWithGoogle} style={{ padding: '10px 18px', fontWeight: 700, fontSize: '13px' }}>
                  <LogIn size={15} />
                  <span>Sign In</span>
                </button>
              ) : (
                <div className="user-profile" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-color)', padding: '5px 12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src={currentUser.photoURL || "https://lh3.googleusercontent.com/a/default-user"} 
                    alt="User Avatar" 
                    className="avatar"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span className="user-name" style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{currentUser.displayName || currentUser.email || "User"}</span>
                  <button className="btn-icon" onClick={logout} title="Sign Out" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <LogOut size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Filtered Navigation Bar */}
      <nav 
        className="app-tabs-container" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 12px', 
          background: 'rgba(15, 23, 42, 0.85)', 
          backdropFilter: 'blur(16px)',
          border: suiteMode === 'recruiter' 
            ? '1px solid rgba(192, 132, 252, 0.3)' 
            : suiteMode === 'candidate'
            ? '1px solid rgba(56, 189, 248, 0.3)'
            : '1px solid rgba(59, 130, 246, 0.25)', 
          borderRadius: '14px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.5)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          whiteSpace: 'nowrap',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Dashboard Tab */}
        <NavLink 
          to="/" 
          end 
          className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: isActive ? 700 : 600,
            color: isActive ? '#ffffff' : 'var(--text-secondary)',
            background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.22))' : 'rgba(255, 255, 255, 0.03)',
            border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: isActive ? '0 0 14px rgba(56, 189, 248, 0.3)' : 'none',
            textDecoration: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0
          })}
        >
          <LayoutDashboard size={16} style={{ color: '#38bdf8' }} />
          <span>Dashboard</span>
        </NavLink>

        {/* Candidate Options (Visible when Candidate mode or All mode) */}
        {isCandidateActive && (
          <>
            <div style={{ height: '22px', width: '1px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 4px', flexShrink: 0 }} />

            <span 
              style={{ 
                fontSize: '10px', 
                fontWeight: 800, 
                color: '#38bdf8', 
                letterSpacing: '0.8px', 
                textTransform: 'uppercase', 
                background: 'rgba(56, 189, 248, 0.1)', 
                border: '1px solid rgba(56, 189, 248, 0.25)', 
                padding: '5px 10px', 
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}
            >
              👤 CANDIDATE
            </span>

            <NavLink 
              to="/navigator" 
              className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.22))' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? '0 0 14px rgba(56, 189, 248, 0.3)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0
              })}
            >
              <Compass size={15} style={{ color: '#38bdf8' }} />
              <span>Career Navigator</span>
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'linear-gradient(135deg,#38bdf8,#0284c7)', color: '#fff', marginLeft: '2px' }}>
                ROLE MATCH
              </span>
            </NavLink>

            <NavLink 
              to="/ats-optimizer" 
              className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(99, 102, 241, 0.22))' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? '0 0 14px rgba(16, 185, 129, 0.3)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0
              })}
            >
              <FileCheck2 size={15} style={{ color: '#10b981' }} />
              <span>ATS Optimizer</span>
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'linear-gradient(135deg,#10b981,#6366f1)', color: '#fff', marginLeft: '2px' }}>
                ATS CHECK
              </span>
            </NavLink>

            <NavLink 
              to="/voice-interview" 
              className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(56, 189, 248, 0.22))' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? '0 0 14px rgba(56, 189, 248, 0.3)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0
              })}
            >
              <Mic size={15} style={{ color: '#38bdf8' }} />
              <span>Voice Interviewer</span>
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'linear-gradient(135deg,#10b981,#0284c7)', color: '#fff', marginLeft: '2px' }}>
                LIVE SPEECH
              </span>
            </NavLink>
          </>
        )}

        {/* Recruiter Options (Visible when Recruiter mode or All mode) */}
        {isRecruiterActive && (
          <>
            <div style={{ height: '22px', width: '1px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 4px', flexShrink: 0 }} />

            <span 
              style={{ 
                fontSize: '10px', 
                fontWeight: 800, 
                color: '#c084fc', 
                letterSpacing: '0.8px', 
                textTransform: 'uppercase', 
                background: 'rgba(168, 85, 247, 0.1)', 
                border: '1px solid rgba(168, 85, 247, 0.25)', 
                padding: '5px 10px', 
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}
            >
              👔 RECRUITER
            </span>

            <NavLink 
              to="/battlecard" 
              className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(239, 68, 68, 0.22))' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? '0 0 14px rgba(245, 158, 11, 0.3)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0
              })}
            >
              <Swords size={15} style={{ color: '#f59e0b' }} />
              <span>Candidate Battle-Card</span>
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#fff', marginLeft: '2px' }}>
                MATRIX
              </span>
            </NavLink>

            <NavLink 
              to="/talent-search" 
              className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.22))' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? '0 0 14px rgba(192, 132, 252, 0.3)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0
              })}
            >
              <SearchCode size={15} style={{ color: '#c084fc' }} />
              <span>Talent Search</span>
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'linear-gradient(135deg,#38bdf8,#6366f1)', color: '#fff', marginLeft: '2px' }}>
                VECTOR RAG
              </span>
            </NavLink>

            <NavLink 
              to="/architect" 
              className={({ isActive }) => `nav-tab-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.22), rgba(59, 130, 246, 0.22))' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? '0 0 14px rgba(56, 189, 248, 0.3)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0
              })}
            >
              <BrainCircuit size={15} style={{ color: '#38bdf8' }} />
              <span>Interview Architect</span>
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'linear-gradient(135deg,#0284c7,#3b82f6)', color: '#fff', marginLeft: '2px' }}>
                GUIDES
              </span>
            </NavLink>
          </>
        )}

        {onStartTour && (
          <button 
            type="button" 
            className="btn-tour-trigger" 
            onClick={onStartTour} 
            style={{ 
              marginLeft: 'auto', 
              background: 'rgba(99, 102, 241, 0.15)', 
              color: 'var(--color-primary-light)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <HelpCircle size={15} />
            <span>Platform Guide</span>
          </button>
        )}
      </nav>
    </header>
  );
}
