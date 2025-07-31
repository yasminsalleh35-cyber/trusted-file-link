import { supabase } from '@/integrations/supabase/client';

/**
 * Test Storage Utilities
 * 
 * Purpose: Test and debug storage functionality
 */

export const testStorageSetup = async () => {
  console.log('🧪 Testing storage setup...');
  
  try {
    // Test 1: Check if we can list buckets
    console.log('1️⃣ Testing bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return false;
    }
    
    console.log('✅ Buckets available:', buckets?.map(b => b.name));
    
    // Test 2: Check if 'files' bucket exists
    const filesBucket = buckets?.find(b => b.name === 'files');
    if (!filesBucket) {
      console.error('❌ Files bucket not found');
      return false;
    }
    
    console.log('✅ Files bucket found:', filesBucket);
    
    // Test 3: Try to list files in the bucket
    console.log('2️⃣ Testing file listing...');
    const { data: files, error: filesError } = await supabase.storage
      .from('files')
      .list('', { limit: 10 });
    
    if (filesError) {
      console.error('❌ Failed to list files:', filesError);
      return false;
    }
    
    console.log('✅ Files in bucket:', files?.length || 0);
    
    // Test 4: Test upload with a small test file
    console.log('3️⃣ Testing file upload...');
    const testContent = 'This is a test file';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(`test/${testFileName}`, testBlob);
    
    if (uploadError) {
      console.error('❌ Failed to upload test file:', uploadError);
      return false;
    }
    
    console.log('✅ Test file uploaded:', uploadData);
    
    // Test 5: Clean up test file
    console.log('4️⃣ Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('files')
      .remove([`test/${testFileName}`]);
    
    if (deleteError) {
      console.warn('⚠️ Failed to delete test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('🎉 Storage setup test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return false;
  }
};

export const createStorageBucket = async () => {
  console.log('🪣 Creating storage bucket...');
  
  try {
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('files', {
      public: false,
      fileSizeLimit: 104857600, // 100MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/zip',
        'application/json'
      ]
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
        return true;
      }
      console.error('❌ Failed to create bucket:', error);
      return false;
    }
    
    console.log('✅ Bucket created successfully:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Bucket creation failed:', error);
    return false;
  }
};