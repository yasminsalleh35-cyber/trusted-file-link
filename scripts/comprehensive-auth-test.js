#!/usr/bin/env node

/**
 * Comprehensive Authentication Test Script
 * 
 * Tests all authentication functions and user permissions
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test accounts
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@financehub.com',
    password: 'admin123456',
    expectedRole: 'admin'
  },
  client: {
    email: 'client@acme.com',
    password: 'client123456',
    expectedRole: 'client'
  },
  user: {
    email: 'user@acme.com',
    password: 'user123456',
    expectedRole: 'user'
  }
};

async function testAuthentication() {
  console.log('🔐 COMPREHENSIVE AUTHENTICATION TESTING\n');
  console.log('=' .repeat(60));

  const results = {
    signIn: {},
    profiles: {},
    permissions: {},
    overall: { passed: 0, failed: 0 }
  };

  for (const [accountType, credentials] of Object.entries(TEST_ACCOUNTS)) {
    console.log(`\n🧪 TESTING ${accountType.toUpperCase()} ACCOUNT`);
    console.log('-'.repeat(40));

    try {
      // Test sign-in
      console.log(`📝 Testing sign-in for ${credentials.email}...`);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (authError) {
        console.log(`❌ Sign-in FAILED: ${authError.message}`);
        results.signIn[accountType] = { success: false, error: authError.message };
        results.overall.failed++;
        continue;
      }

      console.log(`✅ Sign-in successful`);
      console.log(`   User ID: ${authData.user.id}`);
      console.log(`   Email: ${authData.user.email}`);
      results.signIn[accountType] = { success: true, userId: authData.user.id };

      // Test profile retrieval
      console.log(`📋 Testing profile retrieval...`);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.log(`❌ Profile retrieval FAILED: ${profileError.message}`);
        results.profiles[accountType] = { success: false, error: profileError.message };
        results.overall.failed++;
      } else {
        console.log(`✅ Profile retrieved successfully`);
        console.log(`   Role: ${profile.role}`);
        console.log(`   Full Name: ${profile.full_name}`);
        console.log(`   Client ID: ${profile.client_id || 'N/A'}`);
        
        // Verify role matches expected
        if (profile.role === credentials.expectedRole) {
          console.log(`✅ Role verification PASSED`);
          results.profiles[accountType] = { 
            success: true, 
            role: profile.role, 
            fullName: profile.full_name,
            clientId: profile.client_id 
          };
          results.overall.passed++;
        } else {
          console.log(`❌ Role verification FAILED: Expected ${credentials.expectedRole}, got ${profile.role}`);
          results.profiles[accountType] = { 
            success: false, 
            error: `Role mismatch: expected ${credentials.expectedRole}, got ${profile.role}` 
          };
          results.overall.failed++;
        }
      }

      // Test basic permissions
      console.log(`🔒 Testing basic permissions...`);
      
      // Test files table access
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('count(*)')
        .limit(1);

      if (filesError) {
        console.log(`❌ Files table access FAILED: ${filesError.message}`);
        results.permissions[accountType] = { filesAccess: false, error: filesError.message };
      } else {
        console.log(`✅ Files table access successful`);
        results.permissions[accountType] = { filesAccess: true };
      }

      // Test file_assignments table access
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('file_assignments')
        .select('count(*)')
        .limit(1);

      if (assignmentsError) {
        console.log(`❌ File assignments table access FAILED: ${assignmentsError.message}`);
        results.permissions[accountType].assignmentsAccess = false;
      } else {
        console.log(`✅ File assignments table access successful`);
        results.permissions[accountType].assignmentsAccess = true;
      }

      // Admin-specific tests
      if (accountType === 'admin') {
        console.log(`👑 Testing admin-specific permissions...`);
        
        // Test profiles table access (admin should see all profiles)
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .limit(10);

        if (allProfilesError) {
          console.log(`❌ Admin profiles access FAILED: ${allProfilesError.message}`);
          results.permissions[accountType].adminProfilesAccess = false;
        } else {
          console.log(`✅ Admin profiles access successful (${allProfiles.length} profiles visible)`);
          results.permissions[accountType].adminProfilesAccess = true;
          results.permissions[accountType].visibleProfiles = allProfiles.length;
        }
      }

      // Sign out
      await supabase.auth.signOut();
      console.log(`🚪 Signed out successfully`);

    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
      results.overall.failed++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUTHENTICATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Passed: ${results.overall.passed}`);
  console.log(`❌ Failed: ${results.overall.failed}`);
  
  console.log('\n📋 DETAILED RESULTS:');
  
  for (const [accountType, signInResult] of Object.entries(results.signIn)) {
    console.log(`\n${accountType.toUpperCase()}:`);
    console.log(`  Sign-in: ${signInResult.success ? '✅' : '❌'} ${signInResult.error || ''}`);
    
    const profileResult = results.profiles[accountType];
    if (profileResult) {
      console.log(`  Profile: ${profileResult.success ? '✅' : '❌'} ${profileResult.error || ''}`);
      if (profileResult.success) {
        console.log(`    Role: ${profileResult.role}`);
        console.log(`    Name: ${profileResult.fullName}`);
      }
    }
    
    const permResult = results.permissions[accountType];
    if (permResult) {
      console.log(`  Files Access: ${permResult.filesAccess ? '✅' : '❌'}`);
      console.log(`  Assignments Access: ${permResult.assignmentsAccess ? '✅' : '❌'}`);
      if (permResult.adminProfilesAccess !== undefined) {
        console.log(`  Admin Profiles Access: ${permResult.adminProfilesAccess ? '✅' : '❌'}`);
      }
    }
  }

  return results;
}

async function main() {
  const results = await testAuthentication();
  
  // Determine overall status
  const overallSuccess = results.overall.failed === 0;
  console.log(`\n🎯 OVERALL STATUS: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!overallSuccess) {
    console.log('\n🚨 CRITICAL ISSUES DETECTED:');
    console.log('   Authentication system has problems that need immediate attention.');
  }
}

main().catch(console.error);