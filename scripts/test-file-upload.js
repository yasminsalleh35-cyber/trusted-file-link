#!/usr/bin/env node

/**
 * File Upload Test Script
 * 
 * This script tests the file upload functionality
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFileUpload() {
  console.log('🧪 Testing File Upload Functionality...\n');

  try {
    // Step 1: Sign in as admin
    console.log('1. Signing in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }
    console.log('✅ Signed in successfully');

    // Step 2: Check storage bucket
    console.log('\n2. Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Storage access failed:', bucketError.message);
      return;
    }

    const filesBucket = buckets.find(b => b.name === 'files');
    if (!filesBucket) {
      console.log('❌ Files bucket not found');
      console.log('💡 Available buckets:', buckets.map(b => b.name));
      console.log('💡 You need to create a "files" bucket in your Supabase dashboard');
      return;
    }
    console.log('✅ Files bucket exists');

    // Step 3: Test file upload (simulate with text content)
    console.log('\n3. Testing file upload...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for upload functionality';
    const testFile = new Blob([testContent], { type: 'text/plain' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(`uploads/${authData.user.id}/${testFileName}`, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.log('❌ File upload failed:', uploadError.message);
      return;
    }
    console.log('✅ File uploaded to storage:', uploadData.path);

    // Step 4: Test database record creation
    console.log('\n4. Testing database record creation...');
    const { data: dbData, error: dbError } = await supabase
      .from('files')
      .insert({
        filename: testFileName,
        original_filename: testFileName,
        file_type: 'text/plain',
        file_size: testContent.length,
        storage_path: uploadData.path,
        uploaded_by: authData.user.id
      })
      .select()
      .single();

    if (dbError) {
      console.log('❌ Database record creation failed:', dbError.message);
      console.log('💡 Error details:', dbError);
      
      // Clean up storage file
      await supabase.storage.from('files').remove([uploadData.path]);
      return;
    }
    console.log('✅ Database record created:', dbData.id);

    // Step 5: Test file assignment
    console.log('\n5. Testing file assignment...');
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('file_assignments')
      .insert({
        file_id: dbData.id,
        assigned_to: authData.user.id,
        assigned_by: authData.user.id,
        assignment_type: 'user',
        notes: 'Test assignment'
      })
      .select()
      .single();

    if (assignmentError) {
      console.log('❌ File assignment failed:', assignmentError.message);
      console.log('💡 Error details:', assignmentError);
    } else {
      console.log('✅ File assignment created:', assignmentData.id);
    }

    // Step 6: Test file retrieval
    console.log('\n6. Testing file retrieval...');
    const { data: retrievedFiles, error: retrieveError } = await supabase
      .from('files')
      .select(`
        *,
        profiles:uploaded_by (
          full_name,
          email
        )
      `)
      .eq('id', dbData.id);

    if (retrieveError) {
      console.log('❌ File retrieval failed:', retrieveError.message);
    } else {
      console.log('✅ File retrieved successfully:', retrievedFiles[0]?.filename);
    }

    // Cleanup
    console.log('\n7. Cleaning up test data...');
    await supabase.from('file_assignments').delete().eq('file_id', dbData.id);
    await supabase.from('files').delete().eq('id', dbData.id);
    await supabase.storage.from('files').remove([uploadData.path]);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 File upload functionality test completed successfully!');

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  } finally {
    // Sign out
    await supabase.auth.signOut();
  }
}

async function main() {
  await testFileUpload();
}

main().catch(console.error);