'use client';

import React, { useState, useEffect } from 'react';
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
  Camera
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

  // Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedRequest, setScannedRequest] = useState<VisitorRequest | null>(null);
  const [scannedResident, setScannedResident] = useState<Resident | null>(null);

  const loadData = async () => {
    try {
      if (!hasSupabaseCreds()) {
        const currentUser = mockDb.getCurrentUser();
        if (currentUser) setUser(currentUser);

        const allReqs = mockDb.getVisitorRequests();
        const resList = mockDb.getResidents();
        setResidents(resList);

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

    return () => clearInterval(interval);
  }, []);

  const handleSimulateScan = () => {
    if (!scannedCode) {
      toast.error('Please input a request Pass ID');
      return;
    }
    setScanning(true);
    setScannedRequest(null);
    setScannedResident(null);

    setTimeout(() => {
      setScanning(false);
      // Clean request ID from pass code if they typed e.g. "PASS-req-1-4920"
      let reqId = scannedCode;
      if (scannedCode.startsWith('PASS-')) {
        const parts = scannedCode.split('-');
        reqId = `${parts[1]}-${parts[2]}`; // reconstructs req-1
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
        toast.success('Access pass verified successfully!');
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
          toast.success('Visitor entry registered!');
          setScannerOpen(false);
          setScannedCode('');
          setScannedRequest(null);
          loadData();
        } else {
          toast.error('Visitor already checked in or request not approved.');
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
            loadData();
          }
        }
      }
    } catch (err) {
      toast.error('Failed to log gate entry');
    }
  };

  const handleMarkExit = async (reqId: string) => {
    try {
      if (isMock) {
        mockDb.markVisitorExit(reqId, user.id);
        toast.success('Visitor exit registered!');
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
    if (!searchQuery) return allLogs;
    const q = searchQuery.toLowerCase();
    return allLogs.filter(
      l => 
        l.request.visitor_name.toLowerCase().includes(q) ||
        l.request.visitor_phone.toLowerCase().includes(q) ||
        l.residentFlat.toLowerCase().includes(q)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gate Control Desk</h1>
          <p className="text-sm text-slate-400">Welcome, Guard {user?.user_metadata?.full_name || ''} • gatekeeper station</p>
        </div>
        
        {/* QR Scan trigger */}
        <Button 
          onClick={() => setScannerOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/10"
        >
          <Scan className="w-5 h-5" />
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
                      <span className="text-[10px] text-slate-650 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Entered: {new Date(entry.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleMarkExit(entry.request.id)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 hover:text-rose-300 font-semibold text-xs rounded-xl"
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
                        <span className="text-[10px] text-slate-650 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Approved: {req.approval_time ? new Date(req.approval_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleMarkEntry(req.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl"
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
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <CardTitle className="text-sm">Visitor Log History</CardTitle>
            <CardDescription className="text-xs text-slate-500">Search gate entries & exits roster</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-3 w-4 h-4 text-slate-650" />
            <Input
              type="text"
              placeholder="Search visitor, flat, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border-slate-850 text-xs pl-9 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500"
            />
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
                  <th className="py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {getFilteredLogs().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-600">
                      No logs matching query
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
                      <td className="py-3">
                        {log.exit_time ? (
                          <Badge className="bg-slate-800 text-slate-400 border-none text-[9px] font-bold">EXITED</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">INSIDE</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* QR SCANNER SIMULATOR DIALOG */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-150 flex items-center gap-2">
              <Scan className="w-5 h-5 text-emerald-400" />
              Access Pass Scanner
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Simulate camera scanning or input the pass ID manually
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-3 flex flex-col items-center">
            {/* Visual Scanner Box */}
            <div className="w-full aspect-video rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center">
              {scanning ? (
                <>
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] top-0 animate-scanner-bar" />
                  <Camera className="w-10 h-10 text-emerald-500/40 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-3 animate-pulse">Reading Pass...</span>
                </>
              ) : scannedRequest ? (
                <div className="p-4 text-center space-y-2.5">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{scannedRequest.visitor_name}</h4>
                    <p className="text-xs text-slate-400">Access to Flat {scannedResident?.flat_number} ({scannedResident?.full_name})</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">
                    PASS VERIFIED
                  </Badge>
                </div>
              ) : (
                <div className="text-center text-slate-600 space-y-2 p-4">
                  <Scan className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-xs">Scanner idle. Enter Pass Code below to read.</p>
                </div>
              )}
            </div>

            {/* Input Pass Code */}
            <div className="w-full space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">
                Gate Pass Code / Request ID
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. PASS-req-1-4920 or req-1"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  disabled={scanning}
                  className="bg-slate-950 border-slate-850 text-xs focus-visible:ring-emerald-500"
                />
                <Button 
                  onClick={handleSimulateScan}
                  disabled={scanning}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shrink-0 rounded-xl"
                >
                  Verify
                </Button>
              </div>
              <span className="text-[9px] text-slate-500 block">
                Tip: Copy a request ID from the upcoming list (e.g. "req-1") and click verify.
              </span>
            </div>

            {/* Action Check In */}
            {scannedRequest && (
              <Button
                onClick={() => handleMarkEntry(scannedRequest.id)}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-extrabold py-5 rounded-xl transition-all shadow-lg"
              >
                Log Check-In & Open Gate
              </Button>
            )}
          </div>

          <DialogFooter className="mt-2 border-t border-slate-800/60 pt-4">
            <Button 
              onClick={() => {
                setScannerOpen(false);
                setScannedCode('');
                setScannedRequest(null);
              }} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750"
            >
              Cancel Scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
