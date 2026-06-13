'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Phone, Home, Mail, Save, RefreshCw } from 'lucide-react';
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

        const currentSession = mockDb.getCurrentUser();
        currentSession.user_metadata.full_name = fullName;
        localStorage.setItem('mock_current_user', JSON.stringify(currentSession));

        toast.success('Profile updated successfully');
      } else {
        const supabase = createClient();
        if (supabase) {
          const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: fullName }
          });

          if (authError) throw authError;

          await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);

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
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#F0EDE8]">
        <RefreshCw className="w-6 h-6 text-[#4E8079] animate-spin" strokeWidth={1.8} />
        <p className="text-[#6E685E] text-xs font-medium tracking-wide mt-3 animate-pulse">Syncing User Credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 bg-[#F0EDE8] text-[#2A2825] font-sans antialiased p-1">
      
      {/* Title Header Plate */}
      <div className="border-b border-[#DCD6CB]/60 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#2A2825]">Resident Profile</h1>
        <p className="text-xs text-[#6E685E] font-medium mt-0.5">Manage your flat association and personal security settings</p>
      </div>

      {/* Main Soft Tactile Panel */}
      <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[28px] shadow-[8px_8px_20px_rgba(110,104,94,0.18),-8px_-8px_20px_rgba(255,255,255,0.85)] p-2">
        <CardHeader className="pb-4 pt-5 px-5 border-b border-[#DCD6CB]/80">
          <CardTitle className="text-sm font-bold text-[#2A2825] flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#F0EDE8] border border-white flex items-center justify-center shadow-xs">
              <User className="w-3.5 h-3.5 text-[#4E8079]" strokeWidth={2.2} />
            </div>
            Resident Identity Parameters
          </CardTitle>
          <CardDescription className="text-xs text-[#6E685E] pt-0.5">
            Ensure your configuration details match accurately to authorize automatic perimeter checks.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-5 pt-5">
          <form onSubmit={handleSave} className="space-y-5">
            
            {/* Input Node: Disabled/Locked Matrix */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider font-mono">Registered Node Email (Immutable)</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#A39C93]" strokeWidth={2} />
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-[#E4E0D9] border border-[#D5CFC5] pl-10 text-[#857E74] cursor-not-allowed text-xs rounded-xl h-10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.04)] font-medium"
                />
              </div>
            </div>

            {/* Input Node: Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider font-mono">Full Legal Name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#9F988F]" strokeWidth={2} />
                <Input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-[#F0EDE8] border border-[#DCD6CB] pl-10 text-xs text-[#2A2825] placeholder:text-[#9F988F] rounded-xl h-10 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                  required
                />
              </div>
            </div>

            {/* Combined Matrix Grid Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Input Node: Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider font-mono">Contact Network Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#9F988F]" strokeWidth={2} />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91..."
                    className="bg-[#F0EDE8] border border-[#DCD6CB] pl-10 text-xs text-[#2A2825] placeholder:text-[#9F988F] rounded-xl h-10 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                    required
                  />
                </div>
              </div>

              {/* Input Node: Flat Unit */}
              <div className="space-y-1.5">
                <Label htmlFor="flat" className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider font-mono">Assigned Flat/Unit Allocation</Label>
                <div className="relative">
                  <Home className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#9F988F]" strokeWidth={2} />
                  <Input
                    id="flat"
                    type="text"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    placeholder="301"
                    className="bg-[#F0EDE8] border border-[#DCD6CB] pl-10 text-xs text-[#2A2825] placeholder:text-[#9F988F] rounded-xl h-10 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Tactile Push Trigger */}
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-[#4E8079] hover:bg-[#3F6B65] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 h-11 mt-4 border border-[#6BA199] shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
              ) : (
                <Save className="w-3.5 h-3.5" strokeWidth={2.5} />
              )}
              <span>{saving ? 'Syncing Profile Changes...' : 'Commit Configuration Settings'}</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}