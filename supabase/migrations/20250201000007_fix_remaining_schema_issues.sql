-- =====================================================
-- FINAL SCHEMA FIXES: Resolve remaining inconsistencies
-- =====================================================
-- This migration fixes the remaining schema issues and
-- ensures all foreign key references are correct
-- =====================================================

-- Fix foreign key references in files table to use profiles instead of auth.users
DO $$
BEGIN
    -- Drop existing foreign key constraint on uploaded_by if it references auth.users
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'files'
        AND kcu.column_name = 'uploaded_by'
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'auth'
    ) THEN
        -- Find the constraint name and drop it
        EXECUTE (
            SELECT 'ALTER TABLE public.files DROP CONSTRAINT ' || tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public' 
            AND tc.table_name = 'files'
            AND kcu.column_name = 'uploaded_by'
            AND ccu.table_name = 'users'
            AND ccu.table_schema = 'auth'
            LIMIT 1
        );
        
        -- Add new constraint referencing profiles
        ALTER TABLE public.files 
        ADD CONSTRAINT files_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix foreign key references in file_assignments table
DO $$
BEGIN
    -- Fix assigned_to column to reference profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'file_assignments'
        AND kcu.column_name = 'assigned_to'
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'auth'
    ) THEN
        -- Find the constraint name and drop it
        EXECUTE (
            SELECT 'ALTER TABLE public.file_assignments DROP CONSTRAINT ' || tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public' 
            AND tc.table_name = 'file_assignments'
            AND kcu.column_name = 'assigned_to'
            AND ccu.table_name = 'users'
            AND ccu.table_schema = 'auth'
            LIMIT 1
        );
        
        -- Add new constraint referencing profiles
        ALTER TABLE public.file_assignments 
        ADD CONSTRAINT file_assignments_assigned_to_fkey 
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Fix assigned_by column to reference profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'file_assignments'
        AND kcu.column_name = 'assigned_by'
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'auth'
    ) THEN
        -- Find the constraint name and drop it
        EXECUTE (
            SELECT 'ALTER TABLE public.file_assignments DROP CONSTRAINT ' || tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public' 
            AND tc.table_name = 'file_assignments'
            AND kcu.column_name = 'assigned_by'
            AND ccu.table_name = 'users'
            AND ccu.table_schema = 'auth'
            LIMIT 1
        );
        
        -- Add new constraint referencing profiles
        ALTER TABLE public.file_assignments 
        ADD CONSTRAINT file_assignments_assigned_by_fkey 
        FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix foreign key references in file_access_logs table
DO $$
BEGIN
    -- Fix user_id column to reference profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'file_access_logs'
        AND kcu.column_name = 'user_id'
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'auth'
    ) THEN
        -- Find the constraint name and drop it
        EXECUTE (
            SELECT 'ALTER TABLE public.file_access_logs DROP CONSTRAINT ' || tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public' 
            AND tc.table_name = 'file_access_logs'
            AND kcu.column_name = 'user_id'
            AND ccu.table_name = 'users'
            AND ccu.table_schema = 'auth'
            LIMIT 1
        );
        
        -- Add new constraint referencing profiles
        ALTER TABLE public.file_access_logs 
        ADD CONSTRAINT file_access_logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix foreign key references in file_versions table
DO $$
BEGIN
    -- Fix uploaded_by column to reference profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'file_versions'
        AND kcu.column_name = 'uploaded_by'
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'auth'
    ) THEN
        -- Find the constraint name and drop it
        EXECUTE (
            SELECT 'ALTER TABLE public.file_versions DROP CONSTRAINT ' || tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public' 
            AND tc.table_name = 'file_versions'
            AND kcu.column_name = 'uploaded_by'
            AND ccu.table_name = 'users'
            AND ccu.table_schema = 'auth'
            LIMIT 1
        );
        
        -- Add new constraint referencing profiles
        ALTER TABLE public.file_versions 
        ADD CONSTRAINT file_versions_uploaded_by_fkey 
        FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix the file_assignments constraint to match our intended logic
-- Drop the old constraint and add the correct one
ALTER TABLE public.file_assignments 
DROP CONSTRAINT IF EXISTS check_assignment_target;

-- Add the correct constraint that enforces either user OR client assignment (not both)
ALTER TABLE public.file_assignments 
ADD CONSTRAINT check_file_assignment_logic CHECK (
    (assigned_to IS NOT NULL AND assigned_to_client IS NULL) OR
    (assigned_to IS NULL AND assigned_to_client IS NOT NULL)
);

-- Rename assigned_to to assigned_to_user for consistency
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'file_assignments' 
        AND column_name = 'assigned_to'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'file_assignments' 
        AND column_name = 'assigned_to_user'
    ) THEN
        ALTER TABLE public.file_assignments 
        RENAME COLUMN assigned_to TO assigned_to_user;
    END IF;
END $$;

-- Update the constraint to use the new column name
ALTER TABLE public.file_assignments 
DROP CONSTRAINT IF EXISTS check_file_assignment_logic;

ALTER TABLE public.file_assignments 
ADD CONSTRAINT check_file_assignment_logic CHECK (
    (assigned_to_user IS NOT NULL AND assigned_to_client IS NULL) OR
    (assigned_to_user IS NULL AND assigned_to_client IS NOT NULL)
);

-- Add missing metadata column to files table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.files 
        ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create the missing get_user_client_id function
