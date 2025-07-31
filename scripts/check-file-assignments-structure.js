#!/usr/bin/env node

/**
 * Check File Assignments Table Structure
 * 
 * Examines the actual database structure to fix the query issues
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkFileAssignmentsStructure() {
  console.log('🔍 CHECKING FILE ASSIGNMENTS TABLE STRUCTURE\n');
  console.log('=' .repeat(60));

  try {
    // Sign in as admin
    console.log('🔐 Signing in as admin...');
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    if (authError) {
      console.log(`❌ Admin sign-in FAILED: ${authError.message}`);
      return;
    }
    console.log('✅ Admin signed in successfully\n');

    // Check file_assignments table structure
    console.log('📋 Checking file_assignments table...');
    
    // Try to get a sample record to see the actual structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('file_assignments')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log(`❌ Sample query FAILED: ${sampleError.message}`);
    } else {
      console.log(`✅ Sample query successful`);
      if (sampleData && sampleData.length > 0) {
        console.log('\n📄 ACTUAL TABLE STRUCTURE:');
        const sample = sampleData[0];
        Object.keys(sample).forEach(key => {
          console.log(`   ${key}: ${typeof sample[key]} = ${sample[key]}`);
        });
      } else {
        console.log('   No records found in file_assignments table');
      }
    }

    // Test the problematic query
    console.log('\n🧪 Testing the problematic query...');
    const { data: problemData, error: problemError } = await supabase
      .from('file_assignments')
      .select(`
        id,
        assigned_to_name,
        assigned_to_client_name,
        assigned_by_name,
        assigned_at,
        notes,
        expires_at,
        assignment_type
      `)
      .limit(1);

    if (problemError) {
      console.log(`❌ Problematic query FAILED: ${problemError.message}`);
      console.log(`   Code: ${problemError.code}`);
      console.log(`   Details: ${problemError.details}`);
      console.log(`   Hint: ${problemError.hint}`);
    } else {
      console.log('✅ Problematic query worked (unexpected!)');
    }

    // Test a basic query to see what columns actually exist
    console.log('\n🔍 Testing basic query...');
    const { data: basicData, error: basicError } = await supabase
      .from('file_assignments')
      .select('*')
      .limit(1);

    if (basicError) {
      console.log(`❌ Basic query FAILED: ${basicError.message}`);
    } else {
      console.log('✅ Basic query successful');
      if (basicData && basicData.length > 0) {
        console.log('\n📋 AVAILABLE COLUMNS:');
        Object.keys(basicData[0]).forEach(key => {
          console.log(`   ✅ ${key}`);
        });
      }
    }

    // Check if we need to use JOINs to get names
    console.log('\n🔗 Testing JOIN query for names...');
    const { data: joinData, error: joinError } = await supabase
      .from('file_assignments')
      .select(`
        id,
        assigned_to_user,
        assigned_to_client,
        assigned_by,
        assigned_at,
        notes,
        expires_at,
        assignment_type,
        user_profile:assigned_to_user(full_name, email),
        client_profile:assigned_to_client(company_name),
        assigned_by_profile:assigned_by(full_name, email)
      `)
      .limit(1);

    if (joinError) {
      console.log(`❌ JOIN query FAILED: ${joinError.message}`);
      console.log('   This means we need to fix the relationships');
    } else {
      console.log('✅ JOIN query successful');
      if (joinData && joinData.length > 0) {
        console.log('\n📄 JOIN QUERY RESULT:');
        console.log(JSON.stringify(joinData[0], null, 2));
      }
    }

    // Check profiles table structure
    console.log('\n👥 Checking profiles table structure...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log(`❌ Profiles query FAILED: ${profilesError.message}`);
    } else {
      console.log('✅ Profiles query successful');
      if (profilesData && profilesData.length > 0) {
        console.log('\n👤 PROFILES TABLE COLUMNS:');
        Object.keys(profilesData[0]).forEach(key => {
          console.log(`   ✅ ${key}`);
        });
      }
    }

    // Check clients table structure
    console.log('\n🏢 Checking clients table structure...');
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (clientsError) {
      console.log(`❌ Clients query FAILED: ${clientsError.message}`);
    } else {
      console.log('✅ Clients query successful');
      if (clientsData && clientsData.length > 0) {
        console.log('\n🏢 CLIENTS TABLE COLUMNS:');
        Object.keys(clientsData[0]).forEach(key => {
          console.log(`   ✅ ${key}`);
        });
      }
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  } finally {
    await supabase.auth.signOut();
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 RECOMMENDATIONS:');
  console.log('1. Use JOIN queries instead of expecting name columns');
  console.log('2. Query actual foreign key columns (assigned_to_user, assigned_to_client)');
  console.log('3. Join with profiles and clients tables to get names');
  console.log('4. Update FileAssignmentModal to use correct column names');
}

async function main() {
  await checkFileAssignmentsStructure();
}

main().catch(console.error);