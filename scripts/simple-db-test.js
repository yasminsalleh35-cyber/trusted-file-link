#!/usr/bin/env node

/**
 * Simple Database Test
 * 
 * Tests the current database state and identifies issues
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
  console.log('🔍 Simple Database Test...\n');

  try {
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'urL!fKNZ8GSn'
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful\n');

    // Test basic table access
    console.log('📋 TESTING TABLE ACCESS');
    console.log('=' .repeat(40));

    // Test profiles
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      console.log(`✅ Profiles: ${profiles?.length || 0} records`);
      if (profilesError) console.log('   Error:', profilesError.message);
    } catch (error) {
      console.log('❌ Profiles table error:', error.message);
    }

    // Test clients
    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*');
      
      console.log(`✅ Clients: ${clients?.length || 0} records`);
      if (clientsError) console.log('   Error:', clientsError.message);
    } catch (error) {
      console.log('❌ Clients table error:', error.message);
    }

    // Test files
    try {
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('*')
        .limit(1);
      
      console.log(`✅ Files table accessible`);
      if (files && files.length > 0) {
        console.log('   Sample columns:', Object.keys(files[0]).join(', '));
      }
      if (filesError) console.log('   Error:', filesError.message);
    } catch (error) {
      console.log('❌ Files table error:', error.message);
    }

    // Test file_assignments
    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('file_assignments')
        .select('*')
        .limit(1);
      
      console.log(`✅ File assignments table accessible`);
      if (assignments && assignments.length > 0) {
        console.log('   Sample columns:', Object.keys(assignments[0]).join(', '));
      }
      if (assignmentsError) console.log('   Error:', assignmentsError.message);
    } catch (error) {
      console.log('❌ File assignments table error:', error.message);
    }

    // Test simple file creation
    console.log('\n📋 TESTING FILE CREATION');
    console.log('=' .repeat(40));

    try {
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          filename: 'test-file.txt',
          original_filename: 'Test File.txt',
          storage_path: 'test/test-file.txt',
          file_size: 100,
          file_type: 'text/plain',
          uploaded_by: authData.user.id,
          description: 'Simple test file'
        })
        .select()
        .single();

      if (fileError) {
        console.log('❌ File creation failed:', fileError.message);
        console.log('   Details:', fileError.details);
        console.log('   Hint:', fileError.hint);
      } else {
        console.log('✅ File created successfully:', fileData.filename);
        
        // Clean up - delete the test file
        await supabase.from('files').delete().eq('id', fileData.id);
      }
    } catch (error) {
      console.log('❌ File creation test failed:', error.message);
    }

    await supabase.auth.signOut();
    console.log('\n🎯 Test complete');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDatabase();