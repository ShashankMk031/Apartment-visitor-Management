'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  Download, 
  RefreshCw, 
  Phone, 
  MapPin, 
  User, 
  UserCheck2,
  Calendar,
  LogOut,
  Link2
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, VisitorRequest, VisitorEntry } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export default function VisitorTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.requestId as string;

  const [request, setRequest] = useState<VisitorRequest | null>(null);
  const [entry, setEntry] = useState<VisitorEntry | null>(null);
  const [residentName, setResidentName] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (showRefState = false) => {
    if (showRefState) setRefreshing(true);
    try {
      if (!hasSupabaseCreds()) {
        const reqs = mockDb.getVisitorRequests();
        const req = reqs.find(r => r.id === requestId);
        
        if (req) {
          setRequest(req);
          // Find resident info
          const res = mockDb.getResidents().find(r => r.id === req.resident_id);
          if (res) {
            setResidentName(res.full_name);
            setFlatNumber(res.flat_number);
          }
          // Find entry info
          const entries = mockDb.getVisitorEntries();
          const ent = entries.find(e => e.visitor_request_id === req.id);
          if (ent) setEntry(ent);
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data: req, error } = await supabase
            .from('visitor_requests')
            .select(`
              *,
              residents (
                flat_number,
                profiles (
                  full_name
                )
              )
            `)
            .eq('id', requestId)
            .single();

          if (req) {
            setRequest(req);
            setResidentName(req.residents?.profiles?.full_name || 'Resident');
            setFlatNumber(req.residents?.flat_number || 'TBD');

            // Fetch entry
            const { data: ent } = await supabase
              .from('visitor_entries')
              .select('*')
              .eq('visitor_request_id', req.id)
              .maybeSingle();
            
            if (ent) setEntry(ent);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching tracking status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setIsMock(!hasSupabaseCreds());
    fetchStatus();

    // Auto refresh every 3 seconds
    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [requestId]);

  // Generate QR Code when approved
  useEffect(() => {
    if (request && request.status === 'APPROVED') {
      // Encode the request ID in the QR code so the guard can scan it!
      QRCode.toDataURL(request.id, {
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
  }, [request]);

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `visitor-pass-${request?.visitor_name.replace(/\s+/g, '-')}.png`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm animate-pulse">Loading Tracker...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <XCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-200 mb-2">Request Not Found</h2>
        <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">The tracking ID is invalid or has expired.</p>
        <Button onClick={() => router.push('/')} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950">
          Go back home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex justify-between items-center pb-6 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            GateKeeper VMS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchStatus(true)}
            className="text-slate-400 hover:text-slate-100 bg-slate-900/60 rounded-xl"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/')} 
            className="border-slate-800 hover:bg-slate-900 text-slate-300 text-xs rounded-xl"
          >
            Exit Gate
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 my-8 grow items-start">
        
        {/* Left Side: Status Info Card */}
        <div className="md:col-span-7 space-y-6">
          <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Request ID: {request.id}
                  </span>
                  <CardTitle className="text-xl text-slate-100">
                    Live Access Tracker
                  </CardTitle>
                </div>
                <Badge className={`border uppercase text-[10px] font-bold px-2.5 py-1 ${getStatusColor(request.status)}`}>
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Tracker status visual */}
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
                      ${request.status === 'APPROVED' || entry
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                        : request.status === 'REJECTED'
                        ? 'bg-rose-500 text-slate-950 shadow-lg shadow-rose-500/20'
                        : 'bg-slate-800 text-slate-400 animate-pulse'
                      }
                    `}>
                      {request.status === 'REJECTED' ? '✕' : '2'}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 font-semibold">
                      {request.status === 'REJECTED' ? 'Rejected' : 'Approved'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                      ${entry 
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                        : request.status === 'APPROVED'
                        ? 'bg-slate-800 text-slate-400 animate-pulse'
                        : 'bg-slate-800 text-slate-600'
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
                        : 'bg-slate-800 text-slate-600'
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
                  <span className="text-sm font-bold text-slate-200">{request.visitor_name} ({request.visitor_type})</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Purpose</span>
                  <span className="text-sm font-bold text-slate-200">{request.purpose}</span>
                </div>
                {request.vehicle_number && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Vehicle Number</span>
                    <span className="text-sm font-bold text-slate-200">{request.vehicle_number}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Visitors</span>
                  <span className="text-sm font-bold text-slate-200">{request.number_of_visitors} Person(s)</span>
                </div>
              </div>

              {/* Gate Entry details */}
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
        </div>

        {/* Right Side: QR Gate Pass Display OR Status instruction */}
        <div className="md:col-span-5 space-y-6">
          {request.status === 'PENDING' && (
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl p-6 text-center space-y-4">
              <Clock className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
              <div className="space-y-1.5">
                <h3 className="font-bold text-md text-slate-200">Awaiting Resident Action</h3>
                <p className="text-xs text-slate-400">
                  Your request has been sent to flat {flatNumber}. Please wait at the security gate. This page will update automatically.
                </p>
              </div>
              <div className="w-full bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex items-center gap-3 justify-center text-xs text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Checking status every 3s...</span>
              </div>
            </Card>
          )}

          {request.status === 'REJECTED' && (
            <Card className="border-rose-950/40 bg-rose-950/10 backdrop-blur-xl shadow-xl p-6 text-center space-y-4 border">
              <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <div className="space-y-1.5">
                <h3 className="font-bold text-md text-rose-400">Access Request Denied</h3>
                <p className="text-xs text-slate-400">
                  The resident of flat {flatNumber} has declined your access request. Please contact security or try registering again.
                </p>
              </div>
            </Card>
          )}

          {request.status === 'APPROVED' && (
            <div className="space-y-6">
              {/* QR Pass */}
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
                      navigator.clipboard.writeText(`${window.location.origin}/public/tracking/${request.id}`);
                      toast.success('Pass link copied to clipboard!');
                    }
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 gap-2 rounded-xl text-xs py-5 transition-colors font-bold mt-2"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Copy Pass Link</span>
                </Button>
              </Card>

              {/* Digital Badge Bonus Feature */}
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
                    <span className="text-slate-100">{request.visitor_name}</span>
                    <span className="text-emerald-400 uppercase font-mono text-[10px]">{request.visitor_type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-850 pt-2">
                    <div>
                      <span>Flat:</span> <strong className="text-slate-200">{flatNumber}</strong>
                    </div>
                    <div>
                      <span>Phone:</span> <strong className="text-slate-200">{request.visitor_phone.slice(-10)}</strong>
                    </div>
                    <div>
                      <span>Duration:</span> <strong className="text-slate-200">{request.expected_duration} Min</strong>
                    </div>
                    {request.vehicle_number && (
                      <div>
                        <span>Vehicle:</span> <strong className="text-slate-200">{request.vehicle_number}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-[10px] text-slate-600 pt-6 border-t border-slate-900">
        In case of difficulty, please walk up to the gate security booth and refer request code: {request.id}.
      </footer>
    </div>
  );
}
