import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play, Square, Loader2, Sparkles, Trophy, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, MessageSquare, ArrowRight, User } from 'lucide-react';
import Header from '../components/common/Header';
import { useAuth } from '../context/AuthContext';

const PREDEFINED_ROLES = [
  "Senior Full Stack Engineer",
  "Flutter & Mobile Developer",
  "DevOps & Cloud Architect",
  "AI & Machine Learning Engineer",
  "Product Manager & Strategy Lead"
];

export default function VoiceInterviewer() {
  const { currentIdToken } = useAuth();
  const [jobTitle, setJobTitle] = useState('Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Senior');
  const [activeSession, setActiveSession] = useState(false);
  
  // Voice State: 'idle' | 'ai_speaking' | 'listening' | 'evaluating' | 'completed'
  const [voiceState, setVoiceState] = useState('idle');
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [turnScores, setTurnScores] = useState([]);
  const [finalScorecard, setFinalScorecard] = useState(null);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  // Initialize Speech Recognition on Mount if available
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const combined = (final || interim).trim();
        if (combined) {
          setCurrentSpeechText(combined);
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition notice:", e.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const speakText = (text, onEndCallback) => {
    if (!('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = () => {
      if (onEndCallback) onEndCallback();
    };

    setVoiceState('ai_speaking');
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    setCurrentSpeechText('');
    setVoiceState('listening');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition already started");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const handleStartInterview = async () => {
    if (!jobTitle.trim()) {
      setError("Please specify a job title.");
      return;
    }

    setError(null);
    setActiveSession(true);
    setTranscriptHistory([]);
    setTurnScores([]);
    setFinalScorecard(null);
    setCurrentSpeechText('');

    const initialQ = `Hello! Welcome to your real-time AI technical interview for the ${jobTitle} position at ${experienceLevel} level. To begin, please introduce yourself and walk me through a major project you led.`;

    const newHistory = [{ role: 'interviewer', content: initialQ }];
    setTranscriptHistory(newHistory);

    speakText(initialQ, () => {
      startListening();
    });
  };

  const handleSubmitSpokenTurn = async () => {
    stopListening();
    const spoken = currentSpeechText.trim();
    if (!spoken) {
      alert("Please speak or type your answer before submitting.");
      return;
    }

    setVoiceState('evaluating');
    const updatedHistory = [...transcriptHistory, { role: 'candidate', content: spoken }];
    setTranscriptHistory(updatedHistory);
    setCurrentSpeechText('');

    try {
      const resp = await fetch("/api/voice-interview/evaluate-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          experience_level: experienceLevel,
          history: updatedHistory,
          spoken_answer: spoken
        })
      });

      const res = await resp.json();
      if (!resp.ok) throw new Error(res.detail || "Turn evaluation failed.");

      const data = res.data;
      if (data.answer_score) {
        setTurnScores(prev => [...prev, { score: data.answer_score, feedback: data.evaluation_feedback }]);
      }

      if (data.is_final || updatedHistory.length >= 8) {
        await handleFinishInterview(updatedHistory);
      } else {
        const nextQ = data.next_question || "Thank you. Could you elaborate on how you handled error recovery and performance optimization in that scenario?";
        const nextHistory = [...updatedHistory, { role: 'interviewer', content: nextQ }];
        setTranscriptHistory(nextHistory);

        speakText(nextQ, () => {
          startListening();
        });
      }
    } catch (e) {
      console.error(e);
      setError(`Evaluation error: ${e.message}`);
      setVoiceState('listening');
    }
  };

  const handleFinishInterview = async (historyToUse = null) => {
    stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setVoiceState('evaluating');
    const hist = historyToUse || transcriptHistory;

    try {
      const resp = await fetch("/api/voice-interview/generate-final-scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          experience_level: experienceLevel,
          history: hist
        })
      });

      const res = await resp.json();
      if (!resp.ok) throw new Error(res.detail || "Scorecard generation failed.");

      setFinalScorecard(res.data);
      setVoiceState('completed');
    } catch (e) {
      console.error(e);
      setError(`Scorecard error: ${e.message}`);
      setVoiceState('idle');
    }
  };

  return (
    <div className="content-container">
      <Header 
        title="AI Real-Time Voice Interviewer" 
        subtitle="Conversational Voice Simulation, Real-Time Speech Recognition & Spoken Depth Assessor." 
      />

      <div className="content-body">
        {/* Setup Card */}
        {!activeSession && (
          <div className="card" style={{ padding: '28px', maxWidth: '720px', margin: '0 auto 28px auto', background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))', border: '1px solid var(--color-accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '16px' }}>
              <Mic size={18} /> Real-Time Voice Interview Simulation Room
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              Conduct Spoken AI Technical Interview
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '20px' }}>
              The AI Interviewer speaks questions out loud using speech synthesis, listens to your spoken responses via your microphone, scores your technical depth in real-time, and asks dynamic follow-up questions.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Job Role:</label>
              <input 
                type="text" 
                value={jobTitle} 
                onChange={e => setJobTitle(e.target.value)} 
                placeholder="e.g. Senior Full Stack Engineer" 
                style={{ width: '100%', height: '42px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 14px', color: '#fff', fontSize: '13.5px' }} 
              />
            </div>

            {/* Role Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {PREDEFINED_ROLES.map((r, idx) => (
                <button key={idx} onClick={() => setJobTitle(r)} style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', color: 'var(--color-accent)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  {r}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Seniority Level:</label>
              <select 
                value={experienceLevel} 
                onChange={e => setExperienceLevel(e.target.value)} 
                style={{ width: '100%', height: '42px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 14px', color: '#fff', fontSize: '13.5px' }}
              >
                <option value="Junior">Junior / Entry Level</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior / Staff Lead</option>
              </select>
            </div>

            {error && <div style={{ marginBottom: '16px', color: 'var(--color-error)', fontSize: '13px' }}>{error}</div>}

            <button className="btn-primary" onClick={handleStartInterview} style={{ width: '100%', minHeight: '48px', justifyContent: 'center', fontSize: '15px', fontWeight: 800 }}>
              <Mic size={20} />
              <span>Start Live AI Voice Interview</span>
            </button>
          </div>
        )}

        {/* Active Voice Interview Room */}
        {activeSession && !finalScorecard && (
          <div className="card" style={{ padding: '28px', maxWidth: '800px', margin: '0 auto', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--color-primary-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge-active" style={{ background: 'linear-gradient(135deg, #0284c7, #3b82f6)', marginBottom: '4px' }}>
                  🎙️ LIVE VOICE INTERVIEW ROOM
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {jobTitle} ({experienceLevel})
                </h3>
              </div>

              <button className="btn-secondary" onClick={() => handleFinishInterview()} style={{ fontSize: '12px', padding: '6px 14px', borderColor: '#ef4444', color: '#ef4444' }}>
                <Square size={14} /> End & Generate Scorecard
              </button>
            </div>

            {/* AI Avatar & Audio Visualizer Status */}
            <div style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 14px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  position: 'absolute', 
                  inset: '-10px', 
                  borderRadius: '50%', 
                  background: voiceState === 'ai_speaking' ? 'radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)' : voiceState === 'listening' ? 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)' : 'none',
                  animation: voiceState !== 'idle' ? 'pulse 1.5s infinite ease-in-out' : 'none'
                }} />
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: voiceState === 'ai_speaking' ? '#0284c7' : voiceState === 'listening' ? '#10b981' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 1 }}>
                  {voiceState === 'ai_speaking' ? <Volume2 size={32} /> : voiceState === 'listening' ? <Mic size={32} /> : <Loader2 className="spin" size={32} />}
                </div>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 800, color: voiceState === 'ai_speaking' ? 'var(--color-accent)' : voiceState === 'listening' ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                {voiceState === 'ai_speaking' && "🤖 AI Interviewer Speaking..."}
                {voiceState === 'listening' && "🎙️ Candidate Listening... Speak your answer now!"}
                {voiceState === 'evaluating' && "⚡ Evaluating Spoken Technical Depth..."}
              </div>
            </div>

            {/* Live Candidate Speech Input Box */}
            {voiceState === 'listening' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Live Transcribed Answer (Edit if needed):</label>
                <textarea 
                  value={currentSpeechText}
                  onChange={e => setCurrentSpeechText(e.target.value)}
                  placeholder="Listening to microphone... Speak clearly into your mic or type response..."
                  style={{ width: '100%', height: '90px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--color-success)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '13.5px', fontFamily: 'inherit' }}
                />

                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button className="btn-primary" onClick={handleSubmitSpokenTurn} style={{ fontSize: '13px', padding: '8px 20px', fontWeight: 700 }}>
                    <ArrowRight size={16} /> Submit Answer & Continue
                  </button>
                </div>
              </div>
            )}

            {/* Live Interview Transcript Feed */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} /> Live Conversation Transcript
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '6px' }}>
                {transcriptHistory.map((t, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '14px', 
                      borderRadius: '10px', 
                      background: t.role === 'interviewer' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(99, 102, 241, 0.15)',
                      border: t.role === 'interviewer' ? '1px solid var(--border-color)' : '1px solid rgba(99,102,241,0.3)',
                      alignSelf: t.role === 'interviewer' ? 'flex-start' : 'flex-end',
                      maxWidth: '90%'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: t.role === 'interviewer' ? 'var(--color-accent)' : '#10b981', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {t.role === 'interviewer' ? '🤖 AI Interviewer' : '👤 Candidate Spoken Response'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#fff', lineHeight: 1.5 }}>
                      {t.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Final Performance Scorecard Report View */}
        {finalScorecard && (
          <div className="card" style={{ padding: '32px', maxWidth: '820px', margin: '0 auto', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))', border: '1px solid #10b981', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge-active" style={{ background: 'linear-gradient(135deg, #10b981, #0284c7)', marginBottom: '6px' }}>
                  <Trophy size={14} /> VOICE INTERVIEW SCORECARD REPORT
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Candidate Performance Analysis
                </h2>
              </div>
              <button className="btn-primary" onClick={handleStartInterview} style={{ fontSize: '13px', padding: '8px 16px' }}>
                <RefreshCw size={15} /> Restart Voice Interview
              </button>
            </div>

            {/* Hiring Verdict Banner */}
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                FINAL DECISION VERDICT
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                🏆 {finalScorecard.hiring_verdict || "RECOMMEND HIRE"}
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                {finalScorecard.executive_summary}
              </p>
            </div>

            {/* Score Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#38bdf8' }}>{finalScorecard.technical_competency_score || 88}%</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Technical Depth</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981' }}>{finalScorecard.communication_clarity_score || 92}%</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Communication Clarity</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#f59e0b' }}>{finalScorecard.problem_solving_score || 85}%</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>Problem Solving</div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {finalScorecard.key_strengths_observed && (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '18px', borderRadius: '10px' }}>
                  <h4 style={{ color: 'var(--color-success)', fontSize: '14px', fontWeight: 800, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Key Strengths Observed:
                  </h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {finalScorecard.key_strengths_observed.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
              )}

              {finalScorecard.improvement_areas && (
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '18px', borderRadius: '10px' }}>
                  <h4 style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 800, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} /> Improvement Areas:
                  </h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {finalScorecard.improvement_areas.map((imp, idx) => <li key={idx}>{imp}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
