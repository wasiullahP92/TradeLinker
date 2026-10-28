-- ============================================================================
-- TradeLinker — Production Database Schema & Row Level Security (RLS)
-- Platform: Connecting People with Trusted Professionals
-- Techminds (Wasi Ullah & Hamad Ullah) | SRS Document v1.0
-- Backend Target: Supabase (PostgreSQL 15+)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
CREATE TYPE user_role_enum AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE user_status_enum AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE verification_status_enum AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE pricing_type_enum AS ENUM ('fixed', 'hourly', 'upon_request');
CREATE TYPE booking_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled');

-- ----------------------------------------------------------------------------
-- 2. User Profiles Table (Extends Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'customer',
    status user_status_enum NOT NULL DEFAULT 'active',
    avatar_url VARCHAR(500),
    city VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index to prevent duplicate emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(LOWER(email));

-- ----------------------------------------------------------------------------
-- 3. Service Provider Profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.provider_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    business_name VARCHAR(160) NOT NULL,
    primary_category_id VARCHAR(50) NOT NULL,
    skills TEXT[] DEFAULT '{}',
    experience_years INT DEFAULT 1 CHECK (experience_years >= 0),
    service_locations TEXT[] DEFAULT '{}',
    bio_description TEXT,
    verification_status verification_status_enum DEFAULT 'pending',
    verification_document_url VARCHAR(500),
    is_premium BOOLEAN DEFAULT FALSE,
    average_rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. Categories (Initial 6 Categories)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0
);

-- Seed initial 6 categories
INSERT INTO public.categories (id, title, description, icon_name, display_order)
VALUES
    ('construction', 'Construction Services', 'Civil engineers, masonry, structural contracting and site work.', 'construction', 1),
    ('plumbing', 'Plumbing Services', 'Pipe installation, water systems, drainage unclogging, and fixtures.', 'plumbing', 2),
    ('electrical', 'Electrical Services', 'Wiring, breaker panels, emergency diagnostics, and UPS systems.', 'electrical', 3),
    ('hvac', 'AC and HVAC Services', 'Air conditioning installation, gas charging, duct repairs, and chiller units.', 'hvac', 4),
    ('solar', 'Solar Energy Services', 'Solar panel setups, net-metering approvals, hybrid battery backups.', 'solar', 5),
    ('carpentry', 'Wooden Door Making and Carpentry', 'Custom solid doors, wooden frames, lock fittings, and custom woodwork.', 'carpentry', 6)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active service categories"
    ON public.categories FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Only authorized administrators can modify categories"
    ON public.categories FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. Service Listings (FR-14, FR-15)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL REFERENCES public.categories(id),
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    pricing_type pricing_type_enum DEFAULT 'upon_request',
    price_amount DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. Bookings Table (FR-28 to FR-34)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id VARCHAR(20) PRIMARY KEY, -- e.g. TL-BK-1234
    customer_id UUID NOT NULL REFERENCES public.users(id),
    provider_id UUID NOT NULL REFERENCES public.provider_profiles(id),
    service_id UUID REFERENCES public.service_listings(id),
    problem_description TEXT NOT NULL,
    service_address TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time_slot VARCHAR(50) NOT NULL,
    status booking_status_enum NOT NULL DEFAULT 'pending',
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. Reviews Table (FR-39 to FR-42 & BR-06)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id VARCHAR(20) NOT NULL REFERENCES public.bookings(id) UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.users(id),
    provider_id UUID NOT NULL REFERENCES public.provider_profiles(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    is_reported BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Helper security definer function to check if the current user is an Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users RLS
CREATE POLICY "Users can view public user profiles" 
    ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins have full access to users" 
    ON public.users FOR ALL USING (public.is_admin());

-- Provider Profiles RLS
CREATE POLICY "Public can view verified provider profiles" 
    ON public.provider_profiles FOR SELECT USING (true);

CREATE POLICY "Providers can update their own profile" 
    ON public.provider_profiles FOR UPDATE USING (user_id = auth.uid());

-- Bookings RLS
CREATE POLICY "Customers can view their own bookings" 
    ON public.bookings FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Providers can view bookings assigned to them" 
    ON public.bookings FOR SELECT USING (
        provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Customers can insert bookings" 
    ON public.bookings FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Authorized participants or Admins can update booking" 
    ON public.bookings FOR UPDATE USING (
        customer_id = auth.uid() OR 
        provider_id IN (SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()) OR
        public.is_admin()
    );

-- Reviews RLS (Only customers of completed bookings can leave reviews per BR-06)
CREATE POLICY "Public can view non-reported reviews" 
    ON public.reviews FOR SELECT USING (NOT is_reported);

CREATE POLICY "Customers can only review their completed bookings" 
    ON public.reviews FOR INSERT WITH CHECK (
        customer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = booking_id AND customer_id = auth.uid() AND status = 'completed'
        )
    );

-- ----------------------------------------------------------------------------
-- 9. Booking Messages Table (FR-48)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(20) NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id),
    sender_name VARCHAR(120) NOT NULL,
    sender_role user_role_enum NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and Admins can view booking messages"
    ON public.messages FOR SELECT USING (
        sender_id = auth.uid() OR
        booking_id IN (
            SELECT b.id FROM public.bookings b 
            WHERE b.customer_id = auth.uid() OR 
                  b.provider_id IN (SELECT p.id FROM public.provider_profiles p WHERE p.user_id = auth.uid())
        ) OR
        public.is_admin()
    );

CREATE POLICY "Participants can insert messages"
    ON public.messages FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        booking_id IN (
            SELECT b.id FROM public.bookings b 
            WHERE b.customer_id = auth.uid() OR 
                  b.provider_id IN (SELECT p.id FROM public.provider_profiles p WHERE p.user_id = auth.uid())
        )
    );

-- ----------------------------------------------------------------------------
-- 10. Disputes & Complaints Table (FR-47, UC-05)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disputes (
    id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(20) NOT NULL REFERENCES public.bookings(id),
    complainant_id UUID NOT NULL REFERENCES public.users(id),
    complainant_role user_role_enum NOT NULL,
    priority VARCHAR(30) DEFAULT 'Normal',
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'open',
    admin_findings TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disputes, Admins can view all"
    ON public.disputes FOR SELECT USING (
        complainant_id = auth.uid() OR public.is_admin()
    );

CREATE POLICY "Authenticated users can submit disputes"
    ON public.disputes FOR INSERT WITH CHECK (complainant_id = auth.uid());

CREATE POLICY "Only admins can update disputes"
    ON public.disputes FOR UPDATE USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 11. Immutable Administrative Audit Trail (FR-44, FR-48)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(80) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(80) NOT NULL,
    details TEXT NOT NULL,
    admin_id UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authorized administrators can access audit logs"
    ON public.admin_audit_logs FOR ALL USING (public.is_admin());

