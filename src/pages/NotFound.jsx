import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, LayoutDashboard, AlertCircle, ArrowLeft } from 'lucide-react';
import Header from '../components/common/Header';

export default function NotFound() {
  return (
    <div className="content-container">
      <Header 
        title="404 — Page Not Found" 
        subtitle="The requested command center URL or workspace route does not exist." 
      />

      <div className="content-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px' }}>
        <div className="card" style={{ 
          maxWidth: '520px', 
          width: '100%', 
          textAlign: 'center', 
          padding: '40px 32px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)',
          borderRadius: '20px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <img 
              src="/logo.png?v=2" 
              alt="Techno Recruit Logo" 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: '2px solid var(--color-accent, #38bdf8)', 
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.45)',
                marginBottom: '16px'
              }} 
            />
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} /> 404 ROUTE NOT FOUND
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              Lost in Workspace Matrix?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              The page or resource you are looking for has been moved, deleted, or does not exist on Techno Recruit.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '28px' }}>
            <Link to="/" className="btn-primary" style={{ width: '100%', minHeight: '48px', justifyContent: 'center', fontSize: '14.5px', fontWeight: 700, textDecoration: 'none' }}>
              <LayoutDashboard size={18} />
              <span>Return to Dashboard</span>
            </Link>
            <Link to="/navigator" className="btn-secondary" style={{ width: '100%', minHeight: '44px', justifyContent: 'center', fontSize: '13.5px', fontWeight: 600, textDecoration: 'none' }}>
              <Compass size={16} />
              <span>Go to Career Navigator</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
