'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockDb, hasSupabaseCreds, VisitorRequest, VisitorEntry } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import QRCode from 'qrcode';

/* ── status helpers ──────────────────────────────────────── */
type Status = VisitorRequest['status'];

function statusStep(status: Status, hasEntry: boolean, hasExit: boolean): number {
  if (hasExit)            return 4;
  if (hasEntry)           return 3;
  if (status === 'APPROVED') return 2;
  if (status === 'REJECTED') return -1;
  return 1; // PENDING
}

const STEPS = [
  { label: 'Submitted',   sub: 'Request received' },
  { label: 'Approved',    sub: 'Resident confirmed' },
  { label: 'Checked in',  sub: 'Entered premises'  },
  { label: 'Completed',   sub: 'Visit concluded'   },
];

export default function VisitorTrackingPage() {
  const params    = useParams();
  const router    = useRouter();
  const requestId = params?.requestId as string;

  const [request, setRequest]           = useState<VisitorRequest | null>(null);
  const [entry, setEntry]               = useState<VisitorEntry | null>(null);
  const [residentName, setResidentName] = useState('');
  const [flatNumber, setFlatNumber]     = useState('');
  const [qrDataUrl, setQrDataUrl]       = useState('');
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [pulse, setPulse]               = useState(false);       // flash on auto-refresh
  const prevStatus                      = useRef<string>('');

  /* ── fetch ────────────────────────────────────────────── */
  const fetchStatus = async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      if (!hasSupabaseCreds()) {
        const req = mockDb.getVisitorRequests().find(r => r.id === requestId);
        if (req) {
          if (prevStatus.current && prevStatus.current !== req.status) {
            setPulse(true); setTimeout(() => setPulse(false), 800);
          }
          prevStatus.current = req.status;
          setRequest(req);
          const res = mockDb.getResidents().find(r => r.id === req.resident_id);
          if (res) { setResidentName(res.full_name); setFlatNumber(res.flat_number); }
          const ent = mockDb.getVisitorEntries().find(e => e.visitor_request_id === req.id);
          if (ent) setEntry(ent);
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data: req } = await supabase
            .from('visitor_requests')
            .select('*, residents(flat_number, profiles(full_name))')
            .eq('id', requestId).single();
          if (req) {
            if (prevStatus.current && prevStatus.current !== req.status) {
              setPulse(true); setTimeout(() => setPulse(false), 800);
            }
            prevStatus.current = req.status;
            setRequest(req);
            setResidentName(req.residents?.profiles?.full_name || 'Resident');
            setFlatNumber(req.residents?.flat_number || '—');
            const { data: ent } = await supabase
              .from('visitor_entries').select('*')
              .eq('visitor_request_id', req.id).maybeSingle();
            if (ent) setEntry(ent);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const t = setInterval(() => fetchStatus(), 3000);
    return () => clearInterval(t);
  }, [requestId]);

  /* ── QR generation ────────────────────────────────────── */
  useEffect(() => {
    if (request?.status === 'APPROVED') {
      QRCode.toDataURL(request.id, {
        width: 220, margin: 2,
        color: { dark: '#1E1D1B', light: '#ffffff' },
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [request]);

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `gate-pass-${request?.visitor_name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('Gate pass downloaded');
  };

  /* ── derived ──────────────────────────────────────────── */
  const hasEntry    = !!entry;
  const hasExit     = !!entry?.exit_time;
  const step        = request ? statusStep(request.status, hasEntry, hasExit) : 0;
  const isRejected  = request?.status === 'REJECTED';
  const isApproved  = request?.status === 'APPROVED';
  const isPending   = request?.status === 'PENDING';

  /* ── loading / error ──────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F2EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #E4E0D8', borderTopColor: '#5B8E85', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 13, color: '#7A7670' }}>Loading your pass…</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F2EE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FCEAEA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C0392B' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1E1D1B' }}>Request not found</h2>
        <p style={{ fontSize: 13, color: '#7A7670', maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>This tracking ID is invalid or may have expired.</p>
        <button onClick={() => router.push('/')} style={{ marginTop: 8, padding: '10px 22px', borderRadius: 12, background: '#5B8E85', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Return home
        </button>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:         #F4F2EE;
          --surface:    #FAFAF8;
          --border:     #E4E0D8;
          --border-md:  #D5D0C7;
          --sage:       #5B8E85;
          --sage-light: #EBF4F2;
          --sage-mid:   #A8CFC9;
          --text:       #1E1D1B;
          --muted:      #7A7670;
          --amber:      #B07A3E;
          --amber-bg:   #FBF3E8;
          --amber-mid:  #E8C78A;
          --red:        #C0392B;
          --red-bg:     #FCEAEA;
          --neu-bg:     #EDEAE4;
          --neu-dark:   rgba(0,0,0,0.12);
          --neu-light:  rgba(255,255,255,0.90);
        }
        body { background: var(--bg); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: var(--text); }

        .wrap { min-height: 100vh; display: flex; flex-direction: column; }

        /* header */
        .header {
          background: var(--surface); border-bottom: 1px solid var(--border);
          height: 62px; padding: 0 32px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon { width: 34px; height: 34px; border-radius: 10px; background: var(--sage-light); color: var(--sage); display: flex; align-items: center; justify-content: center; }
        .logo-name { font-size: 15px; font-weight: 700; color: var(--text); }
        .logo-name span { color: var(--sage); }
        .header-actions { display: flex; gap: 8px; }
        .btn-icon {
          width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border);
          background: transparent; display: flex; align-items: center; justify-content: center;
          color: var(--muted); cursor: pointer; transition: all 0.15s;
        }
        .btn-icon:hover { background: var(--bg); border-color: var(--border-md); color: var(--text); }
        .btn-outline {
          padding: 7px 16px; border-radius: 10px; border: 1px solid var(--border);
          background: transparent; font-size: 12px; font-weight: 500; color: var(--muted);
          cursor: pointer; transition: all 0.15s;
        }
        .btn-outline:hover { background: var(--bg); color: var(--text); border-color: var(--border-md); }

        /* main */
        .main {
          flex: 1; max-width: 900px; margin: 0 auto; width: 100%;
          padding: 32px 24px;
          display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start;
        }

        /* card */
        .card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 22px; overflow: hidden;
        }
        .card-header { padding: 22px 24px 18px; border-bottom: 1px solid var(--border); }
        .card-body   { padding: 22px 24px; }

        /* request id pill */
        .req-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 30px;
          background: var(--bg); border: 1px solid var(--border);
          font-size: 11px; color: var(--muted); font-family: ui-monospace, monospace;
          margin-bottom: 10px;
        }

        /* status badge */
        .status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 30px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
        }
        .status-badge.pending  { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-mid); }
        .status-badge.approved { background: var(--sage-light); color: var(--sage);  border: 1px solid var(--sage-mid); }
        .status-badge.rejected { background: var(--red-bg);    color: var(--red);   border: 1px solid #F5B8B0; }
        .status-badge.inside   { background: #EBF0F7;          color: #5B7FAB;      border: 1px solid #B0C4DE; }
        .status-badge.done     { background: var(--border);    color: var(--muted); border: 1px solid var(--border-md); }

        .status-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
        }
        .status-dot.pending  { background: var(--amber); animation: pulseDot 2s ease-in-out infinite; }
        .status-dot.approved { background: var(--sage); animation: pulseDot 2s ease-in-out infinite; }
        .status-dot.rejected { background: var(--red); }
        .status-dot.idle     { background: var(--muted); }

        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(0.75); }
        }

        /* ── TIMELINE ──────────────────────────────────── */
        .timeline { padding: 6px 0; }
        .tl-row {
          display: grid;
          grid-template-columns: 32px 1fr;
          gap: 0 14px;
          position: relative;
        }
        /* connector line between rows */
        .tl-row:not(:last-child) .tl-left::after {
          content: '';
          position: absolute;
          left: 15px; top: 32px; bottom: -14px;
          width: 2px;
          background: var(--border);
          border-radius: 2px;
          transition: background 0.4s;
          z-index: 0;
        }
        .tl-row.done .tl-left::after { background: var(--sage-mid); }
        .tl-row.active .tl-left::after { background: var(--border); }

        .tl-left { position: relative; display: flex; flex-direction: column; align-items: center; z-index: 1; }
        .tl-node {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; flex-shrink: 0;
          border: 2px solid transparent;
          transition: all 0.4s;
          position: relative; z-index: 1;
        }
        .tl-node.done    { background: var(--sage); color: #fff; border-color: var(--sage); }
        .tl-node.active  { background: var(--sage-light); color: var(--sage); border-color: var(--sage); }
        .tl-node.waiting { background: var(--surface); color: var(--muted); border-color: var(--border); }
        .tl-node.error   { background: var(--red-bg); color: var(--red); border-color: #F5B8B0; }
        .tl-node.pulse   { animation: nodeGlow 1.5s ease-in-out infinite; }
        @keyframes nodeGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(91,142,133,0); }
          50%     { box-shadow: 0 0 0 6px rgba(91,142,133,0.18); }
        }

        .tl-right { padding-bottom: 24px; }
        .tl-step-label { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 2px; line-height: 1; }
        .tl-step-label.muted { color: var(--muted); }
        .tl-step-sub { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
        .tl-step-time { font-size: 11px; color: var(--sage); font-weight: 500; }

        /* pulse on status change */
        .status-flash { animation: flashBg 0.8s ease; }
        @keyframes flashBg { 0%,100% { background: var(--surface); } 40% { background: var(--sage-light); } }

        /* detail grid */
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .detail-item {}
        .detail-key { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .detail-val { font-size: 13px; font-weight: 600; color: var(--text); }

        /* divider */
        .divider { height: 1px; background: var(--border); margin: 20px 0; }

        /* security log */
        .log-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .log-cell { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; }
        .log-cell-key { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .log-cell-val { font-size: 13px; font-weight: 600; color: var(--text); }
        .log-cell-val.inside { color: var(--sage); }

        /* ── right panel ─────────────────────────────── */
        .right-col { display: flex; flex-direction: column; gap: 16px; }

        /* pending card */
        .pending-card {
          background: var(--amber-bg); border: 1px solid var(--amber-mid);
          border-radius: 20px; padding: 28px 24px; text-align: center;
        }
        .pending-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(176,122,62,0.12); color: var(--amber);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
        }
        .pending-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .pending-desc  { font-size: 12px; color: var(--muted); line-height: 1.6; max-width: 220px; margin: 0 auto 14px; }
        .refresh-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(176,122,62,0.1); border: 1px solid var(--amber-mid);
          border-radius: 30px; padding: 6px 14px;
          font-size: 11px; color: var(--amber); font-weight: 500;
        }

        /* rejected card */
        .rejected-card {
          background: var(--red-bg); border: 1px solid #F5B8B0;
          border-radius: 20px; padding: 28px 24px; text-align: center;
        }
        .rejected-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(192,57,43,0.1); color: var(--red);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
        }
        .rejected-title { font-size: 14px; font-weight: 700; color: var(--red); margin-bottom: 6px; }
        .rejected-desc  { font-size: 12px; color: var(--muted); line-height: 1.6; max-width: 220px; margin: 0 auto; }

        /* qr pass card */
        .qr-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 20px; overflow: hidden;
        }
        .qr-card-header {
          background: var(--sage-light); border-bottom: 1px solid var(--sage-mid);
          padding: 14px 20px; display: flex; align-items: center; gap: 8px;
        }
        .qr-card-title { font-size: 13px; font-weight: 700; color: var(--sage); }
        .qr-card-body  { padding: 20px; text-align: center; }
        .qr-wrap {
          display: inline-block; background: #fff; border-radius: 14px;
          border: 1px solid var(--border); padding: 14px; margin-bottom: 14px;
        }
        .qr-placeholder { width: 200px; height: 200px; background: var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .qr-hint { font-size: 11px; color: var(--muted); margin-bottom: 14px; }
        .pass-code {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
          padding: 10px 14px; margin-bottom: 12px; font-family: ui-monospace, monospace;
          font-size: 13px; font-weight: 700; color: var(--text);
        }
        .copy-btn {
          background: none; border: none; cursor: pointer; color: var(--sage);
          padding: 2px; display: flex; align-items: center;
        }

        /* neumorphic download button */
        .btn-neu {
          width: 100%; padding: 13px 20px; border: none; cursor: pointer;
          border-radius: 14px;
          background: var(--neu-bg);
          box-shadow: 4px 4px 10px var(--neu-dark), -4px -4px 10px var(--neu-light);
          font-size: 13px; font-weight: 700; color: var(--sage);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.15s;
        }
        .btn-neu:hover { box-shadow: 6px 6px 14px var(--neu-dark), -6px -6px 14px var(--neu-light); }
        .btn-neu:active { box-shadow: inset 3px 3px 7px var(--neu-dark), inset -3px -3px 7px var(--neu-light); }

        /* visitor badge */
        .badge-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 20px; overflow: hidden;
        }
        .badge-header {
          background: linear-gradient(135deg, #4A7A72 0%, #5B8E85 100%);
          padding: 14px 18px; display: flex; align-items: center; gap: 8px;
        }
        .badge-header-text { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.8px; }
        .badge-body { padding: 16px 18px; }
        .badge-name { font-size: 16px; font-weight: 800; color: var(--text); letter-spacing: -0.3px; margin-bottom: 2px; }
        .badge-type { font-size: 10px; font-weight: 700; color: var(--sage); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .badge-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .badge-cell { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 9px 12px; }
        .badge-cell-key { font-size: 9px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
        .badge-cell-val { font-size: 12px; font-weight: 600; color: var(--text); }

        /* live pulse dot */
        .live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: var(--sage);
          animation: pulseDot 2s ease-in-out infinite;
        }
        .live-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--muted); }

        /* footer */
        .footer { border-top: 1px solid var(--border); padding: 16px 32px; text-align: center; font-size: 11px; color: var(--muted); }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 720px) {
          .main { grid-template-columns: 1fr; padding: 20px 16px; }
          .header { padding: 0 16px; }
          .detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wrap">

        {/* ── Header ── */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <span className="logo-name">Gate<span>Keeper</span></span>
          </div>
          <div className="header-actions">
            <button
              className="btn-icon"
              onClick={() => fetchStatus(true)}
              title="Refresh"
              disabled={refreshing}
            >
              <svg
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
              >
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
            <button className="btn-outline" onClick={() => router.push('/')}>Exit gate</button>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="main">

          {/* ── Left: Status card ── */}
          <div style={{ transition: 'background 0.4s' }} className={`card ${pulse ? 'status-flash' : ''}`}>
            <div className="card-header">
              <div className="req-pill">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                {request.id}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                  Visit tracker
                </div>
                {/* status badge */}
                {isRejected && <span className="status-badge rejected"><span className="status-dot rejected" />Rejected</span>}
                {isPending  && <span className="status-badge pending"><span className="status-dot pending" />Pending</span>}
                {isApproved && !hasEntry && <span className="status-badge approved"><span className="status-dot approved" />Approved</span>}
                {hasEntry && !hasExit && <span className="status-badge inside"><span className="status-dot idle" />Inside</span>}
                {hasExit && <span className="status-badge done"><span className="status-dot idle" />Completed</span>}
              </div>

              {/* auto-refresh indicator */}
              <div className="live-row" style={{ marginTop: 8 }}>
                <span className="live-dot" />
                Refreshing every 3 seconds
              </div>
            </div>

            <div className="card-body">

              {/* ── Animated timeline ── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
                  Approval timeline
                </div>

                <div className="timeline">
                  {STEPS.map((s, i) => {
                    const stepNum = i + 1;
                    const isDone   = !isRejected && step > stepNum;
                    const isActive = !isRejected && step === stepNum;
                    const isErrStep = isRejected && stepNum === 2;

                    let nodeClass = 'waiting';
                    if (isDone)    nodeClass = 'done';
                    if (isActive)  nodeClass = 'active pulse';
                    if (isErrStep) nodeClass = 'error';

                    return (
                      <div key={i} className={`tl-row ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                        <div className="tl-left">
                          <div className={`tl-node ${nodeClass}`}>
                            {isDone ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : isErrStep ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            ) : stepNum}
                          </div>
                        </div>
                        <div className="tl-right">
                          <div className={`tl-step-label ${!isDone && !isActive && !isErrStep ? 'muted' : ''}`}>
                            {isErrStep ? 'Rejected' : s.label}
                          </div>
                          <div className="tl-step-sub">
                            {isErrStep ? 'Resident declined request' : s.sub}
                          </div>
                          {isDone && stepNum === 1 && (
                            <div className="tl-step-time">
                              {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                          {isDone && stepNum === 3 && entry && (
                            <div className="tl-step-time">
                              {new Date(entry.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                          {isDone && stepNum === 4 && entry?.exit_time && (
                            <div className="tl-step-time">
                              {new Date(entry.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="divider" />

              {/* ── Visitor details ── */}
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
                Visit details
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-key">Host resident</div>
                  <div className="detail-val">{residentName}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-key">Flat number</div>
                  <div className="detail-val">Flat {flatNumber}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-key">Visitor</div>
                  <div className="detail-val">{request.visitor_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-key">Type</div>
                  <div className="detail-val">{request.visitor_type}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-key">Purpose</div>
                  <div className="detail-val">{request.purpose}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-key">Party size</div>
                  <div className="detail-val">{request.number_of_visitors} person{request.number_of_visitors !== 1 ? 's' : ''}</div>
                </div>
                {request.vehicle_number && (
                  <div className="detail-item">
                    <div className="detail-key">Vehicle</div>
                    <div className="detail-val">{request.vehicle_number}</div>
                  </div>
                )}
                <div className="detail-item">
                  <div className="detail-key">Est. duration</div>
                  <div className="detail-val">{request.expected_duration} min</div>
                </div>
              </div>

              {/* ── Security log ── */}
              {entry && (
                <>
                  <div className="divider" />
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                    Security log
                  </div>
                  <div className="log-row">
                    <div className="log-cell">
                      <div className="log-cell-key">Entered gate</div>
                      <div className="log-cell-val">
                        {new Date(entry.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="log-cell">
                      <div className="log-cell-key">Exited gate</div>
                      <div className={`log-cell-val ${!entry.exit_time ? 'inside' : ''}`}>
                        {entry.exit_time
                          ? new Date(entry.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Currently inside'}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Right: QR / Status panel ── */}
          <div className="right-col">

            {isPending && (
              <div className="pending-card">
                <div className="pending-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div className="pending-title">Waiting for resident</div>
                <div className="pending-desc">
                  Your request has been sent to flat {flatNumber}. Please wait at the security gate.
                </div>
                <div className="refresh-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 2s linear infinite' }}>
                    <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                  </svg>
                  Checking every 3 seconds
                </div>
              </div>
            )}

            {isRejected && (
              <div className="rejected-card">
                <div className="rejected-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="rejected-title">Access denied</div>
                <div className="rejected-desc">
                  The resident of flat {flatNumber} has declined this request. Please contact security or try again.
                </div>
              </div>
            )}

            {(isApproved || hasEntry) && (
              <>
                {/* QR Pass */}
                <div className="qr-card">
                  <div className="qr-card-header">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                      <path d="M14 14h2v2m0 3h3m-3-3v3"/>
                    </svg>
                    <span className="qr-card-title">Gate pass — show to guard</span>
                  </div>
                  <div className="qr-card-body">
                    <div className="qr-wrap">
                      {qrDataUrl
                        ? <img src={qrDataUrl} alt="Visitor QR pass" width={200} height={200} style={{ borderRadius: 6, display: 'block' }} />
                        : <div className="qr-placeholder">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9E9B96" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                            </svg>
                          </div>
                      }
                    </div>
                    <div className="pass-code">
                      <span>{request.id}</span>
                      <button
                        className="copy-btn"
                        onClick={() => { navigator.clipboard.writeText(request.id); toast.success('Pass code copied'); }}
                        title="Copy code"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                      </button>
                    </div>
                    <div className="qr-hint">Scan at the gate scanner or read the pass code aloud</div>

                    {/* Neumorphic download — only this button gets the treatment */}
                    <button className="btn-neu" onClick={downloadQR}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Save pass as image
                    </button>
                  </div>
                </div>

                {/* Visitor badge */}
                <div className="badge-card">
                  <div className="badge-header">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"/>
                    </svg>
                    <span className="badge-header-text">Visitor badge — Green Glen Heights</span>
                  </div>
                  <div className="badge-body">
                    <div className="badge-name">{request.visitor_name}</div>
                    <div className="badge-type">{request.visitor_type}</div>
                    <div className="badge-grid">
                      <div className="badge-cell">
                        <div className="badge-cell-key">Host flat</div>
                        <div className="badge-cell-val">Flat {flatNumber}</div>
                      </div>
                      <div className="badge-cell">
                        <div className="badge-cell-key">Phone</div>
                        <div className="badge-cell-val">{request.visitor_phone.slice(-10)}</div>
                      </div>
                      <div className="badge-cell">
                        <div className="badge-cell-key">Duration</div>
                        <div className="badge-cell-val">{request.expected_duration} min</div>
                      </div>
                      {request.vehicle_number && (
                        <div className="badge-cell">
                          <div className="badge-cell-key">Vehicle</div>
                          <div className="badge-cell-val">{request.vehicle_number}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="footer">
          If you need help, show request code <strong style={{ fontFamily: 'ui-monospace, monospace' }}>{request.id}</strong> to the security desk.
        </footer>
      </div>
    </>
  );
}