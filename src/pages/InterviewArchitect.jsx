import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, Sparkles, CheckSquare, Loader2, Award, FileText, CheckCircle2, 
  ChevronRight, HelpCircle, UserCheck, AlertTriangle, Wrench, ClipboardCheck, 
  Database, CheckCircle, Copy, Download, Printer, CornerDownRight, Play, RefreshCw
} from 'lucide-react';
import Header from '../components/common/Header';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../services/api';

const CATEGORIES = [
  "Technical Skills",
  "System Architecture",
  "Problem Solving & Coding",
  "Behavioral & Culture Fit",
  "Leadership & Project Ownership",
  "Domain Expertise"
];

const STEPS = [
  { id: "JD_PARSING", label: "JD Parser", icon: FileText },
  { id: "RESUME_MATCHING", label: "Resume Matcher", icon: UserCheck },
  { id: "SYLLABUS_DESIGN", label: "Syllabus Designer", icon: Award },
  { id: "QUESTION_GENERATION", label: "Question Writer", icon: HelpCircle },
  { id: "CRITIQUE", label: "Critic Agent", icon: AlertTriangle },
  { id: "REFINEMENT", label: "Refiner Agent", icon: Wrench },
  { id: "SCORECARD_BUILDING", label: "Scorecard Agent", icon: ClipboardCheck },
  { id: "DB_LOGGING", label: "DB Logger", icon: Database },
];

