'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const portals = [
    {
      id: 0,
      label: 'Visitor Check-In',
      sub: 'Self-entry form & live pass tracking',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
          <path d="M14 14h2v2m0 3h3m-3-3v3"/>
        </svg>
      ),
      color: '#5B8E85',
      bg: '#EBF4F2',
      href: '/public/visitor/apt-1',
      step: '01',
    },
    {
      id: 1,
      label: 'Resident Dashboard',
      sub: 'Approve or reject gate requests',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 4l9 5.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      ),
      color: '#7B6FAB',
      bg: '#F0EDF8',
      href: '/resident/dashboard',
      step: '02',
    },
    {
      id: 2,
      label: 'Guard Terminal',
      sub: 'Scan passes & log entry / exit',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      ),
      color: '#B07A3E',
      bg: '#F7F0E6',
      href: '/guard/dashboard',
      step: '03',
    },
    {
      id: 3,
      label: 'Admin Office',
      sub: 'Analytics, logs & roster management',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3h2m2 0h2m-3-3v2m0 2v2"/>
        </svg>
      ),
      color: '#5B7FAB',
      bg: '#EBF0F7',
      href: '/admin/dashboard',
      step: '04',
    },
  ];

  const features = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
        </svg>
      ),
      title: 'Real-time approvals',
      body: 'Residents receive an instant notification when someone arrives at the gate, and approve or reject with one tap.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
          <path d="M14 14h2v2m0 3h3m-3-3v3"/>
        </svg>
      ),
      title: 'Touchless QR passes',
      body: 'Every approved visit generates a unique QR pass. Guards scan it at the gate — no paperwork, no delays.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h18v5H3zm0 8h18v10H3zm4 5h10"/>
        </svg>
      ),
      title: 'Complete audit trail',
      body: 'Every entry and exit is logged with timestamps. Exportable reports for committee reviews and safety audits.',
    },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --base: #E8E4DD;
          --surface: #F0EDE8;
          --surface-up: #F5F2EE;
          --shadow-dark: rgba(0,0,0,0.13);
          --shadow-light: rgba(255,255,255,0.85);
          --text-primary: #2A2825;
          --text-secondary: #6B6760;
          --text-muted: #9E9B96;
          --teal: #4E8079;
          --teal-light: #EBF4F2;
          --radius: 20px;
        }
        body { background: var(--surface); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        .neu-raised {
          background: var(--surface-up);
          box-shadow: 6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light);
          border-radius: var(--radius);
        }
        .neu-inset {
          background: var(--base);
          box-shadow: inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light);
          border-radius: var(--radius);
        }
        .neu-flat {
          background: var(--surface);
          box-shadow: 4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light);
          border-radius: 14px;
        }

        .page { min-height: 100vh; background: var(--surface); color: var(--text-primary); }

        .header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(240,237,232,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .header-inner {
          max-width: 1180px; margin: 0 auto; padding: 0 32px;
          height: 68px; display: flex; align-items: center; justify-content: space-between;
        }
        .logo { display: flex; align-items: center; gap: 2px; }
        .logo-icon {
          border-radius: 100%;
          background: var(--surface-up);
          box-shadow: 3px 3px 8px var(--shadow-dark), -3px -3px 8px var(--shadow-light);
          display: flex; align-items: center; justify-content: center; color: var(--teal);
        }
        .logo-text { font-size: 17px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px; }
        .logo-text span { color: var(--teal); }
        .header-nav { display: flex; align-items: center; gap: 10px; }
        .btn-ghost {
          padding: 8px 18px; border-radius: 10px; border: none; background: transparent;
          font-size: 14px; color: var(--text-secondary); cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover { background: var(--base); color: var(--text-primary); }
        .btn-primary {
          padding: 9px 22px; border-radius: 12px; border: none;
          background: var(--surface-up);
          box-shadow: 4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light);
          font-size: 14px; font-weight: 600; color: var(--teal); cursor: pointer;
          transition: all 0.15s;
        }
        .btn-primary:hover { box-shadow: 5px 5px 12px var(--shadow-dark), -5px -5px 12px var(--shadow-light); }
        .btn-primary:active {
          box-shadow: inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light);
          color: #3A6B65;
        }

        .hero { max-width: 1180px; margin: 0 auto; padding: 72px 32px 60px; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }

        .eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 30px;
          background: var(--surface-up);
          box-shadow: 3px 3px 8px var(--shadow-dark), -3px -3px 8px var(--shadow-light);
          font-size: 12px; font-weight: 600; color: var(--teal); letter-spacing: 0.5px;
          text-transform: uppercase; margin-bottom: 28px;
        }
        .dot-live {
          width: 7px; height: 7px; border-radius: 50%; background: #5BAE8E;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        h1 {
          font-size: clamp(36px, 4.5vw, 54px);
          font-weight: 800; line-height: 1.12;
          letter-spacing: -1.5px; color: var(--text-primary);
          margin-bottom: 20px;
        }
        h1 .accent { color: var(--teal); }
        .hero-body {
          font-size: 16px; line-height: 1.75; color: var(--text-secondary);
          max-width: 440px; margin-bottom: 36px;
        }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .cta-main {
          padding: 15px 30px; border-radius: 16px; border: none; cursor: pointer;
          background: var(--surface-up);
          box-shadow: 6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light);
          font-size: 15px; font-weight: 700; color: var(--teal);
          display: flex; align-items: center; gap: 10px;
          transition: all 0.18s;
        }
        .cta-main:hover { box-shadow: 8px 8px 18px var(--shadow-dark), -8px -8px 18px var(--shadow-light); }
        .cta-main:active {
          box-shadow: inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light);
        }
        .cta-main svg { transition: transform 0.2s; }
        .cta-main:hover svg { transform: translateX(3px); }
        .cta-secondary {
          padding: 15px 24px; border-radius: 16px; border: none; cursor: pointer;
          background: var(--surface);
          box-shadow: inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light);
          font-size: 15px; font-weight: 600; color: var(--text-secondary);
          transition: all 0.18s;
        }
        .cta-secondary:hover { color: var(--text-primary); }

        .portal-panel {
          background: var(--surface-up);
          box-shadow: 8px 8px 20px var(--shadow-dark), -8px -8px 20px var(--shadow-light);
          border-radius: 28px; padding: 28px;
        }
        .portal-header { margin-bottom: 20px; }
        .portal-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
        .portal-sub { font-size: 12px; color: var(--text-muted); }
        .portal-time {
          font-size: 11px; color: var(--text-muted); font-variant-numeric: tabular-nums;
          display: flex; align-items: center; gap: 6px; margin-top: 6px;
        }

        .portal-cards { display: flex; flex-direction: column; gap: 10px; }
        .portal-card {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px; border-radius: 18px; border: none; cursor: pointer;
          text-align: left; width: 100%;
          background: var(--surface-up);
          box-shadow: 4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light);
          transition: all 0.18s;
          position: relative; overflow: hidden;
        }
        .portal-card:hover {
          box-shadow: 6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light);
          transform: translateY(-1px);
        }
        .portal-card:active, .portal-card.active {
          box-shadow: inset 3px 3px 8px var(--shadow-dark), inset -3px -3px 8px var(--shadow-light);
          transform: translateY(0);
        }
        .portal-icon {
          width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1), inset -2px -2px 5px rgba(255,255,255,0.7);
        }
        .portal-text { flex: 1; }
        .portal-card-label { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
        .portal-card-sub { font-size: 11px; color: var(--text-muted); line-height: 1.4; }
        .portal-step {
          font-size: 11px; font-weight: 700; color: var(--text-muted);
          font-variant-numeric: tabular-nums; opacity: 0.5;
        }
        .portal-arrow { color: var(--text-muted); flex-shrink: 0; transition: transform 0.2s, color 0.2s; }
        .portal-card:hover .portal-arrow { transform: translateX(3px); }

        .divider { max-width: 1180px; margin: 0 auto; padding: 0 32px; }
        .divider-line {
          height: 1px; background: linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent);
          margin: 0;
        }

        .features { max-width: 1180px; margin: 0 auto; padding: 60px 32px; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .feature-card {
          padding: 28px; border-radius: 22px;
          background: var(--surface-up);
          box-shadow: 5px 5px 12px var(--shadow-dark), -5px -5px 12px var(--shadow-light);
        }
        .feature-icon {
          width: 42px; height: 42px; border-radius: 13px;
          background: var(--base);
          box-shadow: inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light);
          display: flex; align-items: center; justify-content: center;
          color: var(--teal); margin-bottom: 18px;
        }
        .feature-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
        .feature-body { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }

        .stats { max-width: 1180px; margin: 0 auto; padding: 0 32px 60px; }
        .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .stat-card {
          padding: 22px 26px; border-radius: 18px;
          background: var(--base);
          box-shadow: inset 3px 3px 8px var(--shadow-dark), inset -3px -3px 8px var(--shadow-light);
          text-align: center;
        }
        .stat-num { font-size: 32px; font-weight: 800; color: var(--teal); letter-spacing: -1px; }
        .stat-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

        .footer {
          border-top: 1px solid rgba(0,0,0,0.06);
          background: var(--surface);
        }
        .footer-inner {
          max-width: 1180px; margin: 0 auto; padding: 28px 32px;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px;
        }
        .footer-copy { font-size: 12px; color: var(--text-muted); }
        .footer-links { display: flex; gap: 20px; }
        .footer-link { font-size: 12px; color: var(--text-muted); text-decoration: none; transition: color 0.15s; }
        .footer-link:hover { color: var(--text-secondary); }

        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .features-grid { grid-template-columns: 1fr; }
          .stats-row { grid-template-columns: 1fr; }
          h1 { font-size: 36px; }
          .header-inner { padding: 0 20px; }
          .hero { padding: 48px 20px 40px; }
        }
      `}</style>

      <div className="page">
        {/* Header */}
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <img src="/logo-icon.png" alt="logo" className="w-10 h-full" />
              <span className="logo-text">Gate<span>Keeper</span></span>
            </div>
            <nav className="header-nav">
              <button className="btn-ghost" onClick={() => router.push('/login')}>Sign in</button>
              <button className="btn-primary" onClick={() => router.push('/register')}>Get access</button>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <main className="hero">
          <div className="hero-grid">
            {/* Left */}
            <div>
              <div className="eyebrow">
                <span className="dot-live" />
                Visitor management system
              </div>
              <h1>
                A smarter gate<br />
                for every <span className="accent">resident</span>
              </h1>
              <p className="hero-body">
                Replace paper registers with a digital concierge. Residents approve visitors from their phone, guards scan a QR code, and the gate opens — all in under 30 seconds.
              </p>
              <div className="hero-actions">
                <button className="cta-main" onClick={() => router.push('/public/visitor/apt-1')}>
                  Visitor check-in
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button className="cta-secondary" onClick={() => router.push('/login')}>
                  Open dashboard
                </button>
              </div>
            </div>

            {/* Right — Portal Panel */}
            <div className="portal-panel">
              <div className="portal-header">
                <div className="portal-title">Portal entryways</div>
                <div className="portal-sub">Test each role in the demo environment</div>
                <div className="portal-time">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l2 2"/>
                  </svg>
                  Live · {time}
                </div>
              </div>
              <div className="portal-cards">
                {portals.map((p) => (
                  <button
                    key={p.id}
                    className={`portal-card${activeCard === p.id ? ' active' : ''}`}
                    onMouseDown={() => setActiveCard(p.id)}
                    onMouseUp={() => { setActiveCard(null); router.push(p.href); }}
                    onMouseLeave={() => setActiveCard(null)}
                  >
                    <div className="portal-icon" style={{ background: p.bg, color: p.color }}>
                      {p.icon}
                    </div>
                    <div className="portal-text">
                      <div className="portal-card-label">{p.label}</div>
                      <div className="portal-card-sub">{p.sub}</div>
                    </div>
                    <span className="portal-step">{p.step}</span>
                    <svg className="portal-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Stats */}
        <section className="stats">
          <div className="stats-row">
            {[
              { num: '25', label: 'Pre-seeded flats across 5 floors' },
              { num: '< 30s', label: 'Average visitor approval time' },
              { num: '100%', label: 'Audit coverage, zero paper trail' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="divider"><div className="divider-line" /></div>

        {/* Features */}
        <section className="features">
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-body">{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-inner">
            <span className="footer-copy">© 2026 GateKeeper VMS — Built for secure residential communities</span>
            <div className="footer-links">
              <a href="#" className="footer-link">Privacy</a>
              <a href="#" className="footer-link">Terms</a>
              <a href="#" className="footer-link">Security</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}