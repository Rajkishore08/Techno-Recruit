import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BrainCircuit, X, Compass, History as HistoryIcon, FileText, FolderOpen, 
  LayoutDashboard, ShieldCheck, Database, Target, ChevronRight, UserCheck, Sparkles 
} from 'lucide-react';
import { useHistory } from '../../context/HistoryContext';
import { useAuth } from '../../context/AuthContext';

export default function SidebarDrawer() {
  const { sidebarOpen, closeSidebar, careerHistory, guideHistory } = useHistory();
  const { currentUser, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path) => {
    closeSidebar();
    navigate(path);
  };

  const handleSelectCareerSession = (analysisId) => {
    localStorage.setItem("pending_analysis_id", analysisId);
    closeSidebar();
    navigate("/navigator");
  };

  const handleSelectGuideSession = (guideId) => {
    localStorage.setItem("pending_guide_id", guideId);
    closeSidebar();
    navigate("/architect");
  };

  const navLinks = [
    { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { path: '/navigator', label: 'AI Career Navigator', icon: Compass, badge: 'AI Agent' },
    { path: '/ats-optimizer', label: 'ATS Resume Optimizer', icon: ShieldCheck, badge: 'Match' },
    { path: '/talent-search', label: 'Talent Search (Vector DB)', icon: Database, badge: 'RAG' },
    { path: '/architect', label: 'Interview Architect', icon: Target, badge: 'Prep' }
  ];

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div 
          onClick={closeSidebar} 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.6)', 
            backdropFilter: 'blur(4px)', 
            zIndex: 998 
          }} 
        />
      )}

      <aside 
        className={`sidebar ${sidebarOpen ? 'active' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          zIndex: 999
        }}
      >
        <div>
          {/* Header */}
          <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '24px' }}>
            <div className="logo" onClick={() => handleNavClick('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo.png" alt="Techno Recruit" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(59, 130, 246, 0.4)' }} />
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.3px' }}>Techno Recruit</h2>
                <span style={{ fontSize: '10px', color: 'var(--color-primary-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Platform v2.0</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={closeSidebar} 
              title="Close Navbar" 
              style={{ 
                background: 'rgba(255,255,255,0.06)', 
                border: '1px solid var(--border-color)', 
                color: 'var(--text-muted)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justify: 'center', 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px' 
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Navigation Section */}
          <div className="sidebar-section" style={{ marginBottom: '24px' }}>
            <div className="section-title" style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: 'var(--color-primary-light)' }} /> Navigation Routes
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid var(--color-primary-light)' : '1px solid transparent',
                      background: isActive ? 'linear-gradient(90deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))' : 'transparent',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={16} style={{ color: isActive ? 'var(--color-primary-light)' : 'var(--text-muted)' }} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          background: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)', 
                          color: isActive ? '#fff' : 'var(--text-muted)' 
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr style={{ border: 0, height: '1px', background: 'var(--border-color)', margin: '16px 0' }} />

          {/* History Section: Candidate Runs */}
          <div className="sidebar-section">
            <div className="section-title">
              <Compass size={15} />
              <span>Resume Analyses History ({careerHistory.length})</span>
            </div>
            <div className="history-list" style={{ maxHeight: '160px', overflowY: 'auto' }}>
              {careerHistory.length === 0 ? (
                <div className="history-empty">
                  <FileText size={24} />
                  <p style={{ fontSize: '12px' }}>No saved candidate runs yet</p>
                </div>
              ) : (
                careerHistory.map(item => (
                  <div key={item.analysis_id} className="history-item" onClick={() => handleSelectCareerSession(item.analysis_id)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0 }}>👤 {item.candidate_name || "Candidate"}</h4>
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="history-meta" style={{ marginTop: '2px' }}>
                      <span>V{item.version || 1} • {item.filename || 'resume.pdf'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* History Section: Interview Guides */}
          <div className="sidebar-section" style={{ marginTop: '20px' }}>
            <div className="section-title">
              <HistoryIcon size={15} />
              <span>Interview Guides ({guideHistory.length})</span>
            </div>
            <div className="history-list" style={{ maxHeight: '140px', overflowY: 'auto' }}>
              {guideHistory.length === 0 ? (
                <div className="history-empty">
                  <FolderOpen size={24} />
                  <p style={{ fontSize: '12px' }}>No saved guides yet</p>
                </div>
              ) : (
                guideHistory.map(item => (
                  <div key={item.guide_id} className="history-item" onClick={() => handleSelectGuideSession(item.guide_id)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0 }}>📋 {item.job_title}</h4>
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="history-meta" style={{ marginTop: '2px' }}>
                      <span>{item.experience_level}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Auth Status */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', marginTop: '20px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{currentUser.displayName || 'User'}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Signed In</div>
                </div>
              </div>
              <button className="btn-secondary" onClick={logout} style={{ fontSize: '11px', padding: '4px 8px' }}>Logout</button>
            </div>
          ) : (
            <button className="btn-secondary" onClick={loginWithGoogle} style={{ width: '100%', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <UserCheck size={14} />
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
