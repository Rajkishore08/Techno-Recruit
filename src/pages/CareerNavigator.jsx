import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Compass, Sparkles, User, UploadCloud, FileText, ArrowRight, ShieldCheck, Loader2, Link as LinkIcon, Award, Briefcase, PlusCircle, CheckCircle2, TrendingUp, Users, AlertTriangle, Check, Target, Download, Printer } from 'lucide-react';
import Header from '../components/common/Header';
import Dropzone from '../components/common/Dropzone';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { suggestRoles, analyzeCustomRole, parseResume } from '../services/api';

const PREDEFINED_TECH_ROLES = [
  { title: "Flutter Developer", domain: "Mobile Engineering", desc: "Cross-platform mobile apps, Dart, Flutter SDK, Provider / Bloc, Native plugins" },
  { title: "DevOps & Cloud Engineer", domain: "Infrastructure & Cloud", desc: "AWS, Docker, Kubernetes, CI/CD pipelines, Terraform & Infrastructure as Code" },
  { title: "Product Designer & UI/UX Specialist", domain: "Design & Product", desc: "Figma Prototyping, Wireframes, User Research, Design Systems & Usability" },
  { title: "Full Stack Engineer", domain: "Software Engineering", desc: "Build frontend & backend web applications end-to-end with modern frameworks" },
  { title: "Frontend Engineer (React / Next.js)", domain: "Software Engineering", desc: "React, Next.js, TypeScript, UI/UX implementation & web performance" },
  { title: "Backend Engineer (Node.js / Python / Java)", domain: "Software Engineering", desc: "Node.js, Express, Python, Microservices, REST & GraphQL APIs" },
  { title: "Data Engineer", domain: "Data & AI", desc: "ETL pipelines, PySpark, BigQuery, Snowflake, SQL Data Warehousing" },
  { title: "AI / Machine Learning Engineer", domain: "Data & AI", desc: "PyTorch, TensorFlow, LLMs, Computer Vision & NLP Models" },
  { title: "Product Manager", domain: "Product & Strategy", desc: "Roadmaps, Agile/Scrum, User Research, Feature Prioritization" },
  { title: "Mobile App Developer (iOS / Android)", domain: "Mobile Engineering", desc: "React Native, Swift (iOS), Kotlin (Android), Native Mobile APIs" },
  { title: "QA & Test Automation Engineer", domain: "Quality Assurance", desc: "Selenium, Cypress, Playwright, Automated E2E testing pipelines" },
  { title: "Cybersecurity Analyst & Engineer", domain: "Security", desc: "Penetration testing, Network security, SIEM, Threat analysis" },
  { title: "Site Reliability Engineer (SRE)", domain: "Infrastructure", desc: "High availability, Incident management, Observability & Prometheus" },
  { title: "Cloud Architect (AWS / GCP / Azure)", domain: "Cloud Computing", desc: "Multi-cloud architecture, Serverless, IAM security, Enterprise Scalability" }
];

