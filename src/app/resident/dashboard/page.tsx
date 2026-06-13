'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Users,
  Clock,
  CheckCircle,
  Search,
  Calendar,
  UserCheck,
  User,
  Plus,
  Trash2,
  Edit,
  QrCode,
  Power,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Shield,
  Activity,
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, VisitorRequest } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ResidentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [frequentVisitors, setFrequentVisitors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

  const [selectedReq, setSelectedReq] = useState<VisitorRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [freqOpen, setFreqOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<any | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorCategory, setVisitorCategory] = useState<'MAID' | 'DRIVER' | 'COOK' | 'PARENTS' | 'RELATIVES' | 'HELP' | 'TRAINER' | 'OTHER'>('OTHER');
  const [visitorNotes, setVisitorNotes] = useState('');

  const [qrPassOpen, setQrPassOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);
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
          const freq = mockDb.getFrequentVisitors().filter(v => v.resident_id === currentUser.id);
          setFrequentVisitors(freq);
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            setUser({ id: supabaseUser.id, email: supabaseUser.email, user_metadata: { full_name: supabaseUser.user_metadata?.full_name } });
            let flatNo = supabaseUser.user_metadata?.flat_number;
            if (!flatNo) {
              const { data: resData } = await supabase.from('residents').select('flat_number').eq('id', supabaseUser.id).maybeSingle();
              if (resData) flatNo = resData.flat_number;
            }
            let reqQuery = supabase.from('visitor_requests').select(`*, residents!inner (flat_number)`);
            if (flatNo) reqQuery = reqQuery.eq('residents.flat_number', flatNo);
            else reqQuery = reqQuery.eq('resident_id', supabaseUser.id);
            const { data: reqs } = await reqQuery.order('created_at', { ascending: false });
            if (reqs) { setRequests(reqs as any); calculateStats(reqs as any); }
            const { data: freq } = await supabase.from('frequent_visitors').select('*').eq('resident_id', supabaseUser.id).order('created_at', { ascending: false });
            if (freq) setFrequentVisitors(freq);
          }
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMock(!hasSupabaseCreds());
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const calculateStats = (reqList: VisitorRequest[]) => {
    const todayStr = new Date().toDateString();
    setStats({
      total: reqList.length,
      today: reqList.filter(r => new Date(r.created_at).toDateString() === todayStr).length,
      pending: reqList.filter(r => r.status === 'PENDING').length,
      approved: reqList.filter(r => r.status === 'APPROVED').length,
    });
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
          const { error } = await supabase.from('visitor_requests').update({
            status: action,
            approval_time: new Date().toISOString(),
            qr_code_pass: action === 'APPROVED' ? `PASS-${id}-${Math.floor(1000 + Math.random() * 9000)}` : null
          }).eq('id', id);
          if (error) toast.error(error.message);
          else {
            await supabase.from('audit_logs').insert({ actor_id: user.id, action_type: action === 'APPROVED' ? 'APPROVE' : 'REJECT', description: `${action} request ${id}` });
            toast.success(`Request ${action.toLowerCase()}`);
            loadData();
          }
        }
      }
    } catch { toast.error('Failed to update request status'); }
  };

  const getFilteredRequests = (statusFilter?: string) => {
    let list = statusFilter ? requests.filter(r => r.status === statusFilter) : requests;
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(r => r.visitor_name.toLowerCase().includes(q) || r.visitor_phone.toLowerCase().includes(q) || r.purpose.toLowerCase().includes(q) || r.visitor_type.toLowerCase().includes(q));
  };

  const getFilteredFrequentVisitors = () => {
    if (!searchQuery) return frequentVisitors;
    const q = searchQuery.toLowerCase();
    return frequentVisitors.filter(v => v.full_name.toLowerCase().includes(q) || v.phone.toLowerCase().includes(q) || v.category.toLowerCase().includes(q));
  };

  const getVisitorTypeBadge = (type: VisitorRequest['visitor_type']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      GUEST: 'default', DELIVERY: 'outline', MAINTENANCE: 'destructive', MAID: 'secondary', FAMILY: 'outline'
    };
    return <Badge variant={variants[type] ?? 'secondary'}>{type}</Badge>;
  };

  const getStatusBadge = (status: VisitorRequest['status']) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'destructive', APPROVED: 'default', REJECTED: 'secondary', EXPIRED: 'outline'
    };
    return <Badge variant={map[status] ?? 'outline'}>{status}</Badge>;
  };

  const handleSaveFrequentVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorPhone) { toast.error('Name and phone are required'); return; }
    try {
      if (isMock) {
        if (editingVisitor) {
          mockDb.updateFrequentVisitor(editingVisitor.id, { full_name: visitorName, phone: visitorPhone, category: visitorCategory, notes: visitorNotes });
          toast.success('Visitor updated');
        } else {
          mockDb.addFrequentVisitor({ resident_id: user.id, full_name: visitorName, phone: visitorPhone, category: visitorCategory, notes: visitorNotes });
          toast.success('Visitor registered');
        }
        setFreqOpen(false); setEditingVisitor(null); resetFreqForm(); loadData();
      } else {
        const supabase = createClient();
        if (supabase) {
          const payload = { full_name: visitorName, phone: visitorPhone, category: visitorCategory, notes: visitorNotes };
          if (editingVisitor) {
            const { error } = await supabase.from('frequent_visitors').update(payload).eq('id', editingVisitor.id);
            if (error) toast.error(error.message);
            else { toast.success('Visitor updated'); setFreqOpen(false); setEditingVisitor(null); resetFreqForm(); loadData(); }
          } else {
            const qr_code = `FREQ-${visitorCategory.substring(0, 4)}-${visitorPhone.substring(visitorPhone.length - 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
            const { error } = await supabase.from('frequent_visitors').insert({ resident_id: user.id, ...payload, qr_code, is_active: true });
            if (error) toast.error(error.message);
            else { toast.success('Visitor registered'); setFreqOpen(false); resetFreqForm(); loadData(); }
          }
        }
      }
    } catch { toast.error('Failed to save visitor'); }
  };

  const handleEditClick = (visitor: any) => {
    setEditingVisitor(visitor); setVisitorName(visitor.full_name); setVisitorPhone(visitor.phone);
    setVisitorCategory(visitor.category); setVisitorNotes(visitor.notes || ''); setFreqOpen(true);
  };

  const handleToggleVisitorActive = async (id: string, currentStatus: boolean) => {
    try {
      if (isMock) { mockDb.updateFrequentVisitor(id, { is_active: !currentStatus }); toast.success('Status updated'); loadData(); }
      else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase.from('frequent_visitors').update({ is_active: !currentStatus }).eq('id', id);
          if (error) toast.error(error.message); else { toast.success('Status updated'); loadData(); }
        }
      }
    } catch { toast.error('Failed to update'); }
  };

  const handleDeleteVisitor = async (id: string) => {
    if (!confirm('Remove this trusted visitor? Their pass will be voided.')) return;
    try {
      if (isMock) { mockDb.deleteFrequentVisitor(id); toast.success('Visitor removed'); loadData(); }
      else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase.from('frequent_visitors').delete().eq('id', id);
          if (error) toast.error(error.message); else { toast.success('Visitor removed'); loadData(); }
        }
      }
    } catch { toast.error('Failed to remove'); }
  };

  const handleTriggerEmergency = async (type: 'MEDICAL' | 'SECURITY' | 'FIRE' | 'OTHER') => {
    try {
      if (isMock) { mockDb.triggerEmergencyAlert(user.id, type); toast.error(`⚠️ ${type} alert sent to gate`); }
      else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase.from('emergency_alerts').insert({ resident_id: user.id, alert_type: type, status: 'ACTIVE' });
          if (error) toast.error(error.message); else toast.error(`⚠️ ${type} alert sent to gate`);
        }
      }
      setEmergencyOpen(false);
    } catch { toast.error('Failed to send alert'); }
  };

  const resetFreqForm = () => { setVisitorName(''); setVisitorPhone(''); setVisitorCategory('OTHER'); setVisitorNotes(''); };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-[3px] border-[#4E8079] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-28">

      {/* ── Header ── */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-5">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight text-[#2A2825]">Resident Gate Dashboard</h1>
            <p className="text-xs text-[#9E9B96] font-medium">
              Welcome, {user?.user_metadata?.full_name || 'Resident'} · Managed Entry Point
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-[#E8E4DD] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.7)] text-[11px] font-bold text-[#4E8079]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#4E8079] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4E8079]" />
            </span>
            Real-Time Gate Sync Active
          </div>
        </CardContent>
      </Card>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Visitors', val: stats.total, icon: Users, accent: false },
          { label: "Today's Visits", val: stats.today, icon: Calendar, accent: false },
          {
            label: 'Pending Gate', val: stats.pending, icon: Clock,
            accent: stats.pending > 0, pulse: stats.pending > 0
          },
          { label: 'Approved Visits', val: stats.approved, icon: CheckCircle, accent: false },
        ].map((m, i) => (
          <Card key={i} className={m.pulse ? 'ring-2 ring-[#B07A3E]/25' : ''}>
            <CardContent className="flex items-center justify-between py-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E9B96]">{m.label}</span>
                <p className={`text-3xl font-black ${m.accent ? 'text-[#B07A3E]' : 'text-[#2A2825]'} ${m.pulse ? 'animate-pulse' : ''}`}>
                  {m.val}
                </p>
              </div>
              <div className={`p-3 rounded-[16px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.65)] ${m.accent ? 'bg-[#F7F0E6] text-[#B07A3E]' : 'bg-[#E8E4DD] text-[#9E9B96]'}`}>
                <m.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Gate Access Ledger ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Gate Access Ledger</CardTitle>
              <CardDescription>Live visitor log and trusted staff pre-clearance</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9E9B96]" />
              <Input
                placeholder="Search records…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
              <TabsList>
                {[
                  { id: 'pending', label: `Pending (${requests.filter(r => r.status === 'PENDING').length})` },
                  { id: 'approved', label: 'Approved' },
                  { id: 'rejected', label: 'Rejected' },
                  { id: 'history', label: 'Logs' },
                  { id: 'frequent', label: 'Trusted Staff' },
                ].map(t => (
                  <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="frequent" className="m-0">
                <Button
                  onClick={() => { setEditingVisitor(null); resetFreqForm(); setFreqOpen(true); }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Register Trusted Visitor
                </Button>
              </TabsContent>
            </div>

            {/* Request tabs */}
            {(['pending', 'approved', 'rejected', 'history'] as const).map((tabVal) => {
              const filterStatus = tabVal === 'history' ? undefined : tabVal.toUpperCase();
              const tabRequests = getFilteredRequests(filterStatus);
              return (
                <TabsContent key={tabVal} value={tabVal} className="space-y-3 focus-visible:outline-none">
                  {tabRequests.length === 0 ? (
                    <div className="text-center py-14 rounded-[20px] bg-[#E8E4DD]/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.07),inset_-2px_-2px_6px_rgba(255,255,255,0.7)]">
                      <Users className="w-7 h-7 text-[#9E9B96] mx-auto mb-2" />
                      <p className="text-xs text-[#9E9B96] font-medium">No records match this filter.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tabRequests.map((req) => (
                        <Card key={req.id} size="sm" className={req.status === 'PENDING' ? 'ring-1 ring-[#B07A3E]/20' : ''}>
                          <CardContent className="py-4 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-[#2A2825]">{req.visitor_name}</span>
                                  {getVisitorTypeBadge(req.visitor_type)}
                                </div>
                                <span className="text-[11px] text-[#6B6760] block font-medium">{req.purpose}</span>
                                <span className="text-[10px] text-[#9E9B96] flex items-center gap-1.5 font-mono">
                                  <Clock className="w-3 h-3" />
                                  {new Date(req.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              {getStatusBadge(req.status)}
                            </div>
                          </CardContent>
                          <CardFooter className="justify-between">
                            <button
                              type="button"
                              onClick={() => { setSelectedReq(req); setDetailsOpen(true); }}
                              className="text-xs font-bold text-[#4E8079] hover:opacity-70 transition-opacity"
                            >
                              Inspect Details
                            </button>
                            {req.status === 'PENDING' && (
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="destructive" onClick={() => handleAction(req.id, 'REJECTED')}>
                                  Reject
                                </Button>
                                <Button size="sm" onClick={() => handleAction(req.id, 'APPROVED')}>
                                  Approve
                                </Button>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}

            {/* Trusted Staff Tab */}
            <TabsContent value="frequent" className="space-y-3 focus-visible:outline-none">
              {getFilteredFrequentVisitors().length === 0 ? (
                <div className="text-center py-14 rounded-[20px] bg-[#E8E4DD]/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.07),inset_-2px_-2px_6px_rgba(255,255,255,0.7)]">
                  <UserCheck className="w-7 h-7 text-[#9E9B96] mx-auto mb-2" />
                  <p className="text-xs text-[#9E9B96] font-medium">No trusted visitors registered yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredFrequentVisitors().map((visitor) => (
                    <Card key={visitor.id} size="sm">
                      <CardContent className="py-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <h3 className="font-bold text-sm text-[#2A2825]">{visitor.full_name}</h3>
                            <Badge variant="secondary">{visitor.category}</Badge>
                          </div>
                          <Badge variant={visitor.is_active ? 'default' : 'outline'}>
                            {visitor.is_active ? 'Active' : 'Revoked'}
                          </Badge>
                        </div>

                        <div className="rounded-[14px] p-3 space-y-2 bg-[#E8E4DD]/60 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.07),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#9E9B96] font-medium">Phone</span>
                            <span className="font-bold text-[#2A2825] font-mono">{visitor.phone}</span>
                          </div>
                          {visitor.notes && (
                            <div className="flex justify-between text-xs">
                              <span className="text-[#9E9B96] font-medium">Schedule</span>
                              <span className="font-semibold text-[#6B6760] truncate max-w-[140px]">{visitor.notes}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-xs pt-1.5 border-t border-black/[0.05]">
                            <span className="text-[#9E9B96] font-medium">Pass Code</span>
                            <span className="font-mono text-[10px] font-bold text-[#4E8079] bg-[#F5F2EE] px-1.5 py-0.5 rounded-[6px] shadow-[1px_1px_3px_rgba(0,0,0,0.07)]">{visitor.qr_code}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="justify-between">
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" title={visitor.is_active ? 'Deactivate' : 'Activate'} onClick={() => handleToggleVisitorActive(visitor.id, visitor.is_active)}>
                            <Power className={`w-4 h-4 ${visitor.is_active ? 'text-[#4E8079]' : 'text-[#9E9B96]'}`} />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => handleEditClick(visitor)}>
                            <Edit className="w-4 h-4 text-[#6B6760]" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => handleDeleteVisitor(visitor.id)}>
                            <Trash2 className="w-4 h-4 text-[#B07A3E]" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => { setSelectedVisitor(visitor); setQrPassOpen(true); }}
                          className="flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Show Pass
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Visitor Details Dialog ── */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Visitor Entry Details</DialogTitle>
            <DialogDescription>Gate verification record breakdown</DialogDescription>
          </DialogHeader>
          {selectedReq && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between p-3 rounded-[16px] bg-[#E8E4DD]/60 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[10px] bg-[#F5F2EE] shadow-[2px_2px_5px_rgba(0,0,0,0.08),-2px_-2px_5px_rgba(255,255,255,0.9)] text-[#4E8079]">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-[#2A2825] text-sm">{selectedReq.visitor_name}</span>
                </div>
                {getVisitorTypeBadge(selectedReq.visitor_type)}
              </div>
              <div className="rounded-[16px] p-4 space-y-3 text-xs bg-[#E8E4DD]/40 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.65)]">
                {[
                  { label: 'Contact', val: selectedReq.visitor_phone, mono: true },
                  { label: 'Purpose', val: selectedReq.purpose },
                  { label: 'Vehicle', val: selectedReq.vehicle_number || 'N/A', mono: true },
                  { label: 'Visitors', val: `${selectedReq.number_of_visitors} person(s)` },
                  { label: 'Duration', val: `${selectedReq.expected_duration} minutes` },
                  { label: 'Arrived', val: new Date(selectedReq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[#9E9B96] font-medium">{item.label}</span>
                    <span className={`font-bold text-[#2A2825] ${item.mono ? 'font-mono' : ''}`}>{item.val}</span>
                  </div>
                ))}
                {selectedReq.qr_code_pass && (
                  <div className="flex justify-between items-center pt-2 border-t border-black/[0.05]">
                    <span className="text-[#9E9B96] font-medium">Access Pass</span>
                    <span className="font-mono font-black text-[#4E8079] bg-[#F5F2EE] px-2 py-0.5 rounded-[8px] shadow-[1px_1px_3px_rgba(0,0,0,0.07)]">
                      {selectedReq.qr_code_pass}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter showCloseButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Trusted Visitor Registration Dialog ── */}
      <Dialog open={freqOpen} onOpenChange={setFreqOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVisitor ? 'Edit Trusted Visitor' : 'Register Trusted Visitor'}</DialogTitle>
            <DialogDescription>Pre-cleared visitors skip manual gate verification.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveFrequentVisitor} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="vname">Full Name</Label>
              <Input id="vname" placeholder="e.g. Shanti Devi" value={visitorName} onChange={e => setVisitorName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vphone">Phone Number</Label>
              <Input id="vphone" placeholder="+91 98765 43210" value={visitorPhone} onChange={e => setVisitorPhone(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vcat">Role / Category</Label>
              <div className="rounded-[14px] overflow-hidden bg-[#E8E4DD] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.75)]">
                <select
                  id="vcat"
                  value={visitorCategory}
                  onChange={e => setVisitorCategory(e.target.value as any)}
                  className="w-full bg-transparent text-[#2A2825] text-sm font-medium px-3.5 py-2.5 outline-none cursor-pointer"
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vnotes">Schedule Notes</Label>
              <Input id="vnotes" placeholder="e.g. Daily mornings 8 AM" value={visitorNotes} onChange={e => setVisitorNotes(e.target.value)} />
            </div>
            <DialogFooter showCloseButton>
              <Button type="submit">{editingVisitor ? 'Save Changes' : 'Register Visitor'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── QR Pass Dialog ── */}
      <Dialog open={qrPassOpen} onOpenChange={setQrPassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#4E8079]" />
              Staff Access Pass
            </DialogTitle>
            <DialogDescription>Show this pass at the gate for fast-track entry.</DialogDescription>
          </DialogHeader>
          {selectedVisitor && (
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="w-full max-w-[260px] p-5 rounded-[22px] bg-[#F5F2EE] shadow-[6px_6px_14px_rgba(0,0,0,0.13),-6px_-6px_14px_rgba(255,255,255,0.85)] border border-black/[0.02] space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-sm text-[#2A2825]">{selectedVisitor.full_name}</h4>
                    <span className="text-[9px] font-bold text-[#4E8079] uppercase tracking-widest">{selectedVisitor.category}</span>
                  </div>
                  <Badge>Verified</Badge>
                </div>
                <div className="w-40 h-40 mx-auto rounded-[18px] flex items-center justify-center bg-[#E8E4DD] shadow-[inset_3px_3px_7px_rgba(0,0,0,0.1),inset_-3px_-3px_7px_rgba(255,255,255,0.7)] relative">
                  <div className="grid grid-cols-5 grid-rows-5 gap-1 w-28 h-28 opacity-75">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`rounded-[2px] ${(i % 3 === 0 || i % 7 === 0 || i < 5 || i > 20 || (i % 5 === 0 && i > 10)) ? 'bg-[#2A2825]' : 'bg-[#D0CCC5]'}`} />
                    ))}
                  </div>
                  <div className="absolute inset-0 m-auto w-10 h-10 bg-[#F5F2EE] rounded-[12px] shadow-[2px_2px_5px_rgba(0,0,0,0.1)] flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#4E8079]" />
                  </div>
                </div>
                <div className="space-y-1.5 text-xs border-t border-black/[0.05] pt-3">
                  <div className="flex justify-between">
                    <span className="text-[#9E9B96]">Unit</span>
                    <span className="font-bold text-[#2A2825]">Flat {user?.flat_number || '101'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9E9B96]">Pass Code</span>
                    <span className="font-mono font-black text-[#4E8079]">{selectedVisitor.qr_code}</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#9E9B96] text-center leading-relaxed px-4">
                Share this pass code with {selectedVisitor.full_name} for gate check-in.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>Print Pass</Button>
            <Button onClick={() => setQrPassOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Panic FAB ── */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setEmergencyOpen(true)}
          className="flex items-center gap-2.5 bg-[#F5F2EE] text-[#B07A3E] font-black px-5 py-3.5 rounded-full shadow-[4px_4px_12px_rgba(176,122,62,0.2),-4px_-4px_12px_rgba(255,255,255,0.9)] hover:shadow-[5px_5px_14px_rgba(176,122,62,0.25),-5px_-5px_14px_rgba(255,255,255,0.95)] active:shadow-[inset_3px_3px_7px_rgba(176,122,62,0.15)] border border-[#B07A3E]/10 transition-all duration-200 outline-none cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-widest font-extrabold">Trigger Panic Node</span>
        </button>

        <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[#B07A3E] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Select Emergency Type
              </DialogTitle>
              <DialogDescription>
                This immediately alerts gate staff and overrides standard access loops.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { type: 'MEDICAL', label: 'Medical Alert', icon: Activity },
                { type: 'SECURITY', label: 'Security Threat', icon: Shield },
                { type: 'FIRE', label: 'Fire Hazard', icon: Flame },
                { type: 'OTHER', label: 'Other Hazard', icon: AlertTriangle },
              ].map((em) => (
                <button
                  key={em.type}
                  type="button"
                  onClick={() => handleTriggerEmergency(em.type as any)}
                  className="flex flex-col items-center justify-center p-5 rounded-[18px] bg-[#F7F0E6] hover:bg-[#F0E6D8] shadow-[3px_3px_8px_rgba(176,122,62,0.1),-3px_-3px_8px_rgba(255,255,255,0.85)] active:shadow-[inset_2px_2px_5px_rgba(176,122,62,0.12)] text-[#B07A3E] transition-all text-xs font-bold gap-3 cursor-pointer border border-[#B07A3E]/10 outline-none"
                >
                  <em.icon className="w-7 h-7" />
                  <span>{em.label}</span>
                </button>
              ))}
            </div>
            <DialogFooter showCloseButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}