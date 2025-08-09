-- =====================================================
-- CRITICAL FIX: Create Missing Core Tables
-- =====================================================
-- This migration creates the fundamental tables that were missing
-- and fixes the database structure to match the intended design
-- =====================================================

-- Create custom types for roles and message types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'client', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('admin_to_client', 'admin_to_user', 'client_to_user', 'user_to_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 1. CLIENTS TABLE (Must be created first due to foreign keys)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    address TEXT,
    client_admin_id UUID, -- Will be set after profiles table is created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT clients_company_name_check CHECK (char_length(company_name) > 0),
    CONSTRAINT clients_contact_email_check CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- 2. PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT profiles_full_name_check CHECK (char_length(full_name) > 0),
    CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    
    -- Business logic constraints
    CONSTRAINT profiles_client_role_check CHECK (
        (role = 'admin' AND client_id IS NULL) OR
        (role = 'client' AND client_id IS NOT NULL) OR
        (role = 'user' AND client_id IS NOT NULL)
    )
);

-- Now add the foreign key constraint to clients table
ALTER TABLE public.clients 
ADD CONSTRAINT fk_clients_admin 
FOREIGN KEY (client_admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- =====================================================
-- 3. MESSAGES TABLE (Communication System)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    message_type message_type NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT messages_content_check CHECK (char_length(content) > 0),
    CONSTRAINT messages_different_users CHECK (sender_id != recipient_id)
);

-- =====================================================
-- 4. NEWS TABLE (Announcements and Reports)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT news_title_check CHECK (char_length(title) > 0),
    CONSTRAINT news_content_check CHECK (char_length(content) > 0)
);

-- =====================================================
-- 5. NEWS ASSIGNMENTS TABLE (Who can see which news)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.news_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_to_client UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    assigned_to_user UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either client or user is assigned, not both
    CONSTRAINT check_news_assignment CHECK (
        (assigned_to_client IS NOT NULL AND assigned_to_user IS NULL) OR
        (assigned_to_client IS NULL AND assigned_to_user IS NOT NULL)
    )
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_clients_company_name ON public.clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_contact_email ON public.clients(contact_email);
CREATE INDEX IF NOT EXISTS idx_clients_admin_id ON public.clients(client_admin_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at);

CREATE INDEX IF NOT EXISTS idx_news_created_by ON public.news(created_by);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at);

CREATE INDEX IF NOT EXISTS idx_news_assignments_news_id ON public.news_assignments(news_id);
CREATE INDEX IF NOT EXISTS idx_news_assignments_client ON public.news_assignments(assigned_to_client);
CREATE INDEX IF NOT EXISTS idx_news_assignments_user ON public.news_assignments(assigned_to_user);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Admin can see all profiles
CREATE POLICY "Admin can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients can see their own users and their own profile
CREATE POLICY "Clients can view their users" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR -- Can see own profile
        (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'client'
            ) AND
            client_id = (
                SELECT client_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Users can only see their own profile and their client's profile
CREATE POLICY "Users can view own and client profile" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR -- Can see own profile
        (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'user'
            ) AND
            role = 'client' AND
            id = (
                SELECT client_admin_id FROM public.clients 
                WHERE id = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
            )
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admin can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- CLIENTS POLICIES
-- =====================================================

-- Admin can see all clients
CREATE POLICY "Admin can view all clients" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients can only see their own company
CREATE POLICY "Clients can view own company" ON public.clients
    FOR SELECT USING (
        id = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
    );

-- Users can see their client company
CREATE POLICY "Users can view their client company" ON public.clients
    FOR SELECT USING (
        id = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
    );

-- Admin can manage all clients
CREATE POLICY "Admin can manage all clients" ON public.clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- MESSAGES POLICIES
-- =====================================================

-- Users can see messages they sent or received
CREATE POLICY "Users can view their messages" ON public.messages
    FOR SELECT USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- Users can send messages (with role-based restrictions)
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        (
            -- Admin can message anyone
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
            -- Client can message their users and admin
            (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'client') AND
                (
                    EXISTS (SELECT 1 FROM public.profiles WHERE id = recipient_id AND role = 'admin') OR
                    EXISTS (
                        SELECT 1 FROM public.profiles p1, public.profiles p2 
                        WHERE p1.id = auth.uid() AND p2.id = recipient_id 
                        AND p1.client_id = p2.client_id AND p2.role = 'user'
                    )
                )
            ) OR
            -- User can message their client and admin
            (
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'user') AND
                (
                    EXISTS (SELECT 1 FROM public.profiles WHERE id = recipient_id AND role = 'admin') OR
                    EXISTS (
                        SELECT 1 FROM public.profiles p1, public.profiles p2 
                        WHERE p1.id = auth.uid() AND p2.id = recipient_id 
                        AND p1.client_id = p2.client_id AND p2.role = 'client'
                    )
                )
            )
        )
    );

-- Users can update read status of messages sent to them
CREATE POLICY "Users can mark messages as read" ON public.messages
    FOR UPDATE USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- =====================================================
-- NEWS POLICIES
-- =====================================================

