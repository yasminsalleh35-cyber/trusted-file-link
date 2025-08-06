-- Fix Profiles RLS Policies
-- This migration fixes the circular dependency issues in profiles table policies

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Clients can view their users" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during registration" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile read for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile delete for own profile" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- 1. Allow users to read their own profile (no recursion)
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 2. Allow users to update their own profile (no recursion)
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. Allow profile creation during registration (no recursion)
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Allow users to delete their own profile (no recursion)
CREATE POLICY "profiles_delete_own" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- 5. Special policy for service role (bypasses RLS)
-- This allows the application to read profiles for authentication
CREATE POLICY "profiles_service_role_access" ON public.profiles
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Create a function to get user role (for use in other policies)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN COALESCE(user_role, 'user');
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO service_role;

-- Update other table policies to use the function instead of direct profile queries
-- This avoids the circular dependency

-- Fix clients table policies
DROP POLICY IF EXISTS "Admin can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view own company" ON public.clients;
DROP POLICY IF EXISTS "Allow client creation during registration" ON public.clients;
DROP POLICY IF EXISTS "Allow client read for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Allow client update for admin or client admin" ON public.clients;
DROP POLICY IF EXISTS "Allow client delete for admin" ON public.clients;

CREATE POLICY "clients_admin_all" ON public.clients
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "clients_select_own" ON public.clients
    FOR SELECT USING (
        id = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "clients_insert_authenticated" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix files table policies to use the function
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Admins can manage all files" ON public.files;
DROP POLICY IF EXISTS "Users can view assigned files" ON public.files;

CREATE POLICY "files_admin_all" ON public.files
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "files_select_own" ON public.files
    FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "files_select_assigned" ON public.files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.file_assignments fa
            WHERE fa.file_id = files.id
            AND (
                fa.assigned_to = auth.uid() OR
                fa.assigned_to_client = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
            )
            AND fa.is_active = true
            AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
        )
    );

-- Fix file_assignments table policies
DROP POLICY IF EXISTS "Users can view their assignments" ON public.file_assignments;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.file_assignments;

CREATE POLICY "file_assignments_admin_all" ON public.file_assignments
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "file_assignments_select_own" ON public.file_assignments
    FOR SELECT USING (
        assigned_to = auth.uid() OR
        assigned_to_client = (SELECT client_id FROM public.profiles WHERE id = auth.uid()) OR
        assigned_by = auth.uid()
    );

-- Create a trigger to automatically create profiles for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE 'Fixed profiles RLS policies - removed circular dependencies';
    RAISE NOTICE 'Created helper function get_user_role() for other policies';
    RAISE NOTICE 'Added automatic profile creation trigger';
END $$;