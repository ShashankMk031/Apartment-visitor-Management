'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  MapPin, 
  QrCode, 
  Download, 
  CalendarDays, 
  Users, 
  Key,
  Globe
} from 'lucide-react';
import { mockDb, hasSupabaseCreds, Apartment } from '@/lib/supabase/mockDb';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export default function AdminApartments() {
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [residentsCount, setResidentsCount] = useState(0);
  const [guardsCount, setGuardsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadApartmentDetails = async () => {
    try {
      if (!hasSupabaseCreds()) {
        const apt = mockDb.getApartment();
        setApartment(apt);
        setResidentsCount(mockDb.getResidents().length);
        setGuardsCount(mockDb.getGuards().length);
        
        // Generate gate check-in QR code (point to public visitor portal)
        if (typeof window !== 'undefined' && apt) {
          const publicPortalUrl = `${window.location.origin}/public/visitor/${apt.id}`;
          QRCode.toDataURL(publicPortalUrl, { width: 250, margin: 1 })
            .then(url => setQrCodeDataUrl(url))
            .catch(err => console.error(err));
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data: apt } = await supabase.from('apartments').select('*').eq('id', 'apt-1').single();
          if (apt) setApartment(apt);

          const { count: resCount } = await supabase.from('residents').select('*', { count: 'exact', head: true });
          setResidentsCount(resCount || 0);

          const { count: gdCount } = await supabase.from('security_guards').select('*', { count: 'exact', head: true });
          setGuardsCount(gdCount || 0);

          if (typeof window !== 'undefined' && apt) {
            const publicPortalUrl = `${window.location.origin}/public/visitor/${apt.id}`;
            QRCode.toDataURL(publicPortalUrl, { width: 250, margin: 1 })
              .then(url => setQrCodeDataUrl(url))
              .catch(err => console.error(err));
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApartmentDetails();
  }, []);

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `gatekeeper-gate-qr-${apartment?.name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Gate Check-in QR downloaded. Print this QR for physical gate placement.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Apartment Configurations</h1>
        <p className="text-sm text-slate-400">Green Glen Heights • General building information and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Apartment details */}
        <div className="md:col-span-7 space-y-6">
          <Card className="bg-slate-900/40 border-slate-800 shadow-md">
            <CardHeader>
              <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                Community Parameters
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Overview of communities managed</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Apartment Complex Name</span>
                <span className="text-base font-extrabold text-slate-200">{apartment?.name}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Physical Address</span>
                <span className="text-sm text-slate-350 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  {apartment?.address}
                </span>
              </div>

              <div className="border-t border-slate-800/80 pt-4 grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Residents</span>
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    {residentsCount} Flats
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Guards</span>
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-slate-400" />
                    {guardsCount} Guards
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Created On</span>
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    {apartment ? new Date(apartment.created_at).toLocaleDateString([], { year: 'numeric', month: 'short' }) : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: QR Code gate pass generator */}
        <div className="md:col-span-5">
          <Card className="bg-slate-900/40 border-slate-800 shadow-md p-6 text-center space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-md text-slate-200 flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Gate Check-In QR Pass
              </h3>
              <p className="text-[10px] text-slate-500">Print and display this QR code at the main gate. Visitors scan this to access the check-in portal.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner border border-slate-200">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Apartment Gate QR" className="w-[200px] h-[200px]" />
              ) : (
                <div className="w-[200px] h-[200px] bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs">
                  Generating QR Pass...
                </div>
              )}
            </div>

            {apartment && (
              <div className="w-full bg-slate-950/45 p-3 rounded-xl border border-slate-850 flex items-center gap-2 justify-center text-[10px] text-slate-400">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">URL: {`${window.location.origin}/public/visitor/${apartment.id}`}</span>
              </div>
            )}

            <Button 
              onClick={handleDownloadQR}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 rounded-xl text-xs py-5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG Pass</span>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
