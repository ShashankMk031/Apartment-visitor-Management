'use client';

import React, { useState, useEffect, useRef } from 'react';
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

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeEmergencyAlerts, setActiveEmergencyAlerts] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const prevNotifsCountRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const triggerBrowserNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
        notification.onclick = () => {
          window.focus();
          setNotifOpen(true);
        };
      }
    }
  };

  const fetchUserAndNotifications = async () => {
    try {
      if (!hasSupabaseCreds()) {
        const current = mockDb.getCurrentUser();
        if (current) {
          setUser(current);
          const list = mockDb.getNotifications().filter(n => n.recipient_id === current.id);
          setNotifications(list);
          setUnreadNotifications(list.filter(n => !n.read).length);
          
          if (prevNotifsCountRef.current > 0 && list.length > prevNotifsCountRef.current) {
            const newCount = list.length - prevNotifsCountRef.current;
            for (let i = 0; i < newCount; i++) {
              const newNotif = list[i];
              if (newNotif && !newNotif.read) {
                toast.info(`New Alert: ${newNotif.title}`);
                triggerBrowserNotification(newNotif.title, newNotif.message);
              }
            }
          }
          prevNotifsCountRef.current = list.length;

          if (current.role === 'GUARD' || current.role === 'ADMIN') {
            const alerts = mockDb.getEmergencyAlerts().filter(a => a.status === 'ACTIVE');
            setActiveEmergencyAlerts(alerts);
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

            const { data: list } = await supabase
              .from('notifications')
              .select('*')
              .eq('recipient_id', supabaseUser.id)
              .order('created_at', { ascending: false });

            if (list) {
              setNotifications(list);
              setUnreadNotifications(list.filter((n: any) => !n.read).length);
              
              if (prevNotifsCountRef.current > 0 && list.length > prevNotifsCountRef.current) {
                const newCount = list.length - prevNotifsCountRef.current;
                for (let i = 0; i < newCount; i++) {
                  const newNotif = list[i];
                  if (newNotif && !newNotif.read) {
                    toast.info(`New Alert: ${newNotif.title}`);
                    triggerBrowserNotification(newNotif.title, newNotif.message);
                  }
                }
              }
              prevNotifsCountRef.current = list.length;
            }

            if (role === 'GUARD' || role === 'ADMIN') {
              const { data: alerts } = await supabase
                .from('emergency_alerts')
                .select('*')
                .eq('status', 'ACTIVE');
              if (alerts) {
                setActiveEmergencyAlerts(alerts);
              }
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

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    try {
      if (!hasSupabaseCreds()) {
        const list = mockDb.getNotifications();
        const idx = list.findIndex((n: any) => n.id === id);
        if (idx !== -1) {
          list[idx].read = true;
          localStorage.setItem('mock_notifications', JSON.stringify(list));
          toast.success('Notification marked as read');
          fetchUserAndNotifications();
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          await supabase.from('notifications').update({ read: true }).eq('id', id);
          toast.success('Notification marked as read');
          fetchUserAndNotifications();
        }
      }
    } catch (e) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      if (!hasSupabaseCreds()) {
        const list = mockDb.getNotifications();
        list.forEach((n: any) => { if (n.recipient_id === user.id) n.read = true; });
        localStorage.setItem('mock_notifications', JSON.stringify(list));
        toast.success('All notifications marked as read');
        fetchUserAndNotifications();
      } else {
        const supabase = createClient();
        if (supabase) {
          await supabase.from('notifications').update({ read: true }).eq('recipient_id', user.id);
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
        if (supabase) await supabase.auth.signOut();
      }
      toast.success('Signed out successfully');
      router.push('/login');
      router.refresh();
    } catch (e) {
      toast.error('Failed to log out');
    }
  };

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
      <>
        <style>{`
          :root { --base: #E8E4DD; --surface: #F0EDE8; --teal: #4E8079; }
          body { background: var(--surface); margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
          .loader-spin {
            width: 40px; height: 40px; border: 4px solid var(--base);
            border-top: 4px solid var(--teal); border-radius: 50%;
            animation: spin-anim 1s linear infinite; margin: 0 auto 16px;
          }
          @keyframes spin-anim { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--surface)' }}>
          <div className="text-center">
            <div className="loader-spin" />
            <p className="text-sm font-semibold tracking-wide uppercase opacity-60" style={{ color: '#2A2825' }}>
              Verifying Secure Console...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        :root {
          --base: #E8E4DD;
          --surface: #F0EDE8;
          --surface-up: #F5F2EE;
          --shadow-dark: rgba(0,0,0,0.11);
          --shadow-light: rgba(255,255,255,0.85);
          --text-primary: #2A2825;
          --text-secondary: #6B6760;
          --text-muted: #9E9B96;
          --teal: #4E8079;
          --teal-light: #EBF4F2;
          --radius-shell: 20px;
        }
        .neu-raised-shell {
          background: var(--surface-up);
          box-shadow: 4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light);
        }
        .neu-inset-shell {
          background: var(--base);
          box-shadow: inset 3px 3px 8px var(--shadow-dark), inset -3px -3px 8px var(--shadow-light);
        }
        .neu-flat-shell {
          background: var(--surface);
          box-shadow: 3px 3px 8px var(--shadow-dark), -3px -3px 8px var(--shadow-light);
        }
        .pulse-emergency {
          animation: pulse-border 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-border {
          0%, 100% { background-color: #F87171; box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.4); }
          50% { background-color: #EF4444; box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
      `}</style>

      {/* Root: full viewport height, no overflow on the shell itself */}
      <div className="h-screen flex flex-col md:flex-row overflow-hidden font-sans" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>

        {/* ── Mobile top bar ── */}
        <header className="md:hidden h-16 shrink-0 flex items-center justify-between px-5 z-40 backdrop-blur-md" style={{ background: 'rgba(240,237,232,0.85)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center neu-raised-shell" style={{ color: 'var(--teal)' }}>
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">Gate<span>Keeper</span></span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-2 rounded-xl transition-all neu-flat-shell text-neutral-600 active:scale-95"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[9px]">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-neutral-600 rounded-xl hover:bg-neutral-200/50"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* ── Sidebar ── fixed height = full screen on desktop, slide-over on mobile */}
        <aside
          className={`
            fixed inset-y-0 left-0 w-64 z-30
            flex flex-col
            transition-transform duration-300
            md:static md:h-screen md:translate-x-0 md:shrink-0
            ${mobileMenuOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{ background: 'var(--surface-up)', borderRight: '1px solid rgba(0,0,0,0.05)' }}
        >
          {/* Top: brand + nav — scrollable if nav overflows */}
          <div className="flex flex-col gap-6 px-4 py-6 overflow-y-auto flex-1 min-h-0">

            {/* Brand */}
            <div className="hidden md:flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center neu-raised-shell" style={{ color: 'var(--teal)' }}>
                <img src="/logo-icon.png" alt="GateKeeper Logo" className="w-10 h-10" />
              </div>
              <div className="flex flex-col">
                <span className="logo-text">Gate<span>Keeper</span></span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-40" style={{ color: 'var(--text-primary)' }}>
                  VMS Console
                </span>
              </div>
            </div>

            {/* Nav section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-3">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Main Gateway
                </span>
                {user && (
                  <button
                    type="button"
                    onClick={() => setNotifOpen(true)}
                    className="relative text-neutral-500 hover:text-neutral-800 transition-colors p-1"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[8px] animate-pulse px-0.5">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>
                )}
              </div>

              <nav className="space-y-1.5 pt-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all group
                        ${isActive ? 'neu-inset-shell' : 'hover:bg-neutral-200/40 text-neutral-600'}
                      `}
                      style={isActive ? { color: 'var(--teal)' } : undefined}
                    >
                      <Icon className="w-4 h-4 transition-transform group-hover:scale-105" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Bottom: user identity + logout — always pinned to bottom */}
          <div className="shrink-0 p-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(232,228,221,0.2)' }}>
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase neu-inset-shell shrink-0" style={{ color: 'var(--teal)' }}>
                {user?.user_metadata?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.user_metadata?.full_name || 'User'}
                </span>
                <span className="text-[9px] font-extrabold uppercase opacity-50 tracking-wider">
                  {user?.role}
                </span>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl text-xs font-semibold px-3 py-2 text-neutral-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </aside>

        {/* ── Main content area — scrolls independently ── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

          {/* Emergency banner */}
          {activeEmergencyAlerts.length > 0 && (
            <div className="shrink-0 border-b bg-rose-50 border-rose-200 text-rose-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="pulse-emergency absolute inline-flex h-full w-full rounded-full opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
                </span>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xs tracking-wider text-rose-800">CRITICAL SECURITY EMERGENCY</span>
                  <span className="text-[11px] text-rose-600 font-medium">
                    {activeEmergencyAlerts.length} live incident(s) flagged at terminal checkpoints.
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setNotifOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] py-1.5 px-3.5 rounded-xl cursor-pointer shadow-sm transition-all active:scale-95"
                >
                  Inspect
                </button>
                {user.role === 'GUARD' && (
                  <button
                    onClick={async () => {
                      const firstAlert = activeEmergencyAlerts[0];
                      if (!hasSupabaseCreds()) {
                        mockDb.resolveEmergencyAlert(firstAlert.id, user.id);
                        fetchUserAndNotifications();
                        toast.success('Emergency resolved successfully.');
                      } else {
                        const supabase = createClient();
                        if (supabase) {
                          await supabase
                            .from('emergency_alerts')
                            .update({ status: 'RESOLVED', resolved_by: user.id, resolved_at: new Date().toISOString() })
                            .eq('id', firstAlert.id);
                          fetchUserAndNotifications();
                          toast.success('Emergency resolved successfully.');
                        }
                      }
                    }}
                    className="bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-[11px] py-1.5 px-3.5 rounded-xl cursor-pointer shadow-sm transition-all active:scale-95"
                  >
                    Clear First
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Ambient glow */}
          <div
            className="absolute top-0 right-0 w-[40%] h-[30%] rounded-full opacity-30 pointer-events-none blur-[120px]"
            style={{ background: 'var(--teal)' }}
          />

          {/* Page content — this is the only scroll region */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10">
            {children}
          </div>
        </main>

        {/* ── Notifications Dialog ── */}
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent className="max-w-md w-[92vw] mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: 'var(--teal)' }} />
                Gate Alerts ({unreadNotifications} Unread)
              </DialogTitle>
              <DialogDescription>
                Real-time audit messages from the gate operator desk.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-xs font-medium rounded-2xl bg-[#E8E4DD]/40 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.65)] text-[#9E9B96]">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-[14px] text-xs space-y-1 transition-all ${
                      n.read
                        ? 'opacity-50 bg-[#E8E4DD]/40 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06)] text-[#9E9B96]'
                        : 'bg-[#F5F2EE] shadow-[3px_3px_8px_rgba(0,0,0,0.09),-3px_-3px_8px_rgba(255,255,255,0.85)] text-[#2A2825]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 font-bold">
                      <span className="leading-snug">{n.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono opacity-50">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-[10px] font-bold underline cursor-pointer hover:opacity-70"
                            style={{ color: 'var(--teal)' }}
                          >
                            Read
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed text-[#6B6760]">{n.message}</p>
                  </div>
                ))
              )}
            </div>

            <DialogFooter className="flex-col gap-2">
              {unreadNotifications > 0 && (
                <Button onClick={handleMarkAllRead} className="w-full">
                  Mark All as Read
                </Button>
              )}
              <Button variant="outline" onClick={() => setNotifOpen(false)} className="w-full">
                Dismiss
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}