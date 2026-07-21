import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, X, Compass, History as HistoryIcon, FileText, FolderOpen } from 'lucide-react';
import { useHistory } from '../../context/HistoryContext';

export default function SidebarDrawer() {
  const { sidebarOpen, closeSidebar, careerHistory, guideHistory } = useHistory();
  const navigate = useNavigate();

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

  return (
    <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div className="logo">
          <BrainCircuit className="logo-icon" />
          <h2>Techno Recruit</h2>
        </div>
        <button type="button" onClick={closeSidebar} title="Close History" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}>
          <X size={18} />
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-title">
          <Compass size={16} />
          <span>Resume Analyses</span>
        </div>
        <p className="section-subtitle">Career Score Progress</p>
        <div className="history-list">
          {careerHistory.length === 0 ? (
            <div className="history-empty">
              <FileText size={32} />
              <p>No saved candidate runs</p>
            </div>
          ) : (
            careerHistory.map(item => (
              <div key={item.analysis_id} className="history-item" onClick={() => handleSelectCareerSession(item.analysis_id)}>
                <h4>👤 {item.candidate_name || "Candidate"}</h4>
                <div className="history-meta">
                  <span>V{item.version || 1} • {item.filename || 'resume.pdf'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-section" style={{ marginTop: '24px' }}>
        <div className="section-title">
          <HistoryIcon size={16} />
          <span>Interview Guides</span>
        </div>
        <div className="history-list">
          {guideHistory.length === 0 ? (
            <div className="history-empty">
              <FolderOpen size={32} />
              <p>No past guides saved</p>
            </div>
          ) : (
            guideHistory.map(item => (
              <div key={item.guide_id} className="history-item" onClick={() => handleSelectGuideSession(item.guide_id)}>
                <h4>📋 {item.job_title}</h4>
                <div className="history-meta">
                  <span>{item.experience_level}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
