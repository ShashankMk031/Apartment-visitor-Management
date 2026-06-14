'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Home, Key, LogIn, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-[#F0EDE8] text-[#2A2825] font-sans antialiased selection:bg-[#4E8079]/20 selection:text-[#4E8079] flex flex-col justify-center items-center p-4 relative">
      
      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* Structural Minimalist Frame Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8E4DD] border border-white text-[#4E8079] text-xs font-semibold shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="tracking-wide">Welcome Back User</span>
          </div>
          <div className="logo w-full flex items-center justify-center">
              <img src="/logo-icon.png" alt="logo" className="w-10 h-full" />
              <span className="logo-text text-xl">Gate<span>Keeper</span></span>
            </div>
          <p className="text-[#6E685E] text-xs font-medium">
            Digital gatekeeping & structured perimeter controls
          </p>
        </div>

        {/* Tactile Neumorphic Roster Card Plate */}
        <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[28px] shadow-[10px_10px_24px_rgba(163,157,147,0.35),-10px_-10px_24px_rgba(255,255,255,0.85)] p-2">
          <CardHeader className="pb-3 pt-5 px-5 border-b border-[#DCD6CB]/80">
            <CardTitle className="text-[#2A2825] font-bold text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#F0EDE8] border border-white flex items-center justify-center shadow-xs">
                <LogIn className="w-3.5 h-3.5 text-[#4E8079]" strokeWidth={2} />
              </div>
              Console Authentication
            </CardTitle>
            <CardDescription className="text-xs text-[#6E685E] pt-0.5">
              Provide authorized node credentials below
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 px-5 pt-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F2DBDB] border border-[#E8C2C2] text-[#9E4A4A] text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>{errorMsg}</span>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Micro-Indented Real-World Input Box */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider font-mono pl-0.5">Email Matrix</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#F0EDE8] border border-[#DCD6CB] text-xs text-[#2A2825] placeholder:text-[#9F988F] rounded-xl h-10 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                  required
                />
              </div>
              
              {/* Micro-Indented Real-World Input Box */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider font-mono pl-0.5">Passphrase Key</Label>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#F0EDE8] border border-[#DCD6CB] text-xs text-[#2A2825] placeholder:text-[#9F988F] rounded-xl h-10 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                />
                {/* show password */}
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider font-mono"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>

              {/* Muted Soft Elevated Primary Teal CTA Button */}
              <Button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-[#4E8079] hover:bg-[#3F6B65] active:bg-[#4E8079] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white font-bold text-xs h-10 rounded-xl border border-[#6BA199] shadow-[2px_2px_6px_rgba(78,128,121,0.25)] transition-all mt-2 cursor-pointer"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-[#DCD6CB]/80 pt-4 pb-4 px-5 space-y-4">
            {/* Quick Demo logins */}
            <div className="w-full space-y-2.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#9F988F] block text-center">
                System Quick Access Bypass
              </span>
              <div className="grid grid-cols-3 gap-2">
                {/* Flat Tactile Interactive Grid Nodes */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@example.com')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F0EDE8] hover:bg-[#DCEBF2] border border-[#DCD6CB] hover:border-[#B9D9E8] text-[#4A453F] hover:text-[#3B6A80] transition-colors text-[11px] font-bold shadow-xs cursor-pointer"
                >
                  <Shield className="w-4 h-4 mb-1 text-[#477C94]" strokeWidth={1.8} />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('resident1@example.com')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F0EDE8] hover:bg-[#D2E7E2] border border-[#DCD6CB] hover:border-[#B9D5CE] text-[#4A453F] hover:text-[#2E544F] transition-colors text-[11px] font-bold shadow-xs cursor-pointer"
                >
                  <Home className="w-4 h-4 mb-1 text-[#4E8079]" strokeWidth={1.8} />
                  <span>Resident</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('guard1@example.com')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F0EDE8] hover:bg-[#F2ECD2] border border-[#DCD6CB] hover:border-[#E8DCB9] text-[#4A453F] hover:text-[#736031] transition-colors text-[11px] font-bold shadow-xs cursor-pointer"
                >
                  <Key className="w-4 h-4 mb-1 text-[#A1813B]" strokeWidth={1.8} />
                  <span>Guard</span>
                </button>
              </div>
            </div>

            <div className="text-center pt-1 w-full border-t border-[#DCD6CB]/40">
              <p className="text-xs text-[#6E685E] font-medium">
                Unregistered Guest?{' '}
                <Link href="/" className="text-[#4E8079] hover:text-[#3F6B65] font-bold hover:underline transition-colors ml-0.5">
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
      <div className="min-h-screen bg-[#F0EDE8] text-[#2A2825] flex flex-col justify-center items-center p-4">
        <RefreshCw className="w-6 h-6 text-[#4E8079] animate-spin" strokeWidth={1.8} />
        <p className="text-[#6E685E] text-xs font-medium tracking-wide mt-3 animate-pulse">Syncing Cryptographic Module...</p>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}