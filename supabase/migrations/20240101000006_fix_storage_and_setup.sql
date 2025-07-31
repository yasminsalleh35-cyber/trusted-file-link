-- Fix storage bucket and ensure proper setup
-- This migration ensures the storage bucket works and creates test data

-- First, ensure the storage bucket exists with simpler policies
DELETE FROM storage.buckets WHERE id = 'files';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  false,
  104857600, -- 100MB limit
  NULL -- Allow all file types for now
) ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Admin can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Client can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view all files" ON storage.objects;
DROP POLICY IF EXISTS "Client can view their uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "User can view assigned files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create simpler storage policies that work
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'files' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can view files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'files' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'files' AND
    (owner = auth.uid() OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ))
  );

-- Ensure we have proper profiles for existing users
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'role', 'user'),
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Create a default admin user if none exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
        -- Create admin profile for the first user or a specific email
        UPDATE public.profiles 
        SET role = 'admin', full_name = 'System Admin'
        WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
    END IF;
END $$;

-- Create a test client if none exists
INSERT INTO public.clients (id, company_name, contact_email, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Test Company',
    'test@company.com',
    NOW(),
    NOW()
) ON CONFLICT (company_name) DO NOTHING;

-- Update profiles to have client_id for client role users
UPDATE public.profiles 
SET client_id = (SELECT id FROM public.clients LIMIT 1)
WHERE role = 'client' AND client_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Grant necessary permissions
GRANT ALL ON public.files TO authenticated;
GRANT ALL ON public.file_assignments TO authenticated;
GRANT ALL ON public.file_access_logs TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.clients TO authenticated;

-- Enable RLS on all tables
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies for development
CREATE POLICY "Allow all for authenticated users" ON public.files
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON public.file_assignments
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON public.file_access_logs
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON public.profiles
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON public.clients
    FOR ALL USING (auth.uid() IS NOT NULL);