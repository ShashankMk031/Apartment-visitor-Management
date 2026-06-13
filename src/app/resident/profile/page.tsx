'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Phone, Home, Mail, Save } from 'lucide-react';
import { mockDb, hasSupabaseCreds, Resident } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ResidentProfile() {
  const [user, setUser] = useState<any>(null);
  const [resident, setResident] = useState<Resident | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    const isMockMode = !hasSupabaseCreds();
    setIsMock(isMockMode);

    const loadProfile = async () => {
      try {
        if (isMockMode) {
          const currentUser = mockDb.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            const res = mockDb.getResidents().find(r => r.id === currentUser.id);
            if (res) {
              setResident(res);
              setFullName(res.full_name);
              setPhone(res.phone);
              setFlatNumber(res.flat_number);
            }
          }
        } else {
          const supabase = createClient();
          if (supabase) {
            const { data: { user: supabaseUser } } = await supabase.auth.getUser();
            if (supabaseUser) {
              setUser(supabaseUser);
              
              const { data: res } = await supabase
                .from('residents')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

              if (res) {
                setResident(res);
                setFullName(supabaseUser.user_metadata?.full_name || '');
                setPhone(res.phone || '');
                setFlatNumber(res.flat_number || '');
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading resident profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !flatNumber) {
      toast.error('Please fill out all fields');
      return;
    }

    setSaving(true);
    try {
      if (isMock) {
        // Save in Mock DB
        const residents = mockDb.getResidents();
        const idx = residents.findIndex(r => r.id === user.id);
        if (idx !== -1) {
          residents[idx].full_name = fullName;
          residents[idx].phone = phone;
          residents[idx].flat_number = flatNumber;
          localStorage.setItem('mock_residents', JSON.stringify(residents));
        }

        const profiles = mockDb.getProfiles();
        const pIdx = profiles.findIndex(p => p.id === user.id);
        if (pIdx !== -1) {
          profiles[pIdx].full_name = fullName;
          localStorage.setItem('mock_profiles', JSON.stringify(profiles));
        }

        // Update current session
        const currentSession = mockDb.getCurrentUser();
        currentSession.user_metadata.full_name = fullName;
        localStorage.setItem('mock_current_user', JSON.stringify(currentSession));

        toast.success('Profile updated successfully');
      } else {
        // Save in real Supabase
        const supabase = createClient();
        if (supabase) {
          // Update auth user metadata
          const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: fullName }
          });

          if (authError) throw authError;

          // Update profiles table
          await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);

          // Update residents table
          const { error: resError } = await supabase
            .from('residents')
            .update({
              phone,
              flat_number: flatNumber
            })
            .eq('id', user.id);

          if (resError) throw resError;

          toast.success('Profile saved successfully');
        }
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resident Profile</h1>
        <p className="text-sm text-slate-400">Manage your flat association and personal security settings</p>
      </div>

      <Card className="bg-slate-900/40 border-slate-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-200 text-md flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            Resident Settings
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Ensure your details are accurate to receive gate notifications properly
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Registered Email (Cannot be changed)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-700" />
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-950/40 border-slate-900 pl-10 text-slate-500 cursor-not-allowed text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs text-slate-400">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-650" />
                <Input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-slate-950 border-slate-850 pl-10 text-slate-100 focus-visible:ring-emerald-500 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs text-slate-400">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-650" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91..."
                    className="bg-slate-950 border-slate-850 pl-10 text-slate-100 focus-visible:ring-emerald-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="flat" className="text-xs text-slate-400">Flat Number</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 w-4 h-4 text-slate-650" />
                  <Input
                    id="flat"
                    type="text"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    placeholder="301"
                    className="bg-slate-950 border-slate-850 pl-10 text-slate-100 focus-visible:ring-emerald-500 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-5 mt-2 transition-colors rounded-xl flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
