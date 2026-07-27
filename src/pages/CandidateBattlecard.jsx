import React, { useState, useEffect } from 'react';
import { Swords, Trophy, Check, AlertTriangle, BarChart3, Target, X, Sparkles, Loader2, UserCheck, ShieldCheck } from 'lucide-react';
import Header from '../components/common/Header';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { fetchCareerHistory, compareCandidates } from '../services/api';

const FALLBACK_CANDIDATES = [
  {
    analysis_id: "career_rajkishore_default",
    candidate_name: "Raj Kishore S",
    filename: "RajKishore_FullStack_Resume.pdf",
    data: {
      candidate_name: "Raj Kishore S",
      candidate_summary: "Full-stack AI developer with expertise in React, Node.js, Python, Vector RAG search, and GDG Campus Leadership.",
      top_skills_identified: ["React.js", "Node.js", "Python", "Vector RAG", "FastAPI"]
    }
  },
  {
    analysis_id: "career_alex_chen",
    candidate_name: "Alex Chen",
    filename: "AlexChen_Flutter_Resume.pdf",
    data: {
      candidate_name: "Alex Chen",
      candidate_summary: "Senior mobile engineer with 4+ years mastery in Flutter, Dart, BLoC state management, and mobile UI performance.",
      top_skills_identified: ["Flutter", "Dart", "BLoC Pattern", "iOS & Android"]
    }
  },
  {
    analysis_id: "career_devin_vance",
    candidate_name: "Devin Vance",
    filename: "DevinVance_DevOps_Resume.pdf",
    data: {
      candidate_name: "Devin Vance",
      candidate_summary: "Cloud Architect with expertise in AWS, Kubernetes cluster management, Docker containerization, and DevOps CI/CD.",
      top_skills_identified: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"]
    }
  }
];

