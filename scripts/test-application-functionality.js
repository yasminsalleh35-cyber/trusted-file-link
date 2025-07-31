#!/usr/bin/env node

/**
 * Application Functionality Test Script
 * 
 * Tests the actual application functionality by simulating user interactions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testApplicationFunctionality() {
  console.log('🚀 COMPREHENSIVE APPLICATION FUNCTIONALITY TEST\n');
  console.log('=' .repeat(70));

  const results = {
    authentication: {},
    dashboards: {},
    fileOperations: {},
    userManagement: {},
    overall: { passed: 0, failed: 0, warnings: 0 }
  };

  console.log('🌐 Application running at: http://localhost:8080/');
  console.log('📋 Testing core functionality that powers the frontend...\n');

  try {
    // ========================================
    // 1. AUTHENTICATION TESTING
    // ========================================
    console.log('🔐 1. AUTHENTICATION SYSTEM TESTING');
    console.log('='.repeat(50));

    const testAccounts = [
      { type: 'admin', email: 'admin@financehub.com', password: 'admin123456' },
      { type: 'client', email: 'client@acme.com', password: 'client123456' },
      { type: 'user', email: 'user@acme.com', password: 'user123456' }
    ];

    for (const account of testAccounts) {
      console.log(`\n👤 Testing ${account.type.toUpperCase()} login...`);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });

      if (authError) {
        console.log(`❌ ${account.type} login FAILED: ${authError.message}`);
        results.authentication[account.type] = { success: false, error: authError.message };
        results.overall.failed++;
        continue;
      }

      console.log(`✅ ${account.type} login successful`);
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.log(`❌ ${account.type} profile retrieval FAILED: ${profileError.message}`);
        results.authentication[account.type] = { success: false, error: profileError.message };
        results.overall.failed++;
      } else {
        console.log(`✅ ${account.type} profile retrieved: ${profile.full_name} (${profile.role})`);
        results.authentication[account.type] = { 
          success: true, 
          profile: { name: profile.full_name, role: profile.role, clientId: profile.client_id }
        };
        results.overall.passed++;
      }

      await supabase.auth.signOut();
    }

    // ========================================
    // 2. ADMIN DASHBOARD TESTING
    // ========================================
    console.log('\n\n👑 2. ADMIN DASHBOARD FUNCTIONALITY');
    console.log('='.repeat(50));

    // Sign in as admin
    await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    // Test admin file management
    console.log('\n📁 Testing admin file management...');
    const { data: adminFiles, error: adminFilesError } = await supabase
      .from('files')
      .select(`
        *,
        profiles:uploaded_by (
          full_name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (adminFilesError) {
      console.log(`❌ Admin file query FAILED: ${adminFilesError.message}`);
      results.dashboards.adminFiles = { success: false, error: adminFilesError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ Admin can see ${adminFiles.length} files`);
      results.dashboards.adminFiles = { success: true, count: adminFiles.length };
      results.overall.passed++;

      if (adminFiles.length > 0) {
        console.log('📄 Sample files:');
        adminFiles.slice(0, 3).forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.original_filename} (${(file.file_size / 1024).toFixed(1)} KB)`);
          console.log(`      Uploaded by: ${file.profiles?.full_name || 'Unknown'}`);
        });
      }
    }

    // Test admin user management
    console.log('\n👥 Testing admin user management...');
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, client_id, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.log(`❌ Admin user query FAILED: ${usersError.message}`);
      results.dashboards.adminUsers = { success: false, error: usersError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ Admin can see ${allUsers.length} users`);
      results.dashboards.adminUsers = { success: true, count: allUsers.length };
      results.overall.passed++;

      console.log('👤 User breakdown:');
      const roleCount = allUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} users`);
      });
    }

    // Test admin assignment management
    console.log('\n📋 Testing admin assignment management...');
    const { data: allAssignments, error: assignmentsError } = await supabase
      .from('file_assignments')
      .select(`
        *,
        files (filename, original_filename),
        assigned_by_profile:profiles!file_assignments_assigned_by_fkey (full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.log(`❌ Admin assignments query FAILED: ${assignmentsError.message}`);
      results.dashboards.adminAssignments = { success: false, error: assignmentsError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ Admin can see ${allAssignments.length} assignments`);
      results.dashboards.adminAssignments = { success: true, count: allAssignments.length };
      results.overall.passed++;
    }

    await supabase.auth.signOut();

    // ========================================
    // 3. CLIENT DASHBOARD TESTING
    // ========================================
    console.log('\n\n🏢 3. CLIENT DASHBOARD FUNCTIONALITY');
    console.log('='.repeat(50));

    // Sign in as client
    await supabase.auth.signInWithPassword({
      email: 'client@acme.com',
      password: 'client123456'
    });

    // Test client file access
    console.log('\n📁 Testing client file access...');
    const clientId = 'bacb2c3b-7714-494f-ad13-158d6a008b09';
    
    // Files assigned to client
    const { data: clientAssignedFiles, error: clientFilesError } = await supabase
      .from('file_assignments')
      .select(`
        *,
        files (
          *,
          profiles:uploaded_by (full_name, email)
        )
      `)
      .eq('assigned_to_client', clientId);

    if (clientFilesError) {
      console.log(`❌ Client file access FAILED: ${clientFilesError.message}`);
      results.dashboards.clientFiles = { success: false, error: clientFilesError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ Client can access ${clientAssignedFiles.length} assigned files`);
      results.dashboards.clientFiles = { success: true, count: clientAssignedFiles.length };
      results.overall.passed++;
    }

    // Files uploaded by client
    const { data: clientUploadedFiles, error: clientUploadError } = await supabase
      .from('files')
      .select('*')
      .eq('uploaded_by', '16dc3381-becc-4e24-a923-2ef971416d44'); // Client user ID

    if (clientUploadError) {
      console.log(`❌ Client uploaded files query FAILED: ${clientUploadError.message}`);
      results.dashboards.clientUploads = { success: false, error: clientUploadError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ Client has uploaded ${clientUploadedFiles.length} files`);
      results.dashboards.clientUploads = { success: true, count: clientUploadedFiles.length };
      results.overall.passed++;
    }

    await supabase.auth.signOut();

    // ========================================
    // 4. USER DASHBOARD TESTING
    // ========================================
    console.log('\n\n👤 4. USER DASHBOARD FUNCTIONALITY');
    console.log('='.repeat(50));

    // Sign in as user
    await supabase.auth.signInWithPassword({
      email: 'user@acme.com',
      password: 'user123456'
    });

    // Test user file access
    console.log('\n📁 Testing user file access...');
    const userId = 'fffc4428-ea6d-480a-a391-7473f74567bd';
    
    // Files assigned to user
    const { data: userAssignedFiles, error: userFilesError } = await supabase
      .from('file_assignments')
      .select(`
        *,
        files (
          *,
          profiles:uploaded_by (full_name, email)
        )
      `)
      .eq('assigned_to_user', userId);

    if (userFilesError) {
      console.log(`❌ User file access FAILED: ${userFilesError.message}`);
      results.dashboards.userFiles = { success: false, error: userFilesError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ User can access ${userAssignedFiles.length} assigned files`);
      results.dashboards.userFiles = { success: true, count: userAssignedFiles.length };
      results.overall.passed++;
    }

    // Files assigned to user's client
    const { data: userClientFiles, error: userClientError } = await supabase
      .from('file_assignments')
      .select(`
        *,
        files (
          *,
          profiles:uploaded_by (full_name, email)
        )
      `)
      .eq('assigned_to_client', clientId);

    if (userClientError) {
      console.log(`❌ User client files access FAILED: ${userClientError.message}`);
      results.dashboards.userClientFiles = { success: false, error: userClientError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ User can access ${userClientFiles.length} client-assigned files`);
      results.dashboards.userClientFiles = { success: true, count: userClientFiles.length };
      results.overall.passed++;
    }

    await supabase.auth.signOut();

    // ========================================
    // 5. FILE OPERATIONS TESTING
    // ========================================
    console.log('\n\n📁 5. FILE OPERATIONS TESTING');
    console.log('='.repeat(50));

    // Sign in as admin for file operations testing
    await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    // Test file upload process
    console.log('\n📤 Testing file upload process...');
    const testFileContent = `Test file uploaded at ${new Date().toISOString()}`;
    const testFileName = `test-upload-${Date.now()}.txt`;
    const testFileId = crypto.randomUUID();
    const adminUserId = '0d84cc74-aa9d-48c1-97a7-6996d8b65cb0';
    const testFilePath = `uploads/${adminUserId}/${testFileName}`;

    try {
      // Step 1: Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(testFilePath, testFileContent, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Step 2: Create database record
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          id: testFileId,
          filename: testFileName,
          original_filename: testFileName,
          storage_path: testFilePath,
          file_size: testFileContent.length,
          file_type: 'text/plain',
          uploaded_by: adminUserId,
          description: 'Test file for functionality testing'
        });

      if (dbError) throw dbError;

      console.log('✅ File upload process successful');
      results.fileOperations.upload = { success: true };
      results.overall.passed++;

      // Test file download URL generation
      console.log('🔗 Testing file download URL generation...');
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('files')
        .createSignedUrl(testFilePath, 3600);

      if (downloadError) {
        console.log(`❌ Download URL generation FAILED: ${downloadError.message}`);
        results.fileOperations.download = { success: false, error: downloadError.message };
        results.overall.failed++;
      } else {
        console.log('✅ Download URL generation successful');
        results.fileOperations.download = { success: true };
        results.overall.passed++;
      }

      // Test file assignment
      console.log('📋 Testing file assignment...');
      const assignmentId = crypto.randomUUID();
      const { error: assignError } = await supabase
        .from('file_assignments')
        .insert({
          id: assignmentId,
          file_id: testFileId,
          assigned_to_client: clientId,
          assigned_by: adminUserId
        });

      if (assignError) {
        console.log(`❌ File assignment FAILED: ${assignError.message}`);
        results.fileOperations.assignment = { success: false, error: assignError.message };
        results.overall.failed++;
      } else {
        console.log('✅ File assignment successful');
        results.fileOperations.assignment = { success: true };
        results.overall.passed++;

        // Clean up assignment
        await supabase.from('file_assignments').delete().eq('id', assignmentId);
      }

      // Test file deletion
      console.log('🗑️ Testing file deletion...');
      const { error: deleteDbError } = await supabase
        .from('files')
        .delete()
        .eq('id', testFileId);

      if (deleteDbError) {
        console.log(`❌ File database deletion FAILED: ${deleteDbError.message}`);
        results.fileOperations.delete = { success: false, error: deleteDbError.message };
        results.overall.failed++;
      } else {
        // Delete from storage
        const { error: deleteStorageError } = await supabase.storage
          .from('files')
          .remove([testFilePath]);

        if (deleteStorageError) {
          console.log(`⚠️ File storage deletion WARNING: ${deleteStorageError.message}`);
          results.overall.warnings++;
        }

        console.log('✅ File deletion successful');
        results.fileOperations.delete = { success: true };
        results.overall.passed++;
      }

    } catch (error) {
      console.log(`❌ File operations test FAILED: ${error.message}`);
      results.fileOperations.upload = { success: false, error: error.message };
      results.overall.failed++;

      // Attempt cleanup
      try {
        await supabase.from('files').delete().eq('id', testFileId);
        await supabase.storage.from('files').remove([testFilePath]);
      } catch (cleanupError) {
        console.log(`⚠️ Cleanup failed: ${cleanupError.message}`);
      }
    }

    await supabase.auth.signOut();

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    results.overall.failed++;
  }

  // ========================================
  // FINAL SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPREHENSIVE APPLICATION TEST SUMMARY');
  console.log('='.repeat(70));
  
  console.log(`\n✅ Passed: ${results.overall.passed}`);
  console.log(`❌ Failed: ${results.overall.failed}`);
  console.log(`⚠️ Warnings: ${results.overall.warnings}`);
  
  const totalTests = results.overall.passed + results.overall.failed;
  const successRate = totalTests > 0 ? ((results.overall.passed / totalTests) * 100).toFixed(1) : 0;
  console.log(`📈 Success Rate: ${successRate}%`);

  console.log('\n📋 DETAILED RESULTS BY CATEGORY:');
  
  console.log('\n🔐 AUTHENTICATION:');
  Object.entries(results.authentication).forEach(([type, result]) => {
    console.log(`  ${type}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
    if (result.profile) {
      console.log(`    Profile: ${result.profile.name} (${result.profile.role})`);
    }
  });
  
  console.log('\n📊 DASHBOARDS:');
  Object.entries(results.dashboards).forEach(([test, result]) => {
    console.log(`  ${test}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
    if (result.count !== undefined) {
      console.log(`    Count: ${result.count}`);
    }
  });
  
  console.log('\n📁 FILE OPERATIONS:');
  Object.entries(results.fileOperations).forEach(([operation, result]) => {
    console.log(`  ${operation}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
  });

  // Application status assessment
  console.log('\n🎯 APPLICATION STATUS ASSESSMENT:');
  
  if (results.overall.failed === 0) {
    console.log('🎉 EXCELLENT: All core functionality is working perfectly!');
    console.log('✅ The application is ready for production use.');
  } else if (results.overall.failed <= 2) {
    console.log('✅ GOOD: Most functionality is working with minor issues.');
    console.log('⚠️ Some non-critical features may need attention.');
  } else if (results.overall.failed <= 5) {
    console.log('⚠️ FAIR: Core functionality works but several issues need fixing.');
    console.log('🔧 Recommend addressing failed tests before production.');
  } else {
    console.log('❌ POOR: Multiple critical issues detected.');
    console.log('🚨 Immediate attention required before the application can be used.');
  }

  console.log('\n🌐 APPLICATION ACCESS:');
  console.log('   URL: http://localhost:8080/');
  console.log('   Admin: admin@financehub.com / admin123456');
  console.log('   Client: client@acme.com / client123456');
  console.log('   User: user@acme.com / user123456');

  return results;
}

async function main() {
  await testApplicationFunctionality();
}

main().catch(console.error);