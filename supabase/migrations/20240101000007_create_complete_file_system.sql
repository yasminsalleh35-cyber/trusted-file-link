-- Complete File System Setup
-- This migration creates all necessary tables and storage bucket

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  false,
  104857600, -- 100MB limit
  NULL -- Allow all file types
) ON CONFLICT (id) DO NOTHING;

-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT,
    tags TEXT[],
    access_level TEXT NOT NULL DEFAULT 'private' CHECK (access_level IN ('private', 'client', 'public')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create file_assignments table
CREATE TABLE IF NOT EXISTS public.file_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to_client UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('user', 'client', 'all_users_in_client')),
    notes TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure at least one assignment target is specified
    CONSTRAINT check_assignment_target CHECK (
        (assigned_to IS NOT NULL) OR (assigned_to_client IS NOT NULL)
    )
);

-- Create file_access_logs table
CREATE TABLE IF NOT EXISTS public.file_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'preview')),
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create file_versions table
CREATE TABLE IF NOT EXISTS public.file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    change_notes TEXT,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(file_id, version_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_is_active ON public.files(is_active);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON public.files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_file_assignments_file_id ON public.file_assignments(file_id);
CREATE INDEX IF NOT EXISTS idx_file_assignments_assigned_to ON public.file_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_file_assignments_assigned_to_client ON public.file_assignments(assigned_to_client);
CREATE INDEX IF NOT EXISTS idx_file_assignments_is_active ON public.file_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON public.file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON public.file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_accessed_at ON public.file_access_logs(accessed_at);

-- Enable RLS on all tables
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for files table
CREATE POLICY "Users can view files based on role and assignments" ON public.files
    FOR SELECT USING (
        -- Admins can see all files
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        OR
        -- Users can see files they uploaded
        uploaded_by = auth.uid()
        OR
        -- Users can see files assigned to them
        EXISTS (
            SELECT 1 FROM public.file_assignments fa
            WHERE fa.file_id = id
            AND fa.is_active = true
            AND (
                fa.assigned_to = auth.uid()
                OR (
                    fa.assignment_type IN ('client', 'all_users_in_client')
                    AND fa.assigned_to_client = (
                        SELECT client_id FROM public.profiles WHERE id = auth.uid()
                    )
                )
            )
        )
    );

CREATE POLICY "Authenticated users can insert files" ON public.files
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their own files or admins can update any" ON public.files
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Users can delete their own files or admins can delete any" ON public.files
    FOR DELETE USING (
        uploaded_by = auth.uid()
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- Create RLS policies for file_assignments table
CREATE POLICY "Users can view assignments based on role" ON public.file_assignments
    FOR SELECT USING (
        -- Admins can see all assignments
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        OR
        -- Users can see assignments to them
        assigned_to = auth.uid()
        OR
        -- Users can see assignments to their client
        assigned_to_client = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
        OR
        -- Users can see assignments they created
        assigned_by = auth.uid()
    );

CREATE POLICY "Admins and clients can create assignments" ON public.file_assignments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND assigned_by = auth.uid()
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'client')
    );

CREATE POLICY "Users can update assignments they created or admins can update any" ON public.file_assignments
    FOR UPDATE USING (
        assigned_by = auth.uid()
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- Create RLS policies for file_access_logs table
CREATE POLICY "Users can view their own access logs or admins can view all" ON public.file_access_logs
    FOR SELECT USING (
        user_id = auth.uid()
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Authenticated users can insert access logs" ON public.file_access_logs
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

-- Create storage policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'files'
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can view files they have access to" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'files'
        AND auth.uid() IS NOT NULL
        AND (
            -- Admins can access all files
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
            OR
            -- Users can access files they uploaded
            owner = auth.uid()
            OR
            -- Users can access files assigned to them
            EXISTS (
                SELECT 1 FROM public.files f
                JOIN public.file_assignments fa ON fa.file_id = f.id
                WHERE f.file_path = name
                AND fa.is_active = true
                AND (
                    fa.assigned_to = auth.uid()
                    OR (
                        fa.assignment_type IN ('client', 'all_users_in_client')
                        AND fa.assigned_to_client = (
                            SELECT client_id FROM public.profiles WHERE id = auth.uid()
                        )
                    )
                )
            )
        )
    );

CREATE POLICY "Users can delete files they own or admins can delete any" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'files'
        AND (
            owner = auth.uid()
            OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_file_assignments_updated_at
    BEFORE UPDATE ON public.file_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.files TO authenticated;
GRANT ALL ON public.file_assignments TO authenticated;
GRANT ALL ON public.file_access_logs TO authenticated;
GRANT ALL ON public.file_versions TO authenticated;

-- Ensure all existing users have profiles
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'role', 'admin'),
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();