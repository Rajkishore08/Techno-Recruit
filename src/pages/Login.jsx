import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Compass, Target, Database, Sparkles } from 'lucide-react';

export default function Login() {
  const { currentUser, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed',
      inset: 0,
      display: 'flex', 
      alignItems: 'center', 
      justify: 'center', 
      background: 'var(--bg-base)',
      backgroundImage: 'var(--gradient-hero)',
      padding: '20px',
      boxSizing: 'border-box',
      zIndex: 99999,
      overflowY: 'auto'
    }}>
      <div className="card" style={{ 
        maxWidth: '480px', 
        width: '100%', 
        textAlign: 'center', 
        padding: '40px 32px',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        boxShadow: 'var(--shadow-card)',
        borderRadius: 'var(--radius-lg)',
        margin: 'auto'
      }}>
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <img 
            src="/logo.png" 
            alt="Techno Recruit Logo" 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              objectFit: 'cover', 
              border: '2px solid var(--color-accent)', 
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
              marginBottom: '16px'
            }} 
          />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            Techno Recruit
          </h1>
          <span style={{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            AI Talent Intelligence Platform
          </span>
        </div>

        {/* Center Aligned Feature List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center', maxWidth: '360px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--color-accent)', padding: '6px', borderRadius: '8px', width: 'fit-content' }}>
              <Compass size={18} />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '4px 0 2px 0' }}>Multi-Agent Role Navigator</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>Screen profiles and match candidates to target domains instantly.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center', maxWidth: '360px' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--color-success)', padding: '6px', borderRadius: '8px', width: 'fit-content' }}>
              <ShieldCheck size={18} />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '4px 0 2px 0' }}>ATS Keyword Auditor</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>Enhance resume compatibility score with smart missing keyword injections.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center', maxWidth: '360px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-neon)', padding: '6px', borderRadius: '8px', width: 'fit-content' }}>
              <Database size={18} />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '4px 0 2px 0' }}>Vector RAG Semantic Search</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>Query candidate database in natural language for contextual matching.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center', maxWidth: '360px' }}>
            <div style={{ background: 'rgba(250, 204, 21, 0.15)', color: 'var(--color-warning)', padding: '6px', borderRadius: '8px', width: 'fit-content' }}>
              <Target size={18} />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '4px 0 2px 0' }}>Interview Guide Architect</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>Generate structured interview guides with detailed grading scorecards.</p>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleLogin}
          className="btn-primary" 
          style={{ 
            width: '100%', 
            minHeight: '52px', 
            fontSize: '15px', 
            fontWeight: 700,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-button)'
          }}
        >
          <Sparkles size={18} />
          <span>Authenticate & Access Command Center</span>
        </button>

        <p style={{ fontSize: '11px', color: 'var(--text-disabled)', marginTop: '20px', lineHeight: 1.4 }}>
          By authenticating, you agree to connect your corporate workspace to Techno Recruit.
        </p>
      </div>
    </div>
  );
}
