import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, FileCheck2, SearchCode, BrainCircuit, LogIn, LogOut, HelpCircle, Swords, Mic } from 'lucide-react';
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

      {/* Unified Executive Navigation Bar */}
      <nav 
        className="app-tabs-container" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 12px', 
          background: 'rgba(15, 23, 42, 0.85)', 
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(59, 130, 246, 0.25)', 
          borderRadius: '14px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.5)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          whiteSpace: 'nowrap'
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

        {/* Divider */}
        <div style={{ height: '22px', width: '1px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 4px', flexShrink: 0 }} />

        {/* Candidate Suite Divider Label */}
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
          👤 CANDIDATE SUITE
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

        {/* Divider */}
        <div style={{ height: '22px', width: '1px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 4px', flexShrink: 0 }} />

        {/* Recruiter Suite Divider Label */}
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
          👔 RECRUITER SUITE
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
