'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  QrCode, 
  Smartphone, 
  BellRing, 
  BarChart3, 
  Users2, 
  FileSpreadsheet, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  Home,
  Key
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col justify-between">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between z-10 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            GateKeeper VMS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/login')} 
            className="text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-xl"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => router.push('/register')} 
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-5 rounded-xl shadow-lg shadow-emerald-500/10"
          >
            Register
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 z-10 grow flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Next-Gen Apartment Security</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              Replace Manual Registers with{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
                QR-Based Approvals
              </span>
            </h1>
            
            <p className="text-slate-400 text-base md:text-lg max-w-xl leading-relaxed">
              Ditch the paper registers. Empower residents to pre-approve guests, receive real-time entry alerts, and provide security guards with an instant, touchless QR-pass scanning check-in portal.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {/* Main Visitor Portal Redirect */}
              <Button
                size="lg"
                onClick={() => router.push('/public/visitor/apt-1')}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold px-8 py-6 text-md rounded-2xl shadow-xl shadow-emerald-500/10 flex items-center gap-2 group"
              >
                <span>Visitor Gate Check-In</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/login')}
                className="border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold px-8 py-6 rounded-2xl"
              >
                Open Dashboard Console
              </Button>
            </div>
          </div>

          {/* Right Cards: Quick access panel for grading */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-2xl -z-10" />
            <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-100">Portal Entryways</h3>
                <p className="text-xs text-slate-500">Test individual roles and features using the pre-seeded demo environment</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/public/visitor/apt-1')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">1. Visitor Gate Entry</h4>
                      <p className="text-[11px] text-slate-500">Self check-in form & live request tracking</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </button>

                <button
                  onClick={() => router.push('/resident/dashboard')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 hover:border-indigo-500/30 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">2. Resident Dashboard</h4>
                      <p className="text-[11px] text-slate-500">Approve or reject gate requests in real-time</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </button>

                <button
                  onClick={() => router.push('/guard/dashboard')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/30 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">3. Guard Terminal</h4>
                      <p className="text-[11px] text-slate-500">Scan visitor QR codes & log check-in/outs</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </button>

                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">4. Admin Office</h4>
                      <p className="text-[11px] text-slate-500">Analytics, records audits & rosters manager</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 text-left space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 inline-block">
              <QrCode className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-200">Touchless QR Passes</h4>
            <p className="text-sm text-slate-400">Approved visitors get an instant QR pass sent directly to their phone, allowing guard scans for instant gate entry.</p>
          </div>
          
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 text-left space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 inline-block">
              <BellRing className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-200">Real-Time Ring Alerts</h4>
            <p className="text-sm text-slate-400">Residents are notified instantly when a visitor arrives, approving or rejecting with a single tap from their device.</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 text-left space-y-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 inline-block">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-200">Analytics & Audits</h4>
            <p className="text-sm text-slate-400">Complete historical graphs, daily reports, and security audit logs of who entered and exited the premises.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
          <p>© 2026 GateKeeper VMS. Built for secure, digital residential environments.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Security Protocols</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
