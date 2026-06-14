'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Search, 
  UserPlus, 
  Trash2, 
  Home, 
  Phone, 
  Mail, 
  User,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, Resident } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

  // Add resident dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const loadResidents = async () => {
    try {
      if (!hasSupabaseCreds()) {
        setResidents(mockDb.getResidents());
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('residents')
            .select(`
              id,
              flat_number,
              phone,
              profiles (
                full_name,
                email
              )
            `);
          
          if (data) {
            const mapped: Resident[] = data.map((r: any) => ({
              id: r.id,
              apartment_id: 'apt-1',
              flat_number: r.flat_number,
              full_name: r.profiles?.full_name || 'Resident',
              email: r.profiles?.email || '',
              phone: r.phone,
              created_at: '',
            }));
            setResidents(mapped);
          }
        }
      }
    } catch (err) {
      console.error('Error loading residents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMock(!hasSupabaseCreds());
    loadResidents();
  }, []);

  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !flatNumber) {
      toast.error('All fields are required');
      return;
    }

    setSaving(true);
    try {
      if (isMock) {
        mockDb.addResident({
          apartment_id: 'apt-1',
          flat_number: flatNumber,
          full_name: fullName,
          email,
          phone
        });
        toast.success('Resident added successfully');
        setAddOpen(false);
        clearForm();
        loadResidents();
      } else {
        const supabase = createClient();
        if (supabase) {
          const newUserId = crypto.randomUUID();
          
          await supabase.from('profiles').insert({
            id: newUserId,
            full_name: fullName,
            email,
            role: 'RESIDENT'
          });

          const { data: aptData } = await supabase.from('apartments').select('id').limit(1).maybeSingle();
          const targetAptId = aptData?.id || '7b129750-705a-45c1-9d95-8e3ad7bb8fb5';

          const { error } = await supabase.from('residents').insert({
            id: newUserId,
            apartment_id: targetAptId,
            flat_number: flatNumber,
            phone
          });

          if (error) {
            toast.error(error.message);
          } else {
            toast.success('Resident registered successfully');
            setAddOpen(false);
            clearForm();
            loadResidents();
          }
        }
      }
    } catch (err) {
      toast.error('Failed to add resident');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResident = async (id: string) => {
    if (!confirm('Are you sure you want to remove this resident profile?')) return;
    
    try {
      if (isMock) {
        mockDb.deleteResident(id);
        toast.success('Resident removed successfully');
        loadResidents();
      } else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase.from('profiles').delete().eq('id', id);
          if (error) {
            toast.error(error.message);
          } else {
            toast.success('Resident deleted successfully');
            loadResidents();
          }
        }
      }
    } catch (err) {
      toast.error('Failed to delete resident');
    }
  };

  const clearForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setFlatNumber('');
  };

  const getFilteredResidents = () => {
    if (!searchQuery) return residents;
    const q = searchQuery.toLowerCase();
    return residents.filter(
      r => 
        r.full_name.toLowerCase().includes(q) || 
        r.flat_number.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 bg-[#F0EDE8] rounded-[28px] p-8">
        <RefreshCw className="w-8 h-8 text-[#4E8079] animate-spin" strokeWidth={1.8} />
        <span className="text-xs text-[#6E685E] font-medium mt-3 tracking-wide">Syncing Residents Database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F0EDE8] text-[#2A2825] font-sans antialiased selection:bg-[#4E8079]/20 selection:text-[#4E8079]">
      
      {/* Structural Minimalist Header Frame */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-[#E0DACF]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2A2825]">Residents Directory</h1>
          <p className="text-xs text-[#6E685E] font-medium mt-0.5">Green Glen Heights • Manage residents and flat associations</p>
        </div>
        
        {/* Soft Elevated Primary Teal CTA Button */}
        <Button 
          onClick={() => setAddOpen(true)}
          className="bg-[#4E8079] hover:bg-[#3F6B65] active:bg-[#4E8079] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white font-bold px-5 py-5 h-11 rounded-xl flex items-center gap-2 transition-all duration-150 shadow-[4px_4px_12px_rgba(78,128,121,0.35)] border border-[#6BA199] text-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" strokeWidth={2.2} />
          <span>Add Resident</span>
        </Button>
      </div>

      {/* Tactile Neumorphic Main Directory Card */}
      <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.3),-8px_-8px_20px_rgba(255,255,255,0.8)] p-2">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 pt-4 px-5 border-b border-[#DCD6CB]/80">
          <div>
            <CardTitle className="text-[#2A2825] font-bold text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#F0EDE8] border border-white flex items-center justify-center shadow-xs">
                <Users className="w-3.5 h-3.5 text-[#4E8079]" strokeWidth={2} />
              </div>
              Active Residents ({getFilteredResidents().length})
            </CardTitle>
            <CardDescription className="text-xs text-[#6E685E] pt-0.5">Overview of registered property accounts</CardDescription>
          </div>
          
          {/* Micro-Indented Real-World Input Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9F988F]" strokeWidth={2} />
            <Input
              type="text"
              placeholder="Search by name, flat, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#F0EDE8] border border-[#DCD6CB] text-xs pl-9 text-[#2A2825] placeholder:text-[#9F988F] rounded-xl h-9 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
            />
          </div>
        </CardHeader>

        <CardContent className="px-5 pt-3 pb-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCD6CB] text-[#8A8276] font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-3 font-bold">Resident Name</th>
                  <th className="py-3 font-bold">Flat Mapping</th>
                  <th className="py-3 font-bold">Email Endpoint</th>
                  <th className="py-3 font-bold">Phone Connection</th>
                  <th className="py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCD6CB]/40 text-[#4A453F] font-medium">
                {getFilteredResidents().length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#8A8276]">
                      <SlidersHorizontal className="w-7 h-7 text-[#BCB5AB] mx-auto mb-2" strokeWidth={1.5} />
                      No complex profiles correspond with the submitted parameters.
                    </td>
                  </tr>
                ) : (
                  getFilteredResidents().map((res) => (
                    <tr key={res.id} className="hover:bg-[#F0EDE8]/40 transition-colors">
                      <td className="py-3.5 font-bold text-[#2A2825]">
                        {res.full_name}
                      </td>
                      <td className="py-3.5">
                        {/* Micro-Indented Flat Badge Accent */}
                        <span className="bg-[#E1DCD3] text-[#4E8079] border border-[#D0C9BE] font-bold px-2 py-0.5 rounded-md text-[10px] shadow-[inset_0.5px_0.5px_2px_rgba(0,0,0,0.05)] font-mono">
                          FLAT {res.flat_number}
                        </span>
                      </td>
                      <td className="py-3.5 text-[#5C564F]">{res.email}</td>
                      <td className="py-3.5 font-mono text-[#5C564F]">{res.phone}</td>
                      <td className="py-3.5 text-right">
                        {/* Smooth Action Trigger Icon */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteResident(res.id)}
                          className="text-[#8A8276] hover:text-[#A1584E] hover:bg-[#A1584E]/10 h-8 w-8 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* REGISTER RESIDENT TACTILE DIALOG POPUP MODAL */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#E8E4DD] border border-[#F5F3F0] text-[#2A2825] max-w-md rounded-[28px] shadow-[12px_12px_36px_rgba(0,0,0,0.15),-12px_-12px_36px_rgba(255,255,255,0.9)] p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-[#2A2825] font-bold flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-lg bg-[#F0EDE8] border border-white flex items-center justify-center shadow-xs">
                <UserPlus className="w-4 h-4 text-[#4E8079]" strokeWidth={2} />
              </div>
              Register New Resident
            </DialogTitle>
            <DialogDescription className="text-[#6E685E] text-xs pt-0.5">
              Add a new flat association. A profile will be created instantly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddResident} className="space-y-4 pt-4">
            
            {/* Input 1 */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider block font-mono pl-0.5">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 w-4 h-4 text-[#9F988F]" strokeWidth={2} />
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Amit Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-[#F0EDE8] border border-[#DCD6CB] text-[#2A2825] placeholder:text-[#9F988F] text-xs rounded-xl py-4 h-10 pl-10 pr-3.5 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                  required
                />
              </div>
            </div>

            {/* Input 2 */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider block font-mono pl-0.5">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-[#9F988F]" strokeWidth={2} />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#F0EDE8] border border-[#DCD6CB] text-[#2A2825] placeholder:text-[#9F988F] text-xs rounded-xl py-4 h-10 pl-10 pr-3.5 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                  required
                />
              </div>
            </div>

            {/* Two-Column Input Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider block font-mono pl-0.5">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-2.5 w-4 h-4 text-[#9F988F]" strokeWidth={2} />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-[#F0EDE8] border border-[#DCD6CB] text-[#2A2825] placeholder:text-[#9F988F] text-xs rounded-xl py-4 h-10 pl-10 pr-3.5 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="flat" className="text-[10px] font-bold text-[#6E685E] uppercase tracking-wider block font-mono pl-0.5">Flat Number</Label>
                <div className="relative">
                  <Home className="absolute left-3.5 top-2.5 w-4 h-4 text-[#9F988F]" strokeWidth={2} />
                  <Input
                    id="flat"
                    type="text"
                    placeholder="e.g. 304"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="bg-[#F0EDE8] border border-[#DCD6CB] text-[#2A2825] placeholder:text-[#9F988F] text-xs rounded-xl py-4 h-10 pl-10 pr-3.5 shadow-[inset_1px_1px_4px_rgba(163,157,147,0.15)] focus-visible:ring-1 focus-visible:ring-[#4E8079]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <DialogFooter className="mt-6 flex gap-3 sm:space-x-0 pt-2">
              <Button 
                type="button" 
                onClick={() => setAddOpen(false)}
                className="w-1/2 bg-[#F0EDE8] hover:bg-[#DCD6CB]/60 text-[#5C564F] font-bold border border-[#DCD6CB] text-xs h-10 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="w-1/2 bg-[#4E8079] hover:bg-[#3F6B65] active:bg-[#4E8079] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white font-bold text-xs h-10 rounded-xl border border-[#6BA199] shadow-sm cursor-pointer"
              >
                {saving ? 'Adding...' : 'Add Resident'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}