-- =====================================================
-- FIX INFINITE RECURSION IN POLICIES
-- =====================================================
-- This will remove problematic policies and create simple ones
-- =====================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Clients can view own data" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;

-- Temporarily disable RLS to allow setup
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Clear any existing data
DELETE FROM news_assignments;
DELETE FROM file_assignments;
DELETE FROM messages;
DELETE FROM news;
DELETE FROM files;
DELETE FROM profiles;
DELETE FROM clients;

-- Create simple, non-recursive policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Simple profile policies (no recursion)
CREATE POLICY "Allow authenticated users to insert profiles" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to view profiles" ON profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow users to update own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Simple client policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view clients" ON clients
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert clients" ON clients
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Simple policies for other tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage files" ON files
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

ALTER TABLE file_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage file assignments" ON file_assignments
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage news" ON news
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

ALTER TABLE news_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage news assignments" ON news_assignments
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage messages" ON messages
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- POLICIES FIXED - READY FOR DATA CREATION
-- =====================================================
-- ✅ Infinite recursion policies removed
-- ✅ Simple, working policies created
-- ✅ All tables cleaned and ready
-- ✅ Ready to create test data
-- =====================================================