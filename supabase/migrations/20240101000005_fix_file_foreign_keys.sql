-- Fix foreign key relationships for file system tables
-- This migration ensures proper relationships between files/assignments and profiles

-- First, let's make sure all users have profiles
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    COALESCE(au.raw_user_meta_data->>'role', 'user'),
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Update files table to ensure all uploaded_by references exist in profiles
UPDATE public.files 
SET uploaded_by = (
    SELECT id FROM public.profiles 
    WHERE email = 'admin@example.com' 
    LIMIT 1
)
WHERE uploaded_by NOT IN (SELECT id FROM public.profiles);

-- Update file_assignments to ensure all user references exist in profiles
UPDATE public.file_assignments 
SET assigned_by = (
    SELECT id FROM public.profiles 
    WHERE email = 'admin@example.com' 
    LIMIT 1
)
WHERE assigned_by NOT IN (SELECT id FROM public.profiles);

UPDATE public.file_assignments 
SET assigned_to = NULL
WHERE assigned_to IS NOT NULL 
AND assigned_to NOT IN (SELECT id FROM public.profiles);

-- Create a function to log file access
CREATE OR REPLACE FUNCTION public.log_file_access(
    p_file_id UUID,
    p_access_type TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.file_access_logs (
        file_id,
        user_id,
        access_type,
        accessed_at,
        ip_address
    ) VALUES (
        p_file_id,
        auth.uid(),
        p_access_type,
        NOW(),
        inet_client_addr()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.log_file_access(UUID, TEXT) TO authenticated;

-- Create a function to get user files based on assignments
CREATE OR REPLACE FUNCTION public.get_user_files(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    name TEXT,
    original_name TEXT,
    file_path TEXT,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ,
    uploaded_by UUID,
    description TEXT,
    tags TEXT[],
    access_level TEXT,
    is_active BOOLEAN,
    uploader_name TEXT,
    uploader_role TEXT,
    assignment_id UUID,
    assigned_at TIMESTAMPTZ,
    assignment_type TEXT,
    assignment_notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.original_name,
        f.file_path,
        f.file_size,
        f.mime_type,
        f.uploaded_at,
        f.uploaded_by,
        f.description,
        f.tags,
        f.access_level,
        f.is_active,
        p.full_name as uploader_name,
        p.role as uploader_role,
        fa.id as assignment_id,
        fa.assigned_at,
        fa.assignment_type,
        fa.notes as assignment_notes
    FROM public.files f
    JOIN public.file_assignments fa ON fa.file_id = f.id
    JOIN public.profiles p ON p.id = f.uploaded_by
    WHERE f.is_active = true 
    AND fa.is_active = true
    AND (
        fa.assigned_to = user_id
        OR (
            fa.assignment_type = 'all_users_in_client' 
            AND fa.assigned_to_client = (
                SELECT client_id FROM public.profiles WHERE id = user_id
            )
        )
        OR (
            fa.assignment_type = 'client'
            AND fa.assigned_to_client = (
                SELECT client_id FROM public.profiles WHERE id = user_id
            )
            AND (SELECT role FROM public.profiles WHERE id = user_id) = 'client'
        )
    )
    ORDER BY fa.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_files(UUID) TO authenticated;

-- Update RLS policies to be more permissive for development
DROP POLICY IF EXISTS "Users can view assigned files" ON public.files;
CREATE POLICY "Users can view assigned files" ON public.files
    FOR SELECT USING (
        -- Admins can see all files
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        OR
        -- Clients can see files they uploaded
        (uploaded_by = auth.uid() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'client')
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

-- Update file assignments RLS policies
DROP POLICY IF EXISTS "Users can view their assignments" ON public.file_assignments;
CREATE POLICY "Users can view their assignments" ON public.file_assignments
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