-- =====================================================
-- CLIENT PORTAL SYSTEM - DATABASE SCHEMA (Logic 1)
-- =====================================================
-- This schema implements the core logic:
-- 1 Admin -> Multiple Clients -> Multiple Users per Client
-- Strict data isolation between clients
-- Role-based access control with messaging system
-- =====================================================

-- Create custom types for roles and message types
CREATE TYPE user_role AS ENUM ('admin', 'client', 'user');
CREATE TYPE message_type AS ENUM ('direct', 'broadcast', 'announcement');
CREATE TYPE file_status AS ENUM ('active', 'archived', 'expired');

-- =====================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CLIENTS TABLE (Companies/Organizations)
-- =====================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    address TEXT,
    client_admin_id UUID REFERENCES profiles(id), -- Main contact person
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint after clients table is created
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_client 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- =====================================================
-- 3. FILES TABLE (Document Storage Tracking)
-- =====================================================
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL, -- Display name
    original_filename TEXT NOT NULL, -- Original upload name
    file_type TEXT NOT NULL, -- MIME type
    file_size BIGINT NOT NULL, -- Size in bytes
    storage_path TEXT NOT NULL, -- Supabase storage path
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    status file_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. FILE ASSIGNMENTS (Who can access which files)
-- =====================================================
CREATE TABLE file_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    assigned_to_client UUID REFERENCES clients(id), -- If assigned to entire client
    assigned_to_user UUID REFERENCES profiles(id),  -- If assigned to specific user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either client or user is assigned, not both
    CONSTRAINT check_assignment CHECK (
        (assigned_to_client IS NOT NULL AND assigned_to_user IS NULL) OR
        (assigned_to_client IS NULL AND assigned_to_user IS NOT NULL)
    )
);

-- =====================================================
-- 5. NEWS/REPORTS TABLE (Announcements and Reports)
-- =====================================================
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Rich text content (HTML/Markdown)
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. NEWS ASSIGNMENTS (Who can see which news)
-- =====================================================
CREATE TABLE news_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    assigned_to_client UUID REFERENCES clients(id), -- If assigned to entire client
    assigned_to_user UUID REFERENCES profiles(id),  -- If assigned to specific user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either client or user is assigned, not both
    CONSTRAINT check_news_assignment CHECK (
        (assigned_to_client IS NOT NULL AND assigned_to_user IS NULL) OR
        (assigned_to_client IS NULL AND assigned_to_user IS NOT NULL)
    )
);

