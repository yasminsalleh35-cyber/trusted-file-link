#!/usr/bin/env node

/**
 * Admin Query Test Script
 * 
 * This script tests the exact query that the admin dashboard is running
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdminQuery() {
  console.log('🧪 Testing Admin Dashboard Query...\n');

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

    // Test the EXACT query from the error message
    console.log('📋 Testing the exact failing query...');
    console.log('URL: /rest/v1/files?select=*%2Cprofiles%3Auploaded_by%28full_name%2Cemail%29&order=uploaded_at.desc');
    
    // This is the query that's failing - it's trying to order by uploaded_at
    const { data: failingQuery, error: failingError } = await supabase
      .from('files')
      .select('*,profiles:uploaded_by(full_name,email)')
      .order('uploaded_at', { ascending: false });

    if (failingError) {
      console.log('❌ FAILING query error:', failingError.message);
      console.log('💡 This confirms the issue - uploaded_at column does not exist');
    } else {
      console.log('✅ Failing query worked (unexpected)');
    }

    // Test the CORRECT query
    console.log('\n📋 Testing the corrected query...');
    const { data: correctQuery, error: correctError } = await supabase
      .from('files')
      .select('*,profiles:uploaded_by(full_name,email)')
      .order('created_at', { ascending: false });

    if (correctError) {
      console.log('❌ Correct query error:', correctError.message);
    } else {
      console.log(`✅ Correct query successful: ${correctQuery.length} files found`);
    }

    // Check if there are any remaining references to uploaded_at in the codebase
    console.log('\n🔍 The issue is that somewhere in the code, uploaded_at is still being used');
    console.log('💡 We need to find and fix ALL references to uploaded_at');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await supabase.auth.signOut();
  }
}

async function main() {
  await testAdminQuery();
}

main().catch(console.error);