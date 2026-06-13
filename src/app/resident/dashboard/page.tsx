'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Phone, 
  Calendar, 
  FileText,
  UserCheck,
  User,
  AlertCircle,
  Bell
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, VisitorRequest } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ResidentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    approved: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);
  
  // Selected request for details dialog
  const [selectedReq, setSelectedReq] = useState<VisitorRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadData = async () => {
    try {
      if (!hasSupabaseCreds()) {
        const currentUser = mockDb.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const allReqs = mockDb.getVisitorRequests().filter(r => r.resident_id === currentUser.id);
          setRequests(allReqs);
          calculateStats(allReqs);
        }
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

            const { data: reqs } = await supabase
              .from('visitor_requests')
              .select('*')
              .eq('resident_id', supabaseUser.id)
              .order('created_at', { ascending: false });

            if (reqs) {
              setRequests(reqs);
              calculateStats(reqs);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading resident dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMock(!hasSupabaseCreds());
    loadData();

    // Auto-refresh data every 5 seconds to get live visitor requests at the gate!
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const calculateStats = (reqList: VisitorRequest[]) => {
    const todayStr = new Date().toDateString();
    
    const total = reqList.length;
    const today = reqList.filter(r => new Date(r.created_at).toDateString() === todayStr).length;
    const pending = reqList.filter(r => r.status === 'PENDING').length;
    const approved = reqList.filter(r => r.status === 'APPROVED').length;

    setStats({ total, today, pending, approved });
  };

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      if (isMock) {
        mockDb.updateVisitorRequestStatus(id, action, user.id);
        toast.success(`Request ${action.toLowerCase()} successfully`);
        loadData();
      } else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase
            .from('visitor_requests')
            .update({
              status: action,
              approval_time: new Date().toISOString(),
              qr_code_pass: action === 'APPROVED' ? `PASS-${id}-${Math.floor(1000 + Math.random() * 9000)}` : null
            })
            .eq('id', id);

          if (error) {
            toast.error(error.message);
          } else {
            // Log Admin/User action
            await supabase.from('audit_logs').insert({
              actor_id: user.id,
              action_type: action === 'APPROVED' ? 'APPROVE' : 'REJECT',
              description: `${action === 'APPROVED' ? 'Approved' : 'Rejected'} request ${id}`,
            });

            toast.success(`Request ${action.toLowerCase()}`);
            loadData();
          }
        }
      }
    } catch (err) {
      toast.error('Failed to update request status');
    }
  };

  // Filter requests by search query
  const getFilteredRequests = (statusFilter?: string) => {
    let list = requests;
    if (statusFilter) {
      list = requests.filter(r => r.status === statusFilter);
    }
    
    if (!searchQuery) return list;
    
    const query = searchQuery.toLowerCase();
    return list.filter(
      r => 
        r.visitor_name.toLowerCase().includes(query) ||
        r.visitor_phone.toLowerCase().includes(query) ||
        r.purpose.toLowerCase().includes(query) ||
        r.visitor_type.toLowerCase().includes(query)
    );
  };

  const getVisitorTypeColor = (type: VisitorRequest['visitor_type']) => {
    switch (type) {
      case 'GUEST': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'DELIVERY': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'MAINTENANCE': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'MAID': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'FAMILY': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusBadge = (status: VisitorRequest['status']) => {
    switch (status) {
      case 'PENDING': return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 uppercase text-[10px] font-bold">Pending</Badge>;
      case 'APPROVED': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase text-[10px] font-bold">Approved</Badge>;
      case 'REJECTED': return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 uppercase text-[10px] font-bold">Rejected</Badge>;
      case 'EXPIRED': return <Badge className="bg-slate-550/10 text-slate-400 border-slate-500/20 uppercase text-[10px] font-bold">Expired</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resident Gate Dashboard</h1>
          <p className="text-sm text-slate-400">Welcome, {user?.user_metadata?.full_name || 'Resident'} • Manage gate check-ins</p>
        </div>
        
        {/* Real-time blinker */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-Time Gate Sync Active</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800 shadow-md">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Visitors</span>
              <p className="text-2xl font-extrabold">{stats.total}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 shadow-md">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Today's Visits</span>
              <p className="text-2xl font-extrabold text-emerald-400">{stats.today}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-slate-900/40 border-slate-800 shadow-md transition-all ${stats.pending > 0 ? 'ring-1 ring-amber-500/40 bg-amber-500/5' : ''}`}>
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Gate</span>
              <p className={`text-2xl font-extrabold ${stats.pending > 0 ? 'text-amber-400 animate-pulse' : ''}`}>{stats.pending}</p>
            </div>
            <div className={`p-2.5 rounded-xl border ${stats.pending > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 shadow-md">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approved Visits</span>
              <p className="text-2xl font-extrabold text-indigo-400">{stats.approved}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Request Lists */}
      <Card className="bg-slate-900/40 border-slate-800 shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <CardTitle className="text-md">Gate Requests Log</CardTitle>
            <CardDescription className="text-xs text-slate-500">View and respond to entry requests</CardDescription>
          </div>
          
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-3 w-4 h-4 text-slate-650" />
            <Input
              type="text"
              placeholder="Search visitor name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border-slate-850 text-xs pl-9 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="bg-slate-950 border border-slate-850 p-1 rounded-xl mb-4 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="pending" className="rounded-lg text-xs">
                Pending ({requests.filter(r => r.status === 'PENDING').length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="rounded-lg text-xs">Approved</TabsTrigger>
              <TabsTrigger value="rejected" className="rounded-lg text-xs">Rejected</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg text-xs">All History</TabsTrigger>
            </TabsList>

            {/* TAB CONTENTS */}
            {['pending', 'approved', 'rejected', ''].map((tabVal) => {
              const displayVal = tabVal || 'history';
              const tabRequests = getFilteredRequests(tabVal ? tabVal.toUpperCase() : undefined);
              
              return (
                <TabsContent key={displayVal} value={displayVal} className="space-y-3 pt-1">
                  {tabRequests.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                      <Users className="w-8 h-8 text-slate-750 mx-auto mb-2" />
                      No requests in this category
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tabRequests.map((req) => (
                        <div 
                          key={req.id} 
                          className={`
                            p-4 rounded-2xl border bg-slate-950/40 flex flex-col justify-between gap-4 transition-all hover:border-slate-700
                            ${req.status === 'PENDING' ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-850'}
                          `}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-200">{req.visitor_name}</span>
                                <Badge className={`border text-[9px] font-bold px-2 py-0.5 ${getVisitorTypeColor(req.visitor_type)}`}>
                                  {req.visitor_type}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-slate-400 block">{req.purpose}</span>
                              <span className="text-[10px] text-slate-650 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(req.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            {getStatusBadge(req.status)}
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-900/60 pt-3 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReq(req);
                                setDetailsOpen(true);
                              }}
                              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                            >
                              Details
                            </button>

                            {req.status === 'PENDING' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAction(req.id, 'REJECTED')}
                                  className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold rounded-lg text-xs"
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAction(req.id, 'APPROVED')}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs"
                                >
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* DETAIL DIALOG */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-150">Visitor Profile Pass</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Full submission details from the gate</DialogDescription>
          </DialogHeader>

          {selectedReq && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-slate-200">{selectedReq.visitor_name}</span>
                </div>
                <Badge className={`border text-[9px] font-bold uppercase px-2 py-0.5 ${getVisitorTypeColor(selectedReq.visitor_type)}`}>
                  {selectedReq.visitor_type}
                </Badge>
              </div>

              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Contact Number:</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {selectedReq.visitor_phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Purpose of Visit:</span>
                  <span className="font-semibold text-slate-200">{selectedReq.purpose}</span>
                </div>
                {selectedReq.vehicle_number && (
                  <div className="flex justify-between">
                    <span>Vehicle Number:</span>
                    <span className="font-semibold text-slate-200 font-mono">{selectedReq.vehicle_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Number of Guests:</span>
                  <span className="font-semibold text-slate-200">{selectedReq.number_of_visitors} Person(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Duration:</span>
                  <span className="font-semibold text-slate-200">{selectedReq.expected_duration} Minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Gate Arrival:</span>
                  <span className="font-semibold text-slate-200">
                    {new Date(selectedReq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {selectedReq.approval_time && (
                  <div className="flex justify-between">
                    <span>Approval Time:</span>
                    <span className="font-semibold text-slate-200">
                      {new Date(selectedReq.approval_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {selectedReq.qr_code_pass && (
                  <div className="flex justify-between">
                    <span>Access Pass Code:</span>
                    <span className="font-semibold text-emerald-400 font-mono">{selectedReq.qr_code_pass}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button onClick={() => setDetailsOpen(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750">
              Close Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
