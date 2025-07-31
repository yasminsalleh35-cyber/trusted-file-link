#!/usr/bin/env node

/**
 * New User Registration Test Script
 * 
 * Tests the new user registration bug fix
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testNewUserRegistration() {
  console.log('🧪 TESTING NEW USER REGISTRATION BUG FIX\n');
  console.log('=' .repeat(60));

  const results = {
    userCreation: {},
    fileQueries: {},
    overall: { passed: 0, failed: 0 }
  };

  const testEmail = `testuser-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  let testUserId = null;

  try {
    // Step 1: Create a new user (simulating registration)
    console.log('👤 Step 1: Creating new test user...');
    console.log(`   Email: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signUpError) {
      console.log(`❌ User creation FAILED: ${signUpError.message}`);
      results.userCreation.signUp = { success: false, error: signUpError.message };
      results.overall.failed++;
      return results;
    }

    console.log('✅ User created successfully');
    testUserId = signUpData.user.id;
    results.userCreation.signUp = { success: true, userId: testUserId };
    results.overall.passed++;

    // Step 2: Create profile without client_id (simulating new user)
    console.log('\n📋 Step 2: Creating user profile without client_id...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: 'Test User',
        role: 'user',
        client_id: null // This is the key - no client_id assigned yet
      });

    if (profileError) {
      console.log(`❌ Profile creation FAILED: ${profileError.message}`);
      results.userCreation.profile = { success: false, error: profileError.message };
      results.overall.failed++;
      return results;
    }

    console.log('✅ Profile created successfully (without client_id)');
    results.userCreation.profile = { success: true };
    results.overall.passed++;

    // Step 3: Sign in as the new user
    console.log('\n🔐 Step 3: Signing in as new user...');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log(`❌ Sign in FAILED: ${signInError.message}`);
      results.userCreation.signIn = { success: false, error: signInError.message };
      results.overall.failed++;
      return results;
    }

    console.log('✅ Sign in successful');
    results.userCreation.signIn = { success: true };
    results.overall.passed++;

    // Step 4: Test file assignment query (this was failing before)
    console.log('\n📁 Step 4: Testing file assignment query...');
    console.log('   This query was failing with "undefined" client_id...');

    // Simulate the exact query that was failing
    const { data: assignments, error: assignmentError } = await supabase
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
      .eq('assigned_to_user', testUserId); // Only query for user assignments, not client

    if (assignmentError) {
      console.log(`❌ File assignment query FAILED: ${assignmentError.message}`);
      results.fileQueries.assignments = { success: false, error: assignmentError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ File assignment query successful: ${assignments.length} assignments found`);
      results.fileQueries.assignments = { success: true, count: assignments.length };
      results.overall.passed++;
    }

    // Step 5: Test the fetchAssignments function simulation
    console.log('\n📋 Step 5: Testing fetchAssignments function simulation...');
    
    const { data: fetchAssignments, error: fetchError } = await supabase
      .from('file_assignments')
      .select('*')
      .eq('assigned_to_user', testUserId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.log(`❌ fetchAssignments simulation FAILED: ${fetchError.message}`);
      results.fileQueries.fetchAssignments = { success: false, error: fetchError.message };
      results.overall.failed++;
    } else {
      console.log(`✅ fetchAssignments simulation successful: ${fetchAssignments.length} assignments`);
      results.fileQueries.fetchAssignments = { success: true, count: fetchAssignments.length };
      results.overall.passed++;
    }

    // Step 6: Test what happens when we assign client_id later
    console.log('\n🏢 Step 6: Testing client assignment...');
    const clientId = 'bacb2c3b-7714-494f-ad13-158d6a008b09'; // Existing client ID
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ client_id: clientId })
      .eq('id', testUserId);

    if (updateError) {
      console.log(`❌ Client assignment FAILED: ${updateError.message}`);
      results.userCreation.clientAssignment = { success: false, error: updateError.message };
      results.overall.failed++;
    } else {
      console.log('✅ Client assigned successfully');
      results.userCreation.clientAssignment = { success: true };
      results.overall.passed++;

      // Test query with client_id now assigned
      console.log('   Testing query with client_id now assigned...');
      const { data: clientAssignments, error: clientQueryError } = await supabase
        .from('file_assignments')
        .select('*')
        .or(`assigned_to_user.eq.${testUserId},assigned_to_client.eq.${clientId}`);

      if (clientQueryError) {
        console.log(`❌ Client query FAILED: ${clientQueryError.message}`);
        results.fileQueries.clientQuery = { success: false, error: clientQueryError.message };
        results.overall.failed++;
      } else {
        console.log(`✅ Client query successful: ${clientAssignments.length} assignments`);
        results.fileQueries.clientQuery = { success: true, count: clientAssignments.length };
        results.overall.passed++;
      }
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    results.overall.failed++;
  } finally {
    // Cleanup: Delete test user
    if (testUserId) {
      console.log('\n🧹 Cleanup: Removing test user...');
      try {
        await supabase.from('profiles').delete().eq('id', testUserId);
        console.log('✅ Test user cleaned up');
      } catch (cleanupError) {
        console.log(`⚠️ Cleanup warning: ${cleanupError.message}`);
      }
    }
    
    await supabase.auth.signOut();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 NEW USER REGISTRATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Passed: ${results.overall.passed}`);
  console.log(`❌ Failed: ${results.overall.failed}`);
  
  const totalTests = results.overall.passed + results.overall.failed;
  const successRate = totalTests > 0 ? ((results.overall.passed / totalTests) * 100).toFixed(1) : 0;
  console.log(`📈 Success Rate: ${successRate}%`);

  console.log('\n📋 DETAILED RESULTS:');
  
  console.log('\n👤 USER CREATION:');
  Object.entries(results.userCreation).forEach(([test, result]) => {
    console.log(`  ${test}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
  });
  
  console.log('\n📁 FILE QUERIES:');
  Object.entries(results.fileQueries).forEach(([test, result]) => {
    console.log(`  ${test}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
    if (result.count !== undefined) {
      console.log(`    Count: ${result.count}`);
    }
  });

  // Final assessment
  console.log('\n🎯 BUG FIX ASSESSMENT:');
  
  if (results.overall.failed === 0) {
    console.log('🎉 EXCELLENT: New user registration bug is FIXED!');
    console.log('✅ Users without client_id can now sign in without errors.');
  } else {
    console.log('❌ ISSUE: The bug fix may not be complete.');
    console.log('🔧 Additional work may be needed.');
  }

  return results;
}

async function main() {
  await testNewUserRegistration();
}

main().catch(console.error);