-- Users can view news assigned to them
CREATE POLICY "Users can view assigned news" ON public.news
    FOR SELECT USING (
        -- Admin can see all news
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        -- Users can see news assigned to them or their client
        EXISTS (
            SELECT 1 FROM public.news_assignments na
            WHERE na.news_id = id AND (
                na.assigned_to_user = auth.uid() OR
                na.assigned_to_client = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
            )
        )
    );

-- Admin can create news
CREATE POLICY "Admin can create news" ON public.news
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admin can update news
CREATE POLICY "Admin can update news" ON public.news
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- NEWS ASSIGNMENTS POLICIES
-- =====================================================

-- Users can view news assignments relevant to them
CREATE POLICY "Users can view relevant news assignments" ON public.news_assignments
    FOR SELECT USING (
        -- Admin can see all assignments
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        -- Users can see assignments to them or their client
        assigned_to_user = auth.uid() OR
        assigned_to_client = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
    );

-- Admin can create news assignments
CREATE POLICY "Admin can create news assignments" ON public.news_assignments
    FOR INSERT WITH CHECK (
        assigned_by = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- TRIGGERS for updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_news_updated_at
    BEFORE UPDATE ON public.news
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$;

-- Function to get user's client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id(user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    client_uuid UUID;
BEGIN
    SELECT client_id INTO client_uuid
    FROM public.profiles 
    WHERE id = user_id;
    
    RETURN client_uuid;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.news TO authenticated;
GRANT ALL ON public.news_assignments TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_client_id TO authenticated;

-- =====================================================
-- CREATE VIEWS FOR EASIER QUERYING
-- =====================================================

-- View for user profiles with client information
CREATE OR REPLACE VIEW public.user_profiles_with_clients AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.client_id,
    p.created_at,
    p.updated_at,
    c.company_name,
    c.contact_email as client_email
FROM public.profiles p
LEFT JOIN public.clients c ON p.client_id = c.id;

-- View for detailed file assignments
CREATE OR REPLACE VIEW public.file_assignments_detailed AS
SELECT 
    fa.id as assignment_id,
    fa.file_id,
    f.name as filename,
    f.original_name as original_filename,
    f.file_size,
    f.mime_type as file_type,
    f.description,
    fa.assigned_to_user,
    fa.assigned_to_client,
    fa.assigned_at,
    up.full_name as user_name,
    up.email as user_email,
    c.company_name as client_name,
    ap.full_name as assigned_by_name
FROM public.file_assignments fa
LEFT JOIN public.files f ON fa.file_id = f.id
LEFT JOIN public.profiles up ON fa.assigned_to_user = up.id
LEFT JOIN public.clients c ON fa.assigned_to_client = c.id
LEFT JOIN public.profiles ap ON fa.assigned_by = ap.id;

-- View for detailed news assignments
CREATE OR REPLACE VIEW public.news_assignments_detailed AS
SELECT 
    na.id as assignment_id,
    na.news_id,
    n.title,
    n.content,
    n.created_at as news_created_at,
    na.assigned_to_user,
    na.assigned_to_client,
    na.created_at as assigned_at,
    up.full_name as user_name,
    up.email as user_email,
    c.company_name as client_name,
    ap.full_name as assigned_by_name
FROM public.news_assignments na
LEFT JOIN public.news n ON na.news_id = n.id
LEFT JOIN public.profiles up ON na.assigned_to_user = up.id
LEFT JOIN public.clients c ON na.assigned_to_client = c.id
LEFT JOIN public.profiles ap ON na.assigned_by = ap.id;

-- Grant permissions on views
GRANT SELECT ON public.user_profiles_with_clients TO authenticated;
GRANT SELECT ON public.file_assignments_detailed TO authenticated;
GRANT SELECT ON public.news_assignments_detailed TO authenticated;

-- =====================================================
-- POPULATE WITH DEMO DATA (if tables are empty)
-- =====================================================

-- Insert demo admin user profile (if it doesn't exist)
INSERT INTO public.profiles (id, email, full_name, role, client_id, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'System Administrator'),
    'admin'::user_role,
    NULL,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE au.email = 'admin@financehub.com'
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Insert demo client
INSERT INTO public.clients (id, company_name, contact_email, contact_phone, address, created_at, updated_at)
VALUES (
    'bacb2c3b-7714-494f-ad13-158d6a008b09',
    'ACME Corporation',
    'contact@acme.com',
    '+1-555-0123',
    '123 Business Street, Corporate City, CC 12345',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    updated_at = NOW();

-- Insert other demo users if they exist in auth.users
INSERT INTO public.profiles (id, email, full_name, role, client_id, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    CASE 
        WHEN au.email LIKE '%admin%' THEN 'admin'::user_role
        WHEN au.email LIKE '%client%' THEN 'client'::user_role
        ELSE 'user'::user_role
    END,
    CASE 
        WHEN au.email LIKE '%admin%' THEN NULL
        ELSE 'bacb2c3b-7714-494f-ad13-158d6a008b09'::UUID
    END,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Update client admin reference
UPDATE public.clients 
SET client_admin_id = (
    SELECT id FROM public.profiles 
    WHERE client_id = clients.id AND role = 'client' 
    LIMIT 1
)
WHERE client_admin_id IS NULL;