import React, { useState } from 'react';
import { SearchCode, Sparkles, Search, Loader2, Award, UserCheck, ShieldCheck, CheckCircle2, Swords, Trophy, Check, AlertTriangle, BarChart3, Target, X, Download } from 'lucide-react';
import Header from '../components/common/Header';
import { useAuth } from '../context/AuthContext';
import { searchTalentPool, compareCandidates } from '../services/api';

const SAMPLE_QUERIES = [
  "Full stack developers with React, Node.js and MongoDB skills",
  "Hackathon winners and competitive programming champions",
  "Candidates with GDSC or Student Developers Cell leadership roles",
  "UI/UX Designers with Figma prototyping experience"
];

export default function TalentSearch() {
  const { currentIdToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Battle-Card selection & result state
  const [selectedIds, setSelectedIds] = useState([]);
  const [battleLoading, setBattleLoading] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [targetRoleInput, setTargetRoleInput] = useState('');

  const handleSearch = async (queryToUse) => {
    const q = queryToUse || searchQuery;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await searchTalentPool(q.trim(), currentIdToken);
      setResults(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
      alert("Please select at least 2 candidates to generate an AI Battle-Card comparison.");
      return;
    }

    setBattleLoading(true);
    setError(null);
    setBattleResult(null);

    try {
      const res = await compareCandidates(selectedIds, targetRoleInput || searchQuery || "Target Role", currentIdToken);
      setBattleResult(res.data);
    } catch (e) {
      setError(`Battle-Card evaluation failed: ${e.message}`);
    } finally {
      setBattleLoading(false);
    }
  };

  return (
    <div className="content-container">
      <Header 
        title="AI Semantic Talent Search & Battle-Card" 
        subtitle="Natural Language Vector RAG Search & Multi-Candidate Head-to-Head Decision Engine." 
      />

      <div className="content-body">
        {/* Search Query Card */}
        <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} /> Natural Language Vector Query
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., Full stack engineers who won hackathons and have GDSC leadership experience..."
              style={{ flex: 1, minWidth: '300px', minHeight: '48px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 18px', color: '#fff', fontSize: '14px' }}
            />
            <button className="btn-primary" onClick={() => handleSearch()} disabled={loading} style={{ minHeight: '48px', padding: '0 24px', fontWeight: 700 }}>
              {loading ? <Loader2 className="spin" size={18} /> : <Search size={18} />}
              <span>Search Talent Pool</span>
            </button>
          </div>

          {/* Quick Sample Query Pills */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Sample Queries:</span>
            {SAMPLE_QUERIES.map((sq, idx) => (
              <button 
                key={idx} 
                className="search-prompt-pill" 
                onClick={() => { setSearchQuery(sq); handleSearch(sq); }}
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', cursor: 'pointer' }}
              >
                {sq}
              </button>
            ))}
          </div>

          {error && <div style={{ marginTop: '12px', color: 'var(--color-error)', fontSize: '13px' }}>{error}</div>}
        </div>

        {/* Selection Bar for Battlecard */}
        {selectedIds.length > 0 && (
          <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(15, 23, 42, 0.95))', border: '1px solid var(--color-primary-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Swords size={20} style={{ color: 'var(--color-primary-light)' }} />
              <div>
                <strong style={{ color: '#fff', fontSize: '14px' }}>{selectedIds.length} Candidate(s) Selected for Comparison</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select 2 or 3 candidates to generate an AI Head-to-Head Decision Matrix.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Target Role (Optional)" 
                value={targetRoleInput} 
                onChange={e => setTargetRoleInput(e.target.value)} 
                style={{ minHeight: '36px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '12px' }} 
              />
              <button 
                className="btn-primary" 
                onClick={handleRunBattlecard} 
                disabled={battleLoading || selectedIds.length < 2} 
                style={{ fontSize: '13px', padding: '8px 18px', fontWeight: 700 }}
              >
                {battleLoading ? <Loader2 className="spin" size={16} /> : <Swords size={16} />}
                <span>Run AI Battle-Card</span>
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedIds([])} 
                style={{ fontSize: '12px', padding: '8px 12px' }}
              >
                <X size={14} /> Clear
              </button>
            </div>
          </div>
        )}

        {/* AI Head-to-Head Battlecard Decision Matrix Results */}
        {battleResult && (
          <div className="card" style={{ padding: '28px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))', border: '1px solid #6366f1', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge-active" style={{ marginBottom: '8px', background: 'linear-gradient(135deg, #6366f1, #10b981)' }}>
                  <Swords size={14} /> AI HEAD-TO-HEAD DECISION MATRIX
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  ⚔️ Candidate Battle-Card Summary
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
                          <span>Overall Score</span>
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
                            <Check size={14} /> Strengths:
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

            {/* Core Skills Comparison Matrix */}
            {battleResult.skills_matrix && battleResult.skills_matrix.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={18} style={{ color: 'var(--color-primary-light)' }} /> Core Skills & Competencies Comparison Matrix
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--color-primary-light)' }}>
                        <th style={{ padding: '10px' }}>Skill Competency</th>
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

        {/* Search Results Grid */}
        {results && (
          <div>
            <div style={{ marginBottom: '20px', padding: '14px 20px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <strong>Query:</strong> "{results.query}"
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                  {results.total_matches || (results.matched_candidates || []).length} Matched Candidates
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Check candidate cards to compare)</span>
              </div>
            </div>

            {(results.matched_candidates || []).length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <UserCheck size={36} style={{ marginBottom: '12px' }} />
                <p>No candidate records matched this query with sufficient relevance score (&gt;= 35%). Try expanding your query terms!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {results.matched_candidates.map((c, idx) => {
                  const isSelected = selectedIds.includes(c.analysis_id);
                  return (
                    <div 
                      key={idx} 
                      className="card" 
                      style={{ 
                        padding: '20px', 
                        border: isSelected ? '2px solid var(--color-primary-light)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(99,102,241,0.15)' : undefined,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => toggleCandidateSelect(c.analysis_id)} 
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, margin: 0 }}>👤 {c.candidate_name}</h4>
                        </div>
                        <span className="domain-pill" style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--color-success)', fontSize: '13px', padding: '3px 10px', borderRadius: '6px', fontWeight: 800 }}>
                          {c.relevance_score}% Match
                        </span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                        {c.match_reasoning}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(c.top_skills || []).map((sk, sidx) => (
                            <span key={sidx} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', color: 'var(--color-primary-light)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                        <button 
                          onClick={() => toggleCandidateSelect(c.analysis_id)}
                          style={{ background: 'none', border: 'none', color: isSelected ? 'var(--color-primary-light)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Swords size={14} /> {isSelected ? 'Selected' : 'Compare'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