CREATE OR REPLACE FUNCTION public.get_user_client_id(user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    client_uuid UUID;
BEGIN
    SELECT client_id INTO client_uuid
    FROM public.profiles 
    WHERE id = user_id;
    
    RETURN client_uuid;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_client_id TO authenticated;

-- Update the get_user_files function to work with corrected schema
CREATE OR REPLACE FUNCTION public.get_user_files(
    p_user_id UUID DEFAULT auth.uid(),
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    file_id UUID,
    file_name TEXT,
    original_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    uploaded_by_name TEXT,
    uploaded_by_role TEXT,
    assignment_type TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE,
    assigned_by_name TEXT,
    last_accessed TIMESTAMP WITH TIME ZONE,
    access_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as file_id,
        f.name as file_name,
        f.original_name,
        f.file_size,
        f.mime_type,
        f.uploaded_at,
        up.full_name as uploaded_by_name,
        up.role::TEXT as uploaded_by_role,
        fa.assignment_type,
        fa.assigned_at,
        ap.full_name as assigned_by_name,
        MAX(fal.accessed_at) as last_accessed,
        COUNT(fal.id) as access_count
    FROM public.files f
    JOIN public.file_assignments fa ON fa.file_id = f.id
    JOIN public.profiles up ON up.id = f.uploaded_by
    JOIN public.profiles ap ON ap.id = fa.assigned_by
    LEFT JOIN public.file_access_logs fal ON fal.file_id = f.id AND fal.user_id = p_user_id
    WHERE f.is_active = true 
    AND fa.is_active = true
    AND (
        fa.assigned_to_user = p_user_id
        OR (
            fa.assigned_to_client = (
                SELECT client_id FROM public.profiles WHERE id = p_user_id
            )
        )
    )
    GROUP BY f.id, f.name, f.original_name, f.file_size, f.mime_type, f.uploaded_at, 
             up.full_name, up.role, fa.assignment_type, fa.assigned_at, ap.full_name
    ORDER BY fa.assigned_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_files TO authenticated;

-- Update RLS policies to work with corrected foreign key references
-- Drop old policies that might reference auth.users
DROP POLICY IF EXISTS "Users can view files based on role and assignments" ON public.files;
DROP POLICY IF EXISTS "Users can view assignments based on role" ON public.file_assignments;

-- Create corrected RLS policies for files
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
                fa.assigned_to_user = auth.uid()
                OR (
                    fa.assignment_type IN ('client', 'all_users_in_client')
                    AND fa.assigned_to_client = (
                        SELECT client_id FROM public.profiles WHERE id = auth.uid()
                    )
                )
            )
        )
    );

-- Create corrected RLS policies for file_assignments
CREATE POLICY "Users can view assignments based on role" ON public.file_assignments
    FOR SELECT USING (
        -- Admins can see all assignments
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        OR
        -- Users can see assignments to them
        assigned_to_user = auth.uid()
        OR
        -- Users can see assignments to their client
        assigned_to_client = (SELECT client_id FROM public.profiles WHERE id = auth.uid())
        OR
        -- Users can see assignments they created
        assigned_by = auth.uid()
    );

-- Update indexes to match new column names
DROP INDEX IF EXISTS idx_file_assignments_assigned_to;
CREATE INDEX IF NOT EXISTS idx_file_assignments_assigned_to_user ON public.file_assignments(assigned_to_user);

-- Create a demo client if none exists
INSERT INTO public.clients (id, company_name, contact_email, contact_phone, address, created_at, updated_at)
VALUES (
    'bacb2c3b-7714-494f-ad13-158d6a008b09',
    'ACME Corporation',
    'contact@acme.com',
    '+1-555-0123',
    '123 Business Street, Corporate City, CC 12345',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    updated_at = NOW();

-- Insert additional demo clients
INSERT INTO public.clients (id, company_name, contact_email, contact_phone, address, created_at, updated_at)
VALUES 
    (
        'demo-client-2',
        'TechStart Inc.',
        'contact@techstart.com',
        '+1-555-0124',
        '456 Innovation Drive, Tech City, TC 67890',
        NOW(),
        NOW()
    ),
    (
        'demo-client-3',
        'Global Solutions Ltd.',
        'contact@globalsolutions.com',
        '+1-555-0125',
        '789 Enterprise Blvd, Business Park, BP 11111',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    updated_at = NOW();

-- Ensure all existing auth users have proper profiles
INSERT INTO public.profiles (id, email, full_name, role, client_id, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    CASE 
        WHEN au.email LIKE '%admin%' THEN 'admin'::user_role
        WHEN au.email LIKE '%client%' THEN 'client'::user_role
        ELSE 'user'::user_role
    END,
    CASE 
        WHEN au.email LIKE '%admin%' THEN NULL
        ELSE 'bacb2c3b-7714-494f-ad13-158d6a008b09'::UUID
    END,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Update client admin references
UPDATE public.clients 
SET client_admin_id = (
    SELECT id FROM public.profiles 
    WHERE client_id = clients.id AND role = 'client' 
    LIMIT 1
)
WHERE client_admin_id IS NULL;

-- Final verification: Log the schema state
DO $$
DECLARE
    table_count INTEGER;
    profile_count INTEGER;
    client_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO client_count FROM public.clients;
    
    RAISE NOTICE 'Schema fix complete: % public tables, % profiles, % clients', table_count, profile_count, client_count;
END $$;