import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, FileCheck2, SearchCode, BrainCircuit, LogIn, LogOut, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title, subtitle, onStartTour }) {
  const { currentUser, signInWithGoogle, logout } = useAuth();

  return (
    <header className="top-header">
      <div 
        className="header-banner card" 
        style={{ 
          background: 'rgba(17, 24, 39, 0.85)', 
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(59, 130, 246, 0.25)', 
          padding: '24px 28px', 
          marginBottom: '16px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.6), 0 0 20px rgba(59, 130, 246, 0.15)',
          borderRadius: 'var(--radius-lg, 16px)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Accent Glow */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <img 
              src="/logo.png?v=2" 
              alt="Techno Recruit Logo" 
              style={{ 
                width: '68px', 
                height: '68px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: '2px solid var(--color-accent, #38bdf8)', 
                boxShadow: '0 0 22px rgba(56, 189, 248, 0.4)',
                flexShrink: 0
              }} 
            />
            <div style={{ maxWidth: '750px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span className="badge-active" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--color-accent, #38bdf8)', border: '1px solid var(--color-accent, #38bdf8)', fontSize: '11px', padding: '3px 10px', fontWeight: 800, borderRadius: '9999px' }}>
                  ✨ MULTI-AGENT TALENT INTELLIGENCE PLATFORM
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 6px 0', lineHeight: 1.25 }}>
                {title || "Techno Recruit — Enterprise AI Candidate Screening & Career Matcher"}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
                {subtitle || "Evaluate candidate suitability across specialized roles (Flutter, DevOps, Product Designer, Full Stack), extract verified leadership & hackathons, audit ATS keyword gaps, and generate rubric-graded technical interview guides with zero bias."}
              </p>
            </div>
          </div>

          <div className="header-auth" style={{ marginLeft: 'auto' }}>
            {!currentUser ? (
              <button className="btn-primary" onClick={signInWithGoogle} style={{ padding: '12px 20px', fontWeight: 700 }}>
                <LogIn size={16} />
                <span>Sign In with Google</span>
              </button>
            ) : (
              <div className="user-profile" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-color)', padding: '6px 14px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src={currentUser.photoURL || "https://lh3.googleusercontent.com/a/default-user"} 
                  alt="User Avatar" 
                  className="avatar"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span className="user-name" style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{currentUser.displayName || currentUser.email || "User"}</span>
                <button className="btn-icon" onClick={logout} title="Sign Out" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav class="app-tabs">
        <NavLink to="/" end className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/navigator" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
          <Compass size={16} />
          <span>Career Navigator</span>
          <span class="tab-badge">AI ROLE MATCHER</span>
        </NavLink>
        <NavLink to="/architect" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
          <BrainCircuit size={16} />
          <span>Interview Architect</span>
          <span class="tab-badge" style={{ background: 'linear-gradient(135deg,#0284c7,#3b82f6)' }}>GUIDE BUILDER</span>
        </NavLink>
        <NavLink to="/ats-optimizer" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
          <FileCheck2 size={16} />
          <span>ATS Optimizer</span>
          <span class="tab-badge" style={{ background: 'linear-gradient(135deg,#10b981,#6366f1)' }}>ATS CHECK</span>
        </NavLink>
        <NavLink to="/talent-search" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
          <SearchCode size={16} />
          <span>Talent Search</span>
          <span class="tab-badge" style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}>VECTOR RAG</span>
        </NavLink>
        {onStartTour && (
          <button type="button" class="tab-btn btn-tour-trigger" onClick={onStartTour} style={{ marginLeft: 'auto', background: 'rgba(99,102,241,0.15)', color: 'var(--color-primary-light)' }}>
            <HelpCircle size={16} />
            <span>Platform Guide</span>
          </button>
        )}
      </nav>
    </header>
  );
}
