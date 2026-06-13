'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Users, 
  ShieldAlert, 
  CalendarDays, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building,
  FileSpreadsheet,
  FileText,
  UserX,
  Trash2,
  Plus,
  Search,
  Sparkles,
  Database,
  Flame,
  Activity,
  AlertTriangle,
  Shield,
  HelpCircle,
  TrendingUp,
  UserCheck2
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, VisitorRequest, VisitorEntry, Resident } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

  // Blacklist state
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [blackName, setBlackName] = useState('');
  const [blackPhone, setBlackPhone] = useState('');
  const [blackReason, setBlackReason] = useState('');

  // Emergency state
  const [emergencies, setEmergencies] = useState<any[]>([]);

  // Demo Counts state
  const [demoStats, setDemoStats] = useState({
    apartments: 0,
    residents: 0,
    guards: 0,
    visitors: 0
  });

  // Skeletal loading state simulation
  const [skeletonLoading, setSkeletonLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeVisitors: 0,
    approvalRate: 0,
    averageDuration: 0
  });

  // Report Type Selection
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const loadData = async () => {
    try {
      if (!hasSupabaseCreds()) {
        const current = mockDb.getCurrentUser();
        if (current) setUser(current);

        const allReqs = mockDb.getVisitorRequests();
        const allEntries = mockDb.getVisitorEntries();
        const resList = mockDb.getResidents();
        setRequests(allReqs);
        setEntries(allEntries);
        setResidents(resList);
        calculateStats(allReqs, allEntries);

        // Fetch Blacklist
        const bl = mockDb.getBlacklist();
        setBlacklist(bl);

        // Fetch Emergency Alerts
        const em = mockDb.getEmergencyAlerts();
        setEmergencies(em);

        // Fetch Demo counts
        const apts = 1;
        const res = resList.length;
        const guards = mockDb.getGuards().length;
        const visitors = allReqs.length;
        setDemoStats({ apartments: apts, residents: res, guards, visitors });
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

          const { data: reqs } = await supabase.from('visitor_requests').select('*');
          const { data: ents } = await supabase.from('visitor_entries').select('*');
          const { data: res } = await supabase.from('residents').select('*');
          if (reqs) setRequests(reqs);
          if (ents) setEntries(ents);
          if (res) setResidents(res);
          if (reqs && ents) calculateStats(reqs, ents);

          // Fetch blacklist
          const { data: bl } = await supabase.from('blacklisted_visitors').select('*');
          if (bl) setBlacklist(bl);

          // Fetch alerts
          const { data: em } = await supabase.from('emergency_alerts').select('*');
          if (em) setEmergencies(em);

          // Fetch demo counts
          const { count: apts } = await supabase.from('apartments').select('*', { count: 'exact', head: true });
          const { count: resCount } = await supabase.from('residents').select('*', { count: 'exact', head: true });
          const { count: guardsCount } = await supabase.from('security_guards').select('*', { count: 'exact', head: true });
          setDemoStats({ 
            apartments: apts || 0, 
            residents: resCount || 0, 
            guards: guardsCount || 0, 
            visitors: reqs?.length || 0 
          });
        }
      }
    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMock(!hasSupabaseCreds());
    loadData();
  }, []);

  const calculateStats = (reqs: VisitorRequest[], ents: VisitorEntry[]) => {
    const totalRequests = reqs.length;
    const activeVisitors = ents.filter(e => !e.exit_time).length;
    
    // Approval rate
    const approved = reqs.filter(r => r.status === 'APPROVED').length;
    const rejected = reqs.filter(r => r.status === 'REJECTED').length;
    const totalDecided = approved + rejected;
    const approvalRate = totalDecided > 0 ? Math.round((approved / totalDecided) * 100) : 0;

    // Average duration (estimated duration in minutes)
    const avgDuration = reqs.length > 0 
      ? Math.round(reqs.reduce((acc, curr) => acc + curr.expected_duration, 0) / reqs.length)
      : 0;

    setStats({
      totalRequests,
      activeVisitors,
      approvalRate,
      averageDuration: avgDuration
    });
  };

  // 1. Chart Data: Daily Visitor Volume (Last 7 Days)
  const getDailyVisitorData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap: { [key: string]: number } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dataMap[days[d.getDay()]] = 0;
    }

    requests.forEach(r => {
      const day = days[new Date(r.created_at).getDay()];
      if (day in dataMap) {
        dataMap[day]++;
      }
    });

    return Object.keys(dataMap).map(key => ({
      name: key,
      visitors: dataMap[key]
    }));
  };

  // 2. Chart Data: Monthly Visitor Volume (Last 6 Months)
  const getMonthlyVisitorData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataMap: { [key: string]: number } = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      dataMap[months[d.getMonth()]] = 0;
    }

    requests.forEach(r => {
      const m = months[new Date(r.created_at).getMonth()];
      if (m in dataMap) {
        dataMap[m]++;
      }
    });

    return Object.keys(dataMap).map(key => ({
      name: key,
      requests: dataMap[key]
    }));
  };

  // 3. Chart Data: Visitor Types
  const getVisitorTypeData = () => {
    const counts: { [key: string]: number } = {};
    requests.forEach(r => {
      counts[r.visitor_type] = (counts[r.visitor_type] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  };

  // 4. Chart Data: Approval Rate
  const getApprovalRateData = () => {
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED').length;
    return [
      { name: 'Approved', value: approved },
      { name: 'Rejected', value: rejected }
    ];
  };

  const TYPE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#a855f7', '#3b82f6', '#ec4899', '#64748b'];
  const APPROVAL_COLORS = ['#10b981', '#f43f5e'];

  // Reports Exporter
  const handleExportCSV = () => {
    try {
      const filtered = requests.filter(r => {
        const diffDays = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (reportType === 'daily') return diffDays <= 1;
        if (reportType === 'weekly') return diffDays <= 7;
        return diffDays <= 30;
      });

      if (filtered.length === 0) {
        toast.error('No records found for the selected period');
        return;
      }

      // Generate CSV
      const headers = ['Request ID', 'Visitor Name', 'Phone', 'Type', 'Purpose', 'Status', 'Date'];
      const rows = filtered.map(r => [
        r.id,
        `"${r.visitor_name}"`,
        r.visitor_phone,
        r.visitor_type,
        `"${r.purpose}"`,
        r.status,
        new Date(r.created_at).toLocaleDateString()
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `gatekeeper-report-${reportType}-${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV Report exported successfully');
    } catch (e) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = () => {
    toast.success('PDF Report generated! Opening system print dialog...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Blacklist operations
  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blackName || !blackPhone || !blackReason) {
      toast.error('All fields are required');
      return;
    }
    try {
      if (isMock) {
        mockDb.addBlacklistedVisitor({
          full_name: blackName,
          phone: blackPhone,
          reason: blackReason,
          created_by: user?.id || 'admin-id'
        });
        toast.success('Visitor blacklisted successfully');
        setBlacklistOpen(false);
        resetBlacklistForm();
        loadData();
      } else {
        const supabase = createClient();
        if (supabase && user) {
          const { error } = await supabase
            .from('blacklisted_visitors')
            .insert({
              full_name: blackName,
              phone: blackPhone,
              reason: blackReason,
              created_by: user.id
            });
          if (error) toast.error(error.message);
          else {
            toast.success('Visitor blacklisted successfully');
            setBlacklistOpen(false);
            resetBlacklistForm();
            loadData();
          }
        }
      }
    } catch (err) {
      toast.error('Failed to blacklist visitor');
    }
  };

  const handleRemoveBlacklist = async (id: string) => {
    if (!confirm('Are you sure you want to remove this visitor from the blacklist?')) return;
    try {
      if (isMock) {
        mockDb.removeBlacklistedVisitor(id, user?.id || 'admin-id');
        toast.success('Visitor removed from blacklist');
        loadData();
      } else {
        const supabase = createClient();
        if (supabase && user) {
          const { error } = await supabase
            .from('blacklisted_visitors')
            .delete()
            .eq('id', id);
          if (error) toast.error(error.message);
          else {
            toast.success('Visitor removed from blacklist');
            loadData();
          }
        }
      }
    } catch (e) {
      toast.error('Failed to update blacklist');
    }
  };

  const handleResolveEmergencyAdmin = async (id: string) => {
    try {
      if (isMock) {
        mockDb.resolveEmergencyAlert(id, user?.id || 'admin-id');
        toast.success('Emergency alert resolved successfully');
        loadData();
      } else {
        const supabase = createClient();
        if (supabase && user) {
          const { error } = await supabase
            .from('emergency_alerts')
            .update({ status: 'RESOLVED', resolved_by: user.id, resolved_at: new Date().toISOString() })
            .eq('id', id);
          if (error) toast.error(error.message);
          else {
            toast.success('Emergency alert resolved');
            loadData();
          }
        }
      }
    } catch (e) {
      toast.error('Failed to resolve alert');
    }
  };

  const handleTriggerSkeletonDemo = () => {
    setSkeletonLoading(true);
    setTimeout(() => {
      setSkeletonLoading(false);
      toast.success('Overview metrics populated successfully');
    }, 1500);
  };

  const handleResetLocalStorage = () => {
    if (!confirm('Reset local mock database to default seeded data? This deletes custom requests and custom profiles.')) return;
    localStorage.clear();
    toast.success('Mock LocalStorage database cleared. Reloading page...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSimulateEmergencyDemo = () => {
    mockDb.triggerEmergencyAlert('res-1', 'SECURITY');
    toast.error('⚠️ DEMO: Security Threat alert triggered at Flat 101!');
    loadData();
  };

  const handleSimulateBlacklistAttempt = () => {
    // Attempt gate request by a blacklisted visitor
    const mockRequest = {
      resident_id: 'res-1',
      visitor_name: 'Scammer Joe',
      visitor_phone: '+919000000000',
      visitor_type: 'GUEST' as any,
      purpose: 'Unsolicited sales',
      number_of_visitors: 1,
      expected_duration: 30
    };
    
    // Validate blacklist check
    const isBanned = mockDb.checkBlacklist(mockRequest.visitor_phone);
    if (isBanned) {
      // Create rejected request to simulate blocker
      const requestsList = mockDb.getVisitorRequests();
      requestsList.unshift({
        id: `req-banned-${Date.now()}`,
        ...mockRequest,
        purpose: `${mockRequest.purpose} (Auto-rejected: Blacklisted phone. Reason: ${isBanned.reason})`,
        status: 'REJECTED',
        created_at: new Date().toISOString()
      });
      localStorage.setItem('mock_visitor_requests', JSON.stringify(requestsList));
      
      // Log audit
      const logs = mockDb.getAuditLogs();
      logs.unshift({
        id: `log-${Date.now()}`,
        actor_id: 'admin-id',
        actor_name: 'System Security',
        action_type: 'ADMIN_ACTION',
        description: `❌ BLOCKED CHECKIN: Blacklisted visitor Scammer Joe attempted entry for Flat 101`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('mock_audit_logs', JSON.stringify(logs));
      
      toast.error('❌ DEMO: Blacklisted entry attempt blocked at the gate! Audit log recorded.');
      loadData();
    }
  };

  const resetBlacklistForm = () => {
    setBlackName('');
    setBlackPhone('');
    setBlackReason('');
  };

  const getFilteredBlacklist = () => {
    if (!blacklistSearch) return blacklist;
    const q = blacklistSearch.toLowerCase();
    return blacklist.filter(
      b => 
        b.full_name.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        b.reason.toLowerCase().includes(q)
    );
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'MEDICAL': return <Activity className="w-4 h-4 text-rose-400" />;
      case 'SECURITY': return <Shield className="w-4 h-4 text-rose-400" />;
      case 'FIRE': return <Flame className="w-4 h-4 text-rose-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  if (skeletonLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-900 rounded-lg w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-900 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 h-[300px] bg-slate-900 rounded-2xl" />
          <div className="md:col-span-4 h-[300px] bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">System Analytics Console</h1>
          <p className="text-sm text-slate-400">Green Glen Heights • Executive management dashboard</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-950 border border-slate-850 p-1 rounded-xl w-full sm:w-auto overflow-x-auto mb-6">
          <TabsTrigger value="overview" className="rounded-lg text-xs cursor-pointer">Overview & Analytics</TabsTrigger>
          <TabsTrigger value="blacklist" className="rounded-lg text-xs cursor-pointer">Blacklist Management</TabsTrigger>
          <TabsTrigger value="emergencies" className="rounded-lg text-xs cursor-pointer flex items-center gap-1">
            Emergency Desk 
            {emergencies.filter(e => e.status === 'ACTIVE').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </TabsTrigger>
          <TabsTrigger value="demo" className="rounded-lg text-xs cursor-pointer">Demo Control Center</TabsTrigger>
        </TabsList>

        {/* TABS CONTENT: OVERVIEW & ANALYTICS */}
        <TabsContent value="overview" className="space-y-6 m-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/40 border-slate-800 shadow-md">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total requests</span>
                  <p className="text-2xl font-extrabold">{stats.totalRequests}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400">
                  <Users className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800 shadow-md">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active On Site</span>
                  <p className="text-2xl font-extrabold text-emerald-400">{stats.activeVisitors}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Building className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800 shadow-md">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approval Rate</span>
                  <p className="text-2xl font-extrabold text-indigo-400">{stats.approvalRate}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800 shadow-md">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg. Stay Est</span>
                  <p className="text-2xl font-extrabold text-amber-400">{stats.averageDuration}m</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Roster */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Daily Volume Bar Chart */}
            <Card className="lg:col-span-8 bg-slate-900/40 border-slate-800 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-200 text-sm">Daily Visitor Volume (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDailyVisitorData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Bar dataKey="visitors" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Approval Rate Pie Chart */}
            <Card className="lg:col-span-4 bg-slate-900/40 border-slate-800 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-200 text-sm">Gate Approval Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex justify-center items-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getApprovalRateData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getApprovalRateData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={APPROVAL_COLORS[index % APPROVAL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-indigo-400">{stats.approvalRate}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-550 font-bold">Approved</span>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Volume Line Chart */}
            <Card className="lg:col-span-6 bg-slate-900/40 border-slate-800 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-200 text-sm">Monthly Visitor Volume (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getMonthlyVisitorData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Line type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Visitor Type Pie Chart */}
            <Card className="lg:col-span-6 bg-slate-900/40 border-slate-800 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-200 text-sm">Visitor Type Classification</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getVisitorTypeData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                      dataKey="value"
                      style={{ fontSize: '10px', fill: '#cbd5e1', fontWeight: 'bold' }}
                    >
                      {getVisitorTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Reports Module */}
          <Card className="bg-slate-900/40 border-slate-800 shadow-md no-print">
            <CardHeader>
              <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                Executive Reports Module
              </CardTitle>
              <CardDescription className="text-xs text-slate-550">Generate aggregated reports for compliance and auditing</CardDescription>
            </CardHeader>
            
            <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex gap-2 bg-slate-950 p-1.5 border border-slate-850 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setReportType('daily')}
                  className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${reportType === 'daily' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Daily Report
                </button>
                <button
                  onClick={() => setReportType('weekly')}
                  className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${reportType === 'weekly' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Weekly Report
                </button>
                <button
                  onClick={() => setReportType('monthly')}
                  className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${reportType === 'monthly' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Monthly Report
                </button>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleExportCSV}
                  className="flex-1 sm:flex-initial bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 gap-2 rounded-xl text-xs py-5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export CSV</span>
                </Button>
                <Button
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-initial bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 gap-2 rounded-xl text-xs py-5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Export PDF</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TABS CONTENT: BLACKLIST MANAGEMENT */}
        <TabsContent value="blacklist" className="space-y-4 m-0">
          <Card className="bg-slate-900/40 border-slate-800 shadow-md">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
              <div>
                <CardTitle className="text-slate-200 text-sm">Visitor Blacklist</CardTitle>
                <CardDescription className="text-xs text-slate-550">Banned visitors will be automatically blocked at gate check-in</CardDescription>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-2.5 top-3 w-4 h-4 text-slate-655" />
                  <Input
                    type="text"
                    placeholder="Search blacklist..."
                    value={blacklistSearch}
                    onChange={(e) => setBlacklistSearch(e.target.value)}
                    className="bg-slate-950 border-slate-850 text-xs pl-9 text-slate-100 focus-visible:ring-emerald-500"
                  />
                </div>
                <Button 
                  onClick={() => {
                    resetBlacklistForm();
                    setBlacklistOpen(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Banish Visitor
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="py-3 font-semibold">Banned Visitor</th>
                      <th className="py-3 font-semibold">Phone Number</th>
                      <th className="py-3 font-semibold">Reason for Blacklist</th>
                      <th className="py-3 font-semibold">Created Date</th>
                      <th className="py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-350">
                    {getFilteredBlacklist().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          <UserX className="w-8 h-8 text-slate-750 mx-auto mb-2" />
                          No blacklisted visitors logged
                        </td>
                      </tr>
                    ) : (
                      getFilteredBlacklist().map((b) => (
                        <tr key={b.id} className="hover:bg-slate-905/20">
                          <td className="py-3.5 font-bold text-slate-200">{b.full_name}</td>
                          <td className="py-3.5 font-mono">{b.phone}</td>
                          <td className="py-3.5 text-slate-400 leading-normal max-w-[200px] truncate" title={b.reason}>
                            {b.reason}
                          </td>
                          <td className="py-3.5 text-slate-500">
                            {new Date(b.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                          </td>
                          <td className="py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveBlacklist(b.id)}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Pardon
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
        </TabsContent>

        {/* TABS CONTENT: EMERGENCY DESK */}
        <TabsContent value="emergencies" className="space-y-4 m-0">
          <Card className="bg-slate-900/40 border-slate-800 shadow-md">
            <CardHeader className="flex justify-between items-start pb-3 border-b border-slate-900">
              <div>
                <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  Emergency Security Desk
                </CardTitle>
                <CardDescription className="text-xs text-slate-550">Urgent emergency broadcasts generated by residents</CardDescription>
              </div>
              <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">MONITORED</Badge>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-550">
                      <th className="py-3 font-semibold">Location (Flat)</th>
                      <th className="py-3 font-semibold">Resident</th>
                      <th className="py-3 font-semibold">Emergency Type</th>
                      <th className="py-3 font-semibold">Triggered At</th>
                      <th className="py-3 font-semibold">Status</th>
                      <th className="py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-350">
                    {emergencies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <CheckCircle className="w-8 h-8 text-slate-750 mx-auto mb-2" />
                          No emergency alerts triggered
                        </td>
                      </tr>
                    ) : (
                      emergencies.map((e) => {
                        const res = residents.find(r => r.id === e.resident_id);
                        return (
                          <tr key={e.id} className={`hover:bg-slate-905/20 ${e.status === 'ACTIVE' ? 'bg-rose-500/5' : ''}`}>
                            <td className="py-4 font-bold text-slate-200">Flat {res?.flat_number || '101'}</td>
                            <td className="py-4">{res?.full_name || 'Resident'}</td>
                            <td className="py-4 font-bold">
                              <span className="flex items-center gap-1.5 uppercase text-[10px] text-rose-400 tracking-wider">
                                {getEmergencyIcon(e.alert_type)}
                                {e.alert_type}
                              </span>
                            </td>
                            <td className="py-4 text-slate-500">
                              {new Date(e.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="py-4">
                              {e.status === 'ACTIVE' ? (
                                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-extrabold uppercase animate-pulse">ACTIVE</Badge>
                              ) : (
                                <Badge className="bg-slate-800 text-slate-400 border-none text-[9px] font-bold">RESOLVED</Badge>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              {e.status === 'ACTIVE' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleResolveEmergencyAdmin(e.id)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-1 px-2.5 rounded-lg cursor-pointer"
                                >
                                  Resolve Alert
                                </Button>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Resolved</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TABS CONTENT: DEMO CONTROL CENTER */}
        <TabsContent value="demo" className="space-y-6 m-0">
          {/* Quick Roster counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/40 border-slate-800 shadow-md">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Apartments</span>
                  <p className="text-xl font-black text-slate-200">{demoStats.apartments}</p>
                </div>
                <Building className="w-5 h-5 text-slate-500" />
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/40 border-slate-800 shadow-md">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Residents</span>
                  <p className="text-xl font-black text-slate-200">{demoStats.residents}</p>
                </div>
                <Users className="w-5 h-5 text-slate-500" />
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800 shadow-md">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Active Guards</span>
                  <p className="text-xl font-black text-slate-200">{demoStats.guards}</p>
                </div>
                <UserCheck2 className="w-5 h-5 text-slate-500" />
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800 shadow-md">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total Visits Logged</span>
                  <p className="text-xl font-black text-slate-200">{demoStats.visitors}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-slate-500" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interactive Demo Triggers */}
            <Card className="bg-slate-900/40 border-slate-800 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-200 text-sm">Interactive Sandbox Triggers</CardTitle>
                <CardDescription className="text-xs text-slate-550">Simulate backend events instantly in Mock Mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleSimulateEmergencyDemo}
                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold rounded-xl text-xs py-5 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Trigger Security Threat
                  </Button>
                  <Button 
                    onClick={handleSimulateBlacklistAttempt}
                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold rounded-xl text-xs py-5 cursor-pointer"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Attempt Blacklisted Entry
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleTriggerSkeletonDemo}
                    className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold rounded-xl text-xs py-5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Simulate Loading Skeletons
                  </Button>
                  <Button 
                    onClick={handleResetLocalStorage}
                    className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs py-5 cursor-pointer"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Reset Mock Database
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Demo System Guide */}
            <Card className="bg-slate-900/40 border-slate-800 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-200 text-sm">Demo Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400 space-y-3 leading-relaxed">
                <div className="flex gap-2.5">
                  <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <p>
                    **How to test emergencies**: Click the "Trigger Security Threat" button. You will instantly see a red emergency banner flash at the top of the dashboard shell (and on the Guard Dashboard!). Click "Resolve Alert" to dismiss.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    **How to test blacklist**: Click "Attempt Blacklisted Entry". The system simulates a guest named "Scammer Joe" (+919000000000) checking in. Since Joe is on the blacklist, the gate portal blocks his entry attempt.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* BLACKLIST ADD DIALOG */}
      <Dialog open={blacklistOpen} onOpenChange={setBlacklistOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-150 flex items-center gap-2 text-rose-500">
              <UserX className="w-5 h-5" />
              Blacklist Visitor Profile
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Blacklisted visitors are blocked from creating gate entry passes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBlacklist} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Visitor Full Name</label>
              <Input
                type="text"
                placeholder="e.g. Scammer Joe"
                value={blackName}
                onChange={(e) => setBlackName(e.target.value)}
                className="bg-slate-950 border-slate-850 text-xs text-slate-100 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Phone Number</label>
              <Input
                type="text"
                placeholder="e.g. +919000000000"
                value={blackPhone}
                onChange={(e) => setBlackPhone(e.target.value)}
                className="bg-slate-950 border-slate-850 text-xs text-slate-100 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Reason for Banishment</label>
              <Input
                type="text"
                placeholder="e.g. Trespassing, bad behavior"
                value={blackReason}
                onChange={(e) => setBlackReason(e.target.value)}
                className="bg-slate-950 border-slate-850 text-xs text-slate-100 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                required
              />
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <Button 
                type="button" 
                onClick={() => setBlacklistOpen(false)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-xs py-3"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-1/2 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold text-xs py-3 cursor-pointer"
              >
                Banish Visitor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
