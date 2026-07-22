import React, { useState } from 'react';
import { 
  BrainCircuit, Sparkles, CheckSquare, Loader2, Award, FileText, CheckCircle2, 
  ChevronRight, HelpCircle, UserCheck, AlertTriangle, Wrench, ClipboardCheck, Database, CheckCircle 
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

  return (
    <div className="content-container">
      <Header 
        title="AI Interview Architect" 
        subtitle="Multi-Agent Interview Syllabus & Rubric Generator." 
      />

      <div className="content-body">
        {/* Form Input Card */}
        <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                <option value="Entry-Level / Junior">Entry-Level / Junior (0-2 YOE)</option>
                <option value="Mid-Level">Mid-Level (2-5 YOE)</option>
                <option value="Senior / Lead">Senior / Lead (5-8+ YOE)</option>
                <option value="Principal / Architect">Principal / Architect (8+ YOE)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Job Description:</label>
            <textarea 
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              placeholder="Paste job description requirements, key skills, and tools here..."
              style={{ width: '100%', height: '120px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#fff', fontSize: '13px', fontFamily: 'inherit' }}
            />
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
                    background: selectedCategories.includes(cat) ? 'rgba(99,102,241,0.25)' : 'rgba(15,23,42,0.6)',
                    color: selectedCategories.includes(cat) ? '#fff' : 'var(--text-muted)',
                    border: selectedCategories.includes(cat) ? '1px solid var(--color-primary-light)' : '1px solid var(--border-color)'
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
              <span>Generate Structured Interview Guide</span>
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
          <div>
            <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))' }}>
              <span className="badge-active" style={{ marginBottom: '8px', width: 'fit-content' }}><span className="dot"></span> ARCHITECTED GUIDE</span>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>
                {generatedGuide.job_title} ({generatedGuide.experience_level})
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {(generatedGuide.questions || []).map((q, idx) => (
                <div key={idx} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary-light)' }}>Q{idx + 1} • {q.category}</span>
                    <span style={{ background: 'rgba(99,102,241,0.15)', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>{q.difficulty}</span>
                  </div>

                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff', marginBottom: '10px', lineHeight: 1.5 }}>
                    {q.question}
                  </h4>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    <strong>Target Skill:</strong> {q.target_skill}
                  </p>

                  <div style={{ background: 'rgba(15,23,42,0.7)', padding: '10px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <strong>Model Answer snippet:</strong> {q.model_answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
