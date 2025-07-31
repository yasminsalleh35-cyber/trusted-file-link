#!/usr/bin/env node

/**
 * Comprehensive File Management Test Script
 * 
 * Tests all file management functions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFileManagement() {
  console.log('📁 COMPREHENSIVE FILE MANAGEMENT TESTING\n');
  console.log('=' .repeat(60));

  const results = {
    fileQueries: {},
    fileOperations: {},
    assignments: {},
    overall: { passed: 0, failed: 0 }
  };

  try {
    // Sign in as admin for comprehensive testing
    console.log('🔐 Signing in as admin...');
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    if (authError) {
      console.log(`❌ Admin sign-in FAILED: ${authError.message}`);
      return results;
    }
    console.log('✅ Admin signed in successfully\n');

    // Test 1: Basic file queries
    console.log('📋 TESTING FILE QUERIES');
    console.log('-'.repeat(30));

    // Test files table structure
    console.log('🔍 Testing files table access...');
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('*')
      .limit(5);

    if (filesError) {
      console.log(`❌ Files query FAILED: ${filesError.message}`);
      results.fileQueries.basicQuery = { success: false, error: filesError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ Files query successful: ${filesData.length} files found`);
      results.fileQueries.basicQuery = { success: true, count: filesData.length };
      results.overall.passed++;

      if (filesData.length > 0) {
        console.log('📄 Sample file structure:');
        const sampleFile = filesData[0];
        console.log(`   ID: ${sampleFile.id}`);
        console.log(`   Filename: ${sampleFile.filename}`);
        console.log(`   Original: ${sampleFile.original_filename}`);
        console.log(`   Storage Path: ${sampleFile.storage_path}`);
        console.log(`   Size: ${sampleFile.file_size}`);
        console.log(`   Type: ${sampleFile.file_type}`);
        console.log(`   Uploaded By: ${sampleFile.uploaded_by}`);
        console.log(`   Created: ${sampleFile.created_at}`);
      }
    }

    // Test files with profiles join
    console.log('\n🔍 Testing files with profiles join...');
    const { data: filesWithProfiles, error: joinError } = await supabase
      .from('files')
      .select(`
        *,
        profiles:uploaded_by (
          full_name,
          email,
          role
        )
      `)
      .limit(3);

    if (joinError) {
      console.log(`❌ Files with profiles join FAILED: ${joinError.message}`);
      results.fileQueries.joinQuery = { success: false, error: joinError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ Files with profiles join successful: ${filesWithProfiles.length} files`);
      results.fileQueries.joinQuery = { success: true, count: filesWithProfiles.length };
      results.overall.passed++;

      if (filesWithProfiles.length > 0) {
        const sample = filesWithProfiles[0];
        console.log('📄 Sample joined data:');
        console.log(`   File: ${sample.original_filename}`);
        console.log(`   Uploader: ${sample.profiles?.full_name || 'Unknown'}`);
        console.log(`   Role: ${sample.profiles?.role || 'Unknown'}`);
      }
    }

    // Test 2: File assignments
    console.log('\n📋 TESTING FILE ASSIGNMENTS');
    console.log('-'.repeat(30));

    const { data: assignments, error: assignmentsError } = await supabase
      .from('file_assignments')
      .select('*')
      .limit(5);

    if (assignmentsError) {
      console.log(`❌ File assignments query FAILED: ${assignmentsError.message}`);
      results.assignments.basicQuery = { success: false, error: assignmentsError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ File assignments query successful: ${assignments.length} assignments`);
      results.assignments.basicQuery = { success: true, count: assignments.length };
      results.overall.passed++;

      if (assignments.length > 0) {
        console.log('📄 Sample assignment structure:');
        const sample = assignments[0];
        console.log(`   ID: ${sample.id}`);
        console.log(`   File ID: ${sample.file_id}`);
        console.log(`   Assigned to User: ${sample.assigned_to_user || 'N/A'}`);
        console.log(`   Assigned to Client: ${sample.assigned_to_client || 'N/A'}`);
        console.log(`   Assigned By: ${sample.assigned_by}`);
        console.log(`   Created: ${sample.created_at}`);
      }
    }

    // Test assignments with file details
    console.log('\n🔍 Testing assignments with file details...');
    const { data: assignmentsWithFiles, error: assignJoinError } = await supabase
      .from('file_assignments')
      .select(`
        *,
        files (
          filename,
          original_filename,
          file_size,
          file_type
        )
      `)
      .limit(3);

    if (assignJoinError) {
      console.log(`❌ Assignments with files join FAILED: ${assignJoinError.message}`);
      results.assignments.joinQuery = { success: false, error: assignJoinError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ Assignments with files join successful: ${assignmentsWithFiles.length} assignments`);
      results.assignments.joinQuery = { success: true, count: assignmentsWithFiles.length };
      results.overall.passed++;
    }

    // Test 3: Storage operations
    console.log('\n📋 TESTING STORAGE OPERATIONS');
    console.log('-'.repeat(30));

    // Test storage bucket access
    console.log('🗄️ Testing storage bucket access...');
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testFileName = `test-${Date.now()}.txt`;
    const testPath = `uploads/test/${testFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.log(`❌ Storage upload FAILED: ${uploadError.message}`);
      results.fileOperations.storageUpload = { success: false, error: uploadError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ Storage upload successful: ${uploadData.path}`);
      results.fileOperations.storageUpload = { success: true, path: uploadData.path };
      results.overall.passed++;

      // Test signed URL generation
      console.log('🔗 Testing signed URL generation...');
      const { data: signedData, error: signedError } = await supabase.storage
        .from('files')
        .createSignedUrl(testPath, 3600);

      if (signedError) {
        console.log(`❌ Signed URL generation FAILED: ${signedError.message}`);
        results.fileOperations.signedUrl = { success: false, error: signedError.message };
        results.overall.failed++;
      } else {
        console.log(`✅ Signed URL generation successful`);
        results.fileOperations.signedUrl = { success: true, url: signedData.signedUrl };
        results.overall.passed++;
      }

      // Clean up test file
      console.log('🧹 Cleaning up test file...');
      await supabase.storage.from('files').remove([testPath]);
      console.log('✅ Test file cleaned up');
    }

    // Test 4: Complete file lifecycle
    console.log('\n📋 TESTING COMPLETE FILE LIFECYCLE');
    console.log('-'.repeat(30));

    const lifecycleTestId = crypto.randomUUID();
    const lifecycleFileName = `lifecycle-test-${Date.now()}.txt`;
    const lifecyclePath = `uploads/0d84cc74-aa9d-48c1-97a7-6996d8b65cb0/${lifecycleFileName}`;
    const lifecycleContent = 'Complete lifecycle test file';

    try {
      // Step 1: Upload to storage
      console.log('1️⃣ Uploading to storage...');
      const { error: lifecycleUploadError } = await supabase.storage
        .from('files')
        .upload(lifecyclePath, lifecycleContent, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: false
        });

      if (lifecycleUploadError) throw lifecycleUploadError;
      console.log('✅ Storage upload successful');

      // Step 2: Create database record
      console.log('2️⃣ Creating database record...');
      const { error: dbInsertError } = await supabase
        .from('files')
        .insert({
          id: lifecycleTestId,
          filename: lifecycleFileName,
          original_filename: lifecycleFileName,
          storage_path: lifecyclePath,
          file_size: lifecycleContent.length,
          file_type: 'text/plain',
          uploaded_by: '0d84cc74-aa9d-48c1-97a7-6996d8b65cb0',
          description: 'Lifecycle test file'
        });

      if (dbInsertError) throw dbInsertError;
      console.log('✅ Database record created');

      // Step 3: Test file retrieval
      console.log('3️⃣ Testing file retrieval...');
      const { data: retrievedFile, error: retrieveError } = await supabase
        .from('files')
        .select('*')
        .eq('id', lifecycleTestId)
        .single();

      if (retrieveError) throw retrieveError;
      console.log('✅ File retrieval successful');

      // Step 4: Test download URL
      console.log('4️⃣ Testing download URL...');
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('files')
        .createSignedUrl(lifecyclePath, 3600);

      if (downloadError) throw downloadError;
      console.log('✅ Download URL generation successful');

      // Step 5: Clean up
      console.log('5️⃣ Cleaning up...');
      await supabase.from('files').delete().eq('id', lifecycleTestId);
      await supabase.storage.from('files').remove([lifecyclePath]);
      console.log('✅ Cleanup successful');

      console.log('🎉 Complete file lifecycle test PASSED');
      results.fileOperations.lifecycle = { success: true };
      results.overall.passed++;

    } catch (error) {
      console.log(`❌ File lifecycle test FAILED: ${error.message}`);
      results.fileOperations.lifecycle = { success: false, error: error.message };
      results.overall.failed++;

      // Attempt cleanup
      try {
        await supabase.from('files').delete().eq('id', lifecycleTestId);
        await supabase.storage.from('files').remove([lifecyclePath]);
      } catch (cleanupError) {
        console.log(`⚠️ Cleanup failed: ${cleanupError.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    results.overall.failed++;
  } finally {
    await supabase.auth.signOut();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FILE MANAGEMENT TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Passed: ${results.overall.passed}`);
  console.log(`❌ Failed: ${results.overall.failed}`);
  
  console.log('\n📋 DETAILED RESULTS:');
  
  console.log('\nFILE QUERIES:');
  for (const [test, result] of Object.entries(results.fileQueries)) {
    console.log(`  ${test}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
    if (result.count !== undefined) {
      console.log(`    Count: ${result.count}`);
    }
  }
  
  console.log('\nFILE ASSIGNMENTS:');
  for (const [test, result] of Object.entries(results.assignments)) {
    console.log(`  ${test}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
    if (result.count !== undefined) {
      console.log(`    Count: ${result.count}`);
    }
  }
  
  console.log('\nFILE OPERATIONS:');
  for (const [test, result] of Object.entries(results.fileOperations)) {
    console.log(`  ${test}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
  }

  return results;
}

async function main() {
  const results = await testFileManagement();
  
  const overallSuccess = results.overall.failed === 0;
  console.log(`\n🎯 OVERALL STATUS: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!overallSuccess) {
    console.log('\n🚨 CRITICAL ISSUES DETECTED:');
    console.log('   File management system has problems that need immediate attention.');
  }
}

main().catch(console.error);