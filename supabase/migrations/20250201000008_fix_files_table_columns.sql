-- =====================================================
-- CRITICAL FIX: Fix Files Table Column Names
-- =====================================================
-- This migration fixes the column naming mismatch in the files table
-- to match the expected schema used throughout the application
-- =====================================================

-- Rename columns in files table to match expected schema
DO $$
BEGIN
    -- Rename filename to name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'filename'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.files RENAME COLUMN filename TO name;
        RAISE NOTICE 'Renamed filename to name';
    END IF;

    -- Rename original_filename to original_name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'original_filename'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'original_name'
    ) THEN
        ALTER TABLE public.files RENAME COLUMN original_filename TO original_name;
        RAISE NOTICE 'Renamed original_filename to original_name';
    END IF;

    -- Rename file_type to mime_type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'file_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'mime_type'
    ) THEN
        ALTER TABLE public.files RENAME COLUMN file_type TO mime_type;
        RAISE NOTICE 'Renamed file_type to mime_type';
    END IF;

    -- Rename storage_path to file_path
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'storage_path'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'file_path'
    ) THEN
        ALTER TABLE public.files RENAME COLUMN storage_path TO file_path;
        RAISE NOTICE 'Renamed storage_path to file_path';
    END IF;

    -- Rename created_at to uploaded_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'created_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'uploaded_at'
    ) THEN
        ALTER TABLE public.files RENAME COLUMN created_at TO uploaded_at;
        RAISE NOTICE 'Renamed created_at to uploaded_at';
    END IF;
END $$;

-- Add missing columns that should exist in the files table
DO $$
BEGIN
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.files ADD COLUMN tags TEXT[];
        RAISE NOTICE 'Added tags column';
    END IF;

    -- Add access_level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'access_level'
    ) THEN
        ALTER TABLE public.files ADD COLUMN access_level TEXT NOT NULL DEFAULT 'private' 
        CHECK (access_level IN ('private', 'client', 'public'));
        RAISE NOTICE 'Added access_level column';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.files ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Added is_active column';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.files ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.files ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added metadata column';
    END IF;
END $$;

-- Ensure the file_path column has a unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND constraint_name = 'files_file_path_key'
    ) THEN
        ALTER TABLE public.files ADD CONSTRAINT files_file_path_key UNIQUE (file_path);
        RAISE NOTICE 'Added unique constraint on file_path';
    END IF;
END $$;

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = 'handle_files_updated_at'
    ) THEN
        CREATE TRIGGER handle_files_updated_at
            BEFORE UPDATE ON public.files
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
        RAISE NOTICE 'Added updated_at trigger';
    END IF;
END $$;

-- Update indexes to match new column names
DROP INDEX IF EXISTS idx_files_filename;
DROP INDEX IF EXISTS idx_files_created_at;

CREATE INDEX IF NOT EXISTS idx_files_name ON public.files(name);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON public.files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_files_access_level ON public.files(access_level);
CREATE INDEX IF NOT EXISTS idx_files_is_active ON public.files(is_active);

-- Log the final state
DO $$
DECLARE
    column_list TEXT;
BEGIN
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO column_list
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'files';
    
    RAISE NOTICE 'Files table columns after fix: %', column_list;
END $$;