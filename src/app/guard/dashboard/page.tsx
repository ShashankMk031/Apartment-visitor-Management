'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Scan, 
  LogIn, 
  LogOut, 
  Clock, 
  CheckCircle, 
  Search, 
  ShieldAlert, 
  Phone, 
  Home, 
  UserCheck2,
  ListFilter,
  Camera,
  Calendar,
  Info,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, VisitorRequest, VisitorEntry, Resident } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function GuardDashboard() {
  const [user, setUser] = useState<any>(null);
  
  // Lists
  const [approvedRequests, setApprovedRequests] = useState<VisitorRequest[]>([]);
  const [insideEntries, setInsideEntries] = useState<(VisitorEntry & { request: VisitorRequest; residentFlat: string })[]>([]);
  const [allLogs, setAllLogs] = useState<(VisitorEntry & { request: VisitorRequest; residentFlat: string })[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

  // Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedRequest, setScannedRequest] = useState<VisitorRequest | null>(null);
  const [scannedResident, setScannedResident] = useState<Resident | null>(null);
  const [scannedFrequentVisitor, setScannedFrequentVisitor] = useState<any | null>(null);

  // Real Camera scan states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // History Insights Modal
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [selectedVisitorInsights, setSelectedVisitorInsights] = useState<any>(null);

  const loadData = async () => {
    try {
      if (!hasSupabaseCreds()) {
        const currentUser = mockDb.getCurrentUser();
        if (currentUser) setUser(currentUser);

        const allReqs = mockDb.getVisitorRequests();
        const resList = mockDb.getResidents();
        setResidents(resList);

        // Fetch active emergencies
        const emergencies = mockDb.getEmergencyAlerts().filter(a => a.status === 'ACTIVE');
        setActiveAlerts(emergencies);

        // 1. Approved requests (not yet checked in)
        const entries = mockDb.getVisitorEntries();
        const checkedInRequestIds = new Set(entries.map(e => e.visitor_request_id));
        
        const approved = allReqs.filter(r => r.status === 'APPROVED' && !checkedInRequestIds.has(r.id));
        setApprovedRequests(approved);

        // 2. Active inside
        const activeInside = entries
          .filter(e => !e.exit_time)
          .map(e => {
            const req = allReqs.find(r => r.id === e.visitor_request_id)!;
            const res = resList.find(r => r.id === req?.resident_id);
            return {
              ...e,
              request: req,
              residentFlat: res ? res.flat_number : 'TBD'
            };
          })
          .filter(e => e.request !== undefined);
        setInsideEntries(activeInside);

        // 3. All logs
        const logs = entries
          .map(e => {
            const req = allReqs.find(r => r.id === e.visitor_request_id)!;
            const res = resList.find(r => r.id === req?.resident_id);
            return {
              ...e,
              request: req,
              residentFlat: res ? res.flat_number : 'TBD'
            };
          })
          .filter(e => e.request !== undefined);
        setAllLogs(logs);
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email,
              user_metadata: { full_name: supabaseUser.user_metadata?.full_name }
            });
          }

          // Fetch active alerts
          const { data: alerts } = await supabase.from('emergency_alerts').select('*').eq('status', 'ACTIVE');
          if (alerts) setActiveAlerts(alerts);

          // Fetch residents
          const { data: res } = await supabase.from('residents').select('*');
          if (res) setResidents(res);

          // Fetch requests & entries
          const { data: reqs } = await supabase.from('visitor_requests').select('*');
          const { data: entries } = await supabase.from('visitor_entries').select('*').order('entry_time', { ascending: false });

          if (reqs && entries) {
            const checkedInRequestIds = new Set(entries.map((e: any) => e.visitor_request_id));
            const approved = reqs.filter((r: any) => r.status === 'APPROVED' && !checkedInRequestIds.has(r.id));
            setApprovedRequests(approved);

            const activeInside = entries
               .filter((e: any) => !e.exit_time)
               .map((e: any) => {
                 const req = reqs.find((r: any) => r.id === e.visitor_request_id);
                 const resident = res?.find((r: any) => r.id === req?.resident_id);
                 return {
                   ...e,
                   request: req,
                   residentFlat: resident?.flat_number || 'TBD'
                 };
               })
               .filter((e: any) => e.request !== undefined);
            setInsideEntries(activeInside);

            const logs = entries.map((e: any) => {
              const req = reqs.find((r: any) => r.id === e.visitor_request_id);
              const resident = res?.find((r: any) => r.id === req?.resident_id);
              return {
                ...e,
                request: req,
                residentFlat: resident?.flat_number || 'TBD'
              };
            }).filter((e: any) => e.request !== undefined);
            setAllLogs(logs);
          }
        }
      }
    } catch (err) {
      console.error('Error loading guard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMock(!hasSupabaseCreds());
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 5000); // Sync every 5s

    return () => {
      clearInterval(interval);
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

  // Webcam API helpers
  const startCamera = async (deviceId?: string) => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      toast.success('Camera scanner started');
      
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(deviceId || videoDevices[0].deviceId);
      }
    } catch (e) {
      console.error('Camera access error:', e);
      toast.error('Webcam permission denied or camera not found.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    toast.success('Camera scanner stopped');
  };

  const switchCamera = () => {
    if (devices.length < 2) {
      toast.info('No alternative camera available');
      return;
    }
    const curIdx = devices.findIndex(d => d.deviceId === selectedDevice);
    const nextIdx = (curIdx + 1) % devices.length;
    const nextDevice = devices[nextIdx];
    setSelectedDevice(nextDevice.deviceId);
    startCamera(nextDevice.deviceId);
  };

  const handleSimulateScan = () => {
    if (!scannedCode) {
      toast.error('Please input an Access Pass Code or Frequent QR ID');
      return;
    }
    setScanning(true);
    setScannedRequest(null);
    setScannedResident(null);
    setScannedFrequentVisitor(null);

    setTimeout(() => {
      setScanning(false);

      // Handle frequent visitor QR
      if (scannedCode.startsWith('FREQ-')) {
        const list = mockDb.getFrequentVisitors();
        const visitor = list.find(v => v.qr_code === scannedCode);
        if (visitor) {
          setScannedFrequentVisitor(visitor);
          const res = mockDb.getResidents().find(r => r.id === visitor.resident_id);
          if (res) setScannedResident(res);
          toast.success('Trusted staff pass verified!');
        } else {
          toast.error('Invalid or inactive Trusted Staff pass');
        }
        return;
      }

      // Handle standard visitor QR
      let reqId = scannedCode;
      if (scannedCode.startsWith('PASS-')) {
        const parts = scannedCode.split('-');
        reqId = `${parts[1]}-${parts[2]}`; // Reconstructs req-1
      }
      
      let req: VisitorRequest | undefined = undefined;
      let resident: Resident | undefined = undefined;

      if (isMock) {
        req = mockDb.getVisitorRequests().find(r => r.id === reqId || r.qr_code_pass === scannedCode);
        if (req) {
          resident = mockDb.getResidents().find(r => r.id === req?.resident_id);
        }
      }

      if (req) {
        setScannedRequest(req);
        if (resident) setScannedResident(resident);
        toast.success('Visitor gate pass verified!');
      } else {
        toast.error('Invalid Access Pass or Request Code');
      }
    }, 1200);
  };

  const handleMarkEntry = async (reqId: string) => {
    try {
      if (isMock) {
        const entry = mockDb.markVisitorEntry(reqId, user.id);
        if (entry) {
          toast.success('Visitor check-in logged successfully');
          setScannerOpen(false);
          setScannedCode('');
          setScannedRequest(null);
          setScannedFrequentVisitor(null);
          stopCamera();
          loadData();
        } else {
          toast.error('Visitor is already inside or request is invalid');
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase
            .from('visitor_entries')
            .insert({
              visitor_request_id: reqId,
              entered_by_guard: user.id
            });
          
          if (error) {
            toast.error(error.message);
          } else {
            toast.success('Entry registered successfully');
            setScannerOpen(false);
            setScannedCode('');
            setScannedRequest(null);
            stopCamera();
            loadData();
          }
        }
      }
    } catch (err) {
      toast.error('Failed to log gate entry');
    }
  };

  const handleCheckInFrequentVisitor = async (qrCode: string) => {
    try {
      if (isMock) {
        const res = mockDb.checkInFrequentVisitor(qrCode, user.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(`Trusted visitor entry registered! Flat ${scannedResident?.flat_number}`);
          setScannerOpen(false);
          setScannedCode('');
          setScannedFrequentVisitor(null);
          stopCamera();
          loadData();
        }
      } else {
        // Real Supabase flow for frequent visitor auto-entry
        const supabase = createClient();
        if (supabase && scannedFrequentVisitor) {
          let type: any = 'OTHER';
          if (scannedFrequentVisitor.category === 'MAID') type = 'MAID';
          else if (scannedFrequentVisitor.category === 'DRIVER') type = 'DRIVER';
          else if (scannedFrequentVisitor.category === 'COOK') type = 'COOK';
          
          // 1. Create approved request
          const { data: newReq, error: reqErr } = await supabase
            .from('visitor_requests')
            .insert({
              resident_id: scannedFrequentVisitor.resident_id,
              visitor_name: scannedFrequentVisitor.full_name,
              visitor_phone: scannedFrequentVisitor.phone,
              visitor_type: type,
              purpose: `Trusted entry (${scannedFrequentVisitor.category})`,
              status: 'APPROVED',
              approval_time: new Date().toISOString(),
              qr_code_pass: qrCode
            })
            .select()
            .single();

          if (reqErr) {
            toast.error(reqErr.message);
            return;
          }

          // 2. Mark entry
          const { error: entErr } = await supabase
            .from('visitor_entries')
            .insert({
              visitor_request_id: newReq.id,
              entered_by_guard: user.id
            });

          if (entErr) toast.error(entErr.message);
          else {
            toast.success('Trusted entry registered');
            setScannerOpen(false);
            setScannedCode('');
            setScannedFrequentVisitor(null);
            stopCamera();
            loadData();
          }
        }
      }
    } catch (e) {
      toast.error('Failed to check in frequent visitor');
    }
  };

  const handleMarkExit = async (reqId: string) => {
    try {
      if (isMock) {
        mockDb.markVisitorExit(reqId, user.id);
        toast.success('Visitor checkout logged successfully');
        loadData();
      } else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase
            .from('visitor_entries')
            .update({
              exit_time: new Date().toISOString(),
              exited_by_guard: user.id
            })
            .eq('visitor_request_id', reqId)
            .is('exit_time', null);

          if (error) {
            toast.error(error.message);
          } else {
            toast.success('Exit registered successfully');
            loadData();
          }
        }
      }
    } catch (err) {
      toast.error('Failed to log gate exit');
    }
  };

  const getFilteredLogs = () => {
    let list = allLogs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = allLogs.filter(
        l => 
          l.request.visitor_name.toLowerCase().includes(q) ||
          l.request.visitor_phone.toLowerCase().includes(q) ||
          l.residentFlat.toLowerCase().includes(q)
      );
    }

    if (searchStartDate) {
      const start = new Date(searchStartDate);
      list = list.filter(l => new Date(l.entry_time) >= start);
    }
    if (searchEndDate) {
      const end = new Date(searchEndDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(l => new Date(l.entry_time) <= end);
    }

    return list;
  };

  const viewVisitorInsights = (phone: string, name: string) => {
    const visits = allLogs.filter(l => l.request.visitor_phone === phone);
    if (visits.length === 0) {
      toast.error('No history logs found for this visitor');
      return;
    }

    const sortedVisits = [...visits].sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime());
    const firstVisit = sortedVisits[0].entry_time;
    const lastVisit = sortedVisits[sortedVisits.length - 1].entry_time;
    const totalVisits = visits.length;

    setSelectedVisitorInsights({
      name,
      phone,
      totalVisits,
      firstVisit,
      lastVisit,
      visitsList: sortedVisits.reverse(), // Latest first
    });
    setInsightsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Emergency Alert banners inside guard dashboard */}
      {activeAlerts.length > 0 && (
        <div className="bg-rose-950/80 border border-rose-500/30 text-rose-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-500 animate-bounce" />
            <div>
              <span className="font-extrabold text-sm uppercase tracking-wider text-rose-100 block">🚨 URGENT ALERTS ON-SITE</span>
              <span className="text-xs text-rose-300">
                {activeAlerts.map(a => {
                  const res = residents.find(r => r.id === a.resident_id);
                  return `Flat ${res?.flat_number || 'TBD'} (${a.alert_type})`;
                }).join(', ')}
              </span>
            </div>
          </div>
          <Button 
            onClick={async () => {
              const firstAlert = activeAlerts[0];
              if (isMock) {
                mockDb.resolveEmergencyAlert(firstAlert.id, user.id);
                toast.success('Emergency resolved successfully');
                loadData();
              } else {
                const supabase = createClient();
                if (supabase) {
                  await supabase
                    .from('emergency_alerts')
                    .update({ status: 'RESOLVED', resolved_by: user.id, resolved_at: new Date().toISOString() })
                    .eq('id', firstAlert.id);
                  toast.success('Emergency resolved');
                  loadData();
                }
              }
            }}
            className="bg-rose-500 hover:bg-rose-600 text-slate-950 font-extrabold text-xs py-2 px-4 rounded-xl cursor-pointer"
          >
            Resolve First Alert
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Gate Control Desk</h1>
          <p className="text-sm text-slate-400">Welcome, Guard {user?.user_metadata?.full_name || ''} • gatekeeper station</p>
        </div>
        
        {/* QR Scan trigger */}
        <Button 
          onClick={() => {
            setScannerOpen(true);
            setScannedCode('');
            setScannedRequest(null);
            setScannedFrequentVisitor(null);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          <Scan className="w-5 h-5 animate-pulse" />
          <span>Scan Access Pass</span>
        </Button>
      </div>

      {/* Grid of lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Active inside */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="bg-slate-900/40 border-slate-800 shadow-md">
            <CardHeader className="flex justify-between items-start pb-3">
              <div>
                <CardTitle className="text-sm text-slate-200">Inside Premise ({insideEntries.length})</CardTitle>
                <CardDescription className="text-xs text-slate-500">Visitors currently inside the apartment</CardDescription>
              </div>
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">LIVE ON-SITE</Badge>
            </CardHeader>

            <CardContent className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {insideEntries.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-550 border border-dashed border-slate-850 rounded-2xl">
                  No visitors currently inside
                </div>
              ) : (
                insideEntries.map((entry) => (
                  <div key={entry.id} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-200 truncate">{entry.request.visitor_name}</span>
                        <span className="text-[10px] font-bold text-slate-500">Flat {entry.residentFlat}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">Purpose: {entry.request.purpose}</span>
                      <span className="text-[10px] text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Entered: {new Date(entry.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleMarkExit(entry.request.id)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 hover:text-rose-300 font-semibold text-xs rounded-xl cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1" />
                      Checkout
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Approved & Upcoming */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="bg-slate-900/40 border-slate-800 shadow-md">
            <CardHeader className="flex justify-between items-start pb-3">
              <div>
                <CardTitle className="text-sm text-slate-200">Resident Approved ({approvedRequests.length})</CardTitle>
                <CardDescription className="text-xs text-slate-500">Upcoming arrivals waiting for entry</CardDescription>
              </div>
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">APPROVED GATES</Badge>
            </CardHeader>

            <CardContent className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {approvedRequests.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-550 border border-dashed border-slate-850 rounded-2xl">
                  No upcoming approved visits
                </div>
              ) : (
                approvedRequests.map((req) => {
                  const res = residents.find(r => r.id === req.resident_id);
                  return (
                    <div key={req.id} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-200 truncate">{req.visitor_name}</span>
                          <span className="text-[10px] font-bold text-slate-500">Flat {res?.flat_number}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">Type: {req.visitor_type} • {req.purpose}</span>
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Approved: {req.approval_time ? new Date(req.approval_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleMarkEntry(req.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5 mr-1" />
                        Checkin
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historical Logs List */}
      <Card className="bg-slate-900/40 border-slate-800 shadow-md">
        <CardHeader className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-sm">Visitor Log History & Insights</CardTitle>
            <CardDescription className="text-xs text-slate-500">Search past gate logs, apply date filters, and query check-in metrics</CardDescription>
          </div>
          
          {/* Advanced Search Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-56">
              <Search className="absolute left-2.5 top-3 w-4 h-4 text-slate-600" />
              <Input
                type="text"
                placeholder="Name, phone, flat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border-slate-850 text-xs pl-9 text-slate-100 placeholder:text-slate-655 focus-visible:ring-emerald-500"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1 text-slate-400">
                <span className="text-[9px] uppercase font-bold text-slate-600 mr-1">From</span>
                <input
                  type="date"
                  value={searchStartDate}
                  onChange={(e) => setSearchStartDate(e.target.value)}
                  className="bg-transparent border-none text-[11px] text-slate-200 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1 text-slate-400">
                <span className="text-[9px] uppercase font-bold text-slate-600 mr-1">To</span>
                <input
                  type="date"
                  value={searchEndDate}
                  onChange={(e) => setSearchEndDate(e.target.value)}
                  className="bg-transparent border-none text-[11px] text-slate-200 focus:outline-none"
                />
              </div>
              {(searchStartDate || searchEndDate || searchQuery) && (
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => {
                    setSearchStartDate('');
                    setSearchEndDate('');
                    setSearchQuery('');
                  }}
                  className="h-8 w-8 text-slate-500 hover:text-slate-300 rounded-lg cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="py-3 font-semibold">Visitor</th>
                  <th className="py-3 font-semibold">Host Flat</th>
                  <th className="py-3 font-semibold">Type</th>
                  <th className="py-3 font-semibold">Entry Time</th>
                  <th className="py-3 font-semibold">Exit Time</th>
                  <th className="py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {getFilteredLogs().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-600">
                      No logs matching search criteria
                    </td>
                  </tr>
                ) : (
                  getFilteredLogs().map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/20">
                      <td className="py-3 font-bold text-slate-200">
                        {log.request.visitor_name}
                        <span className="text-[10px] text-slate-500 block">{log.request.visitor_phone}</span>
                      </td>
                      <td className="py-3">Flat {log.residentFlat}</td>
                      <td className="py-3">
                        <span className="capitalize">{log.request.visitor_type.toLowerCase()}</span>
                      </td>
                      <td className="py-3">{new Date(log.entry_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="py-3">
                        {log.exit_time 
                          ? new Date(log.exit_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          : <span className="text-amber-400 font-semibold">On Premise</span>}
                      </td>
                      <td className="py-3 text-right">
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => viewVisitorInsights(log.request.visitor_phone, log.request.visitor_name)}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 h-8 rounded-lg cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5 mr-1" />
                          Insights
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* QR SCANNER WEBCAM DIALOG */}
      <Dialog open={scannerOpen} onOpenChange={(val) => {
        setScannerOpen(val);
        if (!val) stopCamera();
      }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-150 flex items-center gap-2">
              <Scan className="w-5 h-5 text-emerald-400" />
              Access Pass Camera Scanner
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Start camera to scan visitor badges, or enter codes manually.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-3 flex flex-col items-center">
            {/* Visual Scanner Box */}
            <div className="w-full aspect-video rounded-2xl bg-slate-950 border border-slate-850 relative overflow-hidden flex flex-col items-center justify-center">
              {cameraActive ? (
                <>
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] top-0 animate-scanner-bar" />
                  
                  {/* Camera overlay controls */}
                  <div className="absolute bottom-3 flex gap-2">
                    <Button 
                      size="sm"
                      onClick={stopCamera}
                      className="bg-rose-500/80 hover:bg-rose-600 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      Stop Camera
                    </Button>
                    <Button 
                      size="sm"
                      onClick={switchCamera}
                      className="bg-slate-900/85 hover:bg-slate-800 border border-slate-750 text-slate-200 font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      Switch Camera
                    </Button>
                  </div>
                </>
              ) : scanning ? (
                <>
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] top-0 animate-scanner-bar" />
                  <Camera className="w-10 h-10 text-emerald-500/40 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-3 animate-pulse">Scanning Pass...</span>
                </>
              ) : scannedRequest ? (
                <div className="p-4 text-center space-y-2.5">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{scannedRequest.visitor_name}</h4>
                    <p className="text-xs text-slate-400">Host Flat {scannedResident?.flat_number} ({scannedResident?.full_name})</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">
                    PASS VERIFIED
                  </Badge>
                </div>
              ) : scannedFrequentVisitor ? (
                <div className="p-4 text-center space-y-2.5">
                  <UserCheck2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{scannedFrequentVisitor.full_name}</h4>
                    <p className="text-xs text-slate-400">Trusted Staff ({scannedFrequentVisitor.category}) • Flat {scannedResident?.flat_number}</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">
                    TRUSTED STAFF VERIFIED
                  </Badge>
                </div>
              ) : (
                <div className="text-center text-slate-600 space-y-3 p-4">
                  <Scan className="w-10 h-10 mx-auto opacity-30 animate-pulse" />
                  <p className="text-xs">Webcam Scanner is Off.</p>
                  <Button 
                    size="sm"
                    onClick={() => startCamera(selectedDevice)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                  >
                    Start Device Camera
                  </Button>
                </div>
              )}
            </div>

            {/* Input Pass Code */}
            <div className="w-full space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Gate Pass Code / Request ID
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. PASS-req-1-4920 or FREQ-COOK-..."
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  disabled={scanning}
                  className="bg-slate-950 border-slate-850 text-xs focus-visible:ring-emerald-500"
                />
                <Button 
                  onClick={handleSimulateScan}
                  disabled={scanning}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shrink-0 rounded-xl cursor-pointer"
                >
                  Verify Code
                </Button>
              </div>
              <span className="text-[9px] text-slate-500 block">
                Tip: Copy a resident pass code or a trusted staff code (from `credentials.md`) and verify.
              </span>
            </div>

            {/* Action Check In */}
            {scannedRequest && (
              <Button
                onClick={() => handleMarkEntry(scannedRequest.id)}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-extrabold py-5 rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Log Check-In & Open Gate
              </Button>
            )}

            {scannedFrequentVisitor && (
              <Button
                onClick={() => handleCheckInFrequentVisitor(scannedFrequentVisitor.qr_code)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-5 rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Log Trusted Staff Entry
              </Button>
            )}
          </div>

          <DialogFooter className="mt-2 border-t border-slate-800/60 pt-4">
            <Button 
              onClick={() => {
                setScannerOpen(false);
                setScannedCode('');
                setScannedRequest(null);
                setScannedFrequentVisitor(null);
                stopCamera();
              }} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750"
            >
              Cancel Scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VISITOR HISTORY INSIGHTS DIALOG */}
      <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-150 flex items-center gap-2">
              <UserCheck2 className="w-5 h-5 text-indigo-400" />
              Visitor History & Insights
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Frequent visitor metrics and aggregate gate activities
            </DialogDescription>
          </DialogHeader>

          {selectedVisitorInsights && (
            <div className="space-y-4 pt-3 text-slate-350 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-200">{selectedVisitorInsights.name}</h4>
                  <span className="text-slate-500">{selectedVisitorInsights.phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Visits</span>
                  <span className="text-2xl font-extrabold text-indigo-400">{selectedVisitorInsights.totalVisits}</span>
                </div>
              </div>

              {/* Insights Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-850/60">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">First Visit</span>
                  <span className="text-[10px] font-semibold text-slate-300">
                    {new Date(selectedVisitorInsights.firstVisit).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-850/60">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Last Visit</span>
                  <span className="text-[10px] font-semibold text-slate-300">
                    {new Date(selectedVisitorInsights.lastVisit).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Visit Logs Timeline */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Recent Activity Timeline</h5>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {selectedVisitorInsights.visitsList.map((v: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950/20 border border-slate-900/60 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-200">Flat {v.residentFlat}</span>
                        <span className="text-[9px] text-slate-550 block">Purpose: {v.request.purpose}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block">In: {new Date(v.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[9px] text-slate-500 block">
                          Out: {v.exit_time ? new Date(v.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'On Site'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button onClick={() => setInsightsOpen(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-xs py-3 rounded-xl">
              Close Insights
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
