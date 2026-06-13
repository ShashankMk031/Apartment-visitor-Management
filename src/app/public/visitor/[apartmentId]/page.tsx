'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { mockDb, hasSupabaseCreds, Resident, Apartment } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type VisitorType = "GUEST" | "DELIVERY" | "MAINTENANCE" | "MAID" | "DRIVER" | "FAMILY" | "OTHER";

export default function VisitorPortalPage() {
  const router = useRouter();
  const params = useParams();
  const apartmentId = (params?.apartmentId as string) || 'apt-1';

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form fields
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorType, setVisitorType] = useState<VisitorType>('GUEST');
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [numberOfVisitors, setNumberOfVisitors] = useState('1');
  const [expectedDuration, setExpectedDuration] = useState('60'); // in minutes
  
  const [loading, setLoading] = useState(false);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    const isMockMode = !hasSupabaseCreds();
    setIsMock(isMockMode);

    if (isMockMode) {
      setApartment(mockDb.getApartment());
      const resList = mockDb.getResidents();
      setResidents(resList);
      setFilteredResidents(resList);
    } else {
      const fetchRealData = async () => {
        const supabase = createClient();
        if (supabase) {
          const { data: apt } = await supabase.from('apartments').select('*').eq('id', apartmentId).single();
          if (apt) setApartment(apt);

          const { data: res } = await supabase
            .from('residents')
            .select(`
              id,
              flat_number,
              phone,
              profiles (
                full_name,
                email
              )
            `)
            .eq('apartment_id', apartmentId);
          
          if (res) {
            const mapped: Resident[] = res.map((r: any) => ({
              id: r.id,
              apartment_id: apartmentId,
              flat_number: r.flat_number,
              full_name: r.profiles?.full_name || 'Resident',
              email: r.profiles?.email || '',
              phone: r.phone,
              created_at: '',
            }));
            setResidents(mapped);
            setFilteredResidents(mapped);
          }
        }
      };
      fetchRealData();
    }
  }, [apartmentId]);

  // Search filter
  useEffect(() => {
    if (!searchQuery) {
      setFilteredResidents(residents);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = residents.filter(
      r => r.flat_number.toLowerCase().includes(query) || r.full_name.toLowerCase().includes(query)
    );
    setFilteredResidents(filtered);
  }, [searchQuery, residents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) {
      toast.error('Please select a resident / flat');
      return;
    }
    if (!visitorName || !visitorPhone || !purpose) {
      toast.error('Please fill in visitor name, phone number, and purpose');
      return;
    }

    setLoading(true);
    try {
      const numVisitors = parseInt(numberOfVisitors, 10) || 1;
      const duration = parseInt(expectedDuration, 10) || 60;

      if (isMock) {
        const newReq = mockDb.createVisitorRequest({
          resident_id: selectedResident.id,
          visitor_name: visitorName,
          visitor_phone: visitorPhone,
          visitor_type: visitorType,
          purpose,
          vehicle_number: vehicleNumber || undefined,
          number_of_visitors: numVisitors,
          expected_duration: duration,
        });
        toast.success('Visitor request submitted successfully!');
        router.push(`/public/tracking/${newReq.id}`);
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('visitor_requests')
            .insert({
              resident_id: selectedResident.id,
              visitor_name: visitorName,
              visitor_phone: visitorPhone,
              visitor_type: visitorType,
              purpose,
              vehicle_number: vehicleNumber || null,
              number_of_visitors: numVisitors,
              expected_duration: duration,
              status: 'PENDING',
            })
            .select()
            .single();

          if (error) {
            toast.error(error.message);
          } else if (data) {
            toast.success('Visitor request submitted!');
            router.push(`/public/tracking/${data.id}`);
          }
        }
      }
    } catch (err) {
      console.error('Error submitting visitor request:', err);
      toast.error('Failed to submit visitor request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:         #EDEAE4; /* Warmer, softer tone baseline for true neumorphic shadows to catch */
          --surface:    #F5F3EE;
          --border:     rgba(228, 224, 216, 0.6);
          --sage:       #5B8E85;
          --sage-light: #EBF4F2;
          --sage-mid:   #A8CFC9;
          --text:       #1E1D1B;
          --muted:      #7A7670;
          
          /* Custom Soft Extrusion Pairings */
          --neu-extruded-box:  6px 6px 16px rgba(0, 0, 0, 0.07), -6px -6px 16px rgba(255, 255, 255, 0.8);
          --neu-sunken-box:    inset 3px 3px 7px rgba(0, 0, 0, 0.05), inset -3px -3px 7px rgba(255, 255, 255, 0.8);
          --neu-button-active: inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.7);
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
        .header-address { font-size: 12px; color: var(--muted); max-width: 240px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* main split layout */
        .main {
          flex: 1; max-width: 920px; margin: 0 auto; width: 100%;
          padding: 40px 24px;
          display: grid; grid-template-columns: 340px 1fr; gap: 28px; align-items: start;
        }

        /* Neumorphic Extruded Panels */
        .card {
          background: var(--surface);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 24px; 
          box-shadow: var(--neu-extruded-box);
          overflow: hidden;
          display: flex; flex-direction: column;
        }
        .card-header { padding: 24px 24px 18px; border-bottom: 1px solid var(--border); }
        .card-title { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px; }
        .card-desc { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .card-body { padding: 24px; }

        /* search block inside sunken well */
        .search-wrap { position: relative; margin-top: 14px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
        .input-text {
          width: 100%; padding: 11px 12px 11px 38px; border-radius: 12px;
          border: 1px solid transparent; background: var(--bg);
          box-shadow: var(--neu-sunken-box);
          font-size: 13px; color: var(--text); transition: all 0.2s;
        }
        .input-text:focus { outline: none; border-color: var(--sage-mid); background: #fff; box-shadow: none; }

        /* form layout definitions */
        .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-row-three { display: grid; grid-template-columns: 1.2fr 0.9fr 0.9fr; gap: 12px; }
        
        .label-style { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* Form controls */
        .input-field, .select-field {
          width: 100%; padding: 11px 14px; border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.03); background: #FAF9F6;
          font-size: 13px; color: var(--text); transition: all 0.15s;
        }
        .input-field:focus, .select-field:focus { 
          outline: none; 
          border-color: var(--sage); 
          background: #fff;
          box-shadow: 0 0 0 3px var(--sage-light); 
        }
        .input-field:disabled, .select-field:disabled { background: var(--bg); color: var(--muted); cursor: not-allowed; opacity: 0.6; box-shadow: none; }

        .select-field {
          cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%237A7670' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
          background-repeat: no-repeat; background-position: right 14px center;
        }

        /* Resident choice cards */
        .resident-list { max-height: 380px; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; background: var(--bg); box-shadow: var(--neu-sunken-box); }
        .resident-btn {
          width: 100%; padding: 12px 14px; border-radius: 14px; text-align: left;
          border: 1px solid transparent; background: var(--surface);
          box-shadow: 3px 3px 8px rgba(0,0,0,0.04), -3px -3px 8px rgba(255,255,255,0.7);
          display: flex; align-items: center; justify-content: space-between;
          cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .resident-btn:hover { transform: translateY(-1px); box-shadow: 4px 4px 10px rgba(0,0,0,0.06), -4px -4px 10px rgba(255,255,255,0.9); background: #fff; }
        
        /* Sunken soft selection state */
        .resident-btn.selected {
          background: var(--sage-light); 
          border-color: rgba(91, 142, 133, 0.2);
          box-shadow: inset 2px 2px 5px rgba(91, 142, 133, 0.15), inset -3px -3px 6px rgba(255,255,255,0.7);
          color: var(--sage);
          transform: none;
        }
        .res-flat { font-size: 13px; font-weight: 700; color: var(--text); display: block; }
        .resident-btn.selected .res-flat { color: var(--sage); }
        .res-name { font-size: 11px; color: var(--muted); display: block; margin-top: 1px; }

        /* context status banner */
        .context-banner {
          padding: 12px 16px; border-radius: 14px; font-size: 12px; line-height: 1.5;
          margin-bottom: 22px; border: 1px solid var(--border); background: var(--bg);
          box-shadow: var(--neu-sunken-box);
          display: flex; gap: 10px; align-items: flex-start;
        }
        .context-banner.active {
          background: var(--sage-light); border-color: rgba(91, 142, 133, 0.15); color: var(--sage);
        }
        .context-banner.active strong { color: var(--text); }

        /* Neumorphic action submission pass */
        .btn-neu-submit {
          width: 100%; padding: 15px 20px; border: 1px solid rgba(255, 255, 255, 0.4); cursor: pointer;
          border-radius: 14px; margin-top: 6px;
          background: var(--surface);
          box-shadow: 4px 4px 12px rgba(0,0,0,0.08), -4px -4px 12px rgba(255,255,255,0.9);
          font-size: 13px; font-weight: 700; color: var(--sage);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.15s ease;
        }
        .btn-neu-submit:not(:disabled):hover { 
          background: #fff;
          box-shadow: 5px 5px 15px rgba(0,0,0,0.1), -5px -5px 15px rgba(255,255,255,1); 
        }
        .btn-neu-submit:not(:disabled):active { 
          background: var(--bg);
          box-shadow: var(--neu-button-active);
          transform: translateY(0.5px);
        }
        .btn-neu-submit:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; background: rgba(0,0,0,0.02); border: 1px solid var(--border); }

        /* footer text */
        .footer { border-top: 1px solid var(--border); padding: 20px 32px; text-align: center; font-size: 11px; color: var(--muted); }

        @media (max-width: 768px) {
          .main { grid-template-columns: 1fr; padding: 24px 16px; gap: 24px; }
          .header { padding: 0 16px; }
          .form-row, .form-row-three { grid-template-columns: 1fr; gap: 18px; }
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
            <span className="logo-name">
              {apartment?.name ? (
                <>Gate<span>{apartment.name.replace('GateKeeper', '').trim() || 'Keeper'}</span></>
              ) : (
                <>Gate<span>Keeper</span></>
              )}
            </span>
          </div>
          <div className="header-address">
            {apartment?.address || 'Security Entrance Desk'}
          </div>
        </header>

        {/* ── Main Panel Split ── */}
        <main className="main">
          
          {/* ── Left Side: Flat Selector Card ── */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Select Host Flat
              </h2>
              <p className="card-desc">Search and locate destination apartment</p>
              
              <div className="search-wrap">
                <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search flat number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-text"
                />
              </div>
            </div>
            
            <div className="resident-list">
              {filteredResidents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: 'var(--muted)' }}>
                  No residents matching criteria
                </div>
              ) : (
                filteredResidents.map((r) => {
                  const isSelected = selectedResident?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedResident(r)}
                      className={`resident-btn ${isSelected ? 'selected' : ''}`}
                    >
                      <div>
                        <span className="res-flat">Flat {r.flat_number}</span>
                        <span className="res-name">{r.full_name}</span>
                      </div>
                      {isSelected && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right Side: Request Input Card ── */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Visitor Access Form
              </h2>
              <p className="card-desc">Provide your arrival parameters below</p>
            </div>
            
            <div className="card-body">
              {/* Context notification layout */}
              <div className={`context-banner ${selectedResident ? 'active' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <div>
                  {selectedResident ? (
                    <span>Routing live request stream to <strong>Flat {selectedResident.flat_number}</strong> managed by {selectedResident.full_name}.</span>
                  ) : (
                    <span>Please lock in a target destination host flat from the left grid panel to begin.</span>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                
                {/* Visitor Name */}
                <div className="form-group">
                  <label htmlFor="visitorName" className="label-style">Visitor Full Name</label>
                  <input
                    id="visitorName"
                    type="text"
                    placeholder="Enter full identity name"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    disabled={!selectedResident || loading}
                    className="input-field"
                    required
                  />
                </div>

                {/* Contact and Type row */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="visitorPhone" className="label-style">Active Phone Line</label>
                    <input
                      id="visitorPhone"
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      disabled={!selectedResident || loading}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="visitorType" className="label-style">Visitor Group Classification</label>
                    <select
                      id="visitorType"
                      value={visitorType}
                      onChange={(e) => setVisitorType(e.target.value as VisitorType)}
                      disabled={!selectedResident || loading}
                      className="select-field"
                    >
                      <option value="GUEST">Guest (Social)</option>
                      <option value="DELIVERY">Delivery Dropoff</option>
                      <option value="MAINTENANCE">Maintenance / Repairs</option>
                      <option value="MAID">Domestic Maid</option>
                      <option value="DRIVER">Personal Driver</option>
                      <option value="FAMILY">Family Member</option>
                      <option value="OTHER">Other Purpose</option>
                    </select>
                  </div>
                </div>

                {/* Purpose field */}
                <div className="form-group">
                  <label htmlFor="purpose" className="label-style">Explicit Purpose of Entry</label>
                  <input
                    id="purpose"
                    type="text"
                    placeholder="e.g., Delivery lunch box, troubleshooting fiber network"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    disabled={!selectedResident || loading}
                    className="input-field"
                    required
                  />
                </div>

                {/* Tri-column logistical metrics */}
                <div className="form-row-three">
                  <div className="form-group">
                    <label htmlFor="vehicle" className="label-style">Vehicle Number</label>
                    <input
                      id="vehicle"
                      type="text"
                      placeholder="KA-03-XX-1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      disabled={!selectedResident || loading}
                      className="input-field"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="visitorsCount" className="label-style">Headcount</label>
                    <input
                      id="visitorsCount"
                      type="number"
                      min="1"
                      value={numberOfVisitors}
                      onChange={(e) => setNumberOfVisitors(e.target.value)}
                      disabled={!selectedResident || loading}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="duration" className="label-style">Est. Stay (Mins)</label>
                    <input
                      id="duration"
                      type="number"
                      min="10"
                      step="5"
                      value={expectedDuration}
                      onChange={(e) => setExpectedDuration(e.target.value)}
                      disabled={!selectedResident || loading}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {/* Main Action Button */}
                <button
                  type="submit"
                  disabled={!selectedResident || loading}
                  className="btn-neu-submit"
                >
                  {loading ? (
                    <span>Transmitting verification protocol...</span>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      <span>Send Instant Access Request to Resident</span>
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="footer">
          Public Access Security Desk Gateway. All actions are compiled, audited, and mirrored immediately onto resident terminals.
        </footer>
      </div>
    </>
  );
}