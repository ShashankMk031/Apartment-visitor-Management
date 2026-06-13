'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Home, 
  Key, 
  LogOut, 
  Menu, 
  X, 
  Users, 
  Building, 
  History, 
  Bell, 
  User,
  Activity,
  FileText,
  ScanLine
} from 'lucide-react';
import { mockDb, hasSupabaseCreds } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface DashboardShellProps {
  children: React.ReactNode;
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchUserAndNotifications = async () => {
    try {
      if (!hasSupabaseCreds()) {
        const current = mockDb.getCurrentUser();
        if (current) {
          setUser(current);
          if (current.role === 'RESIDENT') {
            const list = mockDb.getNotifications().filter(n => n.recipient_id === current.id);
            setNotifications(list);
            setUnreadNotifications(list.filter(n => !n.read).length);
          }
        } else {
          router.push('/login');
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            const role = supabaseUser.user_metadata?.role || 'RESIDENT';
            const curUser = {
              id: supabaseUser.id,
              email: supabaseUser.email,
              role,
              user_metadata: {
                full_name: supabaseUser.user_metadata?.full_name || 'User',
              }
            };
            setUser(curUser);

            // Fetch notifications
            const { data: list } = await supabase
              .from('notifications')
              .select('*')
              .eq('recipient_id', supabaseUser.id)
              .order('created_at', { ascending: false });

            if (list) {
              setNotifications(list);
              setUnreadNotifications(list.filter((n: any) => !n.read).length);
            }
          } else {
            router.push('/login');
          }
        }
      }
    } catch (err) {
      console.error('Error in shell layout:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndNotifications();

    // In mock mode, we poll every 4 seconds to simulate realtime
    let interval: any;
    if (!hasSupabaseCreds()) {
      interval = setInterval(() => {
        fetchUserAndNotifications();
      }, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pathname]);

  // Realtime Supabase Subscription
  useEffect(() => {
    if (hasSupabaseCreds() && user) {
      const supabase = createClient();
      if (supabase) {
        const channel = supabase
          .channel(`notifications-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_id=eq.${user.id}`,
            },
            (payload: any) => {
              toast.info(`New Alert: ${payload.new.title}`);
              fetchUserAndNotifications();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      if (!hasSupabaseCreds()) {
        const list = mockDb.getNotifications();
        list.forEach((n: any) => {
          if (n.recipient_id === user.id) n.read = true;
        });
        localStorage.setItem('mock_notifications', JSON.stringify(list));
        toast.success('All notifications marked as read');
        fetchUserAndNotifications();
      } else {
        const supabase = createClient();
        if (supabase) {
          await supabase
            .from('notifications')
            .update({ read: true })
            .eq('recipient_id', user.id);
          toast.success('All notifications marked as read');
          fetchUserAndNotifications();
        }
      }
    } catch (e) {
      toast.error('Failed to update notifications');
    }
  };


  const handleLogout = async () => {
    try {
      if (!hasSupabaseCreds()) {
        mockDb.signOut();
      } else {
        const supabase = createClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      }
      toast.success('Signed out successfully');
      router.push('/login');
      router.refresh();
    } catch (e) {
      toast.error('Failed to log out');
    }
  };

  // Get navigation links based on user role
  const getNavItems = (): NavItem[] => {
    if (!user) return [];
    
    switch (user.role) {
      case 'ADMIN':
        return [
          { label: 'Overview', href: '/admin/dashboard', icon: Shield },
          { label: 'Apartments', href: '/admin/apartments', icon: Building },
          { label: 'Residents', href: '/admin/residents', icon: Users },
          { label: 'Guards', href: '/admin/guards', icon: Key },
          { label: 'Audit Logs', href: '/admin/audit-logs', icon: Activity },
        ];
      case 'RESIDENT':
        return [
          { label: 'My Flat Gate', href: '/resident/dashboard', icon: Home },
          { label: 'Profile Settings', href: '/resident/profile', icon: User },
        ];
      case 'GUARD':
        return [
          { label: 'Gate Console', href: '/guard/dashboard', icon: ScanLine },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm animate-pulse">Initializing Security Shell...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight">GateKeeper VMS</span>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'RESIDENT' && (
            <button 
              onClick={() => setNotifOpen(true)}
              className="relative p-1.5 text-slate-400 hover:text-slate-100"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-400 hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </header>

      {/* Sidebar for desktop */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-30 transition-transform duration-300 md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="px-4 py-6 flex flex-col gap-6 overflow-y-auto grow">
          <div className="hidden md:flex items-center gap-3 px-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight">GateKeeper</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">VMS Console</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-550">
                Navigation
              </span>
              {user?.role === 'RESIDENT' && (
                <button
                  type="button"
                  onClick={() => setNotifOpen(true)}
                  className="relative text-slate-500 hover:text-slate-200 transition-colors p-1"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              )}
            </div>
            <nav className="space-y-1 pt-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                      ${isActive 
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}
                    `}
                  >
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110`} />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 uppercase">
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-200 truncate">
                {user?.user_metadata?.full_name || 'User'}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {user?.role}
              </span>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header background decoration */}
        <div className="absolute top-0 right-0 w-[50%] h-[20%] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* NOTIFICATIONS DIALOG */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-150 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
              Gate Notifications ({unreadNotifications} Unread)
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Direct security alerts from the gate check-in desk
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-3 max-h-[300px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-600 border border-slate-850/80 border-dashed rounded-2xl">
                No notifications logged
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`
                    p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all
                    ${n.read 
                      ? 'bg-slate-950/20 border-slate-905 text-slate-500' 
                      : 'bg-emerald-500/5 border-emerald-500/20 text-slate-200'}
                  `}
                >
                  <div className="flex justify-between font-bold">
                    <span>{n.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">{n.message}</p>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2">
            {unreadNotifications > 0 && (
              <Button onClick={handleMarkAllRead} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs py-4">
                Mark All as Read
              </Button>
            )}
            <Button onClick={() => setNotifOpen(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-xs rounded-xl py-4">
              Close Inbox
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
