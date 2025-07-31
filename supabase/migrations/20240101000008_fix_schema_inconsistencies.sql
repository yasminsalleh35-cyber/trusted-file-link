-- Fix Critical Schema Inconsistencies
-- This migration aligns database schema with TypeScript types

-- 1. Fix files table column names to match TypeScript types
ALTER TABLE public.files 
  RENAME COLUMN name TO filename;

ALTER TABLE public.files 
  RENAME COLUMN original_name TO original_filename;

ALTER TABLE public.files 
  RENAME COLUMN file_path TO storage_path;

ALTER TABLE public.files 
  RENAME COLUMN mime_type TO file_type;

ALTER TABLE public.files 
  RENAME COLUMN uploaded_at TO created_at;

-- 2. Fix file_assignments table to match expected structure
ALTER TABLE public.file_assignments 
  RENAME COLUMN assigned_at TO created_at;

-- Add missing columns that are expected by the application
ALTER TABLE public.file_assignments 
  ADD COLUMN IF NOT EXISTS assigned_to_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to_client_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_by_name TEXT;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON public.files(file_type);
CREATE INDEX IF NOT EXISTS idx_file_assignments_file_id ON public.file_assignments(file_id);
CREATE INDEX IF NOT EXISTS idx_file_assignments_assigned_to ON public.file_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_file_assignments_assigned_to_client ON public.file_assignments(assigned_to_client);

-- 4. Update RLS policies to use correct column names
DROP POLICY IF EXISTS "Users can view files assigned to them" ON public.files;
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Admins can manage all files" ON public.files;

-- Recreate policies with correct column names
CREATE POLICY "Users can view their own files" ON public.files
  FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all files" ON public.files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view assigned files" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.file_assignments fa
      WHERE fa.file_id = files.id
      AND (
        fa.assigned_to = auth.uid() OR
        fa.assigned_to_client IN (
          SELECT client_id FROM public.profiles 
          WHERE id = auth.uid()
        )
      )
      AND fa.is_active = true
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    )
  );

-- 5. Update file_assignments policies
DROP POLICY IF EXISTS "Users can view their assignments" ON public.file_assignments;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.file_assignments;

CREATE POLICY "Users can view their assignments" ON public.file_assignments
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    assigned_to_client IN (
      SELECT client_id FROM public.profiles 
      WHERE id = auth.uid()
    ) OR
    assigned_by = auth.uid()
  );

CREATE POLICY "Admins can manage all assignments" ON public.file_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 6. Create file_access_logs table for proper tracking
CREATE TABLE IF NOT EXISTS public.file_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'preview')),
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for access logs
CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON public.file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON public.file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_accessed_at ON public.file_access_logs(accessed_at);

-- RLS for access logs
ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access logs" ON public.file_access_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all access logs" ON public.file_access_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert access logs" ON public.file_access_logs
  FOR INSERT WITH CHECK (true);

-- 7. Create updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables that need updated_at
DROP TRIGGER IF EXISTS update_files_updated_at ON public.files;
CREATE TRIGGER update_files_updated_at 
    BEFORE UPDATE ON public.files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_file_assignments_updated_at ON public.file_assignments;
CREATE TRIGGER update_file_assignments_updated_at 
    BEFORE UPDATE ON public.file_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();