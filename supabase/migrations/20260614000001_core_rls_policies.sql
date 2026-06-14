-- Migration to define RLS policies for core tables to grant guards and admins proper access
-- This ensures the Guard dashboard can select and update visitor requests/entries in Supabase

-- 1. Enable RLS on core tables (just in case they aren't already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_entries ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they conflict
DROP POLICY IF EXISTS "Enable select for authenticated users on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable select for authenticated users on residents" ON public.residents;
DROP POLICY IF EXISTS "Enable select for residents and guards/admins on visitor_requests" ON public.visitor_requests;
DROP POLICY IF EXISTS "Enable update for residents and guards/admins on visitor_requests" ON public.visitor_requests;
DROP POLICY IF EXISTS "Enable select for authenticated users on visitor_entries" ON public.visitor_entries;
DROP POLICY IF EXISTS "Enable all for guards and admins on visitor_entries" ON public.visitor_entries;

-- 3. Profiles Policies
CREATE POLICY "Enable select for authenticated users on profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Residents Policies
CREATE POLICY "Enable select for authenticated users on residents" ON public.residents
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Visitor Requests Policies
CREATE POLICY "Enable select for residents and guards/admins on visitor_requests" ON public.visitor_requests
    FOR SELECT USING (
        resident_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ADMIN', 'GUARD')
        )
    );

CREATE POLICY "Enable update for residents and guards/admins on visitor_requests" ON public.visitor_requests
    FOR UPDATE USING (
        resident_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ADMIN', 'GUARD')
        )
    );

-- 6. Visitor Entries Policies
CREATE POLICY "Enable select for authenticated users on visitor_entries" ON public.visitor_entries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for guards and admins on visitor_entries" ON public.visitor_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ADMIN', 'GUARD')
        )
    );
