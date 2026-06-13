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
          // Normalize query to compare
          const normQuery = query.replace(/[\s-()]/g, '');
          matches = reqs.filter(r => r.visitor_phone.replace(/[\s-()]/g, '').includes(normQuery));
        } else {
          // Look up by request ID
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
    
    // Get Resident Info
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
      
      // Fetch Entry
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

    // Generate QR Pass
    if (req.status === 'APPROVED') {
      QRCode.toDataURL(req.id, {
        width: 200,
        margin: 1,
        color: {
          dark: '#020617', // slate-950
          light: '#ffffff',
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

  const getStatusColor = (status: VisitorRequest['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'APPROVED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'EXPIRED': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex justify-between items-center pb-6 border-b border-slate-900 z-10">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            GateKeeper VMS
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/')} 
          className="border-slate-800 hover:bg-slate-900 text-slate-300 text-xs rounded-xl"
        >
          Gate Portal
        </Button>
      </header>

      {/* Main section */}
      <main className="max-w-4xl mx-auto w-full flex flex-col grow justify-center items-center my-8 z-10">
        
        {/* Pass Detail Panel (Loaded once pass is selected/found) */}
        {selectedRequest ? (
          <div className="w-full space-y-4">
            
            {/* Back button if search yielded multiple choices */}
            {results.length > 1 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedRequest(null);
                  setEntry(null);
                  setQrCodeDataUrl('');
                }}
                className="text-slate-400 hover:text-slate-100 bg-slate-900/60 rounded-xl mb-2 gap-2 border border-slate-800/60 self-start"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Results</span>
              </Button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left Side: Status Info Card */}
              <div className="md:col-span-7 space-y-6">
                <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                          Request ID: {selectedRequest.id}
                        </span>
                        <CardTitle className="text-xl text-slate-100">
                          Access Tracker
                        </CardTitle>
                      </div>
                      <Badge className={`border uppercase text-[10px] font-bold px-2.5 py-1 ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Tracker status timeline */}
                    <div className="flex flex-col gap-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Approval Timeline
                      </span>
                      
                      <div className="grid grid-cols-4 gap-2 text-center relative pt-2">
                        {/* Progress lines */}
                        <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-slate-800 -z-10" />
                        
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-lg shadow-emerald-500/20">
                            1
                          </div>
                          <span className="text-[10px] text-slate-400 mt-2 font-semibold">Submitted</span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                            ${selectedRequest.status === 'APPROVED' || entry
                              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                              : selectedRequest.status === 'REJECTED'
                              ? 'bg-rose-500 text-slate-950 shadow-lg shadow-rose-500/20'
                              : 'bg-slate-800 text-slate-400 animate-pulse'
                            }
                          `}>
                            {selectedRequest.status === 'REJECTED' ? '✕' : '2'}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-2 font-semibold">
                            {selectedRequest.status === 'REJECTED' ? 'Rejected' : 'Approved'}
                          </span>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                            ${entry 
                              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                              : selectedRequest.status === 'APPROVED'
                              ? 'bg-slate-800 text-slate-400 animate-pulse'
                              : 'bg-slate-800 text-slate-650'
                            }
                          `}>
                            3
                          </div>
                          <span className="text-[10px] text-slate-400 mt-2 font-semibold">Checked In</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                            ${entry?.exit_time 
                              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                              : 'bg-slate-800 text-slate-650'
                            }
                          `}>
                            4
                          </div>
                          <span className="text-[10px] text-slate-400 mt-2 font-semibold">Exited</span>
                        </div>
                      </div>
                    </div>

                    {/* Detail fields */}
                    <div className="border-t border-slate-800/80 pt-6 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Host Resident</span>
                        <span className="text-sm font-bold text-slate-200">{residentName}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Flat Number</span>
                        <span className="text-sm font-bold text-slate-200">Flat {flatNumber}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Visitor Name</span>
                        <span className="text-sm font-bold text-slate-200">{selectedRequest.visitor_name} ({selectedRequest.visitor_type})</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Purpose</span>
                        <span className="text-sm font-bold text-slate-200">{selectedRequest.purpose}</span>
                      </div>
                      {selectedRequest.vehicle_number && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Vehicle Number</span>
                          <span className="text-sm font-bold text-slate-200">{selectedRequest.vehicle_number}</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Visitors</span>
                        <span className="text-sm font-bold text-slate-200">{selectedRequest.number_of_visitors} Person(s)</span>
                      </div>
                    </div>

                    {/* Security Entry/Exit logs */}
                    {entry && (
                      <div className="border-t border-slate-800/80 pt-6 space-y-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Security Logs
                        </span>
                        <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Entered Gate</span>
                            <span className="text-xs text-slate-300">
                              {new Date(entry.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">Exited Gate</span>
                            <span className="text-xs text-slate-300">
                              {entry.exit_time 
                                ? new Date(entry.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Currently Inside'}
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
                  className="w-full border-slate-800 hover:bg-slate-900 text-slate-400 py-3 rounded-xl text-xs"
                >
                  Lookup Another Pass
                </Button>
              </div>

              {/* Right Side: QR Access Pass Display */}
              <div className="md:col-span-5 space-y-6">
                {selectedRequest.status === 'PENDING' && (
                  <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl p-6 text-center space-y-4">
                    <Clock className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-md text-slate-200">Awaiting Resident Action</h3>
                      <p className="text-xs text-slate-400">
                        This request is currently pending host approval. Once approved, the QR Pass will become active.
                      </p>
                    </div>
                  </Card>
                )}

                {selectedRequest.status === 'REJECTED' && (
                  <Card className="border-rose-950/40 bg-rose-950/10 backdrop-blur-xl shadow-xl p-6 text-center space-y-4 border">
                    <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-md text-rose-400">Access Request Denied</h3>
                      <p className="text-xs text-slate-400">
                        The resident of flat {flatNumber} has declined this access request.
                      </p>
                    </div>
                  </Card>
                )}

                {selectedRequest.status === 'APPROVED' && (
                  <div className="space-y-6">
                    {/* QR Code Card */}
                    <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl p-6 text-center space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-md text-slate-200 flex items-center justify-center gap-2">
                          <QrCode className="w-4 h-4 text-emerald-400" />
                          QR Access Pass
                        </h3>
                        <p className="text-[10px] text-slate-500">Show this QR code to the gate guard to check in</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner border border-slate-200">
                        {qrCodeDataUrl ? (
                          <img src={qrCodeDataUrl} alt="Visitor Pass QR" className="w-[180px] h-[180px]" />
                        ) : (
                          <div className="w-[180px] h-[180px] bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs">
                            Generating...
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Button 
                          onClick={handleDownloadQR}
                          className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 gap-2 rounded-xl text-xs py-5 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Pass (PNG)</span>
                        </Button>

                        <Button 
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              navigator.clipboard.writeText(`${window.location.origin}/public/tracking/${selectedRequest.id}`);
                              toast.success('Pass link copied to clipboard!');
                            }
                          }}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 gap-2 rounded-xl text-xs py-5 transition-colors font-bold mt-2"
                        >
                          <Link2 className="w-4 h-4" />
                          <span>Copy Pass Link</span>
                        </Button>
                      </div>
                    </Card>

                    {/* Visitor Badge layout */}
                    <div className="border border-slate-800/80 bg-gradient-to-b from-indigo-950/20 to-slate-900/60 backdrop-blur-xl rounded-3xl p-5 shadow-xl relative overflow-hidden text-slate-200">
                      <div className="absolute top-[-30px] right-[-30px] w-20 h-20 rounded-full bg-indigo-500/20 blur-xl" />
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">
                          Green Glen Heights - Visitor
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between font-bold text-sm">
                          <span className="text-slate-100">{selectedRequest.visitor_name}</span>
                          <span className="text-emerald-400 uppercase font-mono text-[10px]">{selectedRequest.visitor_type}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-850 pt-2">
                          <div>
                            <span>Flat:</span> <strong className="text-slate-200">{flatNumber}</strong>
                          </div>
                          <div>
                            <span>Phone:</span> <strong className="text-slate-200">*{selectedRequest.visitor_phone.slice(-4)}</strong>
                          </div>
                          <div>
                            <span>Duration:</span> <strong className="text-slate-200">{selectedRequest.expected_duration} Min</strong>
                          </div>
                          {selectedRequest.vehicle_number && (
                            <div>
                              <span>Vehicle:</span> <strong className="text-slate-200">{selectedRequest.vehicle_number}</strong>
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
            
            {/* Lookup Form */}
            {results.length <= 1 && (
              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2 text-lg">
                    <KeyRound className="w-5 h-5 text-emerald-400" />
                    Visitor Pass Lookup
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Retrieve your digital gate pass or check approval status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLookup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="searchQuery" className="text-xs text-slate-400">
                        Enter Request ID or Phone Number
                      </Label>
                      <Input
                        id="searchQuery"
                        type="text"
                        placeholder="e.g. req-1234 or +919876543210"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-emerald-500 py-6"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={searching}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {searching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Retrieve Pass</span>
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="text-center text-[10px] text-slate-550 border-t border-slate-900 pt-4 justify-center">
                  Search by the phone number used during registration, or the unique check-in ID.
                </CardFooter>
              </Card>
            )}

            {/* Multiple Results List */}
            {results.length > 1 && (
              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-slate-100 text-md flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-400" />
                    Select Your Pass
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Multiple requests found for query. Choose one to view details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRequest(r)}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 hover:bg-slate-900/60 rounded-xl transition-all text-left group"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-semibold text-sm text-slate-200 block group-hover:text-emerald-400 transition-colors">
                          Visitor: {r.visitor_name}
                        </span>
                        <span className="text-xs text-slate-400 block truncate max-w-[220px]">
                          Purpose: {r.purpose}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`border uppercase text-[9px] font-bold px-2 py-0.5 ${getStatusColor(r.status)}`}>
                          {r.status}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </CardContent>
                <CardFooter className="pt-2 border-t border-slate-900">
                  <Button
                    variant="ghost"
                    onClick={() => setResults([])}
                    className="w-full text-slate-500 hover:text-slate-300 text-xs"
                  >
                    Back to Search
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-[10px] text-slate-600 pt-6 border-t border-slate-900 z-10">
        This portal allows secure recovery of active guest credentials. All queries are audited by security desks.
      </footer>
    </div>
  );
}
