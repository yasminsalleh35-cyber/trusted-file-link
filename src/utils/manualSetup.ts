import { supabase } from '@/integrations/supabase/client';

/**
 * Manual Setup Instructions
 * 
 * Purpose: Provide manual setup instructions when automatic setup fails
 */

export const showManualSetupInstructions = () => {
  console.log('🔧 MANUAL SETUP REQUIRED');
  console.log('=' .repeat(60));
  console.log('');
  console.log('Since automatic setup failed, please follow these steps:');
  console.log('');
  console.log('📦 STEP 1: Create Storage Bucket');
  console.log('1. Go to Supabase Dashboard → Storage');
  console.log('2. Click "New Bucket"');
  console.log('3. Bucket name: "files"');
  console.log('4. Public: false (unchecked)');
  console.log('5. File size limit: 100MB');
  console.log('6. Click "Create bucket"');
  console.log('');
  console.log('🔒 STEP 2: Set Storage Policies');
  console.log('1. Go to Supabase Dashboard → Storage → files bucket');
  console.log('2. Click "Policies" tab');
  console.log('3. Click "New Policy"');
  console.log('4. Choose "For full customization"');
  console.log('5. Add these policies:');
  console.log('');
  console.log('Policy 1 - Upload files:');
  console.log('Name: "Authenticated users can upload"');
  console.log('Operation: INSERT');
  console.log('Target roles: authenticated');
  console.log('USING expression: bucket_id = \'files\' AND auth.uid() IS NOT NULL');
  console.log('');
  console.log('Policy 2 - View files:');
  console.log('Name: "Authenticated users can view"');
  console.log('Operation: SELECT');
  console.log('Target roles: authenticated');
  console.log('USING expression: bucket_id = \'files\' AND auth.uid() IS NOT NULL');
  console.log('');
  console.log('Policy 3 - Delete files:');
  console.log('Name: "Users can delete own files"');
  console.log('Operation: DELETE');
  console.log('Target roles: authenticated');
  console.log('USING expression: bucket_id = \'files\' AND owner = auth.uid()');
  console.log('');
  console.log('🧪 STEP 3: Test Upload');
  console.log('1. After creating the bucket and policies');
  console.log('2. Refresh this page');
  console.log('3. Try uploading a file');
  console.log('');
  console.log('=' .repeat(60));
  
  // Show alert with simplified instructions
  alert('🔧 MANUAL SETUP REQUIRED\n\n' +
        'The automatic setup failed. Please:\n\n' +
        '1. Go to Supabase Dashboard → Storage\n' +
        '2. Create a bucket named "files" (private)\n' +
        '3. Set up storage policies\n\n' +
        'Check console for detailed instructions!');
};

export const testFileUploadReadiness = async () => {
  console.log('🧪 Testing file upload readiness...');
  
  const results = {
    auth: false,
    storage: false,
    database: false
  };
  
  try {
    // Test 1: Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (user && !authError) {
      results.auth = true;
      console.log('✅ Authentication: OK');
    } else {
      console.log('❌ Authentication: Failed');
    }
    
    // Test 2: Storage bucket
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (!storageError && buckets?.find(b => b.name === 'files')) {
      results.storage = true;
      console.log('✅ Storage bucket: OK');
    } else {
      console.log('❌ Storage bucket: Missing or inaccessible');
    }
    
    // Test 3: Database tables
    const { error: dbError } = await supabase.from('files').select('count').limit(1);
    if (!dbError) {
      results.database = true;
      console.log('✅ Database tables: OK');
    } else {
      console.log('❌ Database tables: Missing or inaccessible');
    }
    
    // Summary
    const allReady = results.auth && results.storage && results.database;
    
    if (allReady) {
      console.log('🎉 All systems ready! File upload should work.');
      return true;
    } else {
      console.log('⚠️ Some components are not ready:');
      if (!results.auth) console.log('  - Authentication required');
      if (!results.storage) console.log('  - Storage bucket missing');
      if (!results.database) console.log('  - Database tables missing');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Readiness test failed:', error);
    return false;
  }
};