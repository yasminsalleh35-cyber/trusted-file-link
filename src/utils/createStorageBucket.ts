import { supabase } from '@/integrations/supabase/client';

/**
 * Simple Storage Bucket Creation
 * 
 * Creates the 'files' bucket if it doesn't exist
 */

export const createFilesBucket = async (): Promise<boolean> => {
  try {
    console.log('🪣 Checking storage bucket...');

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      return false;
    }

    const filesBucket = buckets?.find(bucket => bucket.name === 'files');
    
    if (filesBucket) {
      console.log('✅ Files bucket already exists');
      return true;
    }

    console.log('📦 Creating files bucket...');

    // Create bucket
    const { data, error } = await supabase.storage.createBucket('files', {
      public: false,
      fileSizeLimit: 104857600, // 100MB
      allowedMimeTypes: undefined
    });

    if (error) {
      console.error('❌ Failed to create bucket:', error);
      
      // Show manual instructions
      console.log('📋 MANUAL SETUP REQUIRED:');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Click "New Bucket"');
      console.log('3. Name: "files"');
      console.log('4. Public: false');
      console.log('5. File size limit: 100MB');
      
      alert('Storage bucket creation failed!\n\nPlease create it manually:\n1. Go to Supabase Dashboard → Storage\n2. Create bucket named "files" (private)\n3. Try uploading again');
      
      return false;
    }

    console.log('✅ Files bucket created successfully');
    
    // Show storage policy setup instructions
    console.log('🔒 IMPORTANT: Set up storage policies manually:');
    console.log('1. Go to Supabase Dashboard → Storage → files bucket');
    console.log('2. Click "Policies" tab');
    console.log('3. Click "New Policy" → "For full customization"');
    console.log('4. Create these policies:');
    console.log('');
    console.log('Policy 1 - Upload:');
    console.log('Name: "Authenticated users can upload"');
    console.log('Operation: INSERT');
    console.log('Target roles: authenticated');
    console.log('USING: bucket_id = \'files\' AND auth.uid() IS NOT NULL');
    console.log('');
    console.log('Policy 2 - View:');
    console.log('Name: "Authenticated users can view"');
    console.log('Operation: SELECT');
    console.log('Target roles: authenticated');
    console.log('USING: bucket_id = \'files\' AND auth.uid() IS NOT NULL');
    console.log('');
    console.log('Policy 3 - Delete:');
    console.log('Name: "Users can delete own files"');
    console.log('Operation: DELETE');
    console.log('Target roles: authenticated');
    console.log('USING: bucket_id = \'files\' AND owner = auth.uid()');
    
    alert('✅ Storage bucket created!\n\n⚠️ IMPORTANT: You need to set up storage policies manually.\n\nCheck the console for detailed instructions, then try uploading again.');
    
    return true;

  } catch (error) {
    console.error('❌ Bucket creation failed:', error);
    return false;
  }
};

export const testStorageBucket = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing storage bucket...');

    // Try to list files in the bucket
    const { data, error } = await supabase.storage
      .from('files')
      .list('', { limit: 1 });

    if (error) {
      console.error('❌ Storage bucket test failed:', error);
      return false;
    }

    console.log('✅ Storage bucket is accessible');
    return true;

  } catch (error) {
    console.error('❌ Storage bucket test failed:', error);
    return false;
  }
};