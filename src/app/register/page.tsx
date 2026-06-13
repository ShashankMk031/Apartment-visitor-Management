'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Home, UserPlus, AlertCircle } from 'lucide-react';
import { mockDb, hasSupabaseCreds } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [apartmentId, setApartmentId] = useState('apt-1');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    const credsExist = hasSupabaseCreds();
    setIsMock(!credsExist);
    if (credsExist) {
      const supabase = createClient();
      if (supabase) {
        supabase.from('apartments').select('id').limit(1).maybeSingle().then(({ data }: { data: any }) => {
          if (data?.id) {
            setApartmentId(data.id);
          }
        });
      }
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !flatNumber) {
      toast.error('Please fill out all fields');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isMock) {
        // Register Resident in Mock DB
        mockDb.addResident({
          apartment_id: apartmentId,
          flat_number: flatNumber,
          full_name: fullName,
          email,
          phone,
        });

        // Log in immediately
        mockDb.signIn(email);
        toast.success('Registration successful! Welcome to the portal.');
        router.push('/resident/dashboard');
      } else {
        // Real Supabase Signup
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password: 'password123', // Default password for simplicity in testing
          options: {
            data: {
              full_name: fullName,
              role: 'RESIDENT',
              apartment_id: apartmentId,
              flat_number: flatNumber,
              phone,
            }
          }
        });

        if (error) {
          setErrorMsg(error.message);
          toast.error(error.message);
        } else {
          toast.success('Registration successful! Please check your email or log in.');
          router.push('/login');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-950/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-2">
            <Home className="w-4 h-4" />
            <span>Resident Enrollment</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            Join Green Glen Heights
          </h1>
          <p className="text-slate-400 text-sm">
            Set up your resident account for instant gate approvals
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Register Account
            </CardTitle>
            <CardDescription className="text-slate-400">
              Provide your details to register as a resident
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+9198765..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flat" className="text-slate-300">Flat Number</Label>
                  <Input
                    id="flat"
                    type="text"
                    placeholder="302"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Select Apartment</Label>
                <Select value={apartmentId} onValueChange={(val) => setApartmentId(val || 'apt-1')}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                    <SelectValue placeholder="Select an apartment" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="apt-1">Green Glen Heights</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-semibold transition-colors mt-2"
              >
                {loading ? 'Creating account...' : 'Register as Resident'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-800/60 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <a href="/login" className="text-indigo-400 hover:underline">
                Sign In
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
