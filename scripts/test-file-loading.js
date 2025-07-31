#!/usr/bin/env node

/**
 * File Loading Test Script
 * 
 * This script tests if files can be loaded correctly from the database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFileLoading() {
  console.log('🧪 Testing File Loading...\n');

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

    // Test the exact query that's failing
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
      console.log('❌ Admin file query failed:', adminError.message);
      console.log('💡 Error details:', adminError);
    } else {
      console.log(`✅ Admin file query successful: ${adminFiles.length} files found`);
      if (adminFiles.length > 0) {
        console.log('📄 Sample file:', {
          id: adminFiles[0].id,
          filename: adminFiles[0].filename,
          original_filename: adminFiles[0].original_filename,
          created_at: adminFiles[0].created_at,
          uploaded_by: adminFiles[0].uploaded_by,
          profile: adminFiles[0].profiles
        });
      }
    }

    // Test file assignments query
    console.log('\n📋 Testing file assignments query...');
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
      `);

    if (assignmentError) {
      console.log('❌ File assignments query failed:', assignmentError.message);
      console.log('💡 Error details:', assignmentError);
    } else {
      console.log(`✅ File assignments query successful: ${assignments.length} assignments found`);
      if (assignments.length > 0) {
        console.log('📄 Sample assignment:', {
          id: assignments[0].id,
          file_id: assignments[0].file_id,
          assigned_to_user: assignments[0].assigned_to_user,
          assigned_to_client: assignments[0].assigned_to_client,
          assigned_by: assignments[0].assigned_by,
          created_at: assignments[0].created_at,
          file: assignments[0].files ? {
            filename: assignments[0].files.filename,
            original_filename: assignments[0].files.original_filename
          } : null
        });
      }
    }

    // Test simple files query
    console.log('\n📋 Testing simple files query...');
    const { data: simpleFiles, error: simpleError } = await supabase
      .from('files')
      .select('*')
      .limit(5);

    if (simpleError) {
      console.log('❌ Simple files query failed:', simpleError.message);
    } else {
      console.log(`✅ Simple files query successful: ${simpleFiles.length} files found`);
      if (simpleFiles.length > 0) {
        console.log('📄 Available columns:', Object.keys(simpleFiles[0]));
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await supabase.auth.signOut();
  }
}

async function main() {
  await testFileLoading();
}

main().catch(console.error);