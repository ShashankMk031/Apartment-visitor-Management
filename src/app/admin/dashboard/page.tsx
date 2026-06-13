'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ShieldAlert, 
  CalendarDays, 
  CheckCircle, 
  XCircle, 
  FileDown, 
  Clock, 
  Building,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, VisitorRequest, VisitorEntry } from '@/lib/supabase/mockDb';
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

export default function AdminDashboard() {
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

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
        const allReqs = mockDb.getVisitorRequests();
        const allEntries = mockDb.getVisitorEntries();
        setRequests(allReqs);
        setEntries(allEntries);
        calculateStats(allReqs, allEntries);
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data: reqs } = await supabase.from('visitor_requests').select('*');
          const { data: ents } = await supabase.from('visitor_entries').select('*');
          if (reqs) setRequests(reqs);
          if (ents) setEntries(ents);
          if (reqs && ents) calculateStats(reqs, ents);
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
    // Standard simulation of PDF trigger via window.print or layout toggle
    toast.success('PDF Report generated! Opening system print dialog...');
    setTimeout(() => {
      window.print();
    }, 500);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Analytics Console</h1>
        <p className="text-sm text-slate-400">Green Glen Heights • Executive management dashboard</p>
      </div>

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
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Approved</span>
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
          <CardDescription className="text-xs text-slate-500">Generate aggregated reports for compliance and auditing</CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex gap-2 bg-slate-950 p-1.5 border border-slate-850 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setReportType('daily')}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all ${reportType === 'daily' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setReportType('weekly')}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all ${reportType === 'weekly' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Weekly Report
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all ${reportType === 'monthly' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Monthly Report
            </button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 gap-2 rounded-xl text-xs py-5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </Button>
            <Button
              onClick={handleExportPDF}
              className="flex-1 sm:flex-initial bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 gap-2 rounded-xl text-xs py-5 transition-colors"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Export PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
