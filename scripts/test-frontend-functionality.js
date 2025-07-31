#!/usr/bin/env node

/**
 * Frontend Functionality Test Script
 * 
 * Tests frontend components and hooks
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFrontendFunctionality() {
  console.log('🖥️ FRONTEND FUNCTIONALITY TESTING\n');
  console.log('=' .repeat(60));

  const results = {
    hooks: {},
    components: {},
    overall: { passed: 0, failed: 0 }
  };

  try {
    // Test useFileManagement hook functionality
    console.log('🪝 TESTING USEFILEMANAGEMENT HOOK');
    console.log('-'.repeat(40));

    // Sign in as admin
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    if (authError) {
      console.log(`❌ Authentication failed: ${authError.message}`);
      return results;
    }

    // Test admin file query (simulating useFileManagement hook)
    console.log('📋 Testing admin file query...');
    const { data: adminFiles, error: adminError } = await supabase
      .from('files')
      .select(`
        *,
        profiles:uploaded_by (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (adminError) {
      console.log(`❌ Admin file query FAILED: ${adminError.message}`);
      results.hooks.adminFileQuery = { success: false, error: adminError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ Admin file query successful: ${adminFiles.length} files`);
      results.hooks.adminFileQuery = { success: true, count: adminFiles.length };
      results.overall.passed++;

      // Test file data transformation (simulating safeFileAccess)
      if (adminFiles.length > 0) {
        console.log('🔄 Testing file data transformation...');
        const sampleFile = adminFiles[0];
        
        // Check if all required fields exist
        const requiredFields = ['id', 'filename', 'original_filename', 'storage_path', 'file_size', 'file_type', 'uploaded_by', 'created_at'];
        const missingFields = requiredFields.filter(field => sampleFile[field] === undefined || sampleFile[field] === null);
        
        if (missingFields.length > 0) {
          console.log(`❌ File transformation FAILED: Missing fields: ${missingFields.join(', ')}`);
          results.hooks.fileTransformation = { success: false, error: `Missing fields: ${missingFields.join(', ')}` };
          results.overall.failed++;
        } else {
          console.log('✅ File transformation successful: All required fields present');
          results.hooks.fileTransformation = { success: true };
          results.overall.passed++;
        }

        // Test profile join
        if (sampleFile.profiles) {
          console.log('✅ Profile join successful');
          console.log(`   Uploader: ${sampleFile.profiles.full_name || sampleFile.profiles.email}`);
          results.hooks.profileJoin = { success: true };
          results.overall.passed++;
        } else {
          console.log('❌ Profile join FAILED: No profile data');
          results.hooks.profileJoin = { success: false, error: 'No profile data' };
          results.overall.failed++;
        }
      }
    }

    // Test file assignments query
    console.log('\n📋 Testing file assignments query...');
    const { data: assignments, error: assignError } = await supabase
      .from('file_assignments')
      .select(`
        *,
        files (
          filename,
          original_filename
        )
      `)
      .order('created_at', { ascending: false });

    if (assignError) {
      console.log(`❌ File assignments query FAILED: ${assignError.message}`);
      results.hooks.assignmentsQuery = { success: false, error: assignError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ File assignments query successful: ${assignments.length} assignments`);
      results.hooks.assignmentsQuery = { success: true, count: assignments.length };
      results.overall.passed++;
    }

    // Test client/user file access (simulating non-admin users)
    console.log('\n👤 Testing client/user file access...');
    
    // Sign out admin and sign in as client
    await supabase.auth.signOut();
    const { error: clientAuthError } = await supabase.auth.signInWithPassword({
      email: 'client@acme.com',
      password: 'client123456'
    });

    if (clientAuthError) {
      console.log(`❌ Client authentication failed: ${clientAuthError.message}`);
      results.hooks.clientAuth = { success: false, error: clientAuthError.message };
      results.overall.failed++;
    } else {
      console.log('✅ Client authentication successful');
      results.hooks.clientAuth = { success: true };
      results.overall.passed++;

      // Test client file access through assignments
      const { data: clientFiles, error: clientFileError } = await supabase
        .from('file_assignments')
        .select(`
          *,
          files (
            *,
            profiles:uploaded_by (
              full_name,
              email
            )
          )
        `)
        .eq('assigned_to_client', 'bacb2c3b-7714-494f-ad13-158d6a008b09'); // Client ID

      if (clientFileError) {
        console.log(`❌ Client file access FAILED: ${clientFileError.message}`);
        results.hooks.clientFileAccess = { success: false, error: clientFileError.message };
        results.overall.failed++;
      } else {
        console.log(`✅ Client file access successful: ${clientFiles.length} accessible files`);
        results.hooks.clientFileAccess = { success: true, count: clientFiles.length };
        results.overall.passed++;
      }
    }

    // Test user file access
    await supabase.auth.signOut();
    const { error: userAuthError } = await supabase.auth.signInWithPassword({
      email: 'user@acme.com',
      password: 'user123456'
    });

    if (userAuthError) {
      console.log(`❌ User authentication failed: ${userAuthError.message}`);
      results.hooks.userAuth = { success: false, error: userAuthError.message };
      results.overall.failed++;
    } else {
      console.log('✅ User authentication successful');
      results.hooks.userAuth = { success: true };
      results.overall.passed++;

      // Test user file access through assignments
      const { data: userFiles, error: userFileError } = await supabase
        .from('file_assignments')
        .select(`
          *,
          files (
            *,
            profiles:uploaded_by (
              full_name,
              email
            )
          )
        `)
        .eq('assigned_to_user', 'fffc4428-ea6d-480a-a391-7473f74567bd'); // User ID

      if (userFileError) {
        console.log(`❌ User file access FAILED: ${userFileError.message}`);
        results.hooks.userFileAccess = { success: false, error: userFileError.message };
        results.overall.failed++;
      } else {
        console.log(`✅ User file access successful: ${userFiles.length} accessible files`);
        results.hooks.userFileAccess = { success: true, count: userFiles.length };
        results.overall.passed++;
      }
    }

    // Test dashboard stats calculation
    console.log('\n📊 Testing dashboard stats calculation...');
    
    // Sign back in as admin for stats testing
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    // Get all files for stats
    const { data: allFiles, error: statsError } = await supabase
      .from('files')
      .select('file_size, created_at');

    if (statsError) {
      console.log(`❌ Stats calculation FAILED: ${statsError.message}`);
      results.hooks.statsCalculation = { success: false, error: statsError.message };
      results.overall.failed++;
    } else {
      // Calculate stats (simulating frontend logic)
      const totalFiles = allFiles.length;
      const totalSize = allFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
      
      // Recent uploads (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentUploads = allFiles.filter(file => {
        const uploadDate = new Date(file.created_at);
        return uploadDate > weekAgo;
      }).length;

      console.log('✅ Stats calculation successful');
      console.log(`   Total Files: ${totalFiles}`);
      console.log(`   Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Recent Uploads: ${recentUploads}`);
      
      results.hooks.statsCalculation = { 
        success: true, 
        stats: { totalFiles, totalSize, recentUploads } 
      };
      results.overall.passed++;
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    results.overall.failed++;
  } finally {
    await supabase.auth.signOut();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FRONTEND FUNCTIONALITY TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Passed: ${results.overall.passed}`);
  console.log(`❌ Failed: ${results.overall.failed}`);
  
  console.log('\n📋 DETAILED RESULTS:');
  
  console.log('\nHOOK FUNCTIONALITY:');
  for (const [test, result] of Object.entries(results.hooks)) {
    console.log(`  ${test}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
    if (result.count !== undefined) {
      console.log(`    Count: ${result.count}`);
    }
    if (result.stats) {
      console.log(`    Stats: ${JSON.stringify(result.stats)}`);
    }
  }

  return results;
}

async function main() {
  const results = await testFrontendFunctionality();
  
  const overallSuccess = results.overall.failed === 0;
  console.log(`\n🎯 OVERALL STATUS: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!overallSuccess) {
    console.log('\n🚨 CRITICAL ISSUES DETECTED:');
    console.log('   Frontend functionality has problems that need immediate attention.');
  }
}

main().catch(console.error);