function renderFormattedBoldText(text) {
  if (!text) return null;
  let str = String(text).trim();

  // 0. Clean internal linebreaks and sub-bullets into smooth single-line text
  str = str.replace(/\r/g, ' ');
  str = str.replace(/\n+\s*[\-\•\*\>]?\s*/g, ', ');
  str = str.replace(/\s+/g, ' ');

  // 1. Clean raw bullet markers repeatedly at start of text (* * , * , - , • )
  let prev;
  do {
    prev = str;
    str = str.replace(/^[\-\•\*\>]\s*/, '');
    str = str.replace(/^\*\s*\*\s+/, '');
    str = str.replace(/^\*\s+(?!\*)/, '');
    str = str.replace(/^,\s*/, '');
  } while (str !== prev);

  // Clean trailing asterisks or unclosed markdown
  str = str.replace(/\*+$/g, '').trim();

  // 2. Fix unmatched single-star prefix paired with double-star suffix (*text** -> **text**)
  if (str.startsWith('*') && !str.startsWith('**') && str.endsWith('**')) {
    str = '*' + str;
  } else if (str.startsWith('* ') && str.endsWith('**')) {
    str = str.replace(/^\*\s*/, '**');
  } else if (str.startsWith('* ') && !str.includes('**')) {
    str = str.replace(/^\*\s*/, '');
  }

  // 3. Parse remaining bold tokens (**text**) into <strong> tags
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx} style={{ color: 'var(--color-primary-light)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function CareerNavigator() {
  const { currentIdToken } = useAuth();
  const { refreshHistory, careerHistory } = useHistory();

  const [candidateName, setCandidateName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawResumeText, setRawResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [results, setResults] = useState(null);
  const [baselineSession, setBaselineSession] = useState(null);
  const [error, setError] = useState(null);
  const [placeholderName, setPlaceholderName] = useState('e.g., Sarah Jenkins, Priya Sharma');

  useEffect(() => {
    const RANDOM_NAMES = [
      "Sarah Jenkins", "Alex Rivera", "Priya Sharma", "Chen Wei", "David Kim", 
      "Sofia Rodriguez", "Marcus Vance", "Emily Watson", "Yusuf Demir", "Amara Okafor",
      "Kavitha R", "Siddharth Sen", "Meera Nair", "Arjun Patel", "Aditya Joshi"
    ];
    const n1 = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    let n2 = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    while (n2 === n1) {
      n2 = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    }
    setPlaceholderName(`e.g., ${n1}, ${n2}`);
  }, []);

  // Load pending analysis session when selected from history sidebar drawer
  useEffect(() => {
    const pendingId = localStorage.getItem("pending_analysis_id");
    if (pendingId && careerHistory && careerHistory.length > 0) {
      const match = careerHistory.find(item => item.analysis_id === pendingId);
      if (match && match.data) {
        setResults(match.data);
        if (match.candidate_name) setCandidateName(match.candidate_name);
        if (match.resume_snippet) setRawResumeText(match.resume_snippet);
        localStorage.removeItem("pending_analysis_id");
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [careerHistory]);

  // Custom role state
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [customRoleLoading, setCustomRoleLoading] = useState(false);
  const [customRoleResult, setCustomRoleResult] = useState(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  const resultsRef = useRef(null);

  // Sort suggested roles so the highest matching "Best Fit" role comes FIRST
  const sortedRoles = useMemo(() => {
    if (!results || !results.suggested_roles) return [];
    const rolesCopy = [...results.suggested_roles];
    rolesCopy.sort((a, b) => {
      const maxA = Math.max(a.beginner_score || 0, a.intermediate_score || 0, a.experienced_score || 0);
      const maxB = Math.max(b.beginner_score || 0, b.intermediate_score || 0, b.experienced_score || 0);
      return maxB - maxA;
    });
    return rolesCopy;
  }, [results]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !rawResumeText.trim()) {
      setError("Please drop a candidate resume file or paste resume text.");
      return;
    }
    setError(null);
    setLoading(true);
    setProgressPercent(1);
    setProgressMsg("Extracting candidate background & parsed links...");

    // Smooth continuous percent-by-percent tick from 1% to 98%
    const timer = setInterval(() => {
      setProgressPercent(prev => {
        if (prev >= 98) return 98;
        const next = prev + 1;
        if (next < 25) {
          setProgressMsg("Extracting candidate background & parsed links...");
        } else if (next < 55) {
          setProgressMsg("Evaluating leadership, hackathons & internships...");
        } else if (next < 80) {
          setProgressMsg("Calculating Junior, Mid-Level & Senior match scores...");
        } else {
          setProgressMsg("Generating dynamic career recommendations & skill gap insights...");
        }
        return next;
      });
    }, 120);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("resume_text", rawResumeText);
      }
      if (candidateName) formData.append("candidate_name", candidateName);

      const res = await suggestRoles(formData, currentIdToken);
      clearInterval(timer);
      setProgressPercent(100);
      setProgressMsg("Analysis Complete!");

      const resData = res.data;
      if (res.session && res.session.resume_text) {
        resData.resume_text = res.session.resume_text;
        setRawResumeText(res.session.resume_text);
      }
      setResults(resData);
      setBaselineSession(res.baseline_session);
      refreshHistory();

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      clearInterval(timer);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleCustomRoleAnalyze = async (roleTitle) => {
    const titleToUse = roleTitle || customRoleInput;
    if (!titleToUse.trim()) {
      setError("Please enter or select a custom role title.");
      return;
    }

    let textToUse = rawResumeText.trim();
    if (!textToUse && results && results.resume_text) {
      textToUse = results.resume_text;
    }

    if (!textToUse && selectedFile) {
      try {
        const parsed = await parseResume(selectedFile, currentIdToken);
        if (parsed.resume_text) {
          textToUse = parsed.resume_text;
          setRawResumeText(textToUse);
        }
      } catch (e) {
        console.error("Resume file parse error:", e);
      }
    }

    if (!textToUse) {
      setError("Please upload a resume or paste resume text first.");
      return;
    }

    setError(null);
    setCustomRoleLoading(true);
    setAutocompleteOpen(false);
    setCustomRoleResult(null);

    try {
      const data = await analyzeCustomRole(textToUse, titleToUse.trim());
      setCustomRoleResult(data);
    } catch (e) {
      console.error(e);
      setError(`Custom role evaluation failed: ${e.message}`);
    } finally {
      setCustomRoleLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportTXT = () => {
    if (!results) return;
    const name = results.candidate_name || candidateName || "Candidate";
    let txt = `=================================================================\n`;
    txt += `TECHNO RECRUIT — CAREER NAVIGATOR REPORT\n`;
    txt += `A Product of TS Innovations | Developed by Raj Kishore S\n`;
    txt += `Generated on: ${new Date().toLocaleString()}\n`;
    txt += `=================================================================\n\n`;
    
    txt += `CANDIDATE NAME: ${name}\n\n`;
    
    if (results.candidate_summary) {
      txt += `OVERVIEW & SUMMARY:\n${results.candidate_summary}\n\n`;
    }
    
    if (results.why_best_fit) {
      txt += `WHY THIS CANDIDATE IS THE BEST FIT:\n${results.why_best_fit.replace(/\*\*/g, '')}\n\n`;
    }

    if (results.leadership_and_community?.length) {
      txt += `LEADERSHIP & COMMUNITY INITIATIVES:\n`;
      results.leadership_and_community.forEach(item => {
        txt += `• ${String(item).replace(/\*\*/g, '')}\n`;
      });
      txt += `\n`;
    }

    if (results.achievements_and_competitions?.length) {
      txt += `COMPETITIVE ACHIEVEMENTS & HACKATHONS:\n`;
      results.achievements_and_competitions.forEach(item => {
        txt += `• ${String(item).replace(/\*\*/g, '')}\n`;
      });
      txt += `\n`;
    }

    if (results.work_and_internship_experience?.length) {
      txt += `INTERNSHIPS & WORK EXPERIENCE:\n`;
      results.work_and_internship_experience.forEach(item => {
        txt += `• ${String(item).replace(/\*\*/g, '')}\n`;
      });
      txt += `\n`;
    }

    if (results.dynamic_recommendations?.length) {
      txt += `DYNAMIC CAREER RECOMMENDATIONS & SKILL GAP IMPROVEMENTS:\n`;
      results.dynamic_recommendations.forEach(item => {
        txt += `• ${String(item).replace(/\*\*/g, '')}\n`;
      });
      txt += `\n`;
    }

    if (results.suggested_roles?.length) {
      txt += `RECOMMENDED MATCHING ROLES:\n`;
      results.suggested_roles.forEach((role, i) => {
        txt += `${i + 1}. ${String(role.role_title).replace(/\*/g, '')} [${role.domain || 'Tech'}]\n`;
        txt += `   - Junior Match: ${role.beginner_score}%\n`;
        txt += `   - Mid-Level Match: ${role.intermediate_score}%\n`;
        txt += `   - Senior Match: ${role.experienced_score}%\n`;
        txt += `   - Summary: ${String(role.match_summary || '').replace(/\*\*/g, '')}\n`;
        if (role.key_strengths?.length) {
          txt += `   - Strengths: ${role.key_strengths.map(s => String(s).replace(/\*\*/g, '')).join(', ')}\n`;
        }
        if (role.skill_gaps?.length) {
          txt += `   - Gaps: ${role.skill_gaps.map(g => String(g).replace(/\*\*/g, '')).join(', ')}\n`;
        }
        if (role.recommended_next_steps) {
          txt += `   - Next Step: ${String(role.recommended_next_steps).replace(/\*\*/g, '')}\n`;
        }
        txt += `\n`;
      });
    }

    txt += `=================================================================\n`;
    txt += `© ${new Date().getFullYear()} Techno Recruit. All Rights Reserved.\n`;
    txt += `A Product of TS Innovations | Developed by Raj Kishore S\n`;
    
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${name.replace(/\s+/g, '_')}_Career_Insights.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="content-container">
      <Header 
        title="AI Career Navigator" 
        subtitle="Multi-Agent Candidate Screening & Career Suitability Recommender." 
      />

      <div className="content-body">
        {/* Upload Form Card */}
        <div className="card no-print" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', marginBottom: '16px' }}>
            <User size={16} /> Candidate Profile Input
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Candidate Name (Optional):</label>
            <input 
              type="text" 
              value={candidateName} 
              onChange={e => setCandidateName(e.target.value)} 
              placeholder="e.g. John Doe" 
              style={{ width: '100%', height: '40px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 12px', color: '#fff', fontSize: '13px' }} 
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Upload Candidate Resume (PDF/DOCX/TXT):</label>
            <Dropzone onFileDrop={handleDrop} selectedFile={selectedFile} />
          </div>

          <div style={{ textAlign: 'center', margin: '12px 0', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>OR PASTE RESUME TEXT BELOW</div>

          <textarea 
            value={rawResumeText} 
            onChange={e => setRawResumeText(e.target.value)} 
            placeholder="Paste full candidate resume plain text here..." 
            style={{ width: '100%', height: '140px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#fff', fontSize: '13px', fontFamily: 'inherit' }} 
          />

          {error && <div style={{ marginTop: '12px', color: 'var(--color-error)', fontSize: '13px' }}>{error}</div>}

          {/* AI Progress Bar */}
          {loading && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--color-primary-light)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} className="spin" style={{ color: 'var(--color-primary-light)' }} /> {progressMsg}
                </span>
                <span style={{ color: 'var(--color-primary-light)' }}>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${progressPercent}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #6366f1, #10b981)', 
                    borderRadius: '4px', 
                    transition: 'width 0.3s ease' 
                  }} 
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button className="btn-primary" onClick={handleAnalyze} disabled={loading} style={{ minHeight: '48px', padding: '0 32px', fontSize: '15px', fontWeight: 700 }}>
              {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              <span>Analyze Resume & Calculate Match Scores</span>
            </button>
          </div>
        </div>

        {/* Results Container with Ref for Auto-Scroll */}
        {results && (
          <div className="navigator-results" ref={resultsRef}>
            {/* Candidate Header Summary */}
            <div className="card" style={{ padding: '24px', marginBottom: '20px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span className="badge-active" style={{ marginBottom: '8px', width: 'fit-content' }}><span className="dot"></span> CAREER NAVIGATOR REPORT</span>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    👤 {results.candidate_name || candidateName || "Candidate Profile"}
                  </h2>
                </div>

                <div className="no-print" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={handleExportPDF} 
                    className="btn-secondary" 
                    style={{ fontSize: '13px', padding: '8px 16px', fontWeight: 700, borderColor: 'var(--color-primary-light)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={15} />
                    <span>Export PDF Report</span>
                  </button>
                  <button 
                    onClick={handleExportTXT} 
                    className="btn-secondary" 
                    style={{ fontSize: '13px', padding: '8px 16px', fontWeight: 700, borderColor: 'var(--color-success)', color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={15} />
                    <span>Export TXT Insights</span>
                  </button>
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

            {/* Recommended Roles Grid - Sorted with BEST FIT Role displayed FIRST */}
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} style={{ color: 'var(--color-primary-light)' }} /> Recommended Matching Roles
            </h3>

            <div className="roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              {sortedRoles.map((role, idx) => (
                <div 
                  key={idx} 
                  className="card role-card" 
                  style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: idx === 0 ? '1px solid var(--color-success)' : '1px solid var(--border-color)',
                    background: idx === 0 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)' : 'var(--bg-surface)'
                  }}
                >
                  {/* BEST FIT MATCH Top Badge for First Card */}
                  {idx === 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <span className="badge-active" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', border: '1px solid var(--color-success)', fontSize: '11px', padding: '4px 12px', fontWeight: 800, borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={12} /> ★ BEST FIT MATCH
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ color: 'var(--color-primary-light)', fontSize: '16px', fontWeight: 700, margin: 0 }}>
                      {String(role.role_title || '').replace(/\*/g, '').trim()}
                    </h4>
                    <span className="domain-pill" style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--color-primary-light)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {String(role.domain || '').replace(/\*/g, '').trim()}
                    </span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                    {renderFormattedBoldText(role.match_summary)}
                  </p>

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
                      <strong>Next Step:</strong> {renderFormattedBoldText(role.recommended_next_steps)}
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
                        <div key={idx} className="autocomplete-dropdown-item" onClick={() => { setCustomRoleInput(item.title); setAutocompleteOpen(false); handleCustomRoleAnalyze(item.title); }}>
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

              {/* Custom Role Full Detail Result */}
              {customRoleResult && (
                <div className="card role-card" style={{ marginTop: '24px', padding: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))', border: '1px solid var(--color-primary-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span className="badge-active" style={{ marginBottom: '6px', fontSize: '11px' }}><span className="dot"></span> CUSTOM ROLE EVALUATION</span>
                      <h3 style={{ color: 'var(--color-primary-light)', fontSize: '18px', fontWeight: 800, margin: 0 }}>{customRoleResult.role_title}</h3>
                    </div>
                    <span className="domain-pill" style={{ background: 'rgba(99,102,241,0.25)', color: 'var(--color-primary-light)', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                      {customRoleResult.domain || "Custom Role"}
                    </span>
                  </div>

                  <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.6 }}>
                    {renderFormattedBoldText(customRoleResult.match_summary)}
                  </p>

                  <div className="level-scores-box" style={{ background: 'rgba(15,23,42,0.8)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Junior Match Suitability</span>
                      <span style={{ fontWeight: 800, color: 'var(--color-success)' }}>{customRoleResult.beginner_score}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Mid-Level Match Suitability</span>
                      <span style={{ fontWeight: 800, color: 'var(--color-primary-light)' }}>{customRoleResult.intermediate_score}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Senior Match Suitability</span>
                      <span style={{ fontWeight: 800, color: '#f59e0b' }}>{customRoleResult.experienced_score}%</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    {/* Key Strengths */}
                    {customRoleResult.key_strengths && customRoleResult.key_strengths.length > 0 && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '14px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Check size={16} /> Candidate Key Strengths:
                        </div>
                        <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {customRoleResult.key_strengths.map((str, sidx) => (
                            <li key={sidx}>{renderFormattedBoldText(str)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Skill Gaps */}
                    {customRoleResult.skill_gaps && customRoleResult.skill_gaps.length > 0 && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '14px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={16} /> Skill Gaps to Improve:
                        </div>
                        <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {customRoleResult.skill_gaps.map((gap, gidx) => (
                            <li key={gidx}>{renderFormattedBoldText(gap)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommended Next Steps */}
                  {customRoleResult.recommended_next_steps && (
                    <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', fontSize: '13px', color: '#fff' }}>
                      <strong style={{ color: 'var(--color-primary-light)' }}>Recommended Next Steps:</strong> {renderFormattedBoldText(customRoleResult.recommended_next_steps)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
