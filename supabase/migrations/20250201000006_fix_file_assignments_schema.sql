-- =====================================================
-- CRITICAL FIX: Fix File Assignments Table Schema
-- =====================================================
-- This migration fixes the file_assignments table to match
-- the intended design and ensures proper constraints
-- =====================================================

-- First, let's check if the table exists and what columns it has
-- We need to handle the column naming inconsistency

-- Drop existing constraint that might be incorrect
ALTER TABLE public.file_assignments 
DROP CONSTRAINT IF EXISTS file_assignments_target_check;

ALTER TABLE public.file_assignments 
DROP CONSTRAINT IF EXISTS check_assignment_target;

-- Rename columns to match the intended schema if they exist with wrong names
DO $$ 
BEGIN
    -- Check if 'assigned_to' column exists and rename it to 'assigned_to_user'
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

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add assignment_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'file_assignments' 
        AND column_name = 'assignment_type'
    ) THEN
        ALTER TABLE public.file_assignments 
        ADD COLUMN assignment_type TEXT DEFAULT 'user' CHECK (assignment_type IN ('user', 'client', 'all_users_in_client'));
    END IF;

    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'file_assignments' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.file_assignments 
        ADD COLUMN notes TEXT;
    END IF;

    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'file_assignments' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE public.file_assignments 
        ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'file_assignments' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.file_assignments 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add assigned_at column if it doesn't exist (rename from created_at if needed)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'file_assignments' 
        AND column_name = 'assigned_at'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'file_assignments' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.file_assignments 
        RENAME COLUMN created_at TO assigned_at;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'file_assignments' 
        AND column_name = 'assigned_at'
    ) THEN
        ALTER TABLE public.file_assignments 
        ADD COLUMN assigned_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'file_assignments' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.file_assignments 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Now add the correct constraint for assignment logic
-- This implements the intended business logic: either assign to a specific user OR to a client (but not both)
ALTER TABLE public.file_assignments 
ADD CONSTRAINT check_file_assignment_target CHECK (
    (assigned_to_user IS NOT NULL AND assigned_to_client IS NULL) OR
    (assigned_to_user IS NULL AND assigned_to_client IS NOT NULL) OR
    (assignment_type = 'all_users_in_client' AND assigned_to_client IS NOT NULL AND assigned_to_user IS NULL)
);

-- Update foreign key constraints to reference profiles instead of auth.users where appropriate
-- First, let's check and fix the assigned_by constraint
DO $$
BEGIN
    -- Drop existing foreign key constraint on assigned_by if it references auth.users
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

-- Fix assigned_to_user constraint if needed
DO $$
BEGIN
    -- Drop existing foreign key constraint on assigned_to_user if it references auth.users
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'file_assignments'
        AND kcu.column_name = 'assigned_to_user'
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
            AND kcu.column_name = 'assigned_to_user'
            AND ccu.table_name = 'users'
            AND ccu.table_schema = 'auth'
            LIMIT 1
        );
        
        -- Add new constraint referencing profiles
        ALTER TABLE public.file_assignments 
        ADD CONSTRAINT file_assignments_assigned_to_user_fkey 
        FOREIGN KEY (assigned_to_user) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure the assigned_to_client constraint exists and is correct
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'file_assignments'
        AND kcu.column_name = 'assigned_to_client'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.file_assignments 
        ADD CONSTRAINT file_assignments_assigned_to_client_fkey 
        FOREIGN KEY (assigned_to_client) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = 'handle_file_assignments_updated_at'
    ) THEN
        CREATE TRIGGER handle_file_assignments_updated_at
            BEFORE UPDATE ON public.file_assignments
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Update existing RLS policies to work with the corrected schema
-- Drop old policies that might be incorrect
DROP POLICY IF EXISTS "Admin can manage all file assignments" ON public.file_assignments;
DROP POLICY IF EXISTS "Client can view their file assignments" ON public.file_assignments;
DROP POLICY IF EXISTS "User can view their file assignments" ON public.file_assignments;
DROP POLICY IF EXISTS "Admins and clients can create assignments" ON public.file_assignments;
DROP POLICY IF EXISTS "Users can update assignments they created or admins can update any" ON public.file_assignments;

-- Create corrected RLS policies
CREATE POLICY "Admin can manage all file assignments" ON public.file_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Client can view their file assignments" ON public.file_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'client'
        ) AND (
            assigned_to_client = (
                SELECT client_id FROM public.profiles WHERE id = auth.uid()
            )
            OR assigned_by = auth.uid()
        )
    );

CREATE POLICY "User can view their file assignments" ON public.file_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'user'
        ) AND (
            assigned_to_user = auth.uid()
            OR assigned_to_client = (
                SELECT client_id FROM public.profiles WHERE id = auth.uid()
            )
        )
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

-- Update indexes to match new column names
DROP INDEX IF EXISTS idx_file_assignments_assigned_to;
CREATE INDEX IF NOT EXISTS idx_file_assignments_assigned_to_user ON public.file_assignments(assigned_to_user);

-- Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_file_assignments_assignment_type ON public.file_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_file_assignments_expires_at ON public.file_assignments(expires_at);
CREATE INDEX IF NOT EXISTS idx_file_assignments_assigned_at ON public.file_assignments(assigned_at);

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