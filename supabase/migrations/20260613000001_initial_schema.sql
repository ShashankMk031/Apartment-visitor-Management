-- Create Custom Enums
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'RESIDENT', 'GUARD');
CREATE TYPE public.visitor_type AS ENUM ('GUEST', 'DELIVERY', 'MAINTENANCE', 'MAID', 'DRIVER', 'FAMILY', 'OTHER');
CREATE TYPE public.request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Apartments Table
CREATE TABLE public.apartments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Profiles Table (FK to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY, -- References auth.users.id
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role public.user_role NOT NULL DEFAULT 'RESIDENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Residents Table
CREATE TABLE public.residents (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    apartment_id UUID REFERENCES public.apartments(id) ON DELETE CASCADE NOT NULL,
    flat_number TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Security Guards Table
CREATE TABLE public.security_guards (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    apartment_id UUID REFERENCES public.apartments(id) ON DELETE CASCADE NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Visitor Requests Table
CREATE TABLE public.visitor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_phone TEXT NOT NULL,
    visitor_type public.visitor_type NOT NULL DEFAULT 'GUEST',
    purpose TEXT,
    vehicle_number TEXT,
    number_of_visitors INTEGER NOT NULL DEFAULT 1,
    expected_duration INTEGER NOT NULL DEFAULT 60, -- in minutes
    status public.request_status NOT NULL DEFAULT 'PENDING',
    approval_time TIMESTAMP WITH TIME ZONE,
    qr_code_pass TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Visitor Entries Table
CREATE TABLE public.visitor_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_request_id UUID REFERENCES public.visitor_requests(id) ON DELETE CASCADE NOT NULL UNIQUE,
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    entered_by_guard UUID REFERENCES public.security_guards(id) ON DELETE SET NULL,
    exited_by_guard UUID REFERENCES public.security_guards(id) ON DELETE SET NULL
);

-- 7. Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'APPROVE', 'REJECT', 'ENTRY', 'EXIT', 'ADMIN_ACTION'
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_residents_apartment ON public.residents(apartment_id);
CREATE INDEX idx_guards_apartment ON public.security_guards(apartment_id);
CREATE INDEX idx_visitor_requests_resident ON public.visitor_requests(resident_id);
CREATE INDEX idx_visitor_requests_status ON public.visitor_requests(status);
CREATE INDEX idx_visitor_entries_request ON public.visitor_entries(visitor_request_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Trigger Function for creating user profiles from Auth Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role public.user_role;
BEGIN
    user_role := COALESCE(
        (new.raw_user_meta_data->>'role')::public.user_role,
        'RESIDENT'::public.user_role
    );
    
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
        new.email,
        user_role
    );
    
    -- If resident, we can also insert placeholder in residents table
    IF user_role = 'RESIDENT' THEN
        INSERT INTO public.residents (id, apartment_id, flat_number, phone)
        VALUES (
            new.id,
            COALESCE((new.raw_user_meta_data->>'apartment_id')::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
            COALESCE(new.raw_user_meta_data->>'flat_number', 'TBD'),
            COALESCE(new.raw_user_meta_data->>'phone', '')
        );
    ELSIF user_role = 'GUARD' THEN
        INSERT INTO public.security_guards (id, apartment_id, phone)
        VALUES (
            new.id,
            COALESCE((new.raw_user_meta_data->>'apartment_id')::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
            COALESCE(new.raw_user_meta_data->>'phone', '')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger Function to update profile info if user updates raw metadata
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        full_name = COALESCE(new.raw_user_meta_data->>'full_name', full_name),
        role = COALESCE((new.raw_user_meta_data->>'role')::public.user_role, role)
    WHERE id = new.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Enable read for authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users on their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable all for admins on profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- 2. Apartments Policies
CREATE POLICY "Enable select for anyone" ON public.apartments
    FOR SELECT USING (true);

CREATE POLICY "Enable all for admins on apartments" ON public.apartments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- 3. Residents Policies
CREATE POLICY "Enable select for authenticated users" ON public.residents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for admins on residents" ON public.residents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- 4. Security Guards Policies
CREATE POLICY "Enable select for authenticated users" ON public.security_guards
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for admins on guards" ON public.security_guards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- 5. Visitor Requests Policies
CREATE POLICY "Enable select for anyone by ID (for tracking page)" ON public.visitor_requests
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for anyone (for public entry portal)" ON public.visitor_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable resident update on their own requests" ON public.visitor_requests
    FOR UPDATE USING (
        resident_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ADMIN', 'GUARD')
        )
    );

-- 6. Visitor Entries Policies
CREATE POLICY "Enable select for authenticated users" ON public.visitor_entries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert/update for guards and admins" ON public.visitor_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ADMIN', 'GUARD')
        )
    );

-- 7. Notifications Policies
CREATE POLICY "Enable all for own notifications" ON public.notifications
    FOR ALL USING (recipient_id = auth.uid());

-- 8. Audit Logs Policies
CREATE POLICY "Enable select/insert for admin and guards" ON public.audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ADMIN', 'GUARD')
        )
    );
