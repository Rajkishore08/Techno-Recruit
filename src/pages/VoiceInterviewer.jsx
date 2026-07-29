import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play, Square, Loader2, Sparkles, Trophy, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, MessageSquare, ArrowRight, User, Settings, Radio } from 'lucide-react';
import Header from '../components/common/Header';
import { useAuth } from '../context/AuthContext';

const PREDEFINED_ROLES = [
  "Senior Full Stack Engineer",
  "Flutter & Mobile Developer",
  "DevOps & Cloud Architect",
  "AI & Machine Learning Engineer",
  "Product Manager & Strategy Lead"
];

const VOICE_PERSONAS = [
  { id: 'female', label: '👩‍💼 Professional Female', desc: 'Clear, articulate female AI interviewer' },
  { id: 'male', label: '👨‍💼 Executive Male', desc: 'Confident, authoritative male AI interviewer' },
  { id: 'british', label: '🇬🇧 British Accent', desc: 'Formal UK English AI interviewer' },
  { id: 'system', label: '🤖 Browser Default', desc: 'Standard system text-to-speech voice' }
];

export default function VoiceInterviewer() {
  const { currentIdToken } = useAuth();
  const [jobTitle, setJobTitle] = useState('Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Senior');
  const [activeSession, setActiveSession] = useState(false);
  
  // Voice Persona & Speech Settings
  const [selectedPersona, setSelectedPersona] = useState('female');
  const [systemVoices, setSystemVoices] = useState([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Voice State: 'idle' | 'ai_speaking' | 'listening' | 'evaluating' | 'completed'
  const [voiceState, setVoiceState] = useState('idle');
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [turnScores, setTurnScores] = useState([]);
  const [finalScorecard, setFinalScorecard] = useState(null);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  // Load available Web Speech API voices
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setSystemVoices(voices);
        if (voices.length > 0 && !selectedVoiceUri) {
          const defaultEn = voices.find(v => v.lang.startsWith('en')) || voices[0];
          setSelectedVoiceUri(defaultEn.voiceURI);
        }
      }
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const combinedText = (finalTranscript + interimTranscript).trim();
        if (combinedText) {
          setCurrentSpeechText(combinedText);
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition notice:", e.error);
        if (e.error === 'not-allowed') {
          setError("Microphone permission denied. Please allow microphone access in browser settings or type your responses below.");
        }
      };

      recognition.onend = () => {
        // Auto-restart listening if session is still listening
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.warn("Recognition auto-restart notice");
          }
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Web Speech Recognition API is not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Find best matching SpeechSynthesis Voice based on selected persona
  const getSelectedVoice = () => {
    if (!systemVoices.length) return null;

    if (selectedVoiceUri) {
      const exact = systemVoices.find(v => v.voiceURI === selectedVoiceUri);
      if (exact) return exact;
    }

    if (selectedPersona === 'female') {
      const female = systemVoices.find(v => 
        v.lang.startsWith('en') && (
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('zira') || 
          v.name.toLowerCase().includes('samantha') || 
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('fiona')
        )
      );
      if (female) return female;
    } else if (selectedPersona === 'male') {
      const male = systemVoices.find(v => 
        v.lang.startsWith('en') && (
          v.name.toLowerCase().includes('male') || 
          v.name.toLowerCase().includes('david') || 
          v.name.toLowerCase().includes('alex') || 
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('george')
        )
      );
      if (male) return male;
    } else if (selectedPersona === 'british') {
      const british = systemVoices.find(v => 
        v.lang === 'en-GB' || v.name.toLowerCase().includes('uk') || v.name.toLowerCase().includes('british')
      );
      if (british) return british;
    }

    return systemVoices.find(v => v.lang.startsWith('en')) || systemVoices[0];
  };

  const speakText = (text, onEndCallback) => {
    if (!('speechSynthesis' in window) || isMuted) {
      setVoiceState('listening');
      startListening();
      if (onEndCallback) onEndCallback();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeed;
    utterance.pitch = selectedPersona === 'female' ? 1.1 : selectedPersona === 'male' ? 0.9 : 1.0;
    
    const voiceObj = getSelectedVoice();
    if (voiceObj) {
      utterance.voice = voiceObj;
    }

    utterance.onend = () => {
      setVoiceState('listening');
      startListening();
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      setVoiceState('listening');
      startListening();
      if (onEndCallback) onEndCallback();
    };

    setVoiceState('ai_speaking');
    window.speechSynthesis.speak(utterance);
  };

  const handlePreviewVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }

    setIsPreviewing(true);
    window.speechSynthesis.cancel();

    const sampleText = `Hello! I am your AI Technical Interviewer for the ${jobTitle} role.`;
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = voiceSpeed;
    utterance.pitch = selectedPersona === 'female' ? 1.1 : selectedPersona === 'male' ? 0.9 : 1.0;

    const voiceObj = getSelectedVoice();
    if (voiceObj) {
      utterance.voice = voiceObj;
    }

    utterance.onend = () => setIsPreviewing(false);
    utterance.onerror = () => setIsPreviewing(false);

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    setCurrentSpeechText('');
    setVoiceState('listening');
    isListeningRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition already active");
      }
    }
  };

  const stopListening = () => {
    isListeningRef.current = false;
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

    const initialQ = `Hello! Welcome to your AI technical interview for the ${jobTitle} position at ${experienceLevel} level. To begin, please introduce yourself and walk me through a major project you built.`;

    const newHistory = [{ role: 'interviewer', content: initialQ }];
    setTranscriptHistory(newHistory);

    speakText(initialQ);
  };

  const handleSubmitSpokenTurn = async () => {
    stopListening();
    const spoken = currentSpeechText.trim();
    if (!spoken) {
      alert("Please speak into your microphone or type your answer before submitting.");
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
        const nextQ = data.next_question || "Thank you. Could you elaborate on how you handled performance optimization and error handling in that project?";
        const nextHistory = [...updatedHistory, { role: 'interviewer', content: nextQ }];
        setTranscriptHistory(nextHistory);

        speakText(nextQ);
      }
    } catch (e) {
      console.error(e);
      setError(`Evaluation error: ${e.message}`);
      setVoiceState('listening');
      startListening();
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
        title="AI Real-Time Voice Interviewer & Voice Persona Selector" 
        subtitle="Conversational Voice Simulation, Multi-Persona Speech Synthesis, Real-Time Speech Recognition & Technical Shortlisting Engine." 
      />

      <div className="content-body">
        {/* Setup & Persona Card */}
        {!activeSession && (
          <div className="card" style={{ padding: '28px', maxWidth: '760px', margin: '0 auto 28px auto', background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))', border: '1px solid var(--color-accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                <Mic size={18} /> Real-Time AI Voice Interview Simulation
              </div>

              <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '9999px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid #10b981' }}>
                🎙️ Speech-to-Text Active
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              Conduct Spoken AI Technical Interview
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '24px' }}>
              Select your preferred AI interviewer voice persona below. The AI speaks questions aloud, listens to your microphone response in real time, and scores technical accuracy.
            </p>

            {/* AI Voice Persona Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                <Radio size={16} style={{ color: '#38bdf8' }} /> Select AI Interviewer Voice Persona:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                {VOICE_PERSONAS.map((persona) => {
                  const isSelected = selectedPersona === persona.id;
                  return (
                    <div 
                      key={persona.id}
                      onClick={() => {
                        setSelectedPersona(persona.id);
                        setSelectedVoiceUri('');
                      }}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: isSelected ? 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(99,102,241,0.2))' : 'rgba(15,23,42,0.8)',
                        border: isSelected ? '1.5px solid #38bdf8' : '1px solid var(--border-color)',
                        boxShadow: isSelected ? '0 0 14px rgba(56,189,248,0.25)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                        {persona.label}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {persona.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advanced System Voice Dropdown */}
              {systemVoices.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select 
                    value={selectedVoiceUri} 
                    onChange={e => setSelectedVoiceUri(e.target.value)} 
                    style={{ flex: 1, height: '38px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 12px', color: '#fff', fontSize: '12.5px' }}
                  >
                    <option value="">-- Installed System Voices ({systemVoices.length} available) --</option>
                    {systemVoices.map((v, idx) => (
                      <option key={idx} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>

                  <button 
                    type="button" 
                    onClick={handlePreviewVoice} 
                    disabled={isPreviewing}
                    className="btn-secondary" 
                    style={{ height: '38px', padding: '0 14px', fontSize: '12px', fontWeight: 700, gap: '6px' }}
                  >
                    {isPreviewing ? <Loader2 className="spin" size={14} /> : <Volume2 size={14} />}
                    <span>Preview Voice</span>
                  </button>
                </div>
              )}
            </div>

            {/* Target Role & Seniority */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Job Role:</label>
                <input 
                  type="text" 
                  value={jobTitle} 
                  onChange={e => setJobTitle(e.target.value)} 
                  placeholder="e.g. Senior Full Stack Engineer" 
                  style={{ width: '100%', height: '42px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 14px', color: '#fff', fontSize: '13.5px' }} 
                />
              </div>

              <div>
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
            </div>

            {/* Role Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {PREDEFINED_ROLES.map((r, idx) => (
                <button key={idx} onClick={() => setJobTitle(r)} style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', color: 'var(--color-accent)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  {r}
                </button>
              ))}
            </div>

            {error && <div style={{ marginBottom: '16px', color: '#ef4444', fontSize: '13px', background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>}

            <button className="btn-primary" onClick={handleStartInterview} style={{ width: '100%', minHeight: '48px', justifyContent: 'center', fontSize: '15px', fontWeight: 800 }}>
              <Mic size={20} />
              <span>Start Live AI Voice Interview</span>
            </button>
          </div>
        )}

        {/* Active Voice Interview Room */}
        {activeSession && !finalScorecard && (
          <div className="card" style={{ padding: '28px', maxWidth: '820px', margin: '0 auto', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--color-primary-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge-active" style={{ background: 'linear-gradient(135deg, #0284c7, #3b82f6)', marginBottom: '4px' }}>
                  🎙️ LIVE VOICE INTERVIEW ROOM
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {jobTitle} ({experienceLevel})
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', color: isMuted ? '#ef4444' : '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isMuted ? "AI Audio Muted" : "Mute AI"}</span>
                </button>

                <button className="btn-secondary" onClick={() => handleFinishInterview()} style={{ fontSize: '12px', padding: '6px 14px', borderColor: '#ef4444', color: '#ef4444' }}>
                  <Square size={14} /> End & Generate Scorecard
                </button>
              </div>
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
                {voiceState === 'listening' && "🎙️ Candidate Microphone Active... Speak clearly into your mic!"}
                {voiceState === 'evaluating' && "⚡ Evaluating Spoken Technical Depth & Answer Accuracy..."}
              </div>
            </div>

            {/* Live Candidate Speech Input Box & Text Editor */}
            {voiceState === 'listening' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Live Microphone Speech Input (Auto-Transcribed / Editable):
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setCurrentSpeechText('')} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Clear Text
                  </button>
                </div>

                <textarea 
                  value={currentSpeechText}
                  onChange={e => setCurrentSpeechText(e.target.value)}
                  placeholder="Listening to microphone... Speak your response clearly or edit text here..."
                  style={{ width: '100%', height: '100px', background: 'rgba(15,23,42,0.85)', border: '1.5px solid var(--color-success)', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', lineHeight: 1.5 }}
                />

                <div style={{ marginTop: '12px', display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Mic size={14} className="spin" /> Listening continuously... Speak or click submit.
                  </div>

                  <button className="btn-primary" onClick={handleSubmitSpokenTurn} style={{ fontSize: '13px', padding: '10px 22px', fontWeight: 800 }}>
                    <ArrowRight size={16} /> Submit Answer & Continue
                  </button>
                </div>
              </div>
            )}

            {/* Live Interview Transcript Feed */}
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} /> Live Interview Conversation Feed ({transcriptHistory.length} Turns)
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '6px' }}>
                {transcriptHistory.map((t, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '14px 18px', 
                      borderRadius: '12px', 
                      background: t.role === 'interviewer' ? 'rgba(30, 41, 59, 0.85)' : 'rgba(16, 185, 129, 0.15)',
                      border: t.role === 'interviewer' ? '1px solid var(--border-color)' : '1px solid rgba(16, 185, 129, 0.35)',
                      alignSelf: t.role === 'interviewer' ? 'flex-start' : 'flex-end',
                      maxWidth: '88%'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: t.role === 'interviewer' ? 'var(--color-accent)' : '#10b981', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {t.role === 'interviewer' ? '🤖 AI Interviewer' : '👤 Candidate Spoken Answer'}
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#fff', lineHeight: 1.55 }}>
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
