import React, { useState } from 'react';
import { Users, FileArchive, UploadCloud, Loader2, CheckCircle2, AlertTriangle, Trophy, Target, Sparkles, Star, ChevronRight, FileText, Check, X, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import Header from '../components/common/Header';
import Dropzone from '../components/common/Dropzone';
import { useAuth } from '../context/AuthContext';
import { bulkScreenCandidates } from '../services/api';

export default function BulkScreener() {
  const { currentIdToken } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [zipFile, setZipFile] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [criteriaSkills, setCriteriaSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [screeningResults, setScreeningResults] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleMultipleFilesSelect = (files) => {
    // If user selected a ZIP file
    const zip = Array.from(files).find(f => f.name.toLowerCase().endsWith('.zip'));
    if (zip) {
      setZipFile(zip);
      setSelectedFiles([]);
      showToast(`Selected ZIP Archive: ${zip.name}`);
    } else {
      setZipFile(null);
      setSelectedFiles(Array.from(files));
      showToast(`Selected ${files.length} candidate resume file(s).`);
    }
  };

  const handleSingleDrop = (file) => {
    if (file.name.toLowerCase().endsWith('.zip')) {
      setZipFile(file);
      setSelectedFiles([]);
      showToast(`Selected ZIP Archive: ${file.name}`);
    } else {
      setZipFile(null);
      setSelectedFiles([file]);
      showToast(`Selected file: ${file.name}`);
    }
  };

  const handleScreenCandidates = async (e) => {
    e.preventDefault();
    if (!zipFile && selectedFiles.length === 0) {
      alert("Please upload at least one candidate resume or a ZIP archive containing resumes.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setScreeningResults(null);

    try {
      const formData = new FormData();
      if (zipFile) {
        formData.append("files", zipFile);
      } else {
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });
      }

      formData.append("job_title", jobTitle || "Target Role");
      formData.append("job_description", jobDesc);
      formData.append("criteria_skills", criteriaSkills);

      const res = await bulkScreenCandidates(formData, currentIdToken);
      setScreeningResults(res.data);
      showToast("Candidate Batch Screening & Fit Rationale Analysis Complete!");
    } catch (err) {
      setErrorMsg(err.message || "Failed to process candidate resumes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-container">
      <Header 
        title="Recruiter AI Bulk Candidate Screener & Fit Matcher" 
        subtitle="Batch Resume Processing, ZIP Archive Extraction, Custom Skills Matching & Evidence-Backed 'Why He/She Fits' Shortlist Engine." 
      />

      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, background: 'linear-gradient(135deg,#10b981,#0284c7)', color: '#fff', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="content-body">
        {/* Recruiter Suite Top Card */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge-active" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid #c084fc', marginBottom: '8px' }}>
                👔 RECRUITER BATCH PROCESSING
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Bulk Upload Resumes or ZIP Archive for Automated Shortlisting
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                Upload multiple candidate resumes or a single <code>.zip</code> file. Provide target role criteria & skills to extract ranked best-fit candidates with rationale.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '8px', background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FileArchive size={14} /> ZIP Auto-Unpack
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> AI Fit Rationale
              </span>
            </div>
          </div>
        </div>

        {/* Upload & Form Section */}
        <form onSubmit={handleScreenCandidates} className="grid grid-2" style={{ gap: '24px', marginBottom: '28px' }}>
          {/* Left Column: Upload Dropzone */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={18} style={{ color: '#c084fc' }} />
              1. Upload Candidate Resumes (PDF, DOCX, ZIP)
            </h3>

            <Dropzone 
              onFileSelect={handleSingleDrop} 
              onMultipleFilesSelect={handleMultipleFilesSelect}
              accept=".pdf,.docx,.zip,.txt"
            />

            {/* Selected Files Badge Display */}
            {zipFile ? (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileArchive size={18} />
                  <span>ZIP Archive: {zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button type="button" onClick={() => setZipFile(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            ) : selectedFiles.length > 0 ? (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} />
                  <span>{selectedFiles.length} Resume File(s) Selected</span>
                </div>
                <button type="button" onClick={() => setSelectedFiles([])} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                Tip: Drag & drop a <code>.zip</code> file containing candidate resumes to extract all resumes automatically.
              </p>
            )}
          </div>

          {/* Right Column: Role & Criteria Input */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} style={{ color: '#38bdf8' }} />
              2. Job Details & Evaluation Criteria
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Target Job Title *
              </label>
              <input 
                type="text" 
                className="input-field"
                placeholder="e.g. Senior DevOps & Cloud Architect / Full Stack Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                style={{ width: '100%', height: '42px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 14px', color: '#fff', fontSize: '13.5px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Target Skills & Custom Criteria to Look For *
              </label>
              <textarea 
                className="input-field"
                rows={2}
                placeholder="e.g. Must have Kubernetes, Terraform, AWS certification, 4+ years experience, system design, hackathon wins"
                value={criteriaSkills}
                onChange={(e) => setCriteriaSkills(e.target.value)}
                style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Job Description (Optional)
              </label>
              <textarea 
                className="input-field"
                rows={2}
                placeholder="Paste job description text or key responsibilities..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
              />
            </div>

            <button 
              type="submit"
              className="btn-primary"
              disabled={loading || (!zipFile && selectedFiles.length === 0)}
              style={{ marginTop: 'auto', height: '44px', fontWeight: 800, background: 'linear-gradient(135deg, #7e22ce, #0284c7)' }}
            >
              {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              <span>{loading ? "Extracting & Analyzing Candidates..." : "⚡ Screen & Rank Candidates"}</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Screening Results Shortlist Dashboard */}
        {screeningResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Shortlist Summary Cards */}
            <div className="grid grid-4" style={{ gap: '16px' }}>
              <div className="card" style={{ padding: '20px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(56,189,248,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8' }}>{screeningResults.total_screened || 0}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>Candidates Evaluated</div>
              </div>

              <div className="card" style={{ padding: '20px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>{screeningResults.top_fits_count || 0}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>Top Fit Shortlisted</div>
              </div>

              <div className="card" style={{ padding: '20px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(168,85,247,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#c084fc' }}>{screeningResults.average_match_score || 0}%</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>Average Pool Match</div>
              </div>

              <div className="card" style={{ padding: '20px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(245,158,11,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>
                  {screeningResults.candidates && screeningResults.candidates.length > 0 ? screeningResults.candidates[0].match_score : 0}%
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>Highest Match Score</div>
              </div>
            </div>

            {/* Executive Shortlist Overview */}
            {screeningResults.summary && (
              <div className="card" style={{ padding: '16px 20px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', color: 'var(--text-primary)', fontSize: '13.5px', lineHeight: 1.5 }}>
                <strong style={{ color: '#38bdf8' }}>Executive Pool Summary: </strong> {screeningResults.summary}
              </div>
            )}

            {/* Ranked Shortlist Candidates List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} style={{ color: '#f59e0b' }} />
                Ranked Best-Fit Candidates ({screeningResults.candidates?.length || 0})
              </h3>

              {screeningResults.candidates?.map((candidate, idx) => {
                const score = candidate.match_score || 0;
                const isTopFit = score >= 80;
                const scoreColor = score >= 80 ? '#10b981' : score >= 70 ? '#38bdf8' : score >= 50 ? '#f59e0b' : '#ef4444';

                return (
                  <div 
                    key={idx}
                    className="card"
                    style={{ 
                      padding: '24px', 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: isTopFit ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                      boxShadow: isTopFit ? '0 8px 24px rgba(16, 185, 129, 0.15)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    {/* Candidate Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Rank Badge */}
                        <div 
                          style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '12px', 
                            background: idx === 0 ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : idx === 1 ? 'linear-gradient(135deg,#38bdf8,#0284c7)' : 'rgba(255,255,255,0.08)', 
                            color: '#fff', 
                            fontWeight: 800, 
                            fontSize: '18px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: idx === 0 ? '0 0 16px rgba(245,158,11,0.4)' : 'none',
                            flexShrink: 0
                          }}
                        >
                          #{candidate.rank || idx + 1}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                              {candidate.candidate_name || "Candidate Name"}
                            </h4>
                            <span 
                              style={{ 
                                fontSize: '11px', 
                                fontWeight: 800, 
                                padding: '3px 10px', 
                                borderRadius: '9999px', 
                                background: isTopFit ? 'rgba(16,185,129,0.15)' : 'rgba(56,189,248,0.15)', 
                                color: scoreColor, 
                                border: `1px solid ${scoreColor}` 
                              }}
                            >
                              {candidate.fit_tier || "Shortlisted"}
                            </span>
                          </div>

                          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span>📄 File: {candidate.filename}</span>
                            {candidate.contact_email && candidate.contact_email !== 'N/A' && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={12} /> {candidate.contact_email}
                              </span>
                            )}
                            {candidate.contact_phone && candidate.contact_phone !== 'N/A' && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} /> {candidate.contact_phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score Indicator */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: scoreColor }}>
                          {score}%
                        </div>
                        <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden', marginTop: '4px' }}>
                          <div style={{ width: `${score}%`, height: '100%', background: scoreColor, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    </div>

                    {/* WHY THIS CANDIDATE FITS - Evidence-Backed Rationale Callout Box */}
                    <div 
                      style={{ 
                        padding: '16px 20px', 
                        borderRadius: '12px', 
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(168, 85, 247, 0.12))', 
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} /> WHY THIS CANDIDATE FITS:
                      </div>
                      <p style={{ fontSize: '13.5px', color: '#fff', lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
                        {candidate.why_fits_reason || "Analyzed background against target requirements."}
                      </p>
                    </div>

                    {/* Experience Summary */}
                    {candidate.experience_summary && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                        <strong>Background Overview:</strong> {candidate.experience_summary}
                      </p>
                    )}

                    {/* Matched & Missing Skills Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                      {candidate.matched_skills && candidate.matched_skills.length > 0 && (
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                            MATCHED SKILLS & CRITERIA:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {candidate.matched_skills.map((skill, sIdx) => (
                              <span key={sIdx} style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                ✓ {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {candidate.missing_criteria && candidate.missing_criteria.length > 0 && (
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                            MISSING / GAP CRITERIA:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {candidate.missing_criteria.map((gap, gIdx) => (
                              <span key={gIdx} style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                ✗ {gap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Standout Highlights */}
                    {candidate.key_highlights && candidate.key_highlights.length > 0 && (
                      <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                          ⭐ Standout Highlights:
                        </span>
                        {candidate.key_highlights.map((h, hIdx) => (
                          <span key={hIdx} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            • {h}
                          </span>
                        ))}
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
