import React, { useState } from 'react';
import { SearchCode, Sparkles, Search, Loader2, Award, UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Header from '../components/common/Header';
import { useAuth } from '../context/AuthContext';
import { searchTalentPool } from '../services/api';

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

  return (
    <div className="content-container">
      <Header 
        title="AI Semantic Talent Search" 
        subtitle="Natural Language Vector RAG Search & AI Re-ranking Engine." 
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

        {/* Search Results Grid */}
        {results && (
          <div>
            <div style={{ marginBottom: '20px', padding: '14px 20px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Query:</strong> "{results.query}"
              </div>
              <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                {results.total_matches || (results.matched_candidates || []).length} Matched Candidates
              </span>
            </div>

            {(results.matched_candidates || []).length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <UserCheck size={36} style={{ marginBottom: '12px' }} />
                <p>No candidate records matched this query with sufficient relevance score (&gt;= 35%). Try expanding your query terms!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {results.matched_candidates.map((c, idx) => (
                  <div key={idx} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, margin: 0 }}>👤 {c.candidate_name}</h4>
                      <span className="domain-pill" style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--color-success)', fontSize: '13px', padding: '3px 10px', borderRadius: '6px', fontWeight: 800 }}>
                        {c.relevance_score}% Match
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                      {c.match_reasoning}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(c.top_skills || []).map((sk, sidx) => (
                        <span key={sidx} style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', color: 'var(--color-primary-light)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
