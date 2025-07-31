import { supabase } from '@/integrations/supabase/client';

/**
 * Database Setup Utilities
 * 
 * Purpose: Set up the database schema and storage bucket
 */

export const setupStorageBucket = async () => {
  console.log('🪣 Setting up storage bucket...');
  
  try {
    // First, check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      return false;
    }
    
    const existingBucket = buckets?.find(bucket => bucket.name === 'files');
    if (existingBucket) {
      console.log('✅ Storage bucket already exists:', existingBucket);
      return true;
    }
    
    console.log('📦 Creating new storage bucket...');
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('files', {
      public: false,
      fileSizeLimit: 104857600, // 100MB
      allowedMimeTypes: undefined // Allow all types
    });
    
    if (error) {
      console.error('❌ Failed to create storage bucket:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's a permission issue
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        console.log('⚠️ Storage bucket creation requires admin permissions.');
        console.log('📝 Please create the bucket manually in Supabase Dashboard:');
        console.log('1. Go to Storage in Supabase Dashboard');
        console.log('2. Click "New Bucket"');
        console.log('3. Name: "files"');
        console.log('4. Public: false');
        console.log('5. File size limit: 100MB');
        return false;
      }
      
      return false;
    }
    
    console.log('✅ Storage bucket created successfully:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Storage bucket setup failed:', error);
    return false;
  }
};

export const setupDatabaseTables = async () => {
  console.log('🗄️ Setting up database tables...');
  console.log('⚠️ TABLES ARE MISSING! Please run the following SQL in your Supabase SQL Editor:');
  console.log('🔗 Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
  console.log('📋 Copy and paste this SQL:');
  console.log('=' .repeat(80));
  
  const sql = `
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- Enable RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.files;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.file_assignments;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.file_access_logs;

-- Create RLS policies
CREATE POLICY "Allow all for authenticated users" ON public.files
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON public.file_assignments
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all for authenticated users" ON public.file_access_logs
FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON public.files TO authenticated;
GRANT ALL ON public.file_assignments TO authenticated;
GRANT ALL ON public.file_access_logs TO authenticated;
  `;
  
  console.log(sql);
  console.log('=' .repeat(80));
  console.log('📋 COPY THE SQL ABOVE AND RUN IT IN SUPABASE SQL EDITOR!');
  console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard');
  console.log('📝 After running the SQL, try uploading a file again.');
  
  // Also show an alert
  alert('⚠️ DATABASE SETUP REQUIRED!\n\n' +
        '1. Check the browser console for SQL code\n' +
        '2. Copy the SQL code\n' +
        '3. Go to Supabase Dashboard → SQL Editor\n' +
        '4. Paste and run the SQL\n' +
        '5. Try uploading again\n\n' +
        'Check console for detailed instructions!');
  
  // Try to test if tables exist by querying them
  try {
    const { error: filesError } = await supabase.from('files').select('count').limit(1);
    const { error: assignmentsError } = await supabase.from('file_assignments').select('count').limit(1);
    const { error: logsError } = await supabase.from('file_access_logs').select('count').limit(1);
    
    if (!filesError && !assignmentsError && !logsError) {
      console.log('✅ All tables exist and are accessible!');
      return true;
    } else {
      console.log('❌ Some tables are missing. Please run the SQL above.');
      return false;
    }
  } catch (error) {
    console.log('❌ Tables not accessible. Please run the SQL above.');
    return false;
  }
};

export const setupRLSPolicies = async () => {
  console.log('🔒 RLS policies are included in the SQL above');
  return true;
};

export const setupCompleteFileSystem = async () => {
  console.log('🚀 Setting up complete file system...');
  
  const storageSuccess = await setupStorageBucket();
  const tablesSuccess = await setupDatabaseTables();
  const rlsSuccess = await setupRLSPolicies();
  
  if (storageSuccess && tablesSuccess && rlsSuccess) {
    console.log('🎉 File system setup completed successfully!');
    return true;
  } else {
    console.error('❌ File system setup failed');
    return false;
  }
};