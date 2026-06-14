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
  Globe,
  RefreshCw
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
        
        if (typeof window !== 'undefined' && apt) {
          const publicPortalUrl = `${window.location.origin}/public/visitor/${apt.id}`;
          QRCode.toDataURL(publicPortalUrl, { 
            width: 220, 
            margin: 2,
            color: {
              dark: '#2A2825', // Deep rich charcoal text color matching the ecosystem brand
              light: '#FFFFFF'
            }
          })
            .then(url => setQrCodeDataUrl(url))
            .catch(err => console.error(err));
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          const { data: apt } = await supabase.from('apartments').select('*').limit(1).maybeSingle();
          if (apt) setApartment(apt);

          const { count: resCount } = await supabase.from('residents').select('*', { count: 'exact', head: true });
          setResidentsCount(resCount || 0);

          const { count: gdCount } = await supabase.from('security_guards').select('*', { count: 'exact', head: true });
          setGuardsCount(gdCount || 0);

          if (typeof window !== 'undefined' && apt) {
            const publicPortalUrl = `${window.location.origin}/public/visitor/${apt.id}`;
            QRCode.toDataURL(publicPortalUrl, { 
              width: 220, 
              margin: 2,
              color: {
                dark: '#2A2825',
                light: '#FFFFFF'
              }
            })
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
      <div className="flex flex-col items-center justify-center min-h-100 bg-[#F0EDE8] rounded-[28px] p-8">
        <RefreshCw className="w-8 h-8 text-[#4E8079] animate-spin" strokeWidth={1.8} />
        <span className="text-xs text-[#6E685E] font-medium mt-3 tracking-wide">Syncing Configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#F0EDE8] text-[#2A2825] font-sans antialiased">
      
      {/* Structural Minimalist Dashboard Page Title Header */}
      <div className="pb-5 border-b border-[#E0DACF]">
        <h1 className="text-2xl font-bold tracking-tight text-[#2A2825]">
          Apartment Configurations
        </h1>
        <p className="text-xs text-[#6E685E] font-medium mt-0.5">
          Green Glen Heights • General operational ecosystem variables and gateway control anchors
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Apartment details */}
        <div className="md:col-span-7 space-y-6">
          <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.3),-8px_-8px_20px_rgba(255,255,255,0.8)] p-2">
            <CardHeader className="pt-6 px-6 pb-4 border-b border-[#DCD6CB]/80">
              <CardTitle className="text-[#2A2825] font-bold text-sm flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F0EDE8] border border-white flex items-center justify-center shadow-sm">
                  <Building className="w-4 h-4 text-[#4E8079]" strokeWidth={1.8} />
                </div>
                Community Parameters
              </CardTitle>
              <CardDescription className="text-xs text-[#6E685E] pt-0.5">
                System architectural details for managed resident networks.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-6 pt-6 pb-6 space-y-6">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#8A8276] font-bold uppercase tracking-wider block font-mono">
                  Apartment Complex Name
                </span>
                <span className="text-lg font-extrabold text-[#2A2825] tracking-tight">
                  {apartment?.name}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-[#8A8276] font-bold uppercase tracking-wider block font-mono">
                  Physical Address
                </span>
                <span className="text-sm font-medium text-[#4A453F] flex items-start gap-2 leading-relaxed">
                  <MapPin className="w-4 h-4 text-[#A1584E] shrink-0 mt-0.5" strokeWidth={2} />
                  {apartment?.address}
                </span>
              </div>

              {/* Grid Metric Layout styled with clean soft insets */}
              <div className="border-t border-[#DCD6CB] pt-6 grid grid-cols-3 gap-4">
                
                {/* Metric 1 */}
                <div className="bg-[#F0EDE8] p-3.5 rounded-xl border border-[#DCD6CB] shadow-[inset_2px_2px_5px_rgba(163,157,147,0.12)] space-y-1 text-center">
                  <span className="text-[9px] text-[#8A8276] font-bold uppercase tracking-wider block font-mono">
                    Residents
                  </span>
                  <span className="text-xs font-bold text-[#2A2825] flex items-center justify-center gap-1.5 tabular-nums">
                    <Users className="w-3.5 h-3.5 text-[#6E685E]" strokeWidth={1.8} />
                    {residentsCount} Flats
                  </span>
                </div>

                {/* Metric 2 */}
                <div className="bg-[#F0EDE8] p-3.5 rounded-xl border border-[#DCD6CB] shadow-[inset_2px_2px_5px_rgba(163,157,147,0.12)] space-y-1 text-center">
                  <span className="text-[9px] text-[#8A8276] font-bold uppercase tracking-wider block font-mono">
                    Active Guards
                  </span>
                  <span className="text-xs font-bold text-[#2A2825] flex items-center justify-center gap-1.5 tabular-nums">
                    <Key className="w-3.5 h-3.5 text-[#6E685E]" strokeWidth={1.8} />
                    {guardsCount} Staff
                  </span>
                </div>

                {/* Metric 3 */}
                <div className="bg-[#F0EDE8] p-3.5 rounded-xl border border-[#DCD6CB] shadow-[inset_2px_2px_5px_rgba(163,157,147,0.12)] space-y-1 text-center">
                  <span className="text-[9px] text-[#8A8276] font-bold uppercase tracking-wider block font-mono">
                    Commissioned
                  </span>
                  <span className="text-xs font-bold text-[#2A2825] flex items-center justify-center gap-1.5 tabular-nums">
                    <CalendarDays className="w-3.5 h-3.5 text-[#6E685E]" strokeWidth={1.8} />
                    {apartment ? new Date(apartment.created_at).toLocaleDateString([], { year: 'numeric', month: 'short' }) : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: QR Code gate pass generator */}
        <div className="md:col-span-5">
          <Card className="border border-[#F5F3F0] bg-[#E8E4DD] rounded-[24px] shadow-[8px_8px_20px_rgba(163,157,147,0.3),-8px_-8px_20px_rgba(255,255,255,0.8)] p-6 text-center space-y-5">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#2A2825] flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4 text-[#4E8079]" strokeWidth={1.8} />
                Gate Check-In QR Anchor
              </h3>
              <p className="text-[10px] text-[#6E685E] max-w-xs mx-auto leading-normal">
                Print and frame this primary vector node at security physical barriers. Approaching visitors scan this to initiate digital pass logs.
              </p>
            </div>

            {/* Premium crisp white box layout inset frame */}
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-[inset_2px_2px_6px_rgba(0,0,0,0.1),2px_2px_5px_rgba(255,255,255,0.8)] border border-[#E0DACF]">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Apartment Gate QR" className="w-45 h-45 mix-blend-multiply" />
              ) : (
                <div className="w-45 h-45 bg-[#F0EDE8] flex items-center justify-center text-[#8A8276] text-xs font-mono font-medium animate-pulse">
                  Rendering Anchor Vector...
                </div>
              )}
            </div>

            {apartment && (
              <div className="w-full bg-[#F0EDE8] p-3 rounded-xl border border-[#DCD6CB] flex items-center gap-2 justify-center shadow-[inset_1px_1px_4px_rgba(163,157,147,0.1)] text-[10px] font-mono text-[#5C564F]">
                <Globe className="w-3.5 h-3.5 text-[#4E8079]" strokeWidth={1.8} />
                <span className="truncate select-all">
                  URL: {`${window.location.origin}/public/visitor/${apartment.id}`}
                </span>
              </div>
            )}

            {/* Premium Primary Action Button with real depression active state */}
            <Button 
              onClick={handleDownloadQR}
              className="w-full bg-[#4E8079] hover:bg-[#3F6B65] active:bg-[#4E8079] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] text-white font-bold gap-2 rounded-xl text-xs py-5 h-11 transition-all duration-150 shadow-[4px_4px_12px_rgba(78,128,121,0.35)] border border-[#6BA199]"
            >
              <Download className="w-4 h-4" strokeWidth={2} />
              <span>Download PNG Pass Vector</span>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}