'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Search, 
  Clock, 
  ShieldCheck, 
  Key, 
  Home, 
  Filter 
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, AuditLog } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      if (!hasSupabaseCreds()) {
        setLogs(mockDb.getAuditLogs());
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('audit_logs')
            .select(`
              *,
              profiles (
                full_name,
                role
              )
            `)
            .order('created_at', { ascending: false });
          
          if (data) {
            const mapped: AuditLog[] = data.map((l: any) => ({
              id: l.id,
              actor_id: l.actor_id || '',
              actor_name: l.profiles?.full_name || 'System',
              action_type: l.action_type,
              description: l.description,
              created_at: l.created_at,
            }));
            setLogs(mapped);
          }
        }
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getFilteredLogs = () => {
    let list = logs;
    
    // Filter by action type
    if (actionFilter !== 'all') {
      list = list.filter(l => l.action_type === actionFilter);
    }

    // Filter by search query
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      l => 
        l.actor_name.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q) ||
        l.action_type.toLowerCase().includes(q)
    );
  };

  const getActionColor = (action: AuditLog['action_type']) => {
    switch (action) {
      case 'APPROVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECT': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'ENTRY': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'EXIT': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ADMIN_ACTION': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Audit Logs</h1>
        <p className="text-sm text-slate-400">Green Glen Heights • Cryptographic security auditing roster</p>
      </div>

      {/* Roster Card */}
      <Card className="bg-slate-900/40 border-slate-800 shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <CardTitle className="text-sm">Audit Trails ({getFilteredLogs().length})</CardTitle>
            <CardDescription className="text-xs text-slate-550">Historical log of security activities</CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-3 w-4 h-4 text-slate-650" />
              <Input
                type="text"
                placeholder="Search actor or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border-slate-850 text-xs pl-9 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Filter */}
            <div className="w-full sm:w-40">
              <Select value={actionFilter} onValueChange={(val) => setActionFilter(val || 'all')}>
                <SelectTrigger className="bg-slate-950 border-slate-850 text-xs text-slate-300">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-xs text-slate-100">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="APPROVE">Host Approvals</SelectItem>
                  <SelectItem value="REJECT">Host Rejections</SelectItem>
                  <SelectItem value="ENTRY">Gate Entries</SelectItem>
                  <SelectItem value="EXIT">Gate Exits</SelectItem>
                  <SelectItem value="ADMIN_ACTION">Admin Actions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="py-3 font-semibold">Actor</th>
                  <th className="py-3 font-semibold">Event</th>
                  <th className="py-3 font-semibold">Description</th>
                  <th className="py-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-350">
                {getFilteredLogs().length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-650">
                      No logs found matching criteria
                    </td>
                  </tr>
                ) : (
                  getFilteredLogs().map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/10">
                      <td className="py-3.5 font-bold text-slate-200">
                        {log.actor_name}
                      </td>
                      <td className="py-3.5">
                        <Badge className={`border text-[9px] font-bold px-2 py-0.5 ${getActionColor(log.action_type)}`}>
                          {log.action_type}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-slate-400">{log.description}</td>
                      <td className="py-3.5 text-slate-500 flex items-center gap-1.5 pt-4">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
