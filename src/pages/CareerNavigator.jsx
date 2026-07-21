import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, User, UploadCloud, FileText, ArrowRight, ShieldCheck, Loader2, Link as LinkIcon, Award, Briefcase, PlusCircle, CheckCircle2, TrendingUp, Users, AlertTriangle, Check, Target } from 'lucide-react';
import Header from '../components/common/Header';
import Dropzone from '../components/common/Dropzone';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { suggestRoles, analyzeCustomRole, parseResume } from '../services/api';

const PREDEFINED_TECH_ROLES = [
  { title: "Full Stack Engineer", domain: "Software Engineering", desc: "Build frontend & backend web applications end-to-end" },
  { title: "Frontend Engineer", domain: "Software Engineering", desc: "React, Vue, TypeScript, UI/UX implementation & performance" },
  { title: "Backend Engineer", domain: "Software Engineering", desc: "Node.js, Python, Java, Microservices, REST & GraphQL APIs" },
  { title: "DevOps & Cloud Engineer", domain: "Infrastructure & Cloud", desc: "AWS, Docker, Kubernetes, CI/CD pipelines & Infrastructure as Code" },
  { title: "Data Engineer", domain: "Data & AI", desc: "ETL pipelines, PySpark, BigQuery, Snowflake, SQL Data Warehousing" },
  { title: "AI / Machine Learning Engineer", domain: "Data & AI", desc: "PyTorch, TensorFlow, LLMs, Computer Vision & NLP Models" },
  { title: "Product Manager", domain: "Product & Strategy", desc: "Roadmaps, Agile/Scrum, User Research, Feature Prioritization" },
  { title: "UI/UX Designer & Product Designer", domain: "Design", desc: "Figma Prototyping, Wireframes, User Testing, Design Systems" },
  { title: "Mobile Application Developer", domain: "Mobile Engineering", desc: "React Native, Flutter, Swift (iOS), Kotlin (Android)" },
  { title: "Cybersecurity Analyst & Engineer", domain: "Security", desc: "Penetration testing, Network security, SIEM, Threat analysis" }
];

