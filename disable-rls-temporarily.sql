-- Temporarily disable RLS on profiles table to allow registration
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Check if RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';