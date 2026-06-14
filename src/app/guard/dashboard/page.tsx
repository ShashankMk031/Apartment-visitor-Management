'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Scan, 
  LogIn, 
  LogOut, 
  Clock, 
  Search, 
  ShieldAlert, 
  Phone, 
  Home, 
  UserCheck2,
  Camera,
  Calendar,
  Info,
  RefreshCw,
  AlertTriangle,
  SlidersHorizontal,
  Maximize2
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

        const emergencies = mockDb.getEmergencyAlerts().filter(a => a.status === 'ACTIVE');
        setActiveAlerts(emergencies);

        const entries = mockDb.getVisitorEntries();
        const checkedInRequestIds = new Set(entries.map(e => e.visitor_request_id));
        
        const approved = allReqs.filter(r => r.status === 'APPROVED' && !checkedInRequestIds.has(r.id));
        setApprovedRequests(approved);

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

           const { data: alerts } = await supabase.from('emergency_alerts').select('*').eq('status', 'ACTIVE');
          if (alerts) setActiveAlerts(alerts);
 
          const { data: res } = await supabase.from('residents').select('*');
          if (res) setResidents(res);
 
          const { data: reqs } = await supabase.from('visitor_requests').select('*');
          const { data: entries } = await supabase.from('visitor_entries').select('*').order('entry_time', { ascending: false });
 
          const safeReqs = reqs || [];
          const safeEntries = entries || [];
 
          const checkedInRequestIds = new Set(safeEntries.map((e: any) => e.visitor_request_id));
          const approved = safeReqs.filter((r: any) => r.status === 'APPROVED' && !checkedInRequestIds.has(r.id));
          setApprovedRequests(approved);
 
          const activeInside = safeEntries
             .filter((e: any) => !e.exit_time)
             .map((e: any) => {
               const req = safeReqs.find((r: any) => r.id === e.visitor_request_id);
               const resident = res?.find((r: any) => r.id === req?.resident_id);
               return {
                 ...e,
                 request: req,
                 residentFlat: resident?.flat_number || 'TBD'
               };
             })
             .filter((e: any) => e.request !== undefined);
          setInsideEntries(activeInside);
 
          const logs = safeEntries.map((e: any) => {
            const req = safeReqs.find((r: any) => r.id === e.visitor_request_id);
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
    }, 5000);

    return () => {
      clearInterval(interval);
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

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

      let reqId = scannedCode;
      if (scannedCode.startsWith('PASS-')) {
        const parts = scannedCode.split('-');
        reqId = `${parts[1]}-${parts[2]}`;
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
        const supabase = createClient();
        if (supabase && scannedFrequentVisitor) {
          let type: any = 'OTHER';
          if (scannedFrequentVisitor.category === 'MAID') type = 'MAID';
          else if (scannedFrequentVisitor.category === 'DRIVER') type = 'DRIVER';
          else if (scannedFrequentVisitor.category === 'COOK') type = 'COOK';
          
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
      visitsList: sortedVisits.reverse(),
    });
    setInsightsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#F0EDE8] rounded-[28px] p-8">
        <RefreshCw className="w-8 h-8 text-[#4E8079] animate-spin" strokeWidth={1.8} />
        <span className="text-xs text-[#6E685E] font-medium mt-3 tracking-wide">Syncing Security Perimeter...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F0EDE8] text-[#2A2825] font-sans antialiased selection:bg-[#4E8079]/20 selection:text-[#4E8079]">
      
      {/* Emergency Active Banner */}
      {activeAlerts.length > 0 && (
        <div className="bg-[#EADCDA] border border-[#D1AFA9] text-[#913B2E] p-4 rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_12px_rgba(145,59,46,0.15)] animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-[#913B2E]" strokeWidth={2} />
            <div>
              <span className="font-bold text-xs uppercase tracking-wider block">Urgent Premises Alert</span>
              <span className="text-xs opacity-90 font-medium">
                {activeAlerts.map(a => {
                  const res = residents.find(r => r.id === a.resident_id);
                  return `Flat ${res?.flat_number || 'TBD'} requests immediate support (${a.alert_type})`;
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
            className="bg-[#913B2E] hover:bg-[#782F24] text-white font-bold text-xs px-4 h-9 rounded-xl border border-[#A64A3C] shadow-sm transition-all"
          >
            Acknowledge & Resolve
          </Button>
        </div>
      )}

      {/* Structural Minimalist Header Frame */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-[#E0DACF]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2A2825]">Gate Control Desk</h1>
          <p className="text-xs text-[#6E685E] font-medium mt-0.5">Stationed Guard: {user?.user_metadata?.full_name || 'Officer'} • Gatekeeper Portal</p>
        </div>
        
        {/* Soft Elevated Primary Teal CTA Button */}
        <Button 
          onClick={() => {
            setScannerOpen(true);
            setScannedCode('');
            setScannedRequest(null);
            setScannedFrequentVisitor(null);
          }}
          className="bg-[#4E8079] hover:bg-[#3F6B65] active:bg-[#4E8079] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white font-bold px-5 py-5 h-11 rounded-xl flex items-center gap-2 transition-all duration-150 shadow-[4px_4px_12px_rgba(78,128,121,0.35)] border border-[#6BA199] text-xs cursor-pointer"
        >
          <Scan className="w-4 h-4" strokeWidth={2.2} />
          <span>Scan Access Pass</span>
        </Button>
      </div>

      {/* Live State Split Column Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Grid: Live On-Site Active Arrivals */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[6px_6px_16px_rgba(163,157,147,0.25),-6px_-6px_16px_rgba(255,255,255,0.85)] p-2">
            <CardHeader className="flex flex-row justify-between items-center pb-3 pt-3 px-4 border-b border-[#DCD6CB]/80">
              <div>
                <CardTitle className="text-[#2A2825] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  On-Premises Logs ({insideEntries.length})
                </CardTitle>
                <CardDescription className="text-[11px] text-[#6E685E] pt-0.5">Visitors currently verified on-site</CardDescription>
              </div>
              <Badge className="bg-[#EADEC9] text-[#7A6031] border border-[#DBCFB8] text-[9px] font-bold px-2 py-0.5 shadow-[inset_0.5px_0.5px_2px_rgba(0,0,0,0.02)] transition-none rounded-md">LIVE INSIDE</Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 max-h-[400px] overflow-y-auto pt-3 px-4">
              {insideEntries.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#8A8276] border border-dashed border-[#DCD6CB] rounded-xl font-medium">
                  No visitors currently inside residential limits.
                </div>
              ) : (
                insideEntries.map((entry) => (
                  <div key={entry.id} className="p-3.5 rounded-xl bg-[#F0EDE8] border border-[#E1DCD3] flex items-center justify-between gap-4 shadow-[1px_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#2A2825] truncate">{entry.request.visitor_name}</span>
                        <span className="bg-[#E1DCD3] text-[#4E8079] border border-[#D0C9BE] font-bold px-1.5 py-0.2 rounded text-[9px] font-mono shadow-[inset_0.5px_0.5px_1px_rgba(0,0,0,0.03)]">FLAT {entry.residentFlat}</span>
                      </div>
                      <span className="text-[11px] text-[#5C564F] block truncate">Purpose: {entry.request.purpose}</span>
                      <span className="text-[10px] text-[#8A8276] flex items-center gap-1 pt-0.5 font-mono">
                        <Clock className="w-3 h-3 text-[#9F988F]" strokeWidth={2} /> In: {new Date(entry.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleMarkExit(entry.request.id)} 
                      className="bg-[#F0EDE8] hover:bg-[#EADEC9]/40 border border-[#DCD6CB] text-[#A1584E] hover:text-[#8C463D] font-bold text-[11px] h-8 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3 h-3 mr-1" strokeWidth={2.2} /> Checkout
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Grid: Pending Pre-Approved Entries */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[6px_6px_16px_rgba(163,157,147,0.25),-6px_-6px_16px_rgba(255,255,255,0.85)] p-2">
            <CardHeader className="flex flex-row justify-between items-center pb-3 pt-3 px-4 border-b border-[#DCD6CB]/80">
              <div>
                <CardTitle className="text-[#2A2825] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  Resident Pre-Approvals ({approvedRequests.length})
                </CardTitle>
                <CardDescription className="text-[11px] text-[#6E685E] pt-0.5">Upcoming pass clearances awaiting checkpoint</CardDescription>
              </div>
              <Badge className="bg-[#D2E7E2] text-[#3B6660] border border-[#B9D5CE] text-[9px] font-bold px-2 py-0.5 shadow-[inset_0.5px_0.5px_2px_rgba(0,0,0,0.02)] transition-none rounded-md">APPROVED</Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 max-h-[400px] overflow-y-auto pt-3 px-4">
              {approvedRequests.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#8A8276] border border-dashed border-[#DCD6CB] rounded-xl font-medium">
                  No upcoming pre-approved entries available.
                </div>
              ) : (
                approvedRequests.map((req) => {
                  const res = residents.find(r => r.id === req.resident_id);
                  return (
                    <div key={req.id} className="p-3.5 rounded-xl bg-[#F0EDE8] border border-[#E1DCD3] flex items-center justify-between gap-4 shadow-[1px_1px_3px_rgba(0,0,0,0.02)]">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#2A2825] truncate">{req.visitor_name}</span>
                          <span className="bg-[#E1DCD3] text-[#4E8079] border border-[#D0C9BE] font-bold px-1.5 py-0.2 rounded text-[9px] font-mono shadow-[inset_0.5px_0.5px_1px_rgba(0,0,0,0.03)]">FLAT {res?.flat_number}</span>
                        </div>
                        <span className="text-[11px] text-[#5C564F] block truncate">Type: {req.visitor_type} • {req.purpose}</span>
                        <span className="text-[10px] text-[#8A8276] flex items-center gap-1 pt-0.5 font-mono">
                          <Clock className="w-3 h-3 text-[#9F988F]" strokeWidth={2} /> Set: {req.approval_time ? new Date(req.approval_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkEntry(req.id)} 
                        className="bg-[#4E8079] hover:bg-[#3F6B65] text-white font-bold text-[11px] h-8 px-3 rounded-lg shadow-sm border border-[#6BA199] transition-all cursor-pointer"
                      >
                        <LogIn className="w-3 h-3 mr-1" strokeWidth={2.2} /> Checkin
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Historical Ledger Table Card Container */}
      <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.3),-8px_-8px_20px_rgba(255,255,255,0.8)] p-2">
        <CardHeader className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-4 pt-4 px-5 border-b border-[#DCD6CB]/80">
          <div>
            <CardTitle className="text-[#2A2825] font-bold text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#F0EDE8] border border-white flex items-center justify-center shadow-xs">
                <UserCheck2 className="w-3.5 h-3.5 text-[#4E8079]" strokeWidth={2} />
              </div>
              Checkpoint Ledger & Analytics
            </CardTitle>
            <CardDescription className="text-xs text-[#6E685E] pt-0.5">Granular audit track and structural entry-point parameters</CardDescription>
          </div>

          {/* Micro-Indented Real-World Filtering Rows */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9F988F]" strokeWidth={2} />
              <Input
                type="text"
                placeholder="Search name, phone, flat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#F0EDE8] border border-[#DCD6CB] text-xs pl-9 text-[#2A2825] placeholder:text-[#9F988F] rounded-xl h-9 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Recessed From Date Input */}
              <div className="flex items-center gap-1 bg-[#F0EDE8] border border-[#DCD6CB] rounded-xl px-2 py-1 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.05)] text-[#5C564F]">
                <span className="text-[9px] uppercase font-bold text-[#8A8276] mr-1 font-mono">From</span>
                <input 
                  type="date" 
                  value={searchStartDate} 
                  onChange={(e) => setSearchStartDate(e.target.value)} 
                  className="bg-transparent border-none text-[11px] text-[#2A2825] focus:outline-none focus:ring-0 text-xs font-medium cursor-pointer" 
                />
              </div>

              {/* Recessed To Date Input */}
              <div className="flex items-center gap-1 bg-[#F0EDE8] border border-[#DCD6CB] rounded-xl px-2 py-1 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.05)] text-[#5C564F]">
                <span className="text-[9px] uppercase font-bold text-[#8A8276] mr-1 font-mono">To</span>
                <input 
                  type="date" 
                  value={searchEndDate} 
                  onChange={(e) => setSearchEndDate(e.target.value)} 
                  className="bg-transparent border-none text-[11px] text-[#2A2825] focus:outline-none focus:ring-0 text-xs font-medium cursor-pointer" 
                />
              </div>

              {(searchStartDate || searchEndDate || searchQuery) && (
                <Button 
                  variant="ghost" 
                  onClick={() => { setSearchStartDate(''); setSearchEndDate(''); setSearchQuery(''); }}
                  className="text-xs text-[#8A8276] hover:text-[#2A2825] h-9 px-2 rounded-xl"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pt-3 pb-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCD6CB] text-[#8A8276] font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-3 font-bold">Visitor Reference</th>
                  <th className="py-3 font-bold">Flat Association</th>
                  <th className="py-3 font-bold">Purpose / Details</th>
                  <th className="py-3 font-bold">Check-In Node</th>
                  <th className="py-3 font-bold">Check-Out Node</th>
                  <th className="py-3 font-bold text-right">Metrics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCD6CB]/40 text-[#4A453F] font-medium">
                {getFilteredLogs().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#8A8276]">
                      <SlidersHorizontal className="w-7 h-7 text-[#BCB5AB] mx-auto mb-2" strokeWidth={1.5} />
                      No visitor trails map directly with the specified ledger parameters.
                    </td>
                  </tr>
                ) : (
                  getFilteredLogs().map((log) => (
                    <tr key={log.id} className="hover:bg-[#F0EDE8]/40 transition-colors">
                      <td className="py-3.5 font-bold text-[#2A2825]">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[#2A2825]">{log.request.visitor_name}</div>
                          <div className="text-[10px] text-[#8A8276] font-mono">{log.request.visitor_phone}</div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="bg-[#E1DCD3] text-[#4E8079] border border-[#D0C9BE] font-bold px-2 py-0.5 rounded-md text-[10px] shadow-[inset_0.5px_0.5px_2px_rgba(0,0,0,0.05)] font-mono">
                          FLAT {log.residentFlat}
                        </span>
                      </td>
                      <td className="py-3.5 text-[#5C564F]">
                        <div className="max-w-[180px] truncate">{log.request.purpose}</div>
                      </td>
                      <td className="py-3.5 text-[#5C564F] font-mono text-[11px]">
                        {new Date(log.entry_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3.5 font-mono text-[11px]">
                        {log.exit_time ? (
                          <span className="text-[#5C564F]">{new Date(log.exit_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        ) : (
                          <span className="text-[#A1713B] bg-[#F2ECD2] border border-[#E8DCB9] px-1.5 py-0.5 rounded font-sans font-bold text-[9px]">ON-SITE</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewVisitorInsights(log.request.visitor_phone, log.request.visitor_name)}
                          className="text-[#4E8079] hover:text-[#3F6B65] hover:bg-[#4E8079]/5 h-8 rounded-lg cursor-pointer font-bold text-[11px]"
                        >
                          <Info className="w-3.5 h-3.5 mr-1" strokeWidth={2} /> Profile Insights
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

      {/* SCANNER MODAL DIALOG */}
      <Dialog open={scannerOpen} onOpenChange={(open) => { setScannerOpen(open); if(!open) stopCamera(); }}>
        <DialogContent className="bg-[#E8E4DD] border border-[#F5F3F0] text-[#2A2825] max-w-lg rounded-[28px] shadow-[12px_12px_36px_rgba(0,0,0,0.15),-12px_-12px_36px_rgba(255,255,255,0.9)] p-6">
          <DialogHeader>
            <DialogTitle className="text-[#2A2825] font-bold flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-lg bg-[#F0EDE8] border border-white flex items-center justify-center shadow-xs">
                <Scan className="w-4 h-4 text-[#4E8079]" strokeWidth={2} />
              </div>
              Gate Verification Node
            </DialogTitle>
            <DialogDescription className="text-[#6E685E] text-xs pt-0.5">
              Verify cryptographic secure access codes or run webcam parameter sweeps.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            {/* Real Webcam Stream Window */}
            {cameraActive ? (
              <div className="space-y-3">
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-[#DCD6CB] shadow-inner">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-[30px] border-black/40 flex items-center justify-center">
                    <div className="w-44 h-44 border-2 border-dashed border-[#4E8079] rounded-xl animate-pulse flex items-center justify-center">
                      <span className="text-[9px] font-mono tracking-widest text-white/80 uppercase bg-black/60 px-2 py-0.5 rounded">Target Frame</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-[10px] text-[#6E685E] font-medium block">Hardware feed mapped successfully.</span>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={switchCamera} className="bg-[#F0EDE8] border border-[#DCD6CB] text-[#4A453F] font-bold text-[10px] h-7 rounded-lg cursor-pointer">Switch Cam</Button>
                    <Button type="button" size="sm" onClick={stopCamera} className="bg-[#EADCDA] border border-[#D1AFA9] text-[#913B2E] font-bold text-[10px] h-7 rounded-lg cursor-pointer">Kill Stream</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#F0EDE8] border border-[#DCD6CB] text-center space-y-2 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.02)]">
                <Camera className="w-6 h-6 text-[#9F988F] mx-auto" strokeWidth={1.8} />
                <div className="text-xs font-bold text-[#2A2825]">Live Video Scanner Idle</div>
                <p className="text-[11px] text-[#6E685E] max-w-xs mx-auto">Initialize internal hardware streams to automatically process incoming vehicle or visitor QR passes.</p>
                <Button type="button" onClick={() => startCamera()} className="mt-1 bg-[#F0EDE8] hover:bg-[#DCD6CB]/60 text-[#4E8079] font-bold border border-[#DCD6CB] text-xs h-8 rounded-xl cursor-pointer shadow-xs">
                  Activate Video Matrix
                </Button>
              </div>
            )}

            {/* Simulated Code Entry Textbox */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider block font-mono pl-0.5">Access Pass Code Reference</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="e.g. PASS-req-1 or FREQ-qr-code"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    className="bg-[#F0EDE8] border border-[#DCD6CB] text-[#2A2825] placeholder:text-[#9F988F] text-xs rounded-xl py-4 h-10 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleSimulateScan}
                  disabled={scanning}
                  className="bg-[#4E8079] text-white font-bold text-xs h-10 px-4 rounded-xl border border-[#6BA199] shadow-sm transition-all cursor-pointer"
                >
                  {scanning ? 'Verifying...' : 'Validate Code'}
                </Button>
              </div>
            </div>

            {/* Parsed Verification Result State Plates */}
            {scannedRequest && (
              <div className="p-4 rounded-xl bg-[#D2E7E2] border border-[#B9D5CE] text-[#3B6660] space-y-2 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">✅ Standard Visitor Pass Verified</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-medium text-[#446E68]">
                  <div>Visitor: <b className="text-[#2A2825]">{scannedRequest.visitor_name}</b></div>
                  <div>Phone: <span className="font-mono text-[#2A2825]">{scannedRequest.visitor_phone}</span></div>
                  <div>Flat Association: <b className="text-[#2A2825]">{scannedResident?.flat_number || 'TBD'}</b></div>
                  <div>Category: <span className="font-mono text-[#2A2825]">{scannedRequest.visitor_type}</span></div>
                </div>
                <Button onClick={() => handleMarkEntry(scannedRequest.id)} className="w-full mt-1 bg-[#4E8079] text-white font-bold text-xs h-9 rounded-lg border border-[#6BA199]">
                  Confirm Gate Entry Clearances
                </Button>
              </div>
            )}

            {scannedFrequentVisitor && (
              <div className="p-4 rounded-xl bg-[#DCEBF2] border border-[#C2DFE8] text-[#477C94] space-y-2 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">🛡️ Trusted Community Staff Cleared</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-medium text-[#48788F]">
                  <div>Staff Name: <b className="text-[#2A2825]">{scannedFrequentVisitor.full_name}</b></div>
                  <div>Role Mapped: <span className="font-mono text-[#2A2825]">{scannedFrequentVisitor.category}</span></div>
                  <div>Flat Node: <b className="text-[#2A2825]">{scannedResident?.flat_number || 'TBD'}</b></div>
                  <div>Phone: <span className="font-mono text-[#2A2825]">{scannedFrequentVisitor.phone}</span></div>
                </div>
                <Button onClick={() => handleCheckInFrequentVisitor(scannedFrequentVisitor.qr_code)} className="w-full mt-1 bg-[#477C94] text-white font-bold text-xs h-9 rounded-lg border border-[#5CA4C4]">
                  Log Auto-Approved Staff Entry
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-2 border-t border-[#DCD6CB]/60">
            <Button onClick={() => { setScannerOpen(false); stopCamera(); }} className="w-full bg-[#F0EDE8] border border-[#DCD6CB] text-[#5C564F] text-xs h-9 rounded-xl font-bold">
              Dismiss Console
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HISTORICAL VISITOR INSIGHTS MODAL */}
      <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
        <DialogContent className="bg-[#E8E4DD] border border-[#F5F3F0] text-[#2A2825] max-w-md rounded-[28px] shadow-[12px_12px_36px_rgba(0,0,0,0.15),-12px_-12px_36px_rgba(255,255,255,0.9)] p-6">
          <DialogHeader>
            <DialogTitle className="text-[#2A2825] font-bold flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-lg bg-[#F0EDE8] border border-white flex items-center justify-center shadow-xs">
                <Info className="w-4 h-4 text-[#4E8079]" strokeWidth={2} />
              </div>
              Visitor Frequency Profile
            </DialogTitle>
          </DialogHeader>

          {selectedVisitorInsights && (
            <div className="space-y-4 pt-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F0EDE8] border border-[#DCD6CB] space-y-1.5 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.02)]">
                <div className="font-bold text-[#2A2825] text-sm">{selectedVisitorInsights.name}</div>
                <div className="font-mono text-[#6E685E]">{selectedVisitorInsights.phone}</div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DCD6CB] font-medium text-[#5C564F]">
                  <div>Total On-Site Logs: <b className="text-[#2A2825] font-mono">{selectedVisitorInsights.totalVisits}</b></div>
                  <div>First Initial Visit: <span className="text-[#2A2825] font-mono">{new Date(selectedVisitorInsights.firstVisit).toLocaleDateString()}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider block font-mono pl-0.5">Chronological Trace Logs</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedVisitorInsights.visitsList.map((v: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[#F0EDE8]/60 border border-[#DCD6CB]/80 flex items-center justify-between text-[11px]">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#2A2825]">Flat {v.residentFlat}</span>
                        <span className="text-[10px] text-[#6E685E] block truncate max-w-[160px]">Reason: {v.request.purpose}</span>
                      </div>
                      <div className="text-right font-mono text-[10px] text-[#5C564F]">
                        <span className="block">In: {new Date(v.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="block text-[#8A8276]">{v.exit_time ? `Out: ${new Date(v.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Active Inside'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 pt-2">
            <Button onClick={() => setInsightsOpen(false)} className="w-full bg-[#F0EDE8] border border-[#DCD6CB] text-[#5C564F] text-xs h-9 rounded-xl font-bold">
              Close Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}