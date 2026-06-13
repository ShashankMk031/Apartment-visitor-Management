'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Key, 
  Search, 
  UserPlus, 
  Trash2, 
  Phone, 
  Mail, 
  User,
  ShieldAlert
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, SecurityGuard } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AdminGuards() {
  const [guards, setGuards] = useState<SecurityGuard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);

  // Add guard modal state
  const [addOpen, setAddOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const loadGuards = async () => {
    try {
      if (!hasSupabaseCreds()) {
        setGuards(mockDb.getGuards());
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('security_guards')
            .select(`
              id,
              phone,
              profiles (
                full_name,
                email
              )
            `);
          
          if (data) {
            const mapped: SecurityGuard[] = data.map((g: any) => ({
              id: g.id,
              apartment_id: 'apt-1',
              full_name: g.profiles?.full_name || 'Guard',
              email: g.profiles?.email || '',
              phone: g.phone || '',
              created_at: '',
            }));
            setGuards(mapped);
          }
        }
      }
    } catch (err) {
      console.error('Error loading guards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMock(!hasSupabaseCreds());
    loadGuards();
  }, []);

  const handleAddGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      toast.error('All fields are required');
      return;
    }

    setSaving(true);
    try {
      if (isMock) {
        mockDb.addGuard({
          apartment_id: 'apt-1',
          full_name: fullName,
          email,
          phone
        });
        toast.success('Guard added successfully');
        setAddOpen(false);
        clearForm();
        loadGuards();
      } else {
        const supabase = createClient();
        if (supabase) {
          const newUserId = crypto.randomUUID();
          
          await supabase.from('profiles').insert({
            id: newUserId,
            full_name: fullName,
            email,
            role: 'GUARD'
          });

          const { error } = await supabase.from('security_guards').insert({
            id: newUserId,
            apartment_id: 'apt-1',
            phone
          });

          if (error) {
            toast.error(error.message);
          } else {
            toast.success('Guard registered successfully');
            setAddOpen(false);
            clearForm();
            loadGuards();
          }
        }
      }
    } catch (err) {
      toast.error('Failed to add guard');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuard = async (id: string) => {
    if (!confirm('Are you sure you want to remove this guard?')) return;
    
    try {
      if (isMock) {
        mockDb.deleteGuard(id);
        toast.success('Guard removed successfully');
        loadGuards();
      } else {
        const supabase = createClient();
        if (supabase) {
          const { error } = await supabase.from('profiles').delete().eq('id', id);
          if (error) {
            toast.error(error.message);
          } else {
            toast.success('Guard deleted successfully');
            loadGuards();
          }
        }
      }
    } catch (err) {
      toast.error('Failed to delete guard');
    }
  };

  const clearForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
  };

  const getFilteredGuards = () => {
    if (!searchQuery) return guards;
    const q = searchQuery.toLowerCase();
    return guards.filter(
      g => 
        g.full_name.toLowerCase().includes(q) || 
        g.email.toLowerCase().includes(q)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Roster</h1>
          <p className="text-sm text-slate-400">Green Glen Heights • Manage gate security guard profiles</p>
        </div>
        
        <Button 
          onClick={() => setAddOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-5 rounded-xl flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Guard</span>
        </Button>
      </div>

      {/* Roster Card */}
      <Card className="bg-slate-900/40 border-slate-800 shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <CardTitle className="text-sm">Active Guards ({getFilteredGuards().length})</CardTitle>
            <CardDescription className="text-xs text-slate-550">Registered security accounts</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-3 w-4 h-4 text-slate-650" />
            <Input
              type="text"
              placeholder="Search by name, email..."
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
                  <th className="py-3 font-semibold">Guard Name</th>
                  <th className="py-3 font-semibold">Email</th>
                  <th className="py-3 font-semibold">Phone</th>
                  <th className="py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-350">
                {getFilteredGuards().length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-650">
                      No guards found matching query
                    </td>
                  </tr>
                ) : (
                  getFilteredGuards().map((guard) => (
                    <tr key={guard.id} className="hover:bg-slate-900/10">
                      <td className="py-3.5 font-bold text-slate-200">
                        {guard.full_name}
                      </td>
                      <td className="py-3.5">{guard.email}</td>
                      <td className="py-3.5">{guard.phone}</td>
                      <td className="py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGuard(guard.id)}
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

      {/* ADD GUARD DIALOG */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-150 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Register New Guard
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Add a new security guard account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddGuard} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-slate-400">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-700" />
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Guard Bahadur"
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
                {saving ? 'Adding...' : 'Add Guard'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