// Helper to format bold markdown (**text**) into JSX
function renderFormattedBoldText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} style={{ color: 'var(--color-primary-light)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function CareerNavigator() {
  const { currentIdToken } = useAuth();
  const { refreshHistory } = useHistory();

  const [candidateName, setCandidateName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawResumeText, setRawResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [baselineSession, setBaselineSession] = useState(null);
  const [error, setError] = useState(null);

  // Custom role state
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [customRoleLoading, setCustomRoleLoading] = useState(false);
  const [customRoleResult, setCustomRoleResult] = useState(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    try {
      const res = await parseResume(file, currentIdToken);
      if (res.resume_text) {
        setRawResumeText(res.resume_text);
      }
    } catch (e) {
      console.error("Auto parse failed:", e);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !rawResumeText.trim()) {
      setError("Please drop a candidate resume file or paste resume text.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("resume_text", rawResumeText);
      }
      if (candidateName) formData.append("candidate_name", candidateName);

      const res = await suggestRoles(formData, currentIdToken);
      setResults(res.data);
      setBaselineSession(res.baseline_session);
      refreshHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomRoleAnalyze = async (roleTitle) => {
    const titleToUse = roleTitle || customRoleInput;
    if (!titleToUse.trim() || !rawResumeText.trim()) return;

    setCustomRoleLoading(true);
    setAutocompleteOpen(false);
    try {
      const data = await analyzeCustomRole(rawResumeText, titleToUse.trim());
      setCustomRoleResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCustomRoleLoading(false);
    }
  };

  return (
    <div className="content-container">
      <Header 
        title="AI Career Navigator" 
        subtitle="Multi-Agent Candidate Screening & Career Suitability Recommender." 
      />

      <div className="content-body">
        {/* Upload Form Card */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', marginBottom: '16px' }}>
            <User size={16} /> Candidate Profile Input
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Candidate Name (Optional):</label>
            <input 
              type="text" 
              value={candidateName} 
              onChange={e => setCandidateName(e.target.value)} 
              placeholder="e.g., Pavimalini T, Rajkishore S" 
              style={{ width: '100%', minHeight: '42px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 14px', color: '#fff' }} 
            />
          </div>

          <Dropzone onFileSelected={handleFileSelect} selectedFile={selectedFile} />

          <div style={{ textAlign: 'center', margin: '14px 0', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>— OR PASTE RESUME TEXT —</div>

          <textarea 
            value={rawResumeText} 
            onChange={e => setRawResumeText(e.target.value)} 
            placeholder="Paste full candidate resume plain text here..." 
            style={{ width: '100%', height: '140px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#fff', fontSize: '13px', fontFamily: 'inherit' }} 
          />

          {error && <div style={{ marginTop: '12px', color: 'var(--color-error)', fontSize: '13px' }}>{error}</div>}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button className="btn-primary" onClick={handleAnalyze} disabled={loading} style={{ minHeight: '48px', padding: '0 32px', fontSize: '15px', fontWeight: 700 }}>
              {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              <span>Analyze Resume & Calculate Match Scores</span>
            </button>
          </div>
        </div>

        {/* Results Container */}
        {results && (
          <div className="navigator-results">
            {/* Candidate Header Summary */}
            <div className="card" style={{ padding: '24px', marginBottom: '20px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className="badge-active" style={{ marginBottom: '8px', width: 'fit-content' }}><span className="dot"></span> CAREER NAVIGATOR REPORT</span>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    👤 {results.candidate_name || candidateName || "Candidate Profile"}
                  </h2>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '10px', lineHeight: 1.6 }}>{results.candidate_summary}</p>
            </div>

            {/* Why Best Fit Card */}
            {results.why_best_fit && (
              <div className="card" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <h4 style={{ color: 'var(--color-success)', fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} /> Why This Candidate Is The Best Fit
                </h4>
                <div style={{ color: 'var(--text-primary)', fontSize: '13.5px', lineHeight: 1.6 }}>
                  {renderFormattedBoldText(results.why_best_fit)}
                </div>
              </div>
            )}

            {/* Extracted Hyperlinks */}
            {results.profile_and_project_links && results.profile_and_project_links.length > 0 && (
              <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-light)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LinkIcon size={14} /> Extracted Hyperlinks & Portfolio ({results.profile_and_project_links.length})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {results.profile_and_project_links.map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}>
                      <LinkIcon size={12} />
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Highlights Grid (Leadership, Achievements, Experience) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Leadership & Community */}
              {results.leadership_and_community && results.leadership_and_community.length > 0 && (
                <div className="card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#c084fc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} /> Leadership & Community Initiatives
                  </h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                    {results.leadership_and_community.map((bullet, idx) => (
                      <li key={idx} style={{ marginBottom: '8px' }}>{renderFormattedBoldText(bullet)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Achievements & Competitions */}
              {results.achievements_and_competitions && results.achievements_and_competitions.length > 0 && (
                <div className="card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} /> Competitive Achievements & Hackathons
                  </h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                    {results.achievements_and_competitions.map((bullet, idx) => (
                      <li key={idx} style={{ marginBottom: '8px' }}>{renderFormattedBoldText(bullet)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Work & Internship Experience */}
              {results.work_and_internship_experience && results.work_and_internship_experience.length > 0 && (
                <div className="card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={16} /> Internships & Work Experience
                  </h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                    {results.work_and_internship_experience.map((bullet, idx) => (
                      <li key={idx} style={{ marginBottom: '8px' }}>{renderFormattedBoldText(bullet)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Dynamic Career Recommendations & Skill Gap Improvements */}
            {results.dynamic_recommendations && results.dynamic_recommendations.length > 0 && (
              <div className="card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <h4 style={{ color: '#38bdf8', fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} /> Dynamic Career Recommendations & Skill Gap Improvements
                </h4>
                <ul style={{ paddingLeft: '18px', margin: 0, color: 'var(--text-primary)', fontSize: '13.5px', lineHeight: 1.6 }}>
                  {results.dynamic_recommendations.map((bullet, idx) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>{renderFormattedBoldText(bullet)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Roles Grid */}
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} style={{ color: 'var(--color-primary-light)' }} /> Recommended Matching Roles
            </h3>

            <div className="roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              {(results.suggested_roles || []).map((role, idx) => (
                <div key={idx} className="card role-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ color: 'var(--color-primary-light)', fontSize: '16px', fontWeight: 700, margin: 0 }}>{role.role_title}</h4>
                    <span className="domain-pill" style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--color-primary-light)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{role.domain}</span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>{role.match_summary}</p>

                  <div className="level-scores-box" style={{ background: 'rgba(15,23,42,0.6)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Junior Match</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{role.beginner_score}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Mid-Level Match</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>{role.intermediate_score}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Senior Match</span>
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}>{role.experienced_score}%</span>
                    </div>
                  </div>

                  {/* Key Strengths */}
                  {role.key_strengths && role.key_strengths.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-success)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Candidate Strengths:
                      </div>
                      <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {role.key_strengths.map((str, sidx) => (
                          <li key={sidx}>{renderFormattedBoldText(str)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skill Gaps */}
                  {role.skill_gaps && role.skill_gaps.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={14} /> Skill Gaps to Improve:
                      </div>
                      <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {role.skill_gaps.map((gap, gidx) => (
                          <li key={gidx}>{renderFormattedBoldText(gap)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Next Steps */}
                  {role.recommended_next_steps && (
                    <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', fontSize: '12px', color: 'var(--color-primary-light)' }}>
                      <strong>Next Step:</strong> {role.recommended_next_steps}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Role Autocomplete Evaluator */}
            <div className="card" style={{ padding: '24px' }}>
              <h4 style={{ color: 'var(--color-primary-light)', fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlusCircle size={18} /> Evaluate Fit for a Custom Job Role
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Type or select any job title to calculate suitability scores for this candidate.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                  <input 
                    type="text" 
                    value={customRoleInput}
                    onChange={e => { setCustomRoleInput(e.target.value); setAutocompleteOpen(true); }}
                    onFocus={() => setAutocompleteOpen(true)}
                    placeholder="Type or select role (e.g., DevOps, Product Manager, Full Stack)"
                    style={{ width: '100%', minHeight: '46px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 16px', color: '#fff' }}
                  />

                  {autocompleteOpen && (
                    <div className="autocomplete-dropdown-list" style={{ display: 'block' }}>
                      {PREDEFINED_TECH_ROLES.filter(r => !customRoleInput || r.title.toLowerCase().includes(customRoleInput.toLowerCase())).map((item, idx) => (
                        <div key={idx} className="autocomplete-dropdown-item" onClick={() => { setCustomRoleInput(item.title); setAutocompleteOpen(false); }}>
                          <div className="autocomplete-item-title">
                            <span>{item.title}</span>
                            <span className="autocomplete-item-domain">{item.domain}</span>
                          </div>
                          <div className="autocomplete-item-desc">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="btn-primary" onClick={() => handleCustomRoleAnalyze()} disabled={customRoleLoading} style={{ minHeight: '46px' }}>
                  {customRoleLoading ? <Loader2 className="spin" size={16} /> : <ShieldCheck size={16} />}
                  <span>Analyze Custom Role Fit</span>
                </button>
              </div>

              {/* Custom Role Result */}
              {customRoleResult && (
                <div style={{ marginTop: '20px', padding: '16px', borderRadius: '8px', background: 'rgba(15,23,42,0.7)', border: '1px solid var(--color-primary-light)' }}>
                  <h4 style={{ color: 'var(--color-primary-light)', margin: '0 0 8px 0' }}>{customRoleResult.role_title} Fit Analysis</h4>
                  <p style={{ fontSize: '13px', color: '#fff', marginBottom: '12px' }}>{customRoleResult.match_summary}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                    <span>Junior: <strong>{customRoleResult.beginner_score}%</strong></span>
                    <span>Mid-Level: <strong>{customRoleResult.intermediate_score}%</strong></span>
                    <span>Senior: <strong>{customRoleResult.experienced_score}%</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
