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
  Plus
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
          // In production, we register users using a supabase edge function or admin API to create the auth.users entry.
          // For now, we will create the entry in profiles and residents directly for the dashboard view.
          const newUserId = crypto.randomUUID();
          
          await supabase.from('profiles').insert({
            id: newUserId,
            full_name: fullName,
            email,
            role: 'RESIDENT'
          });

          const { error } = await supabase.from('residents').insert({
            id: newUserId,
            apartment_id: 'apt-1',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Residents Directory</h1>
          <p className="text-sm text-slate-400">Green Glen Heights • Manage residents and flat associations</p>
        </div>
        
        <Button 
          onClick={() => setAddOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-5 rounded-xl flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Resident</span>
        </Button>
      </div>

      {/* Roster Card */}
      <Card className="bg-slate-900/40 border-slate-800 shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <CardTitle className="text-sm">Active Residents ({getFilteredResidents().length})</CardTitle>
            <CardDescription className="text-xs text-slate-550">Overview of registered accounts</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-3 w-4 h-4 text-slate-650" />
            <Input
              type="text"
              placeholder="Search by name, flat, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border-slate-850 text-xs pl-9 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="py-3 font-semibold">Resident Name</th>
                  <th className="py-3 font-semibold">Flat No.</th>
                  <th className="py-3 font-semibold">Email</th>
                  <th className="py-3 font-semibold">Phone</th>
                  <th className="py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-350">
                {getFilteredResidents().length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-650">
                      No residents found matching query
                    </td>
                  </tr>
                ) : (
                  getFilteredResidents().map((res) => (
                    <tr key={res.id} className="hover:bg-slate-900/10">
                      <td className="py-3.5 font-bold text-slate-200">
                        {res.full_name}
                      </td>
                      <td className="py-3.5">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-md text-[10px]">
                          Flat {res.flat_number}
                        </span>
                      </td>
                      <td className="py-3.5">{res.email}</td>
                      <td className="py-3.5">{res.phone}</td>
                      <td className="py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteResident(res.id)}
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ADD RESIDENT DIALOG */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-150 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Register New Resident
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Add a new flat association. A profile will be created instantly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddResident} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-slate-400">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-700" />
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Amit Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-slate-950 border-slate-850 pl-10 text-xs text-slate-100"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-slate-400">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-700" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-850 pl-10 text-xs text-slate-100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-slate-400">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-700" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-950 border-slate-850 pl-10 text-xs text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="flat" className="text-xs text-slate-400">Flat Number</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 w-4 h-4 text-slate-700" />
                  <Input
                    id="flat"
                    type="text"
                    placeholder="e.g. 304"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="bg-slate-950 border-slate-850 pl-10 text-xs text-slate-100"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-800/60 mt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setAddOpen(false)}
                className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl"
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
