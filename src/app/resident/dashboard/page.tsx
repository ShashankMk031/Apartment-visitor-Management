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
  Bell,
  Plus,
  Trash2,
  Edit,
  QrCode,
  Power,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Shield,
  Activity
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, VisitorRequest } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ResidentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [frequentVisitors, setFrequentVisitors] = useState<any[]>([]);
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

  // Frequent Visitors Dialogs
  const [freqOpen, setFreqOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<any | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorCategory, setVisitorCategory] = useState<'MAID' | 'DRIVER' | 'COOK' | 'PARENTS' | 'RELATIVES' | 'HELP' | 'TRAINER' | 'OTHER'>('OTHER');
  const [visitorNotes, setVisitorNotes] = useState('');
  
  // QR Pass Dialog
  const [qrPassOpen, setQrPassOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);

  // Emergency Alert trigger
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const loadData = async () => {
    try {
      if (!hasSupabaseCreds()) {
        const currentUser = mockDb.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const allReqs = mockDb.getVisitorRequests().filter(r => r.resident_id === currentUser.id);
          setRequests(allReqs);
          calculateStats(allReqs);

          // Fetch frequent visitors
          const freq = mockDb.getFrequentVisitors().filter(v => v.resident_id === currentUser.id);
          setFrequentVisitors(freq);
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

            // Fetch requests
            const { data: reqs } = await supabase
              .from('visitor_requests')
              .select('*')
              .eq('resident_id', supabaseUser.id)
              .order('created_at', { ascending: false });

            if (reqs) {
              setRequests(reqs);
              calculateStats(reqs);
            }

            // Fetch frequent visitors
            const { data: freq } = await supabase
              .from('frequent_visitors')
              .select('*')
              .eq('resident_id', supabaseUser.id)
              .order('created_at', { ascending: false });

            if (freq) {
              setFrequentVisitors(freq);
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

  // Filter frequent visitors by search query
  const getFilteredFrequentVisitors = () => {
    if (!searchQuery) return frequentVisitors;
    const query = searchQuery.toLowerCase();
    return frequentVisitors.filter(
      v => 
        v.full_name.toLowerCase().includes(query) ||
        v.phone.toLowerCase().includes(query) ||
        v.category.toLowerCase().includes(query)
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

  // Frequent Visitor CRUD operations
  const handleSaveFrequentVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorPhone) {
      toast.error('Name and phone number are required');
      return;
    }

    try {
      if (isMock) {
        if (editingVisitor) {
          mockDb.updateFrequentVisitor(editingVisitor.id, {
            full_name: visitorName,
            phone: visitorPhone,
            category: visitorCategory,
            notes: visitorNotes,
          });
          toast.success('Trusted visitor updated successfully');
        } else {
          mockDb.addFrequentVisitor({
            resident_id: user.id,
            full_name: visitorName,
            phone: visitorPhone,
            category: visitorCategory,
            notes: visitorNotes,
          });
          toast.success('Trusted visitor pre-registered successfully');
        }
        setFreqOpen(false);
        setEditingVisitor(null);
        resetFreqForm();
        loadData();
      } else {
        const supabase = createClient();
        if (supabase) {
          if (editingVisitor) {
            const { error } = await supabase
              .from('frequent_visitors')
              .update({
                full_name: visitorName,
                phone: visitorPhone,
                category: visitorCategory,
                notes: visitorNotes,
              })
              .eq('id', editingVisitor.id);

            if (error) toast.error(error.message);
            else {
              toast.success('Trusted visitor updated');
              setFreqOpen(false);
              setEditingVisitor(null);
              resetFreqForm();
              loadData();
            }
          } else {
            const qr_code = `FREQ-${visitorCategory.substring(0, 4)}-${visitorPhone.substring(visitorPhone.length - 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
            const { error } = await supabase
              .from('frequent_visitors')
              .insert({
                resident_id: user.id,
                full_name: visitorName,
                phone: visitorPhone,
                category: visitorCategory,
                notes: visitorNotes,
                qr_code,
                is_active: true
              });

            if (error) toast.error(error.message);
            else {
              toast.success('Trusted visitor pre-registered');
              setFreqOpen(false);
              resetFreqForm();
              loadData();
            }
          }
        }
      }
    } catch (err) {
      toast.error('Failed to save trusted visitor profile');
    }
  };

  const handleEditClick = (visitor: any) => {
    setEditingVisitor(visitor);
    setVisitorName(visitor.full_name);
    setVisitorPhone(visitor.phone);
    setVisitorCategory(visitor.category);
    setVisitorNotes(visitor.notes || '');
    setFreqOpen(true);
  };

  const handleToggleVisitorActive = async (id: string, currentStatus: boolean) => {
    try {
      if (isMock) {
        mockDb.updateFrequentVisitor(id, { is_active: !currentStatus });
        toast.success(`Visitor status changed to ${!currentStatus ? 'Active' : 'Inactive'}`);
        loadData();
      } else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase
            .from('frequent_visitors')
            .update({ is_active: !currentStatus })
            .eq('id', id);

          if (error) toast.error(error.message);
          else {
            toast.success('Visitor status updated');
            loadData();
          }
        }
      }
    } catch (e) {
      toast.error('Failed to change visitor status');
    }
  };

  const handleDeleteVisitor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trusted visitor? This will void their permanent QR pass.')) return;
    try {
      if (isMock) {
        mockDb.deleteFrequentVisitor(id);
        toast.success('Trusted visitor removed');
        loadData();
      } else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase
            .from('frequent_visitors')
            .delete()
            .eq('id', id);

          if (error) toast.error(error.message);
          else {
            toast.success('Trusted visitor removed');
            loadData();
          }
        }
      }
    } catch (e) {
      toast.error('Failed to remove visitor');
    }
  };

  const handleTriggerEmergency = async (type: 'MEDICAL' | 'SECURITY' | 'FIRE' | 'OTHER') => {
    try {
      if (isMock) {
        mockDb.triggerEmergencyAlert(user.id, type);
        toast.error(`⚠️ URGENT: ${type} emergency alert sent to gate!`);
      } else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase
            .from('emergency_alerts')
            .insert({
              resident_id: user.id,
              alert_type: type,
              status: 'ACTIVE'
            });

          if (error) {
            toast.error(error.message);
          } else {
            toast.error(`⚠️ URGENT: ${type} emergency alert sent to gate!`);
          }
        }
      }
      setEmergencyOpen(false);
    } catch (e) {
      toast.error('Failed to trigger emergency alert');
    }
  };

  const resetFreqForm = () => {
    setVisitorName('');
    setVisitorPhone('');
    setVisitorCategory('OTHER');
    setVisitorNotes('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Resident Gate Dashboard</h1>
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
            <CardTitle className="text-md">Gate Requests & Trusted Staff</CardTitle>
            <CardDescription className="text-xs text-slate-500">Manage digital approvals and pre-registered frequent visitors</CardDescription>
          </div>
          
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-3 w-4 h-4 text-slate-600" />
            <Input
              type="text"
              placeholder="Search visitor logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border-slate-850 text-xs pl-9 text-slate-100 placeholder:text-slate-655 focus-visible:ring-emerald-500"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList className="bg-slate-950 border border-slate-850 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                <TabsTrigger value="pending" className="rounded-lg text-xs cursor-pointer">
                  Pending ({requests.filter(r => r.status === 'PENDING').length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="rounded-lg text-xs cursor-pointer">Approved</TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-lg text-xs cursor-pointer">Rejected</TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg text-xs cursor-pointer">All History</TabsTrigger>
                <TabsTrigger value="frequent" className="rounded-lg text-xs cursor-pointer">Trusted Visitors</TabsTrigger>
              </TabsList>

              <TabsContent value="frequent" className="m-0 w-full sm:w-auto">
                <Button 
                  onClick={() => {
                    setEditingVisitor(null);
                    resetFreqForm();
                    setFreqOpen(true);
                  }}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Pre-Register Staff
                </Button>
              </TabsContent>
            </div>

            {/* REQUEST LOG TAB CONTENTS */}
            {['pending', 'approved', 'rejected', 'history'].map((tabVal) => {
              const displayVal = tabVal;
              const filterStatus = tabVal === 'history' ? undefined : tabVal.toUpperCase();
              const tabRequests = getFilteredRequests(filterStatus);
              
              return (
                <TabsContent key={displayVal} value={displayVal} className="space-y-3 pt-1">
                  {tabRequests.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-850 rounded-2xl text-slate-500 text-xs">
                      <Users className="w-8 h-8 text-slate-750 mx-auto mb-2" />
                      No requests found
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
                              <span className="text-[10px] text-slate-600 flex items-center gap-1">
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
                              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                            >
                              Details
                            </button>

                            {req.status === 'PENDING' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAction(req.id, 'REJECTED')}
                                  className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold rounded-lg text-xs cursor-pointer"
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAction(req.id, 'APPROVED')}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
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

            {/* FREQUENT VISITORS TAB CONTENT */}
            <TabsContent value="frequent" className="space-y-4 pt-1">
              {getFilteredFrequentVisitors().length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-850 rounded-2xl text-slate-500 text-xs">
                  <UserCheck className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  No pre-registered staff found. Add domestic help, cooks, or relatives to enable instant gate entry.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredFrequentVisitors().map((visitor) => (
                    <Card key={visitor.id} className="bg-slate-950/40 border-slate-850 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between">
                      <CardContent className="pt-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-bold text-sm text-slate-200">{visitor.full_name}</h3>
                            <Badge className="bg-slate-800 text-slate-350 border-slate-700 text-[9px] font-bold px-2 py-0.5">
                              {visitor.category}
                            </Badge>
                          </div>
                          <Badge className={`border text-[9px] font-bold px-2 py-0.5 ${visitor.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                            {visitor.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-xs text-slate-400">
                          <div className="flex justify-between">
                            <span>Phone:</span>
                            <span className="font-semibold text-slate-300">{visitor.phone}</span>
                          </div>
                          {visitor.notes && (
                            <div className="flex justify-between">
                              <span>Notes:</span>
                              <span className="font-semibold text-slate-300 truncate max-w-[150px]">{visitor.notes}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Pass Code:</span>
                            <span className="font-mono font-semibold text-slate-400">{visitor.qr_code}</span>
                          </div>
                        </div>
                      </CardContent>

                      <div className="p-4 border-t border-slate-900/60 flex items-center justify-between bg-slate-950/20">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleVisitorActive(visitor.id, visitor.is_active)}
                            title={visitor.is_active ? 'Deactivate Pass' : 'Activate Pass'}
                            className={`h-8 w-8 rounded-lg cursor-pointer ${visitor.is_active ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'}`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditClick(visitor)}
                            className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteVisitor(visitor.id)}
                            className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedVisitor(visitor);
                            setQrPassOpen(true);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          QR Code
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
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

      {/* FREQUENT VISITOR ADD/EDIT DIALOG */}
      <Dialog open={freqOpen} onOpenChange={setFreqOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-150">
              {editingVisitor ? 'Edit Trusted Staff' : 'Pre-Register Trusted Staff'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Pre-approved helpers can check in immediately without verification requests.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveFrequentVisitor} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Full Name</label>
              <Input
                type="text"
                placeholder="e.g. Shanti Maid"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="bg-slate-950 border-slate-850 text-xs text-slate-100 focus-visible:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Contact Number</label>
              <Input
                type="text"
                placeholder="e.g. +919876543210"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                className="bg-slate-950 border-slate-850 text-xs text-slate-100 focus-visible:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Category / Role</label>
              <select
                value={visitorCategory}
                onChange={(e) => setVisitorCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-850 text-slate-350 text-xs rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
              >
                <option value="MAID">Maid / Housekeeper</option>
                <option value="COOK">Cook / Chef</option>
                <option value="DRIVER">Driver</option>
                <option value="PARENTS">Parents</option>
                <option value="RELATIVES">Relatives / Family</option>
                <option value="HELP">Domestic Help</option>
                <option value="TRAINER">Personal Trainer</option>
                <option value="OTHER">Other Recurring Guest</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Visitor Notes</label>
              <Input
                type="text"
                placeholder="e.g. Daily mornings 8 AM"
                value={visitorNotes}
                onChange={(e) => setVisitorNotes(e.target.value)}
                className="bg-slate-950 border-slate-850 text-xs text-slate-100 focus-visible:ring-emerald-500"
              />
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <Button 
                type="button" 
                onClick={() => setFreqOpen(false)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-xs py-3"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-1/2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-3 cursor-pointer"
              >
                {editingVisitor ? 'Update Staff' : 'Pre-Register'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PERMANENT QR CODE PASS DIALOG */}
      <Dialog open={qrPassOpen} onOpenChange={setQrPassOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-150 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              Trusted Staff Permanent Pass
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Staff can print or keep this QR code on phone for instant check-in.
            </DialogDescription>
          </DialogHeader>

          {selectedVisitor && (
            <div className="space-y-6 py-4 flex flex-col items-center justify-center text-center">
              {/* Digital Pass Card */}
              <div className="w-full max-w-[280px] p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800/80 shadow-2xl relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[50px]" />
                
                {/* Header info */}
                <div className="flex justify-between items-start text-left">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-200 leading-tight">{selectedVisitor.full_name}</h4>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{selectedVisitor.category}</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-extrabold uppercase">
                    Trusted Staff
                  </Badge>
                </div>

                {/* QR Code Block */}
                <div className="w-40 h-40 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-lg relative group">
                  <div className="grid grid-cols-5 grid-rows-5 gap-1.5 w-full h-full opacity-90">
                    {/* Simulated pixelated QR matrix */}
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-[2px] ${
                          (i % 3 === 0 || i % 7 === 0 || i < 5 || i > 20 || (i % 5 === 0 && i > 10)) 
                            ? 'bg-slate-950' 
                            : 'bg-slate-200/20'
                        }`} 
                      />
                    ))}
                  </div>
                  {/* Center branding */}
                  <div className="absolute inset-0 m-auto w-10 h-10 bg-slate-900 border-2 border-white rounded-xl flex items-center justify-center shadow-md">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="text-left space-y-1 text-[11px] text-slate-400">
                  <div className="flex justify-between border-t border-slate-850 pt-2.5">
                    <span>Destination Flat:</span>
                    <span className="font-bold text-slate-300">Flat {user?.flat_number || '101'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passcode:</span>
                    <span className="font-mono font-bold text-emerald-400">{selectedVisitor.qr_code}</span>
                  </div>
                </div>
              </div>

              <div className="text-slate-400 text-xs px-2">
                Send this Passcode to **{selectedVisitor.full_name}**. The security guard can verify them instantly.
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button onClick={() => window.print()} className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-xs py-3">
              Print Pass
            </Button>
            <Button onClick={() => setQrPassOpen(false)} className="w-1/2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-3 cursor-pointer">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EMERGENCY TRIGGER FAB DIALOG */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setEmergencyOpen(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 animate-pulse cursor-pointer border-none outline-none"
        >
          <ShieldAlert className="w-5 h-5 animate-bounce" />
          <span>Trigger Emergency</span>
        </button>

        <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-slate-150 flex items-center gap-2 text-rose-500">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                Select Emergency Type
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                This will immediately trigger a high-priority alert on guard consoles and admin screens.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => handleTriggerEmergency('MEDICAL')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 transition-all text-xs font-semibold gap-2 cursor-pointer"
              >
                <Activity className="w-8 h-8 text-rose-400" />
                <span>Medical Alert</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerEmergency('SECURITY')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 transition-all text-xs font-semibold gap-2 cursor-pointer"
              >
                <Shield className="w-8 h-8 text-rose-400" />
                <span>Security Threat</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerEmergency('FIRE')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 transition-all text-xs font-semibold gap-2 cursor-pointer"
              >
                <Flame className="w-8 h-8 text-rose-400" />
                <span>Fire Alert</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerEmergency('OTHER')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 transition-all text-xs font-semibold gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-8 h-8 text-rose-400" />
                <span>Other Hazard</span>
              </button>
            </div>

            <DialogFooter className="mt-4">
              <Button onClick={() => setEmergencyOpen(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750">
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
