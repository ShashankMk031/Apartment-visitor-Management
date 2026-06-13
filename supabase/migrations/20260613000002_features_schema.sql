-- Migration to add features: Frequent Visitors, Blacklist, and Emergency Alerts

-- 1. Frequent Visitors Table
CREATE TABLE public.frequent_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    category TEXT NOT NULL, -- 'MAID', 'DRIVER', 'COOK', 'PARENTS', 'RELATIVES', 'HELP', 'TRAINER', 'OTHER'
    notes TEXT,
    qr_code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Blacklisted Visitors Table
CREATE TABLE public.blacklisted_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Emergency Alerts Table
CREATE TABLE public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
    alert_type TEXT NOT NULL, -- 'MEDICAL', 'SECURITY', 'FIRE', 'OTHER'
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'RESOLVED'
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.frequent_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blacklisted_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_frequent_visitors_resident ON public.frequent_visitors(resident_id);
CREATE INDEX idx_frequent_visitors_qr_code ON public.frequent_visitors(qr_code);
CREATE INDEX idx_blacklisted_visitors_phone ON public.blacklisted_visitors(phone);
CREATE INDEX idx_emergency_alerts_resident ON public.emergency_alerts(resident_id);
CREATE INDEX idx_emergency_alerts_status ON public.emergency_alerts(status);

-- 4. RLS Policies
-- Frequent Visitors Policies
CREATE POLICY "Enable select for authenticated users on frequent visitors" ON public.frequent_visitors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for residents on own frequent visitors" ON public.frequent_visitors
    FOR INSERT WITH CHECK (
        resident_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Enable update for residents/admins on frequent visitors" ON public.frequent_visitors
    FOR UPDATE USING (
        resident_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Enable delete for residents/admins on frequent visitors" ON public.frequent_visitors
    FOR DELETE USING (
        resident_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Blacklist Policies
CREATE POLICY "Enable select for authenticated users on blacklist" ON public.blacklisted_visitors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for admins on blacklist" ON public.blacklisted_visitors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Emergency Alerts Policies
CREATE POLICY "Enable select for authenticated users on emergency alerts" ON public.emergency_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for residents on emergency alerts" ON public.emergency_alerts
    FOR INSERT WITH CHECK (
        resident_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Enable update for guards/admins on emergency alerts" ON public.emergency_alerts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ADMIN', 'GUARD')
        )
    );
