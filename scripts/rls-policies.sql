-- =====================================================
-- RLS POLICIES FOR TRUSTED FILE LINK APPLICATION
-- =====================================================
-- Copy and paste this entire file into your Supabase SQL Editor
-- and click "Run" to execute all policies at once

-- =====================================================
-- RLS POLICIES FOR FILES TABLE
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view files based on role and assignments" ON public.files;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;

-- Policy 1: Users can view files based on role and assignments
CREATE POLICY "Users can view files based on role and assignments" ON public.files
FOR SELECT USING (
  -- Admins can see all files
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Users can see files uploaded by them
  uploaded_by = auth.uid()
  OR
  -- Users can see files assigned to them
  EXISTS (
    SELECT 1 FROM public.file_assignments fa
    WHERE fa.file_id = id
    AND (
      fa.assigned_to = auth.uid()
      OR
      fa.assigned_to_client = (
        SELECT client_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    AND fa.is_active = true
  )
);

-- Policy 2: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload files" ON public.files
FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Policy 3: Users can update their own files
CREATE POLICY "Users can update their own files" ON public.files
FOR UPDATE USING (
  uploaded_by = auth.uid()
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Policy 4: Users can delete their own files
CREATE POLICY "Users can delete their own files" ON public.files
FOR DELETE USING (
  uploaded_by = auth.uid()
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================================================
-- RLS POLICIES FOR FILE_ASSIGNMENTS TABLE
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view relevant assignments" ON public.file_assignments;
DROP POLICY IF EXISTS "Admins and clients can create assignments" ON public.file_assignments;
DROP POLICY IF EXISTS "Admins and assignment creators can update" ON public.file_assignments;
DROP POLICY IF EXISTS "Admins and assignment creators can delete" ON public.file_assignments;

-- Policy 1: Users can view relevant assignments
CREATE POLICY "Users can view relevant assignments" ON public.file_assignments
FOR SELECT USING (
  -- Admins can see all assignments
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Users can see assignments to them
  assigned_to = auth.uid()
  OR
  -- Users can see assignments to their client
  assigned_to_client = (
    SELECT client_id FROM public.profiles WHERE id = auth.uid()
  )
  OR
  -- Users can see assignments they created
  assigned_by = auth.uid()
);

-- Policy 2: Admins and clients can create assignments
CREATE POLICY "Admins and clients can create assignments" ON public.file_assignments
FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'client')
  AND
  assigned_by = auth.uid()
);

-- Policy 3: Admins and assignment creators can update
CREATE POLICY "Admins and assignment creators can update" ON public.file_assignments
FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  assigned_by = auth.uid()
);

-- Policy 4: Admins and assignment creators can delete
CREATE POLICY "Admins and assignment creators can delete" ON public.file_assignments
FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR
  assigned_by = auth.uid()
);

-- =====================================================
-- ENABLE RLS ON TABLES (if not already enabled)
-- =====================================================

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION QUERIES (optional - run to test)
-- =====================================================

-- Check if policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('files', 'file_assignments')
ORDER BY tablename, policyname;