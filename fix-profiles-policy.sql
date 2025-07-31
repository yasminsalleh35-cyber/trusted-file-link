-- Check current RLS policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Disable RLS temporarily to allow registration
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Or create a proper policy that doesn't cause recursion
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
-- DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create simple policies that don't cause recursion
-- CREATE POLICY "Enable insert for authenticated users" ON profiles
--   FOR INSERT TO authenticated
--   WITH CHECK (auth.uid() = id);

-- CREATE POLICY "Enable select for authenticated users" ON profiles
--   FOR SELECT TO authenticated
--   USING (auth.uid() = id);

-- CREATE POLICY "Enable update for authenticated users" ON profiles
--   FOR UPDATE TO authenticated
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- Re-enable RLS after fixing
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;