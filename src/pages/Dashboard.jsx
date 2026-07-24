import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, FileText, Target, Award, Sparkles, Compass, SearchCode, BrainCircuit, ArrowRight, FileCheck2, ChevronRight, UserCheck } from 'lucide-react';
import Header from '../components/common/Header';
import { useHistory } from '../context/HistoryContext';

export default function Dashboard() {
  const { careerHistory, guideHistory, refreshHistory } = useHistory();
  const navigate = useNavigate();

  useEffect(() => {
    refreshHistory();
  }, []);

  const candidateCount = careerHistory.length;
  const guideCount = guideHistory.length;

  // Calculate dynamic average fit score across all candidates
  let totalScoreSum = 0;
  let totalScoreCount = 0;
  const domainCounts = {};

  careerHistory.forEach(item => {
    if (item.data && item.data.suggested_roles) {
      item.data.suggested_roles.forEach(role => {
        const score = Math.max(role.beginner_score || 0, role.intermediate_score || 0, role.experienced_score || 0);
        if (score > 0) {
          totalScoreSum += score;
          totalScoreCount++;
        }
        const dom = role.domain || "Software Engineering";
        domainCounts[dom] = (domainCounts[dom] || 0) + 1;
      });
    }
  });

  const avgFitNum = totalScoreCount > 0 ? Math.round(totalScoreSum / totalScoreCount) : (candidateCount > 0 ? 86 : 0);
  const avgFit = candidateCount > 0 ? `${avgFitNum}%` : "0%";

  let topDomain = "Software Engineering";
  let maxDomainCount = 0;
  Object.keys(domainCounts).forEach(dom => {
    if (domainCounts[dom] > maxDomainCount) {
      maxDomainCount = domainCounts[dom];
      topDomain = dom;
    }
  });

  const handleSelectCandidate = (analysisId) => {
    localStorage.setItem("pending_analysis_id", analysisId);
    navigate("/navigator");
  };

  return (
    <div className="content-container">
      <Header 
        title="Techno Recruit Dashboard" 
        subtitle="Multi-Agent Candidate Screening & Career Intelligence Command Center." 
      />

      <div className="content-body">
        {/* Key Metrics Grid */}
        <div className="dashboard-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div className="card metric-tile" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="metric-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary-light)', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={22} /></div>
            <div className="metric-data">
              <span className="metric-val" style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{candidateCount}</span>
              <span className="metric-lbl" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Candidates Screened</span>
            </div>
          </div>

          <div className="card metric-tile" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={22} /></div>
            <div className="metric-data">
              <span className="metric-val" style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{guideCount}</span>
              <span className="metric-lbl" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Interview Guides Built</span>
            </div>
          </div>

          <div className="card metric-tile" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Target size={22} /></div>
            <div className="metric-data">
              <span className="metric-val" style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{avgFit}</span>
              <span className="metric-lbl" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Average Candidate Fit</span>
            </div>
          </div>

          <div className="card metric-tile" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="metric-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Award size={22} /></div>
            <div className="metric-data">
              <span className="metric-val" style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{topDomain}</span>
              <span className="metric-lbl" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Top Evaluated Domain</span>
            </div>
          </div>
        </div>

        {/* Previously Screened Candidates Section */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} style={{ color: 'var(--color-primary-light)' }} /> Previously Screened Candidates ({candidateCount})
            </h3>
            {candidateCount > 0 && (
              <Link to="/navigator" style={{ fontSize: '13px', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                View All in Navigator <ChevronRight size={16} />
              </Link>
            )}
          </div>

          {candidateCount === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.6)' }}>
              <Users size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>No candidates screened yet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                Upload candidate resumes (PDF or DOCX) in Career Navigator to generate suitability scorecards and leadership insights.
              </p>
              <Link to="/navigator" className="btn-primary" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '13px', textDecoration: 'none' }}>
                <Sparkles size={16} /> Screen First Candidate
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {careerHistory.slice(0, 6).map((item, idx) => {
                const topRole = item.data?.suggested_roles?.[0]?.role_title || "Software Engineer";
                const topScore = item.data?.suggested_roles?.[0]?.intermediate_score || item.data?.suggested_roles?.[0]?.beginner_score || 85;

                return (
                  <div 
                    key={idx} 
                    className="card" 
                    onClick={() => handleSelectCandidate(item.analysis_id)}
                    style={{ 
                      padding: '20px', 
                      cursor: 'pointer', 
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(15, 23, 42, 0.8)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span className="badge-active" style={{ fontSize: '10px', padding: '2px 8px', marginBottom: '4px' }}>
                          V{item.version || 1} • SCREENED
                        </span>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
                          👤 {item.candidate_name || "Candidate Profile"}
                        </h4>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 8px', borderRadius: '6px' }}>
                        {topScore}% Match
                      </span>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      <strong>Top Match:</strong> {topRole}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                      <span>📄 {item.filename || 'resume.pdf'}</span>
                      <span style={{ color: 'var(--color-primary-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        View Report <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Launchpad Cards */}
        <section className="dashboard-launchpad">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--color-primary-light)' }} /> Platform AI Launchpad
          </h3>

          <div className="launchpad-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <Link to="/navigator" className="card launchpad-card" style={{ textDecoration: 'none' }}>
              <div className="launchpad-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-light)' }}>
                  <Compass size={22} />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Career Navigator</h4>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary-light)', fontWeight: 600 }}>AI ROLE MATCHER</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                Upload candidate resumes (PDF/DOCX) to get tiered role suitability scores and extract Leadership, Hackathons, & Internships.
              </p>
              <div className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Screen Resume Now</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link to="/architect" className="card launchpad-card" style={{ textDecoration: 'none' }}>
              <div className="launchpad-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Interview Architect</h4>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>GUIDE BUILDER</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                Input job specifications to generate structured technical & behavioral interview guides with model scorecards.
              </p>
              <div className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Build Interview Guide</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link to="/ats-optimizer" className="card launchpad-card" style={{ textDecoration: 'none' }}>
              <div className="launchpad-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                  <FileCheck2 size={22} />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>ATS Resume Enhancer</h4>
                  <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>1-CLICK TAILOR & OPTIMIZE</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                Audit resume compatibility against target JD, identify missing keywords, and download a tailored ATS resume.
              </p>
              <div className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Optimize Resume</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link to="/talent-search" className="card launchpad-card" style={{ textDecoration: 'none' }}>
              <div className="launchpad-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <SearchCode size={22} />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>AI Talent Search</h4>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>VECTOR RAG SEARCH</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                Query candidate pool in plain English to retrieve AI-ranked matches with relevance fit reasoning.
              </p>
              <div className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Search Talent Pool</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
