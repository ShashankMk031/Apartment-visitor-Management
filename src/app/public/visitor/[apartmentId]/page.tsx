'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Home, UserCheck, AlertCircle, Search, CalendarDays } from 'lucide-react';
import { mockDb, hasSupabaseCreds, Resident, Apartment } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function VisitorPortalPage() {
  const router = useRouter();
  const params = useParams();
  const apartmentId = (params?.apartmentId as string) || 'apt-1';

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [blacklistWarning, setBlacklistWarning] = useState<{ name: string; reason: string } | null>(null);
  
  // Form fields
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorType, setVisitorType] = useState<any>('GUEST');
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [numberOfVisitors, setNumberOfVisitors] = useState('1');
  const [expectedDuration, setExpectedDuration] = useState('60'); // in minutes
  
  const [loading, setLoading] = useState(false);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    const isMockMode = !hasSupabaseCreds();
    setIsMock(isMockMode);

    if (isMockMode) {
      setApartment(mockDb.getApartment());
      const resList = mockDb.getResidents();
      setResidents(resList);
      setFilteredResidents(resList);
    } else {
      const fetchRealData = async () => {
        const supabase = createClient();
        if (supabase) {
          // Fetch apartment - fallback to first apartment if 'apt-1' is passed
          let aptIdToQuery = apartmentId;
          if (apartmentId === 'apt-1') {
            const { data: firstApt } = await supabase.from('apartments').select('id').limit(1).maybeSingle();
            if (firstApt?.id) {
              aptIdToQuery = firstApt.id;
            }
          }

          const { data: apt } = await supabase.from('apartments').select('*').eq('id', aptIdToQuery).single();
          if (apt) setApartment(apt);

          // Fetch residents
          const { data: res } = await supabase
            .from('residents')
            .select(`
              id,
              flat_number,
              phone,
              profiles (
                full_name,
                email
              )
            `)
            .eq('apartment_id', aptIdToQuery);
          
          if (res) {
            const mapped: Resident[] = res.map((r: any) => ({
              id: r.id,
              apartment_id: aptIdToQuery,
              flat_number: r.flat_number,
              full_name: r.profiles?.full_name || 'Resident',
              email: r.profiles?.email || '',
              phone: r.phone,
              created_at: '',
            }));

            // Deduplicate by flat_number: prefer registered residents (non-seeded UUID)
            const dedupedMap: { [flat: string]: Resident } = {};
            mapped.forEach(resident => {
              const flat = resident.flat_number;
              const existing = dedupedMap[flat];
              
              if (!existing) {
                dedupedMap[flat] = resident;
              } else {
                const isExistingSeeded = existing.id.startsWith('e0000000-');
                const isNewSeeded = resident.id.startsWith('e0000000-');
                if (isExistingSeeded && !isNewSeeded) {
                  dedupedMap[flat] = resident;
                }
              }
            });

            const dedupedList = Object.values(dedupedMap);
            setResidents(dedupedList);
            setFilteredResidents(dedupedList);
          }
        }
      };
      fetchRealData();
    }
  }, [apartmentId]);

  // Search filter
  useEffect(() => {
    if (!searchQuery) {
      setFilteredResidents(residents);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = residents.filter(
      r => r.flat_number.toLowerCase().includes(query) || r.full_name.toLowerCase().includes(query)
    );
    setFilteredResidents(filtered);
  }, [searchQuery, residents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) {
      toast.error('Please select a resident / flat');
      return;
    }
    if (!visitorName || !visitorPhone || !purpose) {
      toast.error('Please fill in visitor name, phone number, and purpose');
      return;
    }

    setLoading(true);
    try {
      const numVisitors = parseInt(numberOfVisitors, 10) || 1;
      const duration = parseInt(expectedDuration, 10) || 60;

      // Check Blacklist
      if (isMock) {
        const blacklisted = mockDb.checkBlacklist(visitorPhone);
        if (blacklisted) {
          mockDb.createAuditLog({
            actor_id: 'system',
            actor_name: 'System',
            action_type: 'ADMIN_ACTION',
            description: `Blocked entry attempt by blacklisted visitor: ${visitorName} (${visitorPhone}). Reason: ${blacklisted.reason}`,
          });
          setBlacklistWarning({
            name: visitorName,
            reason: blacklisted.reason,
          });
          setLoading(false);
          return;
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data: blacklisted } = await supabase
            .from('blacklisted_visitors')
            .select('*')
            .eq('phone', visitorPhone)
            .maybeSingle();

          if (blacklisted) {
            await supabase.from('audit_logs').insert({
              actor_id: null,
              actor_name: 'System Gatekeeper',
              action_type: 'ADMIN_ACTION',
              description: `Blocked entry attempt by blacklisted visitor: ${visitorName} (${visitorPhone}). Reason: ${blacklisted.reason}`,
            });
            setBlacklistWarning({
              name: visitorName,
              reason: blacklisted.reason,
            });
            setLoading(false);
            return;
          }
        }
      }

      if (isMock) {
        // Create in Mock DB
        const newReq = mockDb.createVisitorRequest({
          resident_id: selectedResident.id,
          visitor_name: visitorName,
          visitor_phone: visitorPhone,
          visitor_type: visitorType,
          purpose,
          vehicle_number: vehicleNumber || undefined,
          number_of_visitors: numVisitors,
          expected_duration: duration,
        });
        toast.success('Visitor request submitted successfully!');
        router.push(`/public/tracking/${newReq.id}`);
      } else {
        // Real Supabase Insert
        const supabase = createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('visitor_requests')
            .insert({
              resident_id: selectedResident.id,
              visitor_name: visitorName,
              visitor_phone: visitorPhone,
              visitor_type: visitorType,
              purpose,
              vehicle_number: vehicleNumber || null,
              number_of_visitors: numVisitors,
              expected_duration: duration,
              status: 'PENDING',
            })
            .select()
            .single();

          if (error) {
            toast.error(error.message);
          } else if (data) {
            // Send trigger to notify resident (realtime or trigger handle)
            toast.success('Visitor request submitted!');
            router.push(`/public/tracking/${data.id}`);
          }
        }
      }
    } catch (err) {
      console.error('Error submitting visitor request:', err);
      toast.error('Failed to submit visitor request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex justify-between items-center pb-6 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            {apartment?.name || 'GateKeeper Portal'}
          </span>
        </div>
        <span className="text-xs text-slate-500 max-w-[200px] text-right truncate">
          {apartment?.address || 'Loading...'}
        </span>
      </header>

      {/* Main Grid */}
      <main className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 my-8 grow">
        
        {/* Left Side: Flat / Resident Selector */}
        <div className="md:col-span-5 space-y-4">
          <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-200 text-md flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-400" />
                Select Flat / Resident
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Search and select the host flat
              </CardDescription>
              
              <div className="relative pt-2">
                <Search className="absolute left-2.5 top-4.5 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search flat number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs pl-9 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500"
                />
              </div>
            </CardHeader>
            
            <CardContent className="grow overflow-y-auto max-h-[300px] md:max-h-[350px] space-y-2 pr-1 custom-scrollbar">
              {filteredResidents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-600">
                  No residents found
                </div>
              ) : (
                filteredResidents.map((r) => {
                  const isSelected = selectedResident?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedResident(r)}
                      className={`
                        w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left
                        ${isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/40 text-slate-300'}
                      `}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">Flat {r.flat_number}</span>
                        <span className="text-[11px] text-slate-400">{r.full_name}</span>
                      </div>
                      <UserCheck className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Visitor Entry Form */}
        <div className="md:col-span-7">
          <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-200 text-md flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                Visitor Entry Request
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {selectedResident 
                  ? `Requesting access to flat ${selectedResident.flat_number} (${selectedResident.full_name})`
                  : 'Please select a flat on the left to begin'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visitorName" className="text-xs text-slate-400">Visitor Name</Label>
                  <Input
                    id="visitorName"
                    type="text"
                    placeholder="Enter your name"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    disabled={!selectedResident || loading}
                    className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visitorPhone" className="text-xs text-slate-400">Phone Number</Label>
                    <Input
                      id="visitorPhone"
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      disabled={!selectedResident || loading}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Visitor Type</Label>
                    <Select 
                      value={visitorType} 
                      onValueChange={setVisitorType}
                      disabled={!selectedResident || loading}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select visitor type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="GUEST">Guest</SelectItem>
                        <SelectItem value="DELIVERY">Delivery</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="MAID">Maid</SelectItem>
                        <SelectItem value="DRIVER">Driver</SelectItem>
                        <SelectItem value="FAMILY">Family</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-xs text-slate-400">Purpose of Visit</Label>
                  <Input
                    id="purpose"
                    type="text"
                    placeholder="e.g., Deliver lunch box, repair WiFi, family get-together"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    disabled={!selectedResident || loading}
                    className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle" className="text-xs text-slate-400">Vehicle Number (Opt)</Label>
                    <Input
                      id="vehicle"
                      type="text"
                      placeholder="KA-03-XX-1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      disabled={!selectedResident || loading}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitorsCount" className="text-xs text-slate-400">No. of Visitors</Label>
                    <Input
                      id="visitorsCount"
                      type="number"
                      min="1"
                      value={numberOfVisitors}
                      onChange={(e) => setNumberOfVisitors(e.target.value)}
                      disabled={!selectedResident || loading}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-xs text-slate-400">Est. Duration (Min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="10"
                      step="5"
                      value={expectedDuration}
                      onChange={(e) => setExpectedDuration(e.target.value)}
                      disabled={!selectedResident || loading}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!selectedResident || loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-6 transition-colors rounded-xl shadow-lg mt-2"
                >
                  {loading ? 'Submitting request...' : 'Send Approval Request to Resident'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Blacklist Warning Dialog */}
      <Dialog open={!!blacklistWarning} onOpenChange={(open) => !open && setBlacklistWarning(null)}>
        <DialogContent className="bg-slate-900 border-red-500/50 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 text-lg">
              <AlertCircle className="w-5 h-5" />
              Access Denied (Blacklisted Visitor)
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-2 text-sm">
              The visitor <strong>{blacklistWarning?.name}</strong> is currently on the apartment blacklist. Entry is blocked, and the security desk has been notified.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 my-2 text-xs">
            <span className="text-slate-500 block mb-1">Reason:</span>
            <p className="text-slate-300 font-medium italic">{blacklistWarning?.reason}</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setBlacklistWarning(null)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-[10px] text-slate-600 pt-6 border-t border-slate-900">
        This is a public security portal. All submissions are audited and sent instantly to resident devices.
      </footer>
    </div>
  );
}
