-- =====================================================
-- CLEAN UP AND RESET DATABASE
-- =====================================================
-- This will remove all existing data and reset for fresh start
-- =====================================================

-- Disable RLS temporarily for cleanup
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Delete all data (in correct order to respect foreign keys)
DELETE FROM news_assignments;
DELETE FROM file_assignments;
DELETE FROM messages;
DELETE FROM news;
DELETE FROM files;
DELETE FROM profiles;
DELETE FROM clients;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Reset sequences (if any)
-- Note: UUIDs don't use sequences, but this is here for completeness

-- =====================================================
-- DATABASE CLEANED - READY FOR FRESH DATA
-- =====================================================
-- ✅ All tables emptied
-- ✅ RLS re-enabled
-- ✅ Ready for new user creation
-- =====================================================