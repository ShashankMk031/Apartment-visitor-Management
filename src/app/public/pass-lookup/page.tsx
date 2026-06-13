'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  Download, 
  RefreshCw, 
  Phone, 
  User, 
  Calendar, 
  Link2,
  Search,
  ArrowRight,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, VisitorRequest, VisitorEntry } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export default function PassLookupPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<VisitorRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VisitorRequest | null>(null);
  const [entry, setEntry] = useState<VisitorEntry | null>(null);
  const [residentName, setResidentName] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [searching, setSearching] = useState(false);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    setIsMock(!hasSupabaseCreds());
  }, []);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a Request ID or Phone Number');
      return;
    }

    setSearching(true);
    setResults([]);
    setSelectedRequest(null);
    setEntry(null);
    setResidentName('');
    setFlatNumber('');
    setQrCodeDataUrl('');

    try {
      const query = searchQuery.trim();
      const isPhone = query.startsWith('+') || /^\d+$/.test(query.replace(/[\s-()]/g, ''));

      if (isMock) {
        const reqs = mockDb.getVisitorRequests();
        let matches: VisitorRequest[] = [];
        
        if (isPhone) {
          const normQuery = query.replace(/[\s-()]/g, '');
          matches = reqs.filter(r => r.visitor_phone.replace(/[\s-()]/g, '').includes(normQuery));
        } else {
          const match = reqs.find(r => r.id.toLowerCase() === query.toLowerCase());
          if (match) matches.push(match);
        }

        setResults(matches);
        if (matches.length === 1) {
          handleSelectRequest(matches[0]);
        } else if (matches.length === 0) {
          toast.error('No matching visitor passes found');
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          let queryBuilder = supabase.from('visitor_requests').select(`
            *,
            residents (
              flat_number,
              profiles (
                full_name
              )
            )
          `);

          if (isPhone) {
            queryBuilder = queryBuilder.eq('visitor_phone', query);
          } else {
            queryBuilder = queryBuilder.eq('id', query);
          }

          const { data, error } = await queryBuilder.order('created_at', { ascending: false });

          if (error) {
            toast.error(error.message);
          } else if (data) {
            const mapped: VisitorRequest[] = data.map((r: any) => ({
              id: r.id,
              resident_id: r.resident_id,
              visitor_name: r.visitor_name,
              visitor_phone: r.visitor_phone,
              visitor_type: r.visitor_type,
              purpose: r.purpose,
              vehicle_number: r.vehicle_number,
              number_of_visitors: r.number_of_visitors,
              expected_duration: r.expected_duration,
              status: r.status,
              approval_time: r.approval_time,
              qr_code_pass: r.qr_code_pass,
              created_at: r.created_at,
              _residents: r.residents
            } as any));

            setResults(mapped);
            if (mapped.length === 1) {
              handleSelectRequest(mapped[0]);
            } else if (mapped.length === 0) {
              toast.error('No matching visitor passes found');
            }
          }
        }
      }
    } catch (err) {
      console.error('Error during lookup:', err);
      toast.error('Something went wrong during lookup');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectRequest = async (req: VisitorRequest) => {
    setSelectedRequest(req);
    
    if (!hasSupabaseCreds()) {
      const res = mockDb.getResidents().find(r => r.id === req.resident_id);
      if (res) {
        setResidentName(res.full_name);
        setFlatNumber(res.flat_number);
      }
      
      const entries = mockDb.getVisitorEntries();
      const ent = entries.find(e => e.visitor_request_id === req.id);
      if (ent) setEntry(ent);
    } else {
      const anyReq = req as any;
      if (anyReq._residents) {
        setResidentName(anyReq._residents.profiles?.full_name || 'Resident');
        setFlatNumber(anyReq._residents.flat_number || 'TBD');
      }
      
      const supabase = createClient();
      if (supabase) {
        const { data: ent } = await supabase
          .from('visitor_entries')
          .select('*')
          .eq('visitor_request_id', req.id)
          .maybeSingle();
        if (ent) setEntry(ent);
      }
    }

    if (req.status === 'APPROVED') {
      QRCode.toDataURL(req.id, {
        width: 200,
        margin: 2,
        color: {
          dark: '#2A2825', // Deep rich Charcoal text color matching your design
          light: '#FFFFFF',
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `visitor-pass-${selectedRequest?.visitor_name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR Pass downloaded successfully');
  };

  const getStatusBadgeStyles = (status: VisitorRequest['status']) => {
    switch (status) {
      case 'PENDING': 
        return 'bg-[#E8E4DD] text-amber-700 border-[#D2CBBF]';
      case 'APPROVED': 
        return 'bg-[#E2ECE9] text-[#2D534D] border-[#B9D1CC]';
      case 'REJECTED': 
        return 'bg-[#F9EBEA] text-red-700 border-[#F0D0CE]';
      case 'EXPIRED': 
        return 'bg-[#E8E4DD] text-[#7A746B] border-[#D2CBBF]';
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EDE8] text-[#2A2825] flex flex-col justify-between p-6 md:p-10 font-sans antialiased selection:bg-[#4E8079]/20 selection:text-[#4E8079]">
      
      {/* Premium Structural Header */}
      <header className="max-w-5xl mx-auto w-full flex justify-between items-center pb-6 border-b border-[#E0DACF]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E8E4DD] flex items-center justify-center shadow-[4px_4px_10px_rgba(163,157,147,0.4),-4px_-4px_10px_rgba(255,255,255,0.9)] border border-[#F5F3F0]">
            <Shield className="w-5 h-5 text-[#4E8079]" strokeWidth={2} />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#2A2825]">
            GateKeeper <span className="text-[#6E685E] font-normal text-sm ml-1">VMS</span>
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/')} 
          className="bg-[#E8E4DD] border border-[#F5F3F0] hover:bg-[#E0DACF] active:bg-[#E8E4DD] active:shadow-[inset_2px_2px_5px_rgba(163,157,147,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] text-[#4A453F] text-xs font-semibold px-4 py-2 rounded-xl h-9 transition-all duration-200 shadow-[2px_2px_5px_rgba(163,157,147,0.2),-2px_-2px_5px_rgba(255,255,255,0.8)]"
        >
          Gate Portal
        </Button>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full flex flex-col grow justify-center items-center my-10">
        
        {selectedRequest ? (
          <div className="w-full space-y-5">
            
            {results.length > 1 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedRequest(null);
                  setEntry(null);
                  setQrCodeDataUrl('');
                }}
                className="text-[#6E685E] hover:text-[#2A2825] hover:bg-[#E8E4DD] rounded-xl mb-2 gap-2 border border-transparent active:shadow-[inset_2px_2px_5px_rgba(163,157,147,0.3)] transition-all text-xs font-medium px-3 py-1.5"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                <span>Back to Results</span>
              </Button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Data & Access Logs Tracker */}
              <div className="md:col-span-7 space-y-6">
                <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.3),-8px_-8px_20px_rgba(255,255,255,0.8)] p-6 md:p-8">
                  <CardHeader className="p-0 pb-6 border-b border-[#DCD6CB] space-y-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#8A8276] uppercase tracking-wider block font-mono">
                          ID: {selectedRequest.id}
                        </span>
                        <CardTitle className="text-xl font-bold text-[#2A2825] tracking-tight">
                          Access Tracker
                        </CardTitle>
                      </div>
                      <Badge className={`border uppercase text-[10px] font-bold px-3 py-1 rounded-full shadow-sm select-none tracking-wider self-start sm:self-auto ${getStatusBadgeStyles(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0 pt-6 space-y-8">
                    {/* Process Timeline */}
                    <div className="flex flex-col gap-4">
                      <span className="text-[11px] font-bold text-[#7A746B] uppercase tracking-wider">
                        Approval Stage
                      </span>
                      
                      <div className="grid grid-cols-4 gap-2 text-center relative pt-2">
                        {/* Connecting background bar lines */}
                        <div className="absolute top-[21px] left-[12.5%] right-[12.5%] h-[3px] bg-[#DCD6CB] rounded-full -z-0" />
                        
                        {/* Step 1: Submitted */}
                        <div className="flex flex-col items-center z-10">
                          <div className="w-8 h-8 rounded-full bg-[#4E8079] text-white flex items-center justify-center font-bold text-xs shadow-[2px_2px_5px_rgba(78,128,121,0.3)] border border-[#6BA199]">
                            1
                          </div>
                          <span className="text-[10px] text-[#5C564F] mt-2 font-medium">Submitted</span>
                        </div>
                        
                        {/* Step 2: Actioned */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300
                            ${selectedRequest.status === 'APPROVED' || entry
                              ? 'bg-[#4E8079] text-white shadow-[2px_2px_5px_rgba(78,128,121,0.3)] border-[#6BA199]'
                              : selectedRequest.status === 'REJECTED'
                              ? 'bg-red-600 text-white shadow-[2px_2px_5px_rgba(220,38,38,0.3)] border-red-400'
                              : 'bg-[#E8E4DD] text-[#8A8276] border-[#C8C1B4] shadow-[inset_1px_1px_3px_rgba(163,157,147,0.2)]'
                            }
                          `}>
                            {selectedRequest.status === 'REJECTED' ? '✕' : '2'}
                          </div>
                          <span className="text-[10px] text-[#5C564F] mt-2 font-medium">
                            {selectedRequest.status === 'REJECTED' ? 'Rejected' : 'Approved'}
                          </span>
                        </div>

                        {/* Step 3: Checked In */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300
                            ${entry 
                              ? 'bg-[#4E8079] text-white shadow-[2px_2px_5px_rgba(78,128,121,0.3)] border-[#6BA199]' 
                              : 'bg-[#E8E4DD] text-[#8A8276] border-[#C8C1B4] shadow-[inset_1px_1px_3px_rgba(163,157,147,0.2)]'
                            }
                          `}>
                            3
                          </div>
                          <span className="text-[10px] text-[#5C564F] mt-2 font-medium">Checked In</span>
                        </div>

                        {/* Step 4: Exited */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300
                            ${entry?.exit_time 
                              ? 'bg-[#4E8079] text-white shadow-[2px_2px_5px_rgba(78,128,121,0.3)] border-[#6BA199]' 
                              : 'bg-[#E8E4DD] text-[#A8A196] border-[#D8D2C7] shadow-[inset_1px_1px_3px_rgba(163,157,147,0.1)]'
                            }
                          `}>
                            4
                          </div>
                          <span className="text-[10px] text-[#5C564F] mt-2 font-medium">Exited</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta Fields Table Layout */}
                    <div className="border-t border-[#DCD6CB] pt-6 grid grid-cols-2 gap-x-6 gap-y-5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[#8A8276] font-bold uppercase tracking-wider block">Host Resident</span>
                        <span className="text-sm font-semibold text-[#2A2825]">{residentName}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[#8A8276] font-bold uppercase tracking-wider block">Flat Number</span>
                        <span className="text-sm font-semibold text-[#2A2825]">Flat {flatNumber}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[#8A8276] font-bold uppercase tracking-wider block">Visitor Details</span>
                        <span className="text-sm font-semibold text-[#2A2825]">{selectedRequest.visitor_name}</span>
                        <span className="inline-block text-[9px] bg-[#DCD6CB] px-1.5 py-0.5 font-bold rounded text-[#4A453F] mt-0.5 font-mono">{selectedRequest.visitor_type}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[#8A8276] font-bold uppercase tracking-wider block">Purpose</span>
                        <span className="text-sm font-semibold text-[#2A2825]">{selectedRequest.purpose}</span>
                      </div>
                      {selectedRequest.vehicle_number && (
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-[#8A8276] font-bold uppercase tracking-wider block">Vehicle Number</span>
                          <span className="text-sm font-mono font-semibold text-[#2A2825]">{selectedRequest.vehicle_number}</span>
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-[#8A8276] font-bold uppercase tracking-wider block">Total Party</span>
                        <span className="text-sm font-semibold text-[#2A2825]">{selectedRequest.number_of_visitors} Guest(s)</span>
                      </div>
                    </div>

                    {/* Security Entry/Exit Logs */}
                    {entry && (
                      <div className="border-t border-[#DCD6CB] pt-6 space-y-3">
                        <span className="text-[11px] font-bold text-[#7A746B] uppercase tracking-wider block">
                          Gatehouse Logs
                        </span>
                        <div className="grid grid-cols-2 gap-4 bg-[#F0EDE8] p-4 rounded-xl border border-[#DCD6CB] shadow-[inset_2px_2px_5px_rgba(163,157,147,0.15)]">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-[#8A8276] font-bold uppercase block">Check-In Time</span>
                            <span className="text-xs font-semibold font-mono text-[#2A2825]">
                              {new Date(entry.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-[#8A8276] font-bold uppercase block">Check-Out Time</span>
                            <span className="text-xs font-semibold font-mono text-[#2A2825]">
                              {entry.exit_time 
                                ? new Date(entry.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Active / On Premises'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null);
                    setResults([]);
                    setEntry(null);
                    setQrCodeDataUrl('');
                  }}
                  className="w-full bg-[#E8E4DD] border border-[#F5F3F0] hover:bg-[#E0DACF] active:shadow-[inset_2px_2px_5px_rgba(163,157,147,0.3)] text-[#6E685E] hover:text-[#2A2825] py-5 rounded-xl text-xs font-bold transition-all shadow-[4px_4px_10px_rgba(163,157,147,0.15)]"
                >
                  Lookup Another Pass
                </Button>
              </div>

              {/* Right Column: Pass Visualizer & Action Blocks */}
              <div className="md:col-span-5 space-y-6">
                
                {selectedRequest.status === 'PENDING' && (
                  <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.3)] p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 mx-auto flex items-center justify-center border border-amber-200">
                      <Clock className="w-6 h-6 text-amber-600 animate-pulse" strokeWidth={2} />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-sm text-[#2A2825]">Awaiting Host Action</h3>
                      <p className="text-xs text-[#6E685E] leading-relaxed">
                        This credential lookup is active but pending host verification. Once the resident approves, your operational QR pass code activates.
                      </p>
                    </div>
                  </Card>
                )}

                {selectedRequest.status === 'REJECTED' && (
                  <Card className="border border-red-200 bg-[#FAEEEE] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.15)] p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 mx-auto flex items-center justify-center border border-red-200">
                      <XCircle className="w-6 h-6 text-red-600" strokeWidth={2} />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-sm text-red-900">Access Explicitly Denied</h3>
                      <p className="text-xs text-red-700/80 leading-relaxed">
                        The resident of Flat {flatNumber} has declined permission for this access token request. Please contact host directly.
                      </p>
                    </div>
                  </Card>
                )}

                {selectedRequest.status === 'APPROVED' && (
                  <div className="space-y-6">
                    {/* Modern Inset QR Module */}
                    <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.3),-8px_-8px_20px_rgba(255,255,255,0.8)] p-6 text-center space-y-5">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-[#2A2825] flex items-center justify-center gap-2">
                          <QrCode className="w-4 h-4 text-[#4E8079]" strokeWidth={2} />
                          Secure Access Pass
                        </h3>
                        <p className="text-[10px] text-[#6E685E]">Present vector code to terminal scan at guard house.</p>
                      </div>
                      
                      {/* Premium white box inset block shadow frame */}
                      <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-[inset_2px_2px_6px_rgba(0,0,0,0.1),2px_2px_5px_rgba(255,255,255,0.8)] border border-[#E0DACF]">
                        {qrCodeDataUrl ? (
                          <img src={qrCodeDataUrl} alt="Visitor Pass QR" className="w-[170px] h-[170px] mix-blend-multiply" />
                        ) : (
                          <div className="w-[170px] h-[170px] bg-[#F0EDE8] flex items-center justify-center text-[#8A8276] text-xs font-medium font-mono">
                            Rendering...
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2">
                        <Button 
                          onClick={handleDownloadQR}
                          className="w-full bg-[#E8E4DD] hover:bg-[#E0DACF] border border-[#F5F3F0] active:shadow-[inset_2px_2px_5px_rgba(163,157,147,0.3)] text-[#4A453F] gap-2 rounded-xl text-xs font-bold py-4 h-11 shadow-[2px_2px_5px_rgba(163,157,147,0.15)] transition-all duration-200"
                        >
                          <Download className="w-4 h-4 text-[#6E685E]" strokeWidth={2} />
                          <span>Download Image</span>
                        </Button>

                        <Button 
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              navigator.clipboard.writeText(`${window.location.origin}/public/tracking/${selectedRequest.id}`);
                              toast.success('Pass link copied to clipboard!');
                            }
                          }}
                          className="w-full bg-[#4E8079] hover:bg-[#3F6B65] active:bg-[#4E8079] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white gap-2 rounded-xl text-xs font-bold py-4 h-11 shadow-[3px_3px_10px_rgba(78,128,121,0.3)] transition-all duration-200 border border-[#6BA199]"
                        >
                          <Link2 className="w-4 h-4" strokeWidth={2} />
                          <span>Copy Pass Link</span>
                        </Button>
                      </div>
                    </Card>

                    {/* Tactile Identity Badging Deck */}
                    <div className="border border-[#F5F3F0] bg-gradient-to-b from-[#E2ECE9] to-[#E8E4DD] rounded-[24px] p-5 shadow-[5px_5px_15px_rgba(163,157,147,0.2)] text-[#2A2825] relative overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-[#C6DCD8] pb-3 mb-3">
                        <Shield className="w-4 h-4 text-[#4E8079]" strokeWidth={2.2} />
                        <span className="text-[10px] font-bold tracking-wider text-[#3C6963] uppercase font-mono">
                          Visitor Credentials Verified
                        </span>
                      </div>
                      
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-baseline font-bold">
                          <span className="text-sm font-bold text-[#2A2825]">{selectedRequest.visitor_name}</span>
                          <span className="text-[#4E8079] tracking-widest font-mono text-[9px] bg-white/60 px-1.5 py-0.5 rounded border border-[#C6DCD8] uppercase">{selectedRequest.visitor_type}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px] text-[#5C564F] border-t border-[#DCD6CB]/60 pt-2.5 font-sans">
                          <div>
                            <span className="text-[#8A8276]">Destination:</span> <strong className="text-[#2A2825] font-semibold">Flat {flatNumber}</strong>
                          </div>
                          <div>
                            <span className="text-[#8A8276]">Contact:</span> <strong className="text-[#2A2825] font-mono font-semibold">*{selectedRequest.visitor_phone.slice(-4)}</strong>
                          </div>
                          <div>
                            <span className="text-[#8A8276]">Allocation:</span> <strong className="text-[#2A2825] font-semibold">{selectedRequest.expected_duration} Mins</strong>
                          </div>
                          {selectedRequest.vehicle_number && (
                            <div>
                              <span className="text-[#8A8276]">Plate ID:</span> <strong className="text-[#2A2825] font-mono font-semibold">{selectedRequest.vehicle_number}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6">
            
            {/* Lookup Request Form */}
            {results.length <= 1 && (
              <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[12px_12px_30px_rgba(163,157,147,0.35),-12px_-12px_30px_rgba(255,255,255,0.85)] p-2">
                <CardHeader className="pt-6 px-6 pb-4">
                  <CardTitle className="text-[#2A2825] font-bold tracking-tight flex items-center gap-2.5 text-lg">
                    <div className="w-7 h-7 rounded-lg bg-[#F0EDE8] border border-white flex items-center justify-center shadow-sm">
                      <KeyRound className="w-4 h-4 text-[#4E8079]" strokeWidth={2} />
                    </div>
                    Visitor Pass Lookup
                  </CardTitle>
                  <CardDescription className="text-xs text-[#6E685E] pt-1 leading-relaxed">
                    Retrieve active digital gateway passes, credentials, or audit approval logs instantly.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-6 pb-4">
                  <form onSubmit={handleLookup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="searchQuery" className="text-xs font-bold text-[#6E685E] uppercase tracking-wider block pl-0.5">
                        Request ID or Telephone Code
                      </Label>
                      {/* Soft Premium Inset Input Element */}
                      <Input
                        id="searchQuery"
                        type="text"
                        placeholder="e.g. req-1234 or +919876543210"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#F0EDE8] border border-[#DCD6CB] text-[#2A2825] placeholder:text-[#9F988F] focus-visible:ring-1 focus-visible:ring-[#4E8079] focus-visible:border-[#4E8079] rounded-xl py-6 px-4 shadow-[inset_2px_2px_5px_rgba(163,157,147,0.15)] font-medium transition-all"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={searching}
                      className="w-full bg-[#4E8079] hover:bg-[#3F6B65] active:bg-[#4E8079] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white font-bold py-6 rounded-xl transition-all duration-150 shadow-[4px_4px_12px_rgba(78,128,121,0.35)] flex items-center justify-center gap-2 border border-[#6BA199]"
                    >
                      {searching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={2.2} />
                          <span>Searching Database...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" strokeWidth={2.2} />
                          <span>Retrieve Pass</span>
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
                
                <CardFooter className="text-center text-[10px] text-[#8A8276] border-t border-[#DCD6CB]/60 mx-6 pt-4 pb-4 justify-center font-medium">
                  Search utilizing exact verification phone parameters or system tokens.
                </CardFooter>
              </Card>
            )}

            {/* Multiple Results Disambiguation List */}
            {results.length > 1 && (
              <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[12px_12px_30px_rgba(163,157,147,0.3),-12px_-12px_30px_rgba(255,255,255,0.85)] p-2 w-full">
                <CardHeader className="pt-6 px-6 pb-3">
                  <CardTitle className="text-[#2A2825] font-bold text-md flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#4E8079]" strokeWidth={2} />
                    Select Active Pass
                  </CardTitle>
                  <CardDescription className="text-xs text-[#6E685E]">
                    Multiple matches found. Select a registration token below:
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-6 pb-2 space-y-3 max-h-[340px] overflow-y-auto custom-scrollbar">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRequest(r)}
                      className="w-full flex items-center justify-between p-4 bg-[#F0EDE8] border border-[#DCD6CB] hover:bg-[#EAE6DF] active:shadow-[inset_2px_2px_4px_rgba(163,157,147,0.2)] rounded-xl transition-all text-left group shadow-sm"
                    >
                      <div className="space-y-1 pr-2 max-w-[70%]">
                        <span className="text-[9px] font-bold text-[#8A8276] block font-mono">
                          {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-bold text-sm text-[#2A2825] block group-hover:text-[#4E8079] transition-colors truncate">
                          {r.visitor_name}
                        </span>
                        <span className="text-xs text-[#6E685E] block truncate">
                          For: {r.purpose}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`border uppercase text-[9px] font-bold px-2 py-0.5 rounded-md shadow-2xs tracking-wide ${getStatusBadgeStyles(r.status)}`}>
                          {r.status}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-[#8A8276] group-hover:text-[#4E8079] group-hover:translate-x-0.5 transition-all" strokeWidth={2} />
                      </div>
                    </button>
                  ))}
                </CardContent>
                
                <CardFooter className="pt-2 pb-4 border-t border-[#DCD6CB]/60 mx-6">
                  <Button
                    variant="ghost"
                    onClick={() => setResults([])}
                    className="w-full text-[#7A746B] hover:text-[#2A2825] hover:bg-[#E6E2D9] text-xs font-semibold rounded-xl"
                  >
                    Back to Search
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Structural Minimalist Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-[10px] font-medium text-[#8A8276] pt-6 border-t border-[#E0DACF]">
        Access recovery auditing enabled. All lookups are tracked via gate operations security consoles.
      </footer>
    </div>
  );
}