-- =====================================================
-- 7. MESSAGES TABLE (Communication System)
-- =====================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id),
    recipient_id UUID NOT NULL REFERENCES profiles(id),
    subject TEXT,
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'direct',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_client_id ON profiles(client_id);
CREATE INDEX idx_file_assignments_client ON file_assignments(assigned_to_client);
CREATE INDEX idx_file_assignments_user ON file_assignments(assigned_to_user);
CREATE INDEX idx_news_assignments_client ON news_assignments(assigned_to_client);
CREATE INDEX idx_news_assignments_user ON news_assignments(assigned_to_user);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES (Logic 1 Implementation)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Admin can see all profiles
CREATE POLICY "Admin can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients can only see their own users
CREATE POLICY "Clients can view their users" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR -- Can see own profile
        (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'client'
            ) AND
            client_id = (
                SELECT client_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- =====================================================
-- CLIENTS POLICIES
-- =====================================================

-- Admin can see all clients
CREATE POLICY "Admin can view all clients" ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients can only see their own company
CREATE POLICY "Clients can view own company" ON clients
    FOR SELECT USING (
        id = (SELECT client_id FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- FILES POLICIES
-- =====================================================

-- Admin can see all files
CREATE POLICY "Admin can view all files" ON files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients and Users can only see assigned files
CREATE POLICY "Users can view assigned files" ON files
    FOR SELECT USING (
        id IN (
            SELECT fa.file_id FROM file_assignments fa
            JOIN profiles p ON p.id = auth.uid()
            WHERE 
                fa.assigned_to_user = auth.uid() OR
                (fa.assigned_to_client = p.client_id AND p.client_id IS NOT NULL)
        )
    );

-- =====================================================
-- FILE ASSIGNMENTS POLICIES
-- =====================================================

-- Admin can see all file assignments
CREATE POLICY "Admin can view all file assignments" ON file_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients can see assignments for their users
CREATE POLICY "Clients can view their assignments" ON file_assignments
    FOR SELECT USING (
        assigned_to_client = (SELECT client_id FROM profiles WHERE id = auth.uid()) OR
        assigned_to_user IN (
            SELECT id FROM profiles 
            WHERE client_id = (SELECT client_id FROM profiles WHERE id = auth.uid())
        )
    );

-- Users can see their own assignments
CREATE POLICY "Users can view own assignments" ON file_assignments
    FOR SELECT USING (
        assigned_to_user = auth.uid() OR
        assigned_to_client = (SELECT client_id FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- NEWS POLICIES (Same pattern as files)
-- =====================================================

-- Admin can see all news
CREATE POLICY "Admin can view all news" ON news
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can only see assigned news
CREATE POLICY "Users can view assigned news" ON news
    FOR SELECT USING (
        id IN (
            SELECT na.news_id FROM news_assignments na
            JOIN profiles p ON p.id = auth.uid()
            WHERE 
                na.assigned_to_user = auth.uid() OR
                (na.assigned_to_client = p.client_id AND p.client_id IS NOT NULL)
        )
    );

-- =====================================================
-- MESSAGES POLICIES (Communication Rules)
-- =====================================================

-- Users can see messages they sent or received
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- =====================================================
-- INSERT/UPDATE/DELETE POLICIES
-- =====================================================

-- Admin can insert/update/delete everything
CREATE POLICY "Admin full access profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access clients" ON clients FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access files" ON files FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access file_assignments" ON file_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access news" ON news FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access news_assignments" ON news_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Users can send messages (with restrictions handled in application logic)
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (
    id = auth.uid()
) WITH CHECK (
    id = auth.uid() AND 
    -- Prevent role escalation
    role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- =====================================================
-- HELPER VIEWS for Application Logic
-- =====================================================

-- View to get user details with client information
CREATE VIEW user_profiles_with_clients AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.client_id,
    c.company_name,
    c.contact_email as client_email,
    p.created_at,
    p.updated_at
FROM profiles p
LEFT JOIN clients c ON p.client_id = c.id;

-- View to get file assignments with details
CREATE VIEW file_assignments_detailed AS
SELECT 
    fa.id,
    fa.file_id,
    f.filename,
    f.file_type,
    f.file_size,
    fa.assigned_by,
    fa.assigned_to_client,
    fa.assigned_to_user,
    c.company_name as client_name,
    u.full_name as user_name,
    u.email as user_email,
    fa.created_at
FROM file_assignments fa
JOIN files f ON fa.file_id = f.id
LEFT JOIN clients c ON fa.assigned_to_client = c.id
LEFT JOIN profiles u ON fa.assigned_to_user = u.id;

-- View to get news assignments with details
CREATE VIEW news_assignments_detailed AS
SELECT 
    na.id,
    na.news_id,
    n.title,
    n.content,
    na.assigned_by,
    na.assigned_to_client,
    na.assigned_to_user,
    c.company_name as client_name,
    u.full_name as user_name,
    u.email as user_email,
    na.created_at
FROM news_assignments na
JOIN news n ON na.news_id = n.id
LEFT JOIN clients c ON na.assigned_to_client = c.id
LEFT JOIN profiles u ON na.assigned_to_user = u.id;

-- =====================================================
-- FUNCTIONS for Business Logic
-- =====================================================

-- Function to check if user can message another user (Logic 1 rules)
CREATE OR REPLACE FUNCTION can_send_message(sender_id UUID, recipient_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sender_role user_role;
    recipient_role user_role;
    sender_client_id UUID;
    recipient_client_id UUID;
BEGIN
    -- Get sender info
    SELECT role, client_id INTO sender_role, sender_client_id
    FROM profiles WHERE id = sender_id;
    
    -- Get recipient info
    SELECT role, client_id INTO recipient_role, recipient_client_id
    FROM profiles WHERE id = recipient_id;
    
    -- Admin can message anyone
    IF sender_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Anyone can message admin
    IF recipient_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Client can message their own users
    IF sender_role = 'client' AND recipient_role = 'user' AND 
       sender_client_id = recipient_client_id THEN
        RETURN TRUE;
    END IF;
    
    -- User can message their client
    IF sender_role = 'user' AND recipient_role = 'client' AND 
       sender_client_id = recipient_client_id THEN
        RETURN TRUE;
    END IF;
    
    -- No client-to-client communication allowed
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS for Automatic Updates
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET SETUP (Run this after creating tables)
-- =====================================================

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('client-files', 'client-files', false);

-- Storage policies for file access
CREATE POLICY "Admin can upload files" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'client-files' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin can view all files" ON storage.objects FOR SELECT USING (
    bucket_id = 'client-files' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view assigned files" ON storage.objects FOR SELECT USING (
    bucket_id = 'client-files' AND
    name IN (
        SELECT f.storage_path FROM files f
        JOIN file_assignments fa ON f.id = fa.file_id
        JOIN profiles p ON p.id = auth.uid()
        WHERE 
            fa.assigned_to_user = auth.uid() OR
            (fa.assigned_to_client = p.client_id AND p.client_id IS NOT NULL)
    )
);

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample admin user (you'll need to create this user in Supabase Auth first)
-- INSERT INTO profiles (id, email, full_name, role) VALUES 
-- ('your-admin-user-id-here', 'admin@yourcompany.com', 'System Administrator', 'admin');

-- Insert sample client
-- INSERT INTO clients (id, company_name, contact_email) VALUES 
-- ('client-1-id', 'TechCorp Inc.', 'contact@techcorp.com');

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- This schema implements Logic 1 with:
-- ✅ 1 Admin -> Multiple Clients -> Multiple Users
-- ✅ Strict data isolation between clients
-- ✅ Role-based access control
-- ✅ File assignment system
-- ✅ News/announcement system
-- ✅ Messaging with communication rules
-- ✅ Row Level Security for data protection
-- ✅ Storage bucket for file uploads
-- =====================================================