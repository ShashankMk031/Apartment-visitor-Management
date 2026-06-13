'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  UserCheck2,
  RefreshCw
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

  // Tactile color palette mappings for analytics charts
  const TYPE_COLORS = ['#4E8079', '#6E8E89', '#A18E78', '#A1584E', '#8A8276', '#BD9B6D', '#7688A1'];
  const APPROVAL_COLORS = ['#4E8079', '#A1584E'];

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
    const mockRequest = {
      resident_id: 'res-1',
      visitor_name: 'Scammer Joe',
      visitor_phone: '+919000000000',
      visitor_type: 'GUEST' as any,
      purpose: 'Unsolicited sales',
      number_of_visitors: 1,
      expected_duration: 30
    };
    
    const isBanned = mockDb.checkBlacklist(mockRequest.visitor_phone);
    if (isBanned) {
      const requestsList = mockDb.getVisitorRequests();
      requestsList.unshift({
        id: `req-banned-${Date.now()}`,
        ...mockRequest,
        purpose: `${mockRequest.purpose} (Auto-rejected: Blacklisted phone. Reason: ${isBanned.reason})`,
        status: 'REJECTED',
        created_at: new Date().toISOString()
      });
      localStorage.setItem('mock_visitor_requests', JSON.stringify(requestsList));
      
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
      case 'MEDICAL': return <Activity className="w-4 h-4 text-[#A1584E]" />;
      case 'SECURITY': return <Shield className="w-4 h-4 text-[#A1584E]" />;
      case 'FIRE': return <Flame className="w-4 h-4 text-[#A1584E]" />;
      default: return <AlertTriangle className="w-4 h-4 text-[#A1584E]" />;
    }
  };

  // Tactile Skeletons Frame
  if (skeletonLoading) {
    return (
      <div className="space-y-6 bg-[#F0EDE8] p-2 min-h-screen animate-pulse">
        <div className="h-9 bg-[#E8E4DD] border border-[#DCD6CB] rounded-xl w-1/3 shadow-sm" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#E8E4DD] border border-[#DCD6CB] rounded-2xl shadow-inner" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 h-[320px] bg-[#E8E4DD] border border-[#DCD6CB] rounded-[24px]" />
          <div className="md:col-span-4 h-[320px] bg-[#E8E4DD] border border-[#DCD6CB] rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#F0EDE8] rounded-[24px]">
        <RefreshCw className="w-8 h-8 text-[#4E8079] animate-spin" strokeWidth={1.8} />
        <span className="text-xs text-[#6E685E] font-medium mt-3 tracking-wide">Syncing Security Matrix...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F0EDE8] text-[#2A2825] font-sans antialiased selection:bg-[#4E8079]/20 selection:text-[#4E8079]">
      
      {/* Page Branding Header */}
      <div className="pb-5 border-b border-[#E0DACF]">
        <h1 className="text-2xl font-bold tracking-tight text-[#2A2825]">System Analytics Console</h1>
        <p className="text-xs text-[#6E685E] font-medium mt-0.5">Green Glen Heights • Executive management dashboard</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        {/* Soft Tactile Tab Switcher Bar */}
        <TabsList className="bg-[#E8E4DD] border border-[#F5F3F0] p-1.5 rounded-2xl w-full sm:w-auto flex overflow-x-auto gap-1 shadow-[4px_4px_10px_rgba(163,157,147,0.2),-4px_-4px_10px_rgba(255,255,255,0.7)] mb-6">
          <TabsTrigger value="overview" className="rounded-xl text-xs font-bold px-4 py-2 text-[#6E685E] data-[state=active]:bg-[#F0EDE8] data-[state=active]:text-[#2A2825] data-[state=active]:shadow-[inset_1px_1px_3px_rgba(163,157,147,0.15),2px_2px_5px_rgba(255,255,255,0.8)] border border-transparent data-[state=active]:border-[#F5F3F0] transition-all cursor-pointer">
            Overview & Analytics
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="rounded-xl text-xs font-bold px-4 py-2 text-[#6E685E] data-[state=active]:bg-[#F0EDE8] data-[state=active]:text-[#2A2825] data-[state=active]:shadow-[inset_1px_1px_3px_rgba(163,157,147,0.15),2px_2px_5px_rgba(255,255,255,0.8)] border border-transparent data-[state=active]:border-[#F5F3F0] transition-all cursor-pointer">
            Blacklist Management
          </TabsTrigger>
          <TabsTrigger value="emergencies" className="rounded-xl text-xs font-bold px-4 py-2 text-[#6E685E] data-[state=active]:bg-[#F0EDE8] data-[state=active]:text-[#2A2825] data-[state=active]:shadow-[inset_1px_1px_3px_rgba(163,157,147,0.15),2px_2px_5px_rgba(255,255,255,0.8)] border border-transparent data-[state=active]:border-[#F5F3F0] transition-all cursor-pointer flex items-center gap-2">
            Emergency Desk 
            {emergencies.filter(e => e.status === 'ACTIVE').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#A1584E] animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="demo" className="rounded-xl text-xs font-bold px-4 py-2 text-[#6E685E] data-[state=active]:bg-[#F0EDE8] data-[state=active]:text-[#2A2825] data-[state=active]:shadow-[inset_1px_1px_3px_rgba(163,157,147,0.15),2px_2px_5px_rgba(255,255,255,0.8)] border border-transparent data-[state=active]:border-[#F5F3F0] transition-all cursor-pointer">
            Demo Control Center
          </TabsTrigger>
        </TabsList>

        {/* TABS CONTENT: OVERVIEW & ANALYTICS */}
        <TabsContent value="overview" className="space-y-6 m-0 focus-visible:outline-none">
          {/* Neumorphic Metric Roster Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[22px] shadow-[6px_6px_16px_rgba(163,157,147,0.25),-6px_-6px_16px_rgba(255,255,255,0.8)] p-1">
              <CardContent className="pt-4 px-4 pb-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A8276] font-mono block">Total requests</span>
                  <p className="text-2xl font-extrabold text-[#2A2825] tracking-tight tabular-nums">{stats.totalRequests}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#F0EDE8] border border-white flex items-center justify-center shadow-sm text-[#6E685E]">
                  <Users className="w-4 h-4" strokeWidth={1.8} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[22px] shadow-[6px_6px_16px_rgba(163,157,147,0.25),-6px_-6px_16px_rgba(255,255,255,0.8)] p-1">
              <CardContent className="pt-4 px-4 pb-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A8276] font-mono block">Active On Site</span>
                  <p className="text-2xl font-extrabold text-[#4E8079] tracking-tight tabular-nums">{stats.activeVisitors}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#F0EDE8] border border-white flex items-center justify-center shadow-sm text-[#4E8079]">
                  <Building className="w-4 h-4" strokeWidth={1.8} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[22px] shadow-[6px_6px_16px_rgba(163,157,147,0.25),-6px_-6px_16px_rgba(255,255,255,0.8)] p-1">
              <CardContent className="pt-4 px-4 pb-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A8276] font-mono block">Approval Rate</span>
                  <p className="text-2xl font-extrabold text-[#6E8E89] tracking-tight tabular-nums">{stats.approvalRate}%</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#F0EDE8] border border-white flex items-center justify-center shadow-sm text-[#6E8E89]">
                  <CheckCircle className="w-4 h-4" strokeWidth={1.8} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[22px] shadow-[6px_6px_16px_rgba(163,157,147,0.25),-6px_-6px_16px_rgba(255,255,255,0.8)] p-1">
              <CardContent className="pt-4 px-4 pb-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A8276] font-mono block">Avg. Stay Est</span>
                  <p className="text-2xl font-extrabold text-[#A18E78] tracking-tight tabular-nums">{stats.averageDuration}m</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#F0EDE8] border border-white flex items-center justify-center shadow-sm text-[#A18E78]">
                  <Clock className="w-4 h-4" strokeWidth={1.8} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Core Analytics Charts Layer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Daily Volume Bar Chart */}
            <Card className="lg:col-span-8 border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.25),-8px_-8px_20px_rgba(255,255,255,0.85)] p-2">
              <CardHeader className="pt-4 px-4 pb-3">
                <CardTitle className="text-[#2A2825] font-bold text-xs tracking-wide uppercase font-mono">Daily Visitor Volume (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDailyVisitorData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DCD6CB" />
                    <XAxis dataKey="name" stroke="#8A8276" fontSize={10} className="font-mono font-medium" tickLine={false} />
                    <YAxis stroke="#8A8276" fontSize={10} className="font-mono font-medium" tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#E8E4DD', borderColor: '#DCD6CB', borderRadius: '12px', color: '#2A2825', fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="visitors" fill="#4E8079" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Approval Rate Donut Pie Chart */}
            <Card className="lg:col-span-4 border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.25),-8px_-8px_20px_rgba(255,255,255,0.85)] p-2">
              <CardHeader className="pt-4 px-4 pb-1">
                <CardTitle className="text-[#2A2825] font-bold text-xs tracking-wide uppercase font-mono">Gate Approval Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex justify-center items-center relative pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getApprovalRateData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {getApprovalRateData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={APPROVAL_COLORS[index % APPROVAL_COLORS.length]} stroke="#E8E4DD" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#E8E4DD', borderColor: '#DCD6CB', borderRadius: '12px', color: '#2A2825', fontSize: '11px' }} />
                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '600', color: '#6E685E' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none mt-[-16px]">
                  <span className="text-xl font-black text-[#4E8079] tracking-tight">{stats.approvalRate}%</span>
                  <span className="text-[8px] uppercase tracking-wider text-[#8A8276] font-bold font-mono">Approved</span>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Volume Line Chart */}
            <Card className="lg:col-span-6 border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.25),-8px_-8px_20px_rgba(255,255,255,0.85)] p-2">
              <CardHeader className="pt-4 px-4 pb-3">
                <CardTitle className="text-[#2A2825] font-bold text-xs tracking-wide uppercase font-mono">Monthly Visitor Volume (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getMonthlyVisitorData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DCD6CB" />
                    <XAxis dataKey="name" stroke="#8A8276" fontSize={10} tickLine={false} />
                    <YAxis stroke="#8A8276" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#E8E4DD', borderColor: '#DCD6CB', borderRadius: '12px', color: '#2A2825', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="requests" stroke="#6E8E89" strokeWidth={2.5} dot={{ r: 4, stroke: '#E8E4DD', strokeWidth: 1 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Visitor Type Allocation Pie Chart */}
            <Card className="lg:col-span-6 border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.25),-8px_-8px_20px_rgba(255,255,255,0.85)] p-2">
              <CardHeader className="pt-4 px-4 pb-3">
                <CardTitle className="text-[#2A2825] font-bold text-xs tracking-wide uppercase font-mono">Visitor Type Classification</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getVisitorTypeData()}
                      cx="50%"
                      cy="40%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                      dataKey="value"
                      style={{ fontSize: '10px', fill: '#4A453F', fontWeight: 'bold' }}
                    >
                      {getVisitorTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} stroke="#E8E4DD" strokeWidth={1.5} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#E8E4DD', borderColor: '#DCD6CB', borderRadius: '12px', color: '#2A2825', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Compliance & Auditing Reports Module */}
          <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.25),-8px_-8px_20px_rgba(255,255,255,0.85)] p-2 no-print">
            <CardHeader className="pt-4 px-6 pb-2">
              <CardTitle className="text-sm font-bold text-[#2A2825] flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#4E8079]" strokeWidth={2} />
                Executive Reports Module
              </CardTitle>
              <CardDescription className="text-xs text-[#6E685E]">Generate aggregated ledger arrays for digital security audits.</CardDescription>
            </CardHeader>
            
            <CardContent className="px-6 pb-4 pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              {/* Filter Selector Row */}
              <div className="flex gap-1.5 bg-[#F0EDE8] p-1 border border-[#DCD6CB] rounded-xl w-full sm:w-auto shadow-[inset_1px_1px_3px_rgba(163,157,147,0.1)]">
                {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setReportType(period)}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer capitalize ${reportType === period ? 'bg-[#4E8079] text-white shadow-sm' : 'text-[#6E685E] hover:text-[#2A2825]'}`}
                  >
                    {period} Report
                  </button>
                ))}
              </div>

              {/* Action Vectors */}
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleExportCSV}
                  className="flex-1 sm:flex-initial bg-[#F0EDE8] hover:bg-[#E8E4DD] border border-[#DCD6CB] text-[#2A2825] active:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] gap-2 rounded-xl text-xs py-5 h-10 shadow-sm transition-all cursor-pointer font-bold"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#4E8079]" strokeWidth={2} />
                  <span>Export CSV</span>
                </Button>
                <Button
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-initial bg-[#F0EDE8] hover:bg-[#E8E4DD] border border-[#DCD6CB] text-[#2A2825] active:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] gap-2 rounded-xl text-xs py-5 h-10 shadow-sm transition-all cursor-pointer font-bold"
                >
                  <FileText className="w-4 h-4 text-[#A1584E]" strokeWidth={2} />
                  <span>Print Ledger Pass</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TABS CONTENT: BLACKLIST MANAGEMENT */}
        <TabsContent value="blacklist" className="space-y-4 m-0 focus-visible:outline-none">
          <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.25),-8px_-8px_20px_rgba(255,255,255,0.85)] p-2">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 px-6 pb-4 border-b border-[#DCD6CB]/60">
              <div>
                <CardTitle className="text-sm font-bold text-[#2A2825]">Visitor Blacklist Anchor</CardTitle>
                <CardDescription className="text-xs text-[#6E685E]">Identified profiles will be rejected automatically at real-time gateway nodes.</CardDescription>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9F988F]" strokeWidth={2} />
                  <Input
                    type="text"
                    placeholder="Search banned registry..."
                    value={blacklistSearch}
                    onChange={(e) => setBlacklistSearch(e.target.value)}
                    className="bg-[#F0EDE8] border border-[#DCD6CB] text-xs pl-9 text-[#2A2825] placeholder:text-[#9F988F] rounded-xl h-9 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                  />
                </div>
                <Button 
                  onClick={() => {
                    resetBlacklistForm();
                    setBlacklistOpen(true);
                  }}
                  className="bg-[#A1584E] hover:bg-[#8D4A41] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white font-bold rounded-xl text-xs h-9 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md border border-[#BD6A5F]"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.2} />
                  Banish Visitor
                </Button>
              </div>
            </CardHeader>

            <CardContent className="px-6 pt-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DCD6CB] text-[#8A8276] font-mono uppercase tracking-wider text-[10px]">
                      <th className="py-3 font-bold">Banned Profile</th>
                      <th className="py-3 font-bold">Communication Node</th>
                      <th className="py-3 font-bold">Banishment Parameter</th>
                      <th className="py-3 font-bold">Registry Date</th>
                      <th className="py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCD6CB]/40 text-[#4A453F] font-medium">
                    {getFilteredBlacklist().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#8A8276]">
                          <UserX className="w-8 h-8 text-[#BCB5AB] mx-auto mb-2" strokeWidth={1.5} />
                          No blacklisted arrays initialized in this database block.
                        </td>
                      </tr>
                    ) : (
                      getFilteredBlacklist().map((b) => (
                        <tr key={b.id} className="hover:bg-[#F0EDE8]/40 transition-colors">
                          <td className="py-3.5 font-bold text-[#2A2825]">{b.full_name}</td>
                          <td className="py-3.5 font-mono text-[#5C564F]">{b.phone}</td>
                          <td className="py-3.5 text-[#6E685E] leading-normal max-w-[220px] truncate" title={b.reason}>
                            {b.reason}
                          </td>
                          <td className="py-3.5 text-[#8A8276] font-mono">
                            {new Date(b.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                          </td>
                          <td className="py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveBlacklist(b.id)}
                              className="text-[#4E8079] hover:text-[#3F6B65] hover:bg-[#4E8079]/10 h-8 rounded-lg cursor-pointer font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" strokeWidth={2} />
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
        <TabsContent value="emergencies" className="space-y-4 m-0 focus-visible:outline-none">
          <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.25),-8px_-8px_20px_rgba(255,255,255,0.85)] p-2">
            <CardHeader className="flex justify-between items-start pt-4 px-6 pb-3 border-b border-[#DCD6CB]/60">
              <div>
                <CardTitle className="text-sm font-bold text-[#2A2825] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#A1584E]" strokeWidth={2} />
                  Emergency Security Desk
                </CardTitle>
                <CardDescription className="text-xs text-[#6E685E]">Urgent live distress beacons dispatched directly by structural tenants.</CardDescription>
              </div>
              <Badge className="bg-[#A1584E]/10 text-[#A1584E] border border-[#A1584E]/20 text-[9px] font-bold tracking-wider font-mono">MONITORED</Badge>
            </CardHeader>

            <CardContent className="px-6 pt-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DCD6CB] text-[#8A8276] font-mono uppercase tracking-wider text-[10px]">
                      <th className="py-3 font-bold">Location (Flat)</th>
                      <th className="py-3 font-bold">Resident Token</th>
                      <th className="py-3 font-bold">Emergency Vector</th>
                      <th className="py-3 font-bold">Triggered Realtime</th>
                      <th className="py-3 font-bold">State</th>
                      <th className="py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCD6CB]/40 text-[#4A453F] font-medium">
                    {emergencies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#8A8276]">
                          <CheckCircle className="w-8 h-8 text-[#BCB5AB] mx-auto mb-2" strokeWidth={1.5} />
                          All gateway subsystems operate within baseline vectors. No triggers logged.
                        </td>
                      </tr>
                    ) : (
                      emergencies.map((e) => {
                        const res = residents.find(r => r.id === e.resident_id);
                        return (
                          <tr key={e.id} className={`hover:bg-[#F0EDE8]/30 transition-colors ${e.status === 'ACTIVE' ? 'bg-[#A1584E]/5' : ''}`}>
                            <td className="py-4 font-bold text-[#2A2825]">Flat {res?.flat_number || '101'}</td>
                            <td className="py-4 font-medium text-[#5C564F]">{res?.full_name || 'Resident'}</td>
                            <td className="py-4">
                              <span className="flex items-center gap-1.5 uppercase text-[10px] text-[#A1584E] font-bold tracking-wider font-mono">
                                {getEmergencyIcon(e.alert_type)}
                                {e.alert_type}
                              </span>
                            </td>
                            <td className="py-4 text-[#6E685E] font-mono">
                              {new Date(e.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="py-4">
                              {e.status === 'ACTIVE' ? (
                                <Badge className="bg-[#A1584E] text-white border-none text-[9px] font-extrabold uppercase animate-pulse px-2 py-0.5 rounded-md shadow-sm">ACTIVE</Badge>
                              ) : (
                                <Badge className="bg-[#DCD6CB] text-[#6E685E] border-none text-[9px] font-bold px-2 py-0.5 rounded-md">RESOLVED</Badge>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              {e.status === 'ACTIVE' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleResolveEmergencyAdmin(e.id)}
                                  className="bg-[#4E8079] hover:bg-[#3F6B65] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white font-bold text-xs py-1 px-3 rounded-lg cursor-pointer border border-[#6BA199] shadow-sm"
                                >
                                  Resolve Alert
                                </Button>
                              ) : (
                                <span className="text-[10px] text-[#8A8276] font-mono italic">Archived</span>
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
        <TabsContent value="demo" className="space-y-6 m-0 focus-visible:outline-none">
          {/* Quick Roster Counts Subgrid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Apartments', value: demoStats.apartments, icon: <Building className="w-4 h-4 text-[#6E685E]" /> },
              { label: 'Residents Registered', value: demoStats.residents, icon: <Users className="w-4 h-4 text-[#6E685E]" /> },
              { label: 'Active Guards', value: demoStats.guards, icon: <UserCheck2 className="w-4 h-4 text-[#6E685E]" /> },
              { label: 'Total Visits Logged', value: demoStats.visitors, icon: <TrendingUp className="w-4 h-4 text-[#6E685E]" /> },
            ].map((d, index) => (
              <Card key={index} className="bg-[#F0EDE8] border border-[#DCD6CB] rounded-xl shadow-[inset_1px_1px_4px_rgba(163,157,147,0.12)] p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A8276] font-mono block">{d.label}</span>
                    <p className="text-xl font-black text-[#2A2825] tracking-tight tabular-nums">{d.value}</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#E8E4DD] border border-white flex items-center justify-center shadow-xs">
                    {d.icon}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interactive Demo Sandbox Operations */}
            <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.25),-8px_-8px_20px_rgba(255,255,255,0.85)] p-2">
              <CardHeader className="pt-4 px-6 pb-2">
                <CardTitle className="text-xs font-bold text-[#2A2825] tracking-wide uppercase font-mono">Interactive Sandbox Triggers</CardTitle>
                <CardDescription className="text-xs text-[#6E685E]">Inject immediate simulated events safely into the Mock operational matrix layer.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-4 pt-2 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleSimulateEmergencyDemo}
                    className="flex-1 bg-[#F0EDE8] text-[#A1584E] hover:bg-[#E8E4DD] border border-[#DCD6CB] font-bold rounded-xl text-xs py-5 h-11 transition-all cursor-pointer shadow-xs"
                  >
                    <ShieldAlert className="w-4 h-4 mr-2" strokeWidth={2} />
                    Trigger Security Threat
                  </Button>
                  <Button 
                    onClick={handleSimulateBlacklistAttempt}
                    className="flex-1 bg-[#F0EDE8] text-[#A1584E] hover:bg-[#E8E4DD] border border-[#DCD6CB] font-bold rounded-xl text-xs py-5 h-11 transition-all cursor-pointer shadow-xs"
                  >
                    <UserX className="w-4 h-4 mr-2" strokeWidth={2} />
                    Attempt Blacklisted Entry
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleTriggerSkeletonDemo}
                    className="flex-1 bg-[#4E8079] hover:bg-[#3F6B65] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white font-bold rounded-xl text-xs py-5 h-11 transition-all cursor-pointer shadow-md border border-[#6BA199]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" strokeWidth={2} />
                    Simulate Loading Skeletons
                  </Button>
                  <Button 
                    onClick={handleResetLocalStorage}
                    className="flex-1 bg-[#F0EDE8] text-[#5C564F] hover:bg-[#DCD6CB]/80 border border-[#DCD6CB] font-bold rounded-xl text-xs py-5 h-11 transition-all cursor-pointer shadow-xs"
                  >
                    <Database className="w-4 h-4 mr-2" strokeWidth={2} />
                    Reset Mock Database
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tactical System Documentation Deck */}
            <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.25),-8px_-8px_20px_rgba(255,255,255,0.85)] p-2">
              <CardHeader className="pt-4 px-6 pb-2">
                <CardTitle className="text-xs font-bold text-[#2A2825] tracking-wide uppercase font-mono">Demo Framework Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-4 pt-2 text-xs text-[#5C564F] space-y-4 font-medium leading-relaxed">
                <div className="flex gap-2.5 items-start">
                  <HelpCircle className="w-4 h-4 text-[#4E8079] shrink-0 mt-0.5" strokeWidth={2.2} />
                  <p>
                    <strong>Distress Broadcast Simulator</strong>: Triggering a security alert instantiates a priority flag visible globally to physical guards on terminal access viewports. Dismiss via the resolving console row button.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <HelpCircle className="w-4 h-4 text-[#6E8E89] shrink-0 mt-0.5" strokeWidth={2.2} />
                  <p>
                    <strong>Automated Gate Enforcer Check</strong>: Emulates an entry query originating from a banned terminal phone index. The local middleware intercepts the connection packet and records a rejected pass log.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOG: TACTILE NEUMORPHIC BLACKLIST POPUP MODAL */}
      <Dialog open={blacklistOpen} onOpenChange={setBlacklistOpen}>
        <DialogContent className="bg-[#E8E4DD] border border-[#F5F3F0] text-[#2A2825] max-w-sm rounded-[28px] shadow-[12px_12px_36px_rgba(0,0,0,0.15),-12px_-12px_36px_rgba(255,255,255,0.9)] p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-[#2A2825] font-bold flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-lg bg-[#F0EDE8] border border-white flex items-center justify-center shadow-xs">
                <UserX className="w-4 h-4 text-[#A1584E]" strokeWidth={2} />
              </div>
              Blacklist Visitor Profile
            </DialogTitle>
            <DialogDescription className="text-[#6E685E] text-xs pt-0.5">
              Profiles registered here are isolated from establishing secure gate passes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBlacklist} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider block font-mono pl-0.5">Visitor Full Name</label>
              <Input
                type="text"
                placeholder="e.g. Scammer Joe"
                value={blackName}
                onChange={(e) => setBlackName(e.target.value)}
                className="bg-[#F0EDE8] border border-[#DCD6CB] text-[#2A2825] placeholder:text-[#9F988F] text-xs rounded-xl py-4 h-10 px-3.5 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#A1584E]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider block font-mono pl-0.5">Phone Number Index</label>
              <Input
                type="text"
                placeholder="e.g. +919000000000"
                value={blackPhone}
                onChange={(e) => setBlackPhone(e.target.value)}
                className="bg-[#F0EDE8] border border-[#DCD6CB] text-xs text-[#2A2825] placeholder:text-[#9F988F] font-mono rounded-xl py-4 h-10 px-3.5 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#A1584E]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider block font-mono pl-0.5">Reason for Banishment</label>
              <Input
                type="text"
                placeholder="e.g. Trespassing parameter violation"
                value={blackReason}
                onChange={(e) => setBlackReason(e.target.value)}
                className="bg-[#F0EDE8] border border-[#DCD6CB] text-xs text-[#2A2825] placeholder:text-[#9F988F] rounded-xl py-4 h-10 px-3.5 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#A1584E]"
                required
              />
            </div>

            <DialogFooter className="mt-6 flex gap-3 sm:space-x-0">
              <Button 
                type="button" 
                onClick={() => setBlacklistOpen(false)}
                className="w-1/2 bg-[#F0EDE8] hover:bg-[#DCD6CB]/60 text-[#5C564F] font-bold border border-[#DCD6CB] text-xs h-10 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-1/2 bg-[#A1584E] hover:bg-[#8D4A41] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white font-bold text-xs h-10 rounded-xl border border-[#BD6A5F] shadow-sm cursor-pointer"
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