export default function CandidateBattlecard() {
  const { currentIdToken } = useAuth();
  const { careerHistory, refreshHistory } = useHistory();
  const [candidates, setCandidates] = useState([]);
  const [loadingPool, setLoadingPool] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetRole, setTargetRole] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    refreshHistory();
  }, [currentIdToken]);

  useEffect(() => {
    if (careerHistory && careerHistory.length > 0) {
      setCandidates(careerHistory);
    } else {
      setCandidates(FALLBACK_CANDIDATES);
    }
    setLoadingPool(false);
  }, [careerHistory]);

  const toggleCandidateSelect = (analysisId) => {
    if (selectedIds.includes(analysisId)) {
      setSelectedIds(selectedIds.filter(id => id !== analysisId));
    } else {
      if (selectedIds.length >= 3) {
        alert("You can compare up to 3 candidates at a time.");
        return;
      }
      setSelectedIds([...selectedIds, analysisId]);
    }
  };

  const handleRunBattlecard = async () => {
    if (selectedIds.length < 2) {
      alert("Please select at least 2 candidates to compare.");
      return;
    }

    setEvaluating(true);
    setError(null);
    setBattleResult(null);

    try {
      const res = await compareCandidates(selectedIds, targetRole || "Target Job Opening", currentIdToken);
      setBattleResult(res.data);
    } catch (e) {
      setError(`Battle-Card evaluation failed: ${e.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="content-container">
      <Header 
        title="AI Candidate Battle-Card & Decision Matrix" 
        subtitle="Multi-Candidate Head-to-Head Evaluation, Risk Trade-Off Analysis & Hiring Verdict Engine." 
      />

      <div className="content-body">
        {/* Top Feature Banner */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(15, 23, 42, 0.95))', border: '1px solid var(--color-primary-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge-active" style={{ marginBottom: '8px', background: 'linear-gradient(135deg, #6366f1, #10b981)' }}>
                <Swords size={14} /> NEW FEATURE
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Select Candidates to Run Head-to-Head Comparison
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                Choose 2 or 3 candidates from your talent pool below to generate a multi-dimensional AI Decision Matrix.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Target Job Role (e.g. Senior Full Stack Dev)" 
                value={targetRole} 
                onChange={e => setTargetRole(e.target.value)} 
                style={{ height: '42px', minWidth: '240px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 14px', color: '#fff', fontSize: '13px' }} 
              />
              <button 
                className="btn-primary" 
                onClick={handleRunBattlecard} 
                disabled={evaluating || selectedIds.length < 2} 
                style={{ height: '42px', padding: '0 24px', fontWeight: 700 }}
              >
                {evaluating ? <Loader2 className="spin" size={18} /> : <Swords size={18} />}
                <span>Generate Battle-Card ({selectedIds.length}/3)</span>
              </button>
            </div>
          </div>
          {error && <div style={{ marginTop: '14px', color: 'var(--color-error)', fontSize: '13px' }}>{error}</div>}
        </div>

        {/* AI Head-to-Head Battlecard Decision Matrix Results */}
        {battleResult && (
          <div className="card" style={{ padding: '28px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))', border: '1px solid #6366f1', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge-active" style={{ marginBottom: '8px', background: 'linear-gradient(135deg, #6366f1, #10b981)' }}>
                  <Swords size={14} /> DECISION COMMITTEE VERDICT
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  ⚔️ Candidate Battle-Card Breakdown
                </h2>
              </div>
              <button className="btn-secondary" onClick={() => setBattleResult(null)} style={{ fontSize: '12px', padding: '6px 12px' }}>
                <X size={14} /> Close Matrix
              </button>
            </div>

            {/* Winner Recommendation Banner */}
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>
                <Trophy size={22} />
                <span>RECOMMENDED WINNER HIRE: {battleResult.winner_name || "Top Candidate"}</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                {battleResult.hiring_recommendation_summary}
              </p>
            </div>

            {/* Candidate Side-by-Side Comparison Cards */}
            {battleResult.candidates && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: '20px', marginBottom: '28px' }}>
                {battleResult.candidates.map((cand, idx) => {
                  const isWinner = cand.name === battleResult.winner_name || cand.analysis_id === battleResult.winner_id;
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        border: isWinner ? '2px solid #10b981' : '1px solid var(--border-color)', 
                        borderRadius: '12px', 
                        padding: '20px', 
                        background: isWinner ? 'rgba(16, 185, 129, 0.05)' : 'rgba(15, 23, 42, 0.8)',
                        position: 'relative'
                      }}
                    >
                      {isWinner && (
                        <div style={{ position: 'absolute', top: '-12px', right: '16px', background: '#10b981', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 10px', borderRadius: '9999px' }}>
                          ★ WINNER
                        </div>
                      )}
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>{cand.name}</h3>
                      <div style={{ fontSize: '12px', color: 'var(--color-primary-light)', fontWeight: 700, marginBottom: '14px' }}>
                        {cand.best_suited_for || "Technical Candidate"}
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          <span>Overall Fit Rating</span>
                          <span style={{ color: isWinner ? '#10b981' : 'var(--color-primary-light)' }}>{cand.overall_score}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${cand.overall_score}%`, height: '100%', background: isWinner ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #6366f1, #38bdf8)', borderRadius: '4px' }} />
                        </div>
                      </div>

                      {/* Dimension Metric Bars */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Technical Depth</span>
                          <strong style={{ color: '#fff' }}>{cand.technical_depth}%</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Leadership Impact</span>
                          <strong style={{ color: '#fff' }}>{cand.leadership_impact}%</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Execution Speed</span>
                          <strong style={{ color: '#fff' }}>{cand.project_execution_speed}%</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Team Adaptability</span>
                          <strong style={{ color: '#fff' }}>{cand.team_adaptability}%</strong>
                        </div>
                      </div>

                      {/* Strengths & Trade-offs */}
                      {cand.key_strengths && cand.key_strengths.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-success)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={14} /> Key Strengths:
                          </div>
                          <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {cand.key_strengths.map((str, sidx) => <li key={sidx}>{str}</li>)}
                          </ul>
                        </div>
                      )}

                      {cand.trade_offs && cand.trade_offs.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={14} /> Risk Trade-Offs:
                          </div>
                          <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {cand.trade_offs.map((to, tidx) => <li key={tidx}>{to}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Core Skills Comparison Matrix Table */}
            {battleResult.skills_matrix && battleResult.skills_matrix.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={18} style={{ color: 'var(--color-primary-light)' }} /> Skills Competency Overlap Matrix
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--color-primary-light)' }}>
                        <th style={{ padding: '10px' }}>Skill Domain</th>
                        {battleResult.candidates.map((c, i) => (
                          <th key={i} style={{ padding: '10px', textAlign: 'center' }}>{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {battleResult.skills_matrix.map((row, sidx) => (
                        <tr key={sidx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{row.skill}</td>
                          {battleResult.candidates.map((c, i) => {
                            const score = (row.scores && row.scores[c.name]) || (row.scores && row.scores[c.analysis_id]) || 80;
                            return (
                              <td key={i} style={{ padding: '10px', textAlign: 'center' }}>
                                <span style={{ fontWeight: 800, color: score >= 85 ? '#10b981' : '#38bdf8' }}>{score}%</span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Talent Pool Candidate Selection Grid */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
            Available Candidate Profiles in Talent Pool ({candidates.length})
          </h3>

          {loadingPool ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <Loader2 className="spin" size={28} style={{ marginBottom: '8px' }} />
              <p>Loading candidate records...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <UserCheck size={32} style={{ marginBottom: '8px' }} />
              <p>No candidate profiles found. Upload resumes in Career Navigator to populate your talent pool!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {candidates.map((cand, idx) => {
                const id = cand.analysis_id || `c_${idx}`;
                const isSelected = selectedIds.includes(id);
                const name = cand.candidate_name || (cand.data && cand.data.candidate_name) || `Candidate #${idx + 1}`;
                const summary = (cand.data && cand.data.candidate_summary) || cand.resume_snippet || "Candidate resume profile";
                const skills = (cand.data && (cand.data.top_skills_identified || cand.data.matched_keywords)) || [];

                return (
                  <div 
                    key={idx}
                    onClick={() => toggleCandidateSelect(id)}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '10px', 
                      border: isSelected ? '2px solid var(--color-primary-light)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.7)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => {}} 
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <strong style={{ color: '#fff', fontSize: '14.5px' }}>👤 {name}</strong>
                      </div>
                      {isSelected && (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-primary-light)', background: 'rgba(99,102,241,0.25)', padding: '2px 8px', borderRadius: '4px' }}>
                          SELECTED
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {summary}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {skills.slice(0, 4).map((sk, sidx) => (
                        <span key={sidx} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px' }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
