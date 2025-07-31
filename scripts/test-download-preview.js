#!/usr/bin/env node

/**
 * Download/Preview Test Script
 * 
 * This script tests the download and preview functionality
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDownloadPreview() {
  console.log('🧪 Testing Download/Preview Functionality...\n');

  try {
    // Sign in as admin
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authenticated as admin\n');

    // Get a sample file
    console.log('📋 Getting sample file...');
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .limit(1);

    if (filesError) {
      console.log('❌ Failed to get files:', filesError.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log('⚠️  No files found in database');
      return;
    }

    const sampleFile = files[0];
    console.log('📄 Sample file:', {
      id: sampleFile.id,
      filename: sampleFile.filename,
      original_filename: sampleFile.original_filename,
      storage_path: sampleFile.storage_path,
      file_type: sampleFile.file_type
    });

    // Test storage bucket access
    console.log('\n📋 Testing storage bucket access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Storage access failed:', bucketError.message);
      return;
    }

    const filesBucket = buckets.find(b => b.name === 'files');
    if (!filesBucket) {
      console.log('❌ Files bucket not found');
      console.log('💡 Available buckets:', buckets.map(b => b.name));
      return;
    }
    console.log('✅ Files bucket exists');

    // Test file existence in storage
    console.log('\n📋 Testing file existence in storage...');
    const { data: fileList, error: listError } = await supabase.storage
      .from('files')
      .list('', { limit: 10 });

    if (listError) {
      console.log('❌ Failed to list files in storage:', listError.message);
      return;
    }

    console.log('📁 Files in storage root:', fileList?.map(f => f.name) || []);

    // Try to list files in uploads folder
    const { data: uploadsFileList, error: uploadsListError } = await supabase.storage
      .from('files')
      .list('uploads', { limit: 10 });

    if (!uploadsListError && uploadsFileList) {
      console.log('📁 Files in uploads folder:', uploadsFileList.map(f => f.name));
    }

    // Test signed URL generation
    console.log('\n📋 Testing signed URL generation...');
    const storagePath = sampleFile.storage_path;
    console.log('🔗 Attempting to create signed URL for path:', storagePath);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('files')
      .createSignedUrl(storagePath, 3600);

    if (signedUrlError) {
      console.log('❌ Failed to create signed URL:', signedUrlError.message);
      console.log('💡 This might be because:');
      console.log('   - The file does not exist in storage');
      console.log('   - The storage path is incorrect');
      console.log('   - RLS policies are blocking access');
      
      // Try different path formats
      console.log('\n🔍 Trying alternative path formats...');
      const alternativePaths = [
        storagePath.replace(/^\/+/, ''), // Remove leading slashes
        `uploads/${storagePath}`,
        storagePath.replace(/\\/g, '/'), // Replace backslashes with forward slashes
      ];

      for (const altPath of alternativePaths) {
        console.log(`   Trying path: "${altPath}"`);
        const { data: altData, error: altError } = await supabase.storage
          .from('files')
          .createSignedUrl(altPath, 3600);
        
        if (!altError && altData?.signedUrl) {
          console.log(`   ✅ Success with path: "${altPath}"`);
          console.log(`   🔗 Signed URL: ${altData.signedUrl}`);
          break;
        } else {
          console.log(`   ❌ Failed: ${altError?.message || 'No signed URL returned'}`);
        }
      }
    } else {
      console.log('✅ Signed URL created successfully');
      console.log('🔗 Signed URL:', signedUrlData.signedUrl);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await supabase.auth.signOut();
  }
}

async function main() {
  await testDownloadPreview();
}

main().catch(console.error);