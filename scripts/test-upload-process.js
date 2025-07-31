#!/usr/bin/env node

/**
 * Upload Process Test Script
 * 
 * This script tests the complete upload process
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUploadProcess() {
  console.log('🧪 Testing Upload Process...\n');

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

    // Check storage bucket
    console.log('📋 Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Storage access failed:', bucketError.message);
      return;
    }

    const filesBucket = buckets.find(b => b.name === 'files');
    if (!filesBucket) {
      console.log('❌ Files bucket not found');
      console.log('💡 Available buckets:', buckets.map(b => b.name));
      console.log('💡 You need to create a "files" bucket in Supabase Dashboard');
      return;
    }
    console.log('✅ Files bucket exists');

    // Test file upload simulation
    console.log('\n📋 Testing file upload simulation...');
    
    // Create a test file content
    const testContent = 'This is a test file for upload verification.';
    const testFileName = `test-${Date.now()}.txt`;
    const userId = '0d84cc74-aa9d-48c1-97a7-6996d8b65cb0'; // Admin user ID
    const filePath = `uploads/${userId}/${testFileName}`;
    
    console.log('📁 Test file path:', filePath);

    // Upload to storage
    console.log('📤 Uploading to storage...');
    const { data: storageData, error: storageError } = await supabase.storage
      .from('files')
      .upload(filePath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) {
      console.log('❌ Storage upload failed:', storageError.message);
      return;
    }
    console.log('✅ Storage upload successful:', storageData.path);

    // Create database record
    console.log('💾 Creating database record...');
    const fileId = crypto.randomUUID();
    const { data: dbData, error: dbError } = await supabase
      .from('files')
      .insert({
        id: fileId,
        filename: testFileName,
        original_filename: testFileName,
        storage_path: filePath,
        file_size: testContent.length,
        file_type: 'text/plain',
        uploaded_by: userId,
        description: 'Test file for upload verification'
      })
      .select()
      .single();

    if (dbError) {
      console.log('❌ Database insert failed:', dbError.message);
      console.log('💡 Error details:', dbError);
      // Clean up storage
      await supabase.storage.from('files').remove([filePath]);
      return;
    }
    console.log('✅ Database record created:', dbData.id);

    // Test download URL generation
    console.log('\n📋 Testing download URL generation...');
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('files')
      .createSignedUrl(filePath, 3600);

    if (signedUrlError) {
      console.log('❌ Failed to create signed URL:', signedUrlError.message);
    } else {
      console.log('✅ Signed URL created successfully');
      console.log('🔗 URL:', signedUrlData.signedUrl);
    }

    // Clean up test file
    console.log('\n🧹 Cleaning up test file...');
    await supabase.from('files').delete().eq('id', fileId);
    await supabase.storage.from('files').remove([filePath]);
    console.log('✅ Test file cleaned up');

    console.log('\n🎉 Upload process test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await supabase.auth.signOut();
  }
}

async function main() {
  await testUploadProcess();
}

main().catch(console.error);