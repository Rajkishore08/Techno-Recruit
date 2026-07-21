import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, FileCheck2, SearchCode, BrainCircuit, LogIn, LogOut, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title, subtitle, onStartTour }) {
  const { currentUser, signInWithGoogle, logout } = useAuth();

  return (
    <header class="top-header">
      <div class="header-banner">
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <div class="header-title">
            <span class="badge-active"><span class="dot"></span> Autonomous Specialist Agent System</span>
            <h1>{title || "Techno Recruit Command Center"}</h1>
            <p class="subtitle">{subtitle || "Multi-Agent Candidate Screening & Career Intelligence Command Center."}</p>
          </div>
        </div>
        <div class="header-auth">
          {!currentUser ? (
            <button class="btn-primary" onClick={signInWithGoogle}>
              <LogIn size={16} />
              <span>Sign In with Google</span>
            </button>
          ) : (
            <div class="user-profile">
              <img 
                src={currentUser.photoURL || "https://lh3.googleusercontent.com/a/default-user"} 
                alt="User Avatar" 
                class="avatar"
                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span class="user-name">{currentUser.displayName || currentUser.email || "User"}</span>
              <button class="btn-icon" onClick={logout} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          )}
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
        <NavLink to="/architect" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
          <BrainCircuit size={16} />
          <span>Interview Architect</span>
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