export default function InterviewArchitect() {
  const { currentIdToken } = useAuth();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [expLevel, setExpLevel] = useState('Mid-Level');
  const [selectedCategories, setSelectedCategories] = useState(["Technical Skills", "System Architecture"]);
  const [questionCount, setQuestionCount] = useState(6);
  const [resumeText, setResumeText] = useState('');

  const [generating, setGenerating] = useState(false);
  const [sseTraces, setSseTraces] = useState([]);
  const [generatedGuide, setGeneratedGuide] = useState(null);
  const [error, setError] = useState(null);

  // Playground & Tweak States
  const [activePlaygroundQId, setActivePlaygroundQId] = useState(null);
  const [activeTweakQId, setActiveTweakQId] = useState(null);
  const [candidateAnswers, setCandidateAnswers] = useState({});
  const [evaluationResults, setEvaluationResults] = useState({});
  const [evaluatingQId, setEvaluatingQId] = useState(null);
  
  const [tweakAction, setTweakAction] = useState('Rewrite Question');
  const [tweakFeedback, setTweakFeedback] = useState('');
  const [tweakingStatus, setTweakingStatus] = useState(false);

  const guideResultRef = useRef(null);

  useEffect(() => {
    if (generatedGuide && guideResultRef.current) {
      guideResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedGuide]);

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleGenerate = async () => {
    if (!jobTitle.trim() || !jobDesc.trim()) {
      setError("Please enter Job Title and Job Description.");
      return;
    }
    setError(null);
    setGenerating(true);
    setSseTraces([]);
    setGeneratedGuide(null);
    setActivePlaygroundQId(null);
    setActiveTweakQId(null);

    const payload = {
      job_title: jobTitle,
      job_description: jobDesc,
      experience_level: expLevel,
      categories: selectedCategories,
      count: questionCount,
      resume_text: resumeText
    };

    try {
      const resp = await fetchWithAuth("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, currentIdToken);

      if (!resp.ok) throw new Error("Failed to start guide generation stream.");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // keep partial

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.phase === "COMPLETED") {
                setGeneratedGuide(data.data);
              }
              // Add to sse traces
              setSseTraces(prev => [...prev, data]);
            } catch (e) {
              console.error("Parse SSE chunk error:", e);
            }
          }
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  // Tweak Question Handler
  const handleTweak = async (questionId) => {
    if (!generatedGuide) return;
    setTweakingStatus(true);
    try {
      const payload = {
        guide_id: generatedGuide.guide_id,
        question_id: questionId,
        action: tweakAction,
        feedback: tweakFeedback
      };
      
      const resp = await fetchWithAuth("/api/tweak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, currentIdToken);

      if (!resp.ok) throw new Error("Failed to tweak question.");
      
      const updatedGuide = await resp.json();
      setGeneratedGuide(prev => ({
        ...prev,
        questions: updatedGuide.questions
      }));
      setActiveTweakQId(null);
      setTweakFeedback('');
    } catch (e) {
      alert("Error tweaking question: " + e.message);
    } finally {
      setTweakingStatus(false);
    }
  };

  // Evaluate Candidate Answer Handler
  const handleEvaluate = async (questionId) => {
    const answer = candidateAnswers[questionId];
    if (!answer || !answer.trim()) {
      alert("Please enter a candidate response to grade.");
      return;
    }

    setEvaluatingQId(questionId);
    try {
      const payload = {
        guide_id: generatedGuide.guide_id,
        question_id: questionId,
        candidate_answer: answer
      };
      
      const resp = await fetchWithAuth("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, currentIdToken);

      if (!resp.ok) throw new Error("Failed to evaluate candidate answer.");
      
      const evalResult = await resp.json();
      setEvaluationResults(prev => ({
        ...prev,
        [questionId]: evalResult
      }));
    } catch (e) {
      alert("Error evaluating response: " + e.message);
    } finally {
      setEvaluatingQId(null);
    }
  };

  // Copy JSON Payload Handler
  const handleCopyJSON = () => {
    if (!generatedGuide) return;
    navigator.clipboard.writeText(JSON.stringify(generatedGuide, null, 2));
    alert("JSON payload copied to clipboard!");
  };

  // Export Markdown Handler
  const handleExportMarkdown = () => {
    if (!generatedGuide) return;
    let md = `# Interview Guide: ${generatedGuide.job_title} (${generatedGuide.experience_level})\n`;
    md += `**Guide ID**: ${generatedGuide.guide_id}\n\n`;
    
    if (generatedGuide.job_analysis?.candidate_profile) {
      md += `## Candidate Profile Fit\n${generatedGuide.job_analysis.candidate_profile}\n\n`;
    }
    
    md += `## Finalized Assessment Questions\n\n`;
    generatedGuide.questions.forEach((q, idx) => {
      md += `### Q${idx + 1}: ${q.question}\n`;
      md += `- **Category**: ${q.category}\n`;
      md += `- **Difficulty**: ${q.difficulty}\n`;
      md += `- **Target Skill**: ${q.target_skill}\n`;
      md += `- **Assessment Rationale**: ${q.rationale}\n`;
      md += `- **Ideal Model Answer**: ${q.model_answer}\n\n`;
      if (q.grading_rubric) {
        md += `#### Grading Rubric\n`;
        md += `- **Score 1 (Poor)**: ${q.grading_rubric['1'] || 'N/A'}\n`;
        md += `- **Score 3 (Good)**: ${q.grading_rubric['3'] || 'N/A'}\n`;
        md += `- **Score 5 (Excellent)**: ${q.grading_rubric['5'] || 'N/A'}\n\n`;
      }
      md += `* * *\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview_guide_${generatedGuide.guide_id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="content-container">
      <Header 
        title="AI Interview Architect" 
        subtitle="Multi-Agent Interview Syllabus & Rubric Generator." 
      />

      <div className="content-body">
        {/* Form Input Card */}
        <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BrainCircuit size={16} /> Interview Requirements Configuration
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Job Title:</label>
              <input 
                type="text" 
                value={jobTitle} 
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Full Stack Engineer, AI Research Lead"
                style={{ width: '100%', minHeight: '42px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 14px', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Seniority Level:</label>
              <select 
                value={expLevel}
                onChange={e => setExpLevel(e.target.value)}
                style={{ width: '100%', minHeight: '42px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 14px', color: '#fff' }}
              >
                <option value="Junior">Entry-Level / Junior (0-2 YOE)</option>
                <option value="Mid-Level">Mid-Level (2-5 YOE)</option>
                <option value="Senior">Senior / Lead (5-8+ YOE)</option>
                <option value="Lead">Principal / Architect (8+ YOE)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Job Description:</label>
              <textarea 
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                placeholder="Paste job description requirements, key skills, and tools here..."
                style={{ width: '100%', height: '100px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#fff', fontSize: '13px', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Candidate Resume (Optional Match):</label>
              <textarea 
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste candidate resume to automatically evaluate fit and build custom questions..."
                style={{ width: '100%', height: '100px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#fff', fontSize: '13px', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Categories Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Include Categories:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map((cat, idx) => (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selectedCategories.includes(cat) ? 'rgba(37,99,235,0.25)' : 'rgba(15,23,42,0.6)',
                    color: selectedCategories.includes(cat) ? '#fff' : 'var(--text-muted)',
                    border: selectedCategories.includes(cat) ? '1px solid var(--color-accent)' : '1px solid var(--border-color)'
                  }}
                >
                  {selectedCategories.includes(cat) ? "✓ " : "+ "}{cat}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

          <div style={{ textAlign: 'center' }}>
            <button className="btn-primary" onClick={handleGenerate} disabled={generating} style={{ minHeight: '48px', padding: '0 32px', fontSize: '15px', fontWeight: 700 }}>
              {generating ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              <span>Execute Autonomous Architect Loop</span>
            </button>
          </div>
        </div>

        {/* SSE Trace Visualizer & Flowchart */}
        {sseTraces.length > 0 && (() => {
          const activeTrace = sseTraces[sseTraces.length - 1];
          const activePhase = activeTrace?.phase || "";
          
          const getStepStatus = (stepId) => {
            if (activePhase === "COMPLETED") return "completed";
            const traceIdx = sseTraces.findIndex(t => t.phase === stepId);
            if (stepId === activePhase) return "active";
            if (traceIdx !== -1) return "completed";
            return "pending";
          };

          return (
            <div className="card" style={{ padding: '24px', marginBottom: '28px', background: 'rgba(11, 17, 32, 0.85)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles className="spin-slow" size={16} /> Autonomous Multi-Agent Work Pipeline
              </h4>

              {/* Grid of Steps */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {STEPS.map((step, idx) => {
                  // Skip resume matching step if no resume uploaded and not started
                  if (step.id === "RESUME_MATCHING" && !resumeText.trim() && getStepStatus(step.id) === "pending") {
                    return null;
                  }
                  
                  const status = getStepStatus(step.id);
                  const Icon = step.icon;
                  
                  let cardBg = 'rgba(15, 23, 42, 0.4)';
                  let border = '1px solid var(--border-color)';
                  let iconColor = 'var(--text-disabled)';
                  let isCurrent = status === 'active';
                  
                  if (status === 'completed') {
                    cardBg = 'rgba(34, 197, 94, 0.06)';
                    border = '1px solid rgba(34, 197, 94, 0.25)';
                    iconColor = 'var(--color-success)';
                  } else if (status === 'active') {
                    cardBg = 'rgba(37, 99, 235, 0.12)';
                    border = '1px solid var(--color-accent)';
                    iconColor = 'var(--color-accent)';
                  }

                  return (
                    <div key={idx} style={{ 
                      background: cardBg, 
                      border, 
                      borderRadius: '12px', 
                      padding: '14px 10px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '8px',
                      textAlign: 'center',
                      position: 'relative',
                      boxShadow: isCurrent ? '0 0 15px rgba(56, 189, 248, 0.2)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ 
                        background: isCurrent ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)', 
                        padding: '10px', 
                        borderRadius: '50%', 
                        color: iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={18} className={isCurrent ? 'spin-slow' : ''} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: status === 'pending' ? 'var(--text-disabled)' : '#fff' }}>
                        {step.label}
                      </span>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: 800, 
                        textTransform: 'uppercase',
                        color: status === 'completed' ? 'var(--color-success)' : isCurrent ? 'var(--color-accent)' : 'var(--text-disabled)'
                      }}>
                        {status === 'completed' ? 'Done ✓' : isCurrent ? 'Active...' : 'Waiting'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Stream Logs */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h5 style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Activity Logs</h5>
                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '6px' }}>
                  {sseTraces.map((tr, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.4 }}>
                      <span style={{ color: tr.phase === "COMPLETED" ? 'var(--color-success)' : tr.phase === "ERROR" ? 'var(--color-error)' : 'var(--color-accent)', fontWeight: 800, flexShrink: 0 }}>
                        [{tr.phase}]
                      </span>
                      <span>{tr.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Generated Guide View */}
        {generatedGuide && (
          <div ref={guideResultRef} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Header Panel with Export Actions */}
            <div className="card" style={{ 
              padding: '24px', 
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <span className="badge-active" style={{ marginBottom: '8px', width: 'fit-content' }}>
                  <span className="dot"></span> ARCHITECTED GUIDE
                </span>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
                  {generatedGuide.job_title} ({generatedGuide.experience_level})
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>
                  GUIDE ID: {generatedGuide.guide_id}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" onClick={handleCopyJSON} style={{ padding: '10px 16px', fontSize: '12px' }}>
                  <Copy size={14} /> <span>Copy JSON</span>
                </button>
                <button className="btn-secondary" onClick={handleExportMarkdown} style={{ padding: '10px 16px', fontSize: '12px' }}>
                  <Download size={14} /> <span>Export Markdown</span>
                </button>
                <button className="btn-secondary" onClick={handlePrint} style={{ padding: '10px 16px', fontSize: '12px' }}>
                  <Printer size={14} /> <span>Print Guide</span>
                </button>
              </div>
            </div>

            {/* Metrics Dashboard */}
            {generatedGuide.metrics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--color-accent)', padding: '10px', borderRadius: '10px' }}>
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                      {generatedGuide.questions?.length || 0}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assessment Items</span>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--color-success)', padding: '10px', borderRadius: '10px' }}>
                    <Loader2 size={20} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                      {generatedGuide.metrics.total_latency_sec}s
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Build Latency</span>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--color-secondary)', padding: '10px', borderRadius: '10px' }}>
                    <Database size={20} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                      {generatedGuide.metrics.total_tokens?.toLocaleString() || 0}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Tokens</span>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(250, 204, 21, 0.15)', color: 'var(--color-warning)', padding: '10px', borderRadius: '10px' }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                      ${generatedGuide.metrics.estimated_cost_usd}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Cost</span>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Requirements Fit */}
            {generatedGuide.job_analysis && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} /> AI Parsed Requirements Fit Profile
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>
                      Candidate Persona Summary
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {generatedGuide.job_analysis.candidate_profile}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                        Extracted Tech Competencies
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(generatedGuide.job_analysis.technical_competencies || []).map((skill, sIdx) => (
                          <span key={sIdx} style={{ fontSize: '11.5px', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--color-accent)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                        Required Soft Skills
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(generatedGuide.job_analysis.soft_skills || []).map((skill, sIdx) => (
                          <span key={sIdx} style={{ fontSize: '11.5px', background: 'rgba(168, 85, 247, 0.12)', color: 'var(--color-secondary)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Questions Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--color-accent)' }} /> Architected Assessment Scorecards
              </h3>
              
              {(generatedGuide.questions || []).map((q, idx) => {
                const isPlaygroundActive = activePlaygroundQId === q.id;
                const isTweakActive = activeTweakQId === q.id;
                const evalResult = evaluationResults[q.id];

                return (
                  <div key={idx} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--color-accent)', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px' }}>
                          Q{idx + 1}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {q.category}
                        </span>
                      </div>
                      <span style={{ background: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-secondary)', fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                        {q.difficulty}
                      </span>
                    </div>

                    {/* Question Content */}
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                        {q.question}
                      </h4>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                        <strong>Target Skill/Focus:</strong> {q.target_skill}
                      </p>
                    </div>

                    {/* Assessment Rationale */}
                    <div style={{ padding: '12px 14px', background: 'rgba(15, 23, 42, 0.4)', borderLeft: '3px solid var(--color-accent)', borderRadius: '4px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <strong>Assessment Rationale:</strong> {q.rationale}
                    </div>

                    {/* Model Answer */}
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
                        Ideal Model Answer Summary
                      </span>
                      <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '14px', borderRadius: '8px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {q.model_answer}
                      </div>
                    </div>

                    {/* Scorecard Rubrics */}
                    {q.grading_rubric && (
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                          Grading Rubric Benchmarks
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '8px' }}>
                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--color-error)', marginBottom: '4px' }}>SCORE 1 (POOR)</span>
                            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{q.grading_rubric['1']}</p>
                          </div>
                          <div style={{ background: 'rgba(250, 204, 21, 0.05)', border: '1px solid rgba(250, 204, 21, 0.15)', padding: '12px', borderRadius: '8px' }}>
                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--color-warning)', marginBottom: '4px' }}>SCORE 3 (GOOD)</span>
                            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{q.grading_rubric['3']}</p>
                          </div>
                          <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.15)', padding: '12px', borderRadius: '8px' }}>
                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--color-success)', marginBottom: '4px' }}>SCORE 5 (EXCELLENT)</span>
                            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{q.grading_rubric['5']}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Question Actions */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', flexWrap: 'wrap' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => {
                          setActivePlaygroundQId(isPlaygroundActive ? null : q.id);
                          setActiveTweakQId(null);
                        }}
                        style={{ padding: '8px 14px', fontSize: '12px', background: isPlaygroundActive ? 'rgba(56, 189, 248, 0.15)' : '#111827' }}
                      >
                        <Play size={12} /> <span>{isPlaygroundActive ? "Close Playground" : "Open Grading Playground"}</span>
                      </button>

                      <button 
                        className="btn-secondary" 
                        onClick={() => {
                          setActiveTweakQId(isTweakActive ? null : q.id);
                          setActivePlaygroundQId(null);
                        }}
                        style={{ padding: '8px 14px', fontSize: '12px', background: isTweakActive ? 'rgba(168, 85, 247, 0.15)' : '#111827' }}
                      >
                        <RefreshCw size={12} /> <span>{isTweakActive ? "Close Tweaker" : "Tweak Question"}</span>
                      </button>
                    </div>

                    {/* Expandable Tweak Form */}
                    {isTweakActive && (
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '16px', marginTop: '4px' }}>
                        <h5 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Wrench size={14} /> Live Question Tweak Console
                        </h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Adjustment Action:</label>
                            <select 
                              value={tweakAction} 
                              onChange={e => setTweakAction(e.target.value)}
                              style={{ width: '100%', minHeight: '36px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '12px' }}
                            >
                              <option value="Make Harder">Increase Difficulty (Harder)</option>
                              <option value="Make Easier">Decrease Difficulty (Easier)</option>
                              <option value="Rewrite Question">Standard Rewrite / Refine</option>
                              <option value="Behavioral Swap">Change to Behavioral STAR focus</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Custom Feedback / Context (Optional):</label>
                            <input 
                              type="text" 
                              value={tweakFeedback}
                              onChange={e => setTweakFeedback(e.target.value)}
                              placeholder="e.g. Focus on docker containers, rephrase to target system security..."
                              style={{ width: '100%', minHeight: '36px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '12px' }}
                            />
                          </div>
                        </div>
                        <button 
                          className="btn-primary" 
                          onClick={() => handleTweak(q.id)}
                          disabled={tweakingStatus}
                          style={{ minHeight: '36px', padding: '0 20px', fontSize: '12px', width: 'fit-content' }}
                        >
                          {tweakingStatus ? <Loader2 className="spin" size={14} /> : <RefreshCw size={12} />}
                          <span>Execute Agent Tweak</span>
                        </button>
                      </div>
                    )}

                    {/* Expandable Playground Panel */}
                    {isPlaygroundActive && (
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <h5 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-accent)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Play size={14} /> AI Interview Response Evaluator Sandbox
                        </h5>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Candidate Answer Input:</label>
                          <textarea 
                            value={candidateAnswers[q.id] || ''}
                            onChange={e => setCandidateAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Type or paste the mock candidate response to evaluate here..."
                            style={{ width: '100%', height: '80px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '12.5px', fontFamily: 'inherit' }}
                          />
                        </div>

                        <button 
                          className="btn-primary"
                          onClick={() => handleEvaluate(q.id)}
                          disabled={evaluatingQId === q.id}
                          style={{ minHeight: '36px', padding: '0 20px', fontSize: '12px', width: 'fit-content' }}
                        >
                          {evaluatingQId === q.id ? <Loader2 className="spin" size={14} /> : <Sparkles size={12} />}
                          <span>Analyze & Grade Response</span>
                        </button>

                        {/* Grading Results Panel */}
                        {evalResult && (
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>EVALUATION SCORE:</span>
                              <span style={{ background: evalResult.score >= 4 ? 'rgba(34, 197, 94, 0.15)' : evalResult.score >= 3 ? 'rgba(250, 204, 21, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: evalResult.score >= 4 ? 'var(--color-success)' : evalResult.score >= 3 ? 'var(--color-warning)' : 'var(--color-error)', fontSize: '13px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                {evalResult.score} / 5
                              </span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                              <div style={{ background: 'rgba(34, 197, 94, 0.03)', border: '1px solid rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '6px' }}>
                                <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--color-success)', marginBottom: '4px' }}>STRENGTHS</span>
                                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {(evalResult.strengths || []).map((str, sIdx) => <li key={sIdx}>{str}</li>)}
                                </ul>
                              </div>
                              <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '6px' }}>
                                <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--color-error)', marginBottom: '4px' }}>WEAKNESSES / GAPS</span>
                                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {(evalResult.weaknesses || []).map((wk, wIdx) => <li key={wIdx}>{wk}</li>)}
                                </ul>
                              </div>
                            </div>

                            {evalResult.red_flags?.length > 0 && (
                              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--color-error)', padding: '10px 14px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--color-error)' }}>
                                <strong>⚠️ CRITICAL RED FLAGS:</strong>
                                <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                                  {evalResult.red_flags.map((rf, rIdx) => <li key={rIdx}>{rf}</li>)}
                                </ul>
                              </div>
                            )}

                            {evalResult.follow_up_question && (
                              <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.15)', padding: '12px 14px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <CornerDownRight size={14} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                  <strong style={{ color: 'var(--color-accent)' }}>Targeted Follow-up Question:</strong>
                                  <p style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>{evalResult.follow_up_question}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
