'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Home, Key, LogIn, AlertCircle } from 'lucide-react';
import { mockDb, hasSupabaseCreds } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    setIsMock(!hasSupabaseCreds());
    
    // Check if user is already logged in
    if (!hasSupabaseCreds()) {
      const current = mockDb.getCurrentUser();
      if (current) {
        redirectUser(current.role);
      }
    } else {
      const checkRealSession = async () => {
        const supabase = createClient();
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            const role = data.session.user.user_metadata?.role || 'RESIDENT';
            redirectUser(role);
          }
        }
      };
      checkRealSession();
    }
  }, []);

  const redirectUser = (role: 'ADMIN' | 'RESIDENT' | 'GUARD') => {
    let dest = '/';
    if (role === 'ADMIN') dest = '/admin/dashboard';
    else if (role === 'RESIDENT') dest = '/resident/dashboard';
    else if (role === 'GUARD') dest = '/guard/dashboard';
    
    router.push(redirect || dest);
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');

    try {
      if (isMock) {
        // Mock DB Sign In
        const { user, error } = mockDb.signIn(email);
        if (error) {
          setErrorMsg(error.message);
          toast.error(error.message);
        } else {
          toast.success(`Welcome back, ${user.user_metadata.full_name}!`);
          redirectUser(user.role);
        }
      } else {
        // Real Supabase Sign In
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: password || 'password123',
        });
        
        if (error) {
          setErrorMsg(error.message);
          toast.error(error.message);
        } else {
          const role = data.user?.user_metadata?.role || 'RESIDENT';
          toast.success('Signed in successfully');
          redirectUser(role);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
      toast.error('Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
    // Automate form submission
    setTimeout(() => {
      const btn = document.getElementById('login-submit-btn');
      if (btn) btn.click();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-950/20 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-2">
            <Shield className="w-4 h-4" />
            <span>Secure Access Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            Apartment Visitor Management
          </h1>
          <p className="text-slate-400 text-sm">
            Digital gatekeeping and resident approval system
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-emerald-400" />
              Sign In
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your registered credentials below
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                />
              </div>

              <Button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold transition-colors mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-slate-800/60 pt-6 space-y-4">
            {/* Quick Demo logins */}
            <div className="w-full space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block text-center">
                Demo Quick Access (No Credentials Required)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@example.com')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 hover:text-indigo-200 transition-all text-xs font-medium"
                >
                  <Shield className="w-5 h-5 mb-1.5" />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('resident1@example.com')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-300 hover:text-emerald-200 transition-all text-xs font-medium"
                >
                  <Home className="w-5 h-5 mb-1.5" />
                  <span>Resident 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('guard1@example.com')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-300 hover:text-amber-200 transition-all text-xs font-medium"
                >
                  <Key className="w-5 h-5 mb-1.5" />
                  <span>Guard 1</span>
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-500">
                Are you a visitor?{' '}
                <Link href="/" className="text-emerald-400 hover:underline">
                  Go to gate check-in
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-slate-400 text-sm animate-pulse">Loading login portal...</p>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
