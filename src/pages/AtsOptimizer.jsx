import React, { useState } from 'react';
import { FileCheck2, Wand2, Loader2, CheckCircle2, AlertTriangle, Target, Copy, Download, FileText, Briefcase } from 'lucide-react';
import Header from '../components/common/Header';
import Dropzone from '../components/common/Dropzone';
import { useAuth } from '../context/AuthContext';
import { optimizeResume, parseResume } from '../services/api';

export default function AtsOptimizer() {
  const { currentIdToken } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawResumeText, setRawResumeText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    try {
      const res = await parseResume(file, currentIdToken);
      if (res.resume_text) setRawResumeText(res.resume_text);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOptimize = async () => {
    if (!selectedFile && !rawResumeText.trim()) {
      showToast("Please upload a resume file or paste resume text.");
      return;
    }
    if (!jobDesc.trim()) {
      showToast("Please enter target Job Description.");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("resume_text", rawResumeText);
      }
      formData.append("job_title", jobTitle || "Target Role");
      formData.append("job_description", jobDesc);

      const res = await optimizeResume(formData, currentIdToken);
      setResults(res.data);
      showToast("AI Resume Optimization & ATS Audit Complete!");
    } catch (e) {
      showToast(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyText = () => {
    if (!results || !results.ats_optimized_resume_text) return;
    navigator.clipboard.writeText(results.ats_optimized_resume_text);
    showToast("Tailored ATS resume content copied to clipboard!");
  };

  const handleDownloadText = () => {
    if (!results || !results.ats_optimized_resume_text) return;
    const cleanTitle = (jobTitle || "Target_Role").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${cleanTitle}_ATS_Optimized_Resume.txt`;
    const blob = new Blob([results.ats_optimized_resume_text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  return (
    <div className="content-container">
      <Header 
        title="AI Resume Enhancer & ATS Optimizer" 
        subtitle="Deep ATS Gap Audit, Keyword Heatmap & Tailored Resume Generator." 
      />

      <div className="content-body">
        {toastMsg && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--color-primary)', color: '#fff', padding: '12px 20px', borderRadius: '8px', zIndex: 10000, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            {toastMsg}
          </div>
        )}

        {/* Input Form Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          {/* Resume Input Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> Candidate Resume
            </div>
            <Dropzone onFileSelected={handleFileSelect} selectedFile={selectedFile} />

            <div style={{ textAlign: 'center', margin: '10px 0', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>— OR PASTE TEXT —</div>

            <textarea 
              value={rawResumeText}
              onChange={e => setRawResumeText(e.target.value)}
              placeholder="Paste full candidate resume plain text here..."
              style={{ width: '100%', height: '140px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#fff', fontSize: '13px', fontFamily: 'inherit' }}
            />
          </div>

          {/* Job Opening Input Card */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={16} /> Target Job Opening
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Job Title:</label>
              <input 
                type="text" 
                value={jobTitle} 
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Full Stack Engineer, Product Manager"
                style={{ width: '100%', minHeight: '42px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 14px', color: '#fff' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Job Description & Requirements:</label>
              <textarea 
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                placeholder="Paste full Job Description, required skills, tools, frameworks, and qualifications here..."
                style={{ flex: 1, minHeight: '160px', width: '100%', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: '#fff', fontSize: '13px', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <button className="btn-primary" onClick={handleOptimize} disabled={loading} style={{ minHeight: '52px', padding: '0 36px', fontSize: '15px', fontWeight: 700 }}>
            {loading ? <Loader2 className="spin" size={20} /> : <Wand2 size={20} />}
            <span>Run AI Resume Enhancer & ATS Optimizer</span>
          </button>
        </div>

        {/* Results Container */}
        {results && (
          <div className="ats-results-container">
            {/* Header Score Card */}
            <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <span className="badge-active" style={{ marginBottom: '8px', width: 'fit-content' }}><span className="dot"></span> ATS COMPATIBILITY REPORT</span>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Target Role: {results.job_title || jobTitle || "Target Position"}
                  </h3>
                </div>
                <div>
                  <div style={{ fontSize: '38px', fontWeight: 900, color: (results.ats_score || 0) >= 80 ? 'var(--color-success)' : '#f59e0b', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                    {results.ats_score || 0}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>ATS Match Score</div>
                </div>
              </div>
            </div>

            {/* Keyword Heatmap */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Matched Keywords Green Pills */}
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> Matched ATS Keywords & Qualifications
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(results.matched_keywords || []).map((kw, idx) => (
                    <span key={idx} className="domain-pill" style={{ background: 'rgba(16,185,129,0.18)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', fontSize: '12px', padding: '4px 10px', fontWeight: 600 }}>✓ {kw}</span>
                  ))}
                </div>
              </div>

              {/* Missing Keywords Orange Pills */}
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> Missing Critical ATS Keywords to Add
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(results.missing_keywords || []).map((kw, idx) => (
                    <span key={idx} className="domain-pill" style={{ background: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontSize: '12px', padding: '4px 10px', fontWeight: 600 }}>+ {kw}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bullet Recommendations */}
            <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-light)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={16} /> Bullet Point & Action Verb Recommendations
              </h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-primary)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {(results.formatting_and_impact_improvements || []).map((imp, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{imp}</li>
                ))}
              </ul>
            </div>

            {/* Tailored Resume Text */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={18} style={{ color: 'var(--color-success)' }} /> AI-Enhanced ATS Optimized Resume Content
                </h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-secondary" onClick={handleCopyText} style={{ fontSize: '12.5px' }}>
                    <Copy size={14} />
                    <span>Copy Resume Text</span>
                  </button>
                  <button className="btn-primary" onClick={handleDownloadText} style={{ fontSize: '12.5px' }}>
                    <Download size={14} />
                    <span>Download ATS Resume (.txt)</span>
                  </button>
                </div>
              </div>

              <pre style={{ width: '100%', maxHeight: '500px', overflowY: 'auto', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '18px', color: '#f8fafc', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {results.ats_optimized_resume_text}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
