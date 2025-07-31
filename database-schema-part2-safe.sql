-- =====================================================
-- CLIENT PORTAL SYSTEM - DATABASE SCHEMA PART 2 (SAFE)
-- =====================================================
-- Run this AFTER Part 1 completes successfully
-- This version handles existing policies gracefully
-- =====================================================

-- =====================================================
-- ROW LEVEL SECURITY POLICIES (Logic 1 Implementation)
-- =====================================================

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP EXISTING POLICIES (if they exist)
-- =====================================================

-- Drop profiles policies
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Clients can view their users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop clients policies
DROP POLICY IF EXISTS "Admin can view all clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own company" ON clients;
DROP POLICY IF EXISTS "Admin full access clients" ON clients;

-- Drop files policies
DROP POLICY IF EXISTS "Admin can view all files" ON files;
DROP POLICY IF EXISTS "Users can view assigned files" ON files;
DROP POLICY IF EXISTS "Admin full access files" ON files;

-- Drop file_assignments policies
DROP POLICY IF EXISTS "Admin can view all file assignments" ON file_assignments;
DROP POLICY IF EXISTS "Clients can view their assignments" ON file_assignments;
DROP POLICY IF EXISTS "Users can view own assignments" ON file_assignments;
DROP POLICY IF EXISTS "Admin full access file_assignments" ON file_assignments;

-- Drop news policies
DROP POLICY IF EXISTS "Admin can view all news" ON news;
DROP POLICY IF EXISTS "Users can view assigned news" ON news;
DROP POLICY IF EXISTS "Admin full access news" ON news;

-- Drop news_assignments policies
DROP POLICY IF EXISTS "Admin can view all news assignments" ON news_assignments;
DROP POLICY IF EXISTS "Clients can view their news assignments" ON news_assignments;
DROP POLICY IF EXISTS "Users can view own news assignments" ON news_assignments;
DROP POLICY IF EXISTS "Admin full access news_assignments" ON news_assignments;

-- Drop messages policies
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Drop storage policies
DROP POLICY IF EXISTS "Admin can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view all files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view assigned files" ON storage.objects;

-- =====================================================
-- CREATE FRESH POLICIES
-- =====================================================

-- PROFILES POLICIES
CREATE POLICY "Admin can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

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

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- CLIENTS POLICIES
CREATE POLICY "Admin can view all clients" ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Clients can view own company" ON clients
    FOR SELECT USING (
        id = (SELECT client_id FROM profiles WHERE id = auth.uid())
    );

-- FILES POLICIES
CREATE POLICY "Admin can view all files" ON files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

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

-- FILE ASSIGNMENTS POLICIES
CREATE POLICY "Admin can view all file assignments" ON file_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Clients can view their assignments" ON file_assignments
    FOR SELECT USING (
        assigned_to_client = (SELECT client_id FROM profiles WHERE id = auth.uid()) OR
        assigned_to_user IN (
            SELECT id FROM profiles 
            WHERE client_id = (SELECT client_id FROM profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can view own assignments" ON file_assignments
    FOR SELECT USING (
        assigned_to_user = auth.uid() OR
        assigned_to_client = (SELECT client_id FROM profiles WHERE id = auth.uid())
    );

-- NEWS POLICIES
CREATE POLICY "Admin can view all news" ON news
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

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

-- NEWS ASSIGNMENTS POLICIES
CREATE POLICY "Admin can view all news assignments" ON news_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Clients can view their news assignments" ON news_assignments
    FOR SELECT USING (
        assigned_to_client = (SELECT client_id FROM profiles WHERE id = auth.uid()) OR
        assigned_to_user IN (
            SELECT id FROM profiles 
            WHERE client_id = (SELECT client_id FROM profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can view own news assignments" ON news_assignments
    FOR SELECT USING (
        assigned_to_user = auth.uid() OR
        assigned_to_client = (SELECT client_id FROM profiles WHERE id = auth.uid())
    );

-- MESSAGES POLICIES
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- INSERT/UPDATE/DELETE POLICIES
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

CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
);

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (
    id = auth.uid()
) WITH CHECK (
    id = auth.uid() AND 
    role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- =====================================================
-- HELPER VIEWS (Drop and recreate)
-- =====================================================

DROP VIEW IF EXISTS user_profiles_with_clients;
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

DROP VIEW IF EXISTS file_assignments_detailed;
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

DROP VIEW IF EXISTS news_assignments_detailed;
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
-- FUNCTIONS (Replace existing)
-- =====================================================

CREATE OR REPLACE FUNCTION can_send_message(sender_id UUID, recipient_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sender_role user_role;
    recipient_role user_role;
    sender_client_id UUID;
    recipient_client_id UUID;
BEGIN
    SELECT role, client_id INTO sender_role, sender_client_id
    FROM profiles WHERE id = sender_id;
    
    SELECT role, client_id INTO recipient_role, recipient_client_id
    FROM profiles WHERE id = recipient_id;
    
    IF sender_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    IF recipient_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    IF sender_role = 'client' AND recipient_role = 'user' AND 
       sender_client_id = recipient_client_id THEN
        RETURN TRUE;
    END IF;
    
    IF sender_role = 'user' AND recipient_role = 'client' AND 
       sender_client_id = recipient_client_id THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS (Drop and recreate)
-- =====================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_news_updated_at ON news;
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET SETUP (Safe)
-- =====================================================

-- Create storage bucket (ignore if exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-files', 'client-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
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
-- PART 2 COMPLETE - SCHEMA FULLY IMPLEMENTED
-- =====================================================
-- ✅ Row Level Security enabled
-- ✅ All access policies implemented (fresh)
-- ✅ Helper views created
-- ✅ Business logic functions added
-- ✅ Storage bucket and policies set up
-- ✅ Triggers for automatic updates
-- 
-- Schema is now ready for application integration!
-- =====================================================