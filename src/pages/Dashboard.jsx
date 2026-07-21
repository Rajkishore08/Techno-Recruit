import React from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Target, Award, Sparkles, Compass, SearchCode, BrainCircuit, ArrowRight, FileCheck2 } from 'lucide-react';
import Header from '../components/common/Header';
import { useHistory } from '../context/HistoryContext';

export default function Dashboard() {
  const { careerHistory, guideHistory } = useHistory();

  const candidateCount = careerHistory.length;
  const guideCount = guideHistory.length;
  const avgFit = candidateCount > 0 ? "86%" : "0%";
  const topDomain = "Full Stack";

  return (
    <div className="content-container">
      <Header 
        title="Techno Recruit Dashboard" 
        subtitle="Multi-Agent Candidate Screening & Career Intelligence Command Center." 
      />

      <div className="content-body">
        {/* Dashboard Welcome Banner */}
        <section className="card dashboard-hero-card" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))', border: '1px solid var(--color-primary-light)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge-active" style={{ marginBottom: '8px', width: 'fit-content' }}><span className="dot"></span> Talent Acquisition Command Center</span>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Welcome to Techno Recruit</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '680px', lineHeight: 1.5 }}>
                Screen candidates with autonomous multi-agent intelligence, extract leadership and competitive highlights, track score improvements across resume revisions, run ATS keyword gap audits, and architect rubric-graded interview guides.
              </p>
            </div>
            <Link to="/navigator" className="btn-primary" style={{ padding: '12px 20px', fontSize: '14px', textDecoration: 'none' }}>
              <Sparkles size={16} />
              <span>Screen New Candidate</span>
            </Link>
          </div>
        </section>

        {/* Key Metrics Grid */}
        <div className="dashboard-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
              <span className="metric-val" style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{topDomain}</span>
              <span className="metric-lbl" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Top Evaluated Domain</span>
            </div>
          </div>
        </div>

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
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>AI Talent Search</h4>
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

            <Link to="/architect" className="card launchpad-card" style={{ textDecoration: 'none' }}>
              <div className="launchpad-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Interview Architect</h4>
                  <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>GUIDE GENERATOR</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                Input job specifications to generate 6-question structured interview guides with model scorecards.
              </p>
              <div className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Build Interview Guide</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
