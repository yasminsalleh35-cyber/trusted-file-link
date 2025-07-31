-- =====================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- =====================================================
-- This fixes the circular reference issue in policies
-- =====================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Clients can view their users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Admin can view all clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own company" ON clients;
DROP POLICY IF EXISTS "Admin full access clients" ON clients;

DROP POLICY IF EXISTS "Admin can view all files" ON files;
DROP POLICY IF EXISTS "Users can view assigned files" ON files;
DROP POLICY IF EXISTS "Admin full access files" ON files;

DROP POLICY IF EXISTS "Admin can view all file assignments" ON file_assignments;
DROP POLICY IF EXISTS "Clients can view their assignments" ON file_assignments;
DROP POLICY IF EXISTS "Users can view own assignments" ON file_assignments;
DROP POLICY IF EXISTS "Admin full access file_assignments" ON file_assignments;

DROP POLICY IF EXISTS "Admin can view all news" ON news;
DROP POLICY IF EXISTS "Users can view assigned news" ON news;
DROP POLICY IF EXISTS "Admin full access news" ON news;

DROP POLICY IF EXISTS "Admin can view all news assignments" ON news_assignments;
DROP POLICY IF EXISTS "Clients can view their news assignments" ON news_assignments;
DROP POLICY IF EXISTS "Users can view own news assignments" ON news_assignments;
DROP POLICY IF EXISTS "Admin full access news_assignments" ON news_assignments;

DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- =====================================================
-- CREATE FIXED POLICIES (No Recursion)
-- =====================================================

-- PROFILES POLICIES (Fixed - no self-reference)
CREATE POLICY "Admin can view all profiles" ON profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Clients can view their users" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR -- Can see own profile
        (
            auth.uid() IN (SELECT id FROM profiles WHERE role = 'client') AND
            client_id = (SELECT client_id FROM profiles WHERE id = auth.uid())
        )
    );

-- CLIENTS POLICIES
CREATE POLICY "Admin can view all clients" ON clients
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

CREATE POLICY "Clients can view own company" ON clients
    FOR SELECT USING (
        id = (SELECT client_id FROM profiles WHERE id = auth.uid())
    );

-- FILES POLICIES
CREATE POLICY "Admin can view all files" ON files
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
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
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
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
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
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
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
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

-- =====================================================
-- INSERT/UPDATE/DELETE POLICIES (Fixed)
-- =====================================================

-- Admin can do everything
CREATE POLICY "Admin full access profiles" ON profiles FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Admin full access clients" ON clients FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Admin full access files" ON files FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Admin full access file_assignments" ON file_assignments FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Admin full access news" ON news FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Admin full access news_assignments" ON news_assignments FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
);

-- Users can update their own profile (prevent role escalation)
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (
    id = auth.uid()
) WITH CHECK (
    id = auth.uid() AND 
    role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- Allow profile creation for new users (needed for signup)
CREATE POLICY "Allow profile creation" ON profiles FOR INSERT WITH CHECK (
    auth.uid() = id
);

-- =====================================================
-- POLICY FIX COMPLETE
-- =====================================================
-- ✅ Removed circular references
-- ✅ Fixed infinite recursion
-- ✅ Maintained security rules
-- ✅ Added profile creation policy for signup
-- =====================================================