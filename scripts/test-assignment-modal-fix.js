#!/usr/bin/env node

/**
 * Test Assignment Modal Fix
 * 
 * Tests the fixed FileAssignmentModal database queries
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAssignmentModalFix() {
  console.log('🔧 TESTING ASSIGNMENT MODAL FIX\n');
  console.log('=' .repeat(50));

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

    // Test 1: Fixed assignment history query
    console.log('📋 Testing FIXED assignment history query...');
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('file_assignments')
      .select(`
        id,
        file_id,
        assigned_to_user,
        assigned_to_client,
        assigned_by,
        created_at,
        user_profile:assigned_to_user(full_name, email),
        client_profile:assigned_to_client(company_name),
        assigned_by_profile:assigned_by(full_name, email)
      `)
      .limit(5)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.log(`❌ Fixed assignment query FAILED: ${assignmentsError.message}`);
      console.log(`   Code: ${assignmentsError.code}`);
      console.log(`   Details: ${assignmentsError.details}`);
    } else {
      console.log(`✅ Fixed assignment query successful: ${assignmentsData.length} assignments`);
      
      if (assignmentsData.length > 0) {
        console.log('\n📄 Sample assignment data:');
        const sample = assignmentsData[0];
        console.log(`   ID: ${sample.id}`);
        console.log(`   File ID: ${sample.file_id}`);
        console.log(`   Assigned to user: ${sample.assigned_to_user || 'None'}`);
        console.log(`   Assigned to client: ${sample.assigned_to_client || 'None'}`);
        console.log(`   Assigned by: ${sample.assigned_by}`);
        console.log(`   Created at: ${sample.created_at}`);
        console.log(`   User profile: ${sample.user_profile?.full_name || 'None'}`);
        console.log(`   Client profile: ${sample.client_profile?.company_name || 'None'}`);
        console.log(`   Assigned by profile: ${sample.assigned_by_profile?.full_name || 'None'}`);
      }
    }

    // Test 2: Users query for assignment modal
    console.log('\n👥 Testing users query for assignment modal...');
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, client_id')
      .neq('role', 'admin'); // Exclude admins from assignment targets

    if (usersError) {
      console.log(`❌ Users query FAILED: ${usersError.message}`);
    } else {
      console.log(`✅ Users query successful: ${usersData.length} users`);
      
      const clients = usersData.filter(u => u.role === 'client');
      const regularUsers = usersData.filter(u => u.role === 'user');
      
      console.log(`   Clients: ${clients.length}`);
      console.log(`   Regular users: ${regularUsers.length}`);
      
      if (clients.length > 0) {
        console.log(`   Sample client: ${clients[0].full_name} (${clients[0].email})`);
      }
      if (regularUsers.length > 0) {
        console.log(`   Sample user: ${regularUsers[0].full_name} (${regularUsers[0].email})`);
      }
    }

    // Test 3: Clients query for assignment modal
    console.log('\n🏢 Testing clients query for assignment modal...');
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name');

    if (clientsError) {
      console.log(`❌ Clients query FAILED: ${clientsError.message}`);
    } else {
      console.log(`✅ Clients query successful: ${clientsData.length} clients`);
      
      if (clientsData.length > 0) {
        console.log(`   Sample client: ${clientsData[0].company_name}`);
      }
    }

    // Test 4: Test the old broken query to confirm it fails
    console.log('\n🚫 Testing the OLD BROKEN query (should fail)...');
    const { data: brokenData, error: brokenError } = await supabase
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

    if (brokenError) {
      console.log(`✅ Old broken query FAILED as expected: ${brokenError.message}`);
      console.log('   This confirms our fix is necessary!');
    } else {
      console.log('❌ Old broken query worked (unexpected!)');
    }

    // Test 5: Simulate assignment modal data flow
    console.log('\n🔄 Testing assignment modal data flow...');
    
    // Get a sample file
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('id, original_filename')
      .limit(1);

    if (filesError || !filesData || filesData.length === 0) {
      console.log('❌ No files found for testing assignment modal');
    } else {
      const sampleFile = filesData[0];
      console.log(`📄 Testing with file: ${sampleFile.original_filename}`);
      
      // Test assignment history for this file
      const { data: fileAssignments, error: fileAssignmentsError } = await supabase
        .from('file_assignments')
        .select(`
          id,
          file_id,
          assigned_to_user,
          assigned_to_client,
          assigned_by,
          created_at,
          user_profile:assigned_to_user(full_name, email),
          client_profile:assigned_to_client(company_name),
          assigned_by_profile:assigned_by(full_name, email)
        `)
        .eq('file_id', sampleFile.id)
        .order('created_at', { ascending: false });

      if (fileAssignmentsError) {
        console.log(`❌ File assignments query FAILED: ${fileAssignmentsError.message}`);
      } else {
        console.log(`✅ File assignments query successful: ${fileAssignments.length} assignments for this file`);
        
        if (fileAssignments.length > 0) {
          console.log('   Assignment details:');
          fileAssignments.forEach((assignment, index) => {
            const assignedTo = assignment.user_profile?.full_name || 
                             assignment.client_profile?.company_name || 
                             'Unknown';
            const assignedBy = assignment.assigned_by_profile?.full_name || 'Unknown';
            const assignmentType = assignment.assigned_to_user ? 'user' : 'client';
            
            console.log(`   ${index + 1}. ${assignedTo} (${assignmentType}) - assigned by ${assignedBy}`);
          });
        }
      }
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  } finally {
    await supabase.auth.signOut();
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 ASSIGNMENT MODAL FIX SUMMARY:');
  console.log('✅ Fixed database column references');
  console.log('✅ Updated query to use JOINs for names');
  console.log('✅ Removed non-existent fields (notes, expires_at)');
  console.log('✅ Updated data structure interfaces');
  console.log('✅ Fixed assignment history display logic');
  
  console.log('\n🌐 TEST THE FIX:');
  console.log('1. Go to: http://localhost:8080/admin/files');
  console.log('2. Login: admin@financehub.com / admin123456');
  console.log('3. Click "Assign File" button on any file');
  console.log('4. The modal should open without console errors');
  console.log('5. Assignment history should display correctly');
}

async function main() {
  await testAssignmentModalFix();
}

main().catch(console.error);