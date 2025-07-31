#!/usr/bin/env node

/**
 * Direct Upload Test Script
 * 
 * This script tests direct upload without checking bucket existence
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDirectUpload() {
  console.log('🧪 Testing Direct Upload...\n');

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

    // Try direct upload to files bucket
    console.log('📤 Attempting direct upload to files bucket...');
    
    const testContent = 'Direct upload test content';
    const testFileName = `direct-test-${Date.now()}.txt`;
    const userId = '0d84cc74-aa9d-48c1-97a7-6996d8b65cb0';
    const filePath = `uploads/${userId}/${testFileName}`;
    
    console.log('📁 Upload path:', filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.log('❌ Upload failed:', uploadError.message);
      console.log('💡 Error details:', uploadError);
      
      if (uploadError.message.includes('Bucket not found')) {
        console.log('\n🚨 BUCKET DOES NOT EXIST!');
        console.log('📋 You MUST create the "files" bucket in Supabase Dashboard:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Go to Storage');
        console.log('   4. Click "Create bucket"');
        console.log('   5. Name: "files"');
        console.log('   6. Public: UNCHECKED (private)');
        console.log('   7. Click "Create bucket"');
      }
      return;
    }

    console.log('✅ Upload successful:', uploadData.path);

    // Test signed URL creation
    console.log('\n📋 Testing signed URL creation...');
    const { data: signedData, error: signedError } = await supabase.storage
      .from('files')
      .createSignedUrl(filePath, 3600);

    if (signedError) {
      console.log('❌ Signed URL creation failed:', signedError.message);
    } else {
      console.log('✅ Signed URL created:', signedData.signedUrl);
    }

    // Test file listing
    console.log('\n📋 Testing file listing in uploads folder...');
    const { data: fileList, error: listError } = await supabase.storage
      .from('files')
      .list(`uploads/${userId}`, { limit: 10 });

    if (listError) {
      console.log('❌ File listing failed:', listError.message);
    } else {
      console.log('✅ Files in user folder:', fileList.map(f => f.name));
    }

    // Clean up
    console.log('\n🧹 Cleaning up...');
    await supabase.storage.from('files').remove([filePath]);
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await supabase.auth.signOut();
  }
}

async function main() {
  await testDirectUpload();
}

main().catch(console.error);