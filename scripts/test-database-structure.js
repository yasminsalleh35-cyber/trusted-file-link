#!/usr/bin/env node

/**
 * Database Structure Test
 * 
 * Tests if our database structure fixes are working correctly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseStructure() {
  console.log('🔍 Testing Database Structure...\n');

  try {
    // Test 1: Check if profiles table exists and has correct structure
    console.log('📋 1. TESTING PROFILES TABLE');
    console.log('=' .repeat(50));
    
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (profilesError) {
        console.log('❌ Profiles table error:', profilesError.message);
      } else {
        console.log('✅ Profiles table exists');
        if (profilesData && profilesData.length > 0) {
          const columns = Object.keys(profilesData[0]);
          console.log('   Columns:', columns.join(', '));
        }
      }
    } catch (error) {
      console.log('❌ Profiles table test failed:', error.message);
    }

    // Test 2: Check if clients table exists
    console.log('\n📋 2. TESTING CLIENTS TABLE');
    console.log('=' .repeat(50));
    
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

      if (clientsError) {
        console.log('❌ Clients table error:', clientsError.message);
      } else {
        console.log('✅ Clients table exists');
        if (clientsData && clientsData.length > 0) {
          const columns = Object.keys(clientsData[0]);
          console.log('   Columns:', columns.join(', '));
        }
      }
    } catch (error) {
      console.log('❌ Clients table test failed:', error.message);
    }

    // Test 3: Check files table structure
    console.log('\n📋 3. TESTING FILES TABLE');
    console.log('=' .repeat(50));
    
    try {
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .limit(1);

      if (filesError) {
        console.log('❌ Files table error:', filesError.message);
      } else {
        console.log('✅ Files table exists');
        if (filesData && filesData.length > 0) {
          const columns = Object.keys(filesData[0]);
          console.log('   Columns:', columns.join(', '));
        } else {
          console.log('   Table is empty (expected for new setup)');
        }
      }
    } catch (error) {
      console.log('❌ Files table test failed:', error.message);
    }

    // Test 4: Check file_assignments table structure
    console.log('\n📋 4. TESTING FILE_ASSIGNMENTS TABLE');
    console.log('=' .repeat(50));
    
    try {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('file_assignments')
        .select('*')
        .limit(1);

      if (assignmentsError) {
        console.log('❌ File assignments table error:', assignmentsError.message);
      } else {
        console.log('✅ File assignments table exists');
        if (assignmentsData && assignmentsData.length > 0) {
          const columns = Object.keys(assignmentsData[0]);
          console.log('   Columns:', columns.join(', '));
        } else {
          console.log('   Table is empty (expected for new setup)');
        }
      }
    } catch (error) {
      console.log('❌ File assignments table test failed:', error.message);
    }

    // Test 5: Check messages table
    console.log('\n📋 5. TESTING MESSAGES TABLE');
    console.log('=' .repeat(50));
    
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .limit(1);

      if (messagesError) {
        console.log('❌ Messages table error:', messagesError.message);
      } else {
        console.log('✅ Messages table exists');
        if (messagesData && messagesData.length > 0) {
          const columns = Object.keys(messagesData[0]);
          console.log('   Columns:', columns.join(', '));
        } else {
          console.log('   Table is empty (expected for new setup)');
        }
      }
    } catch (error) {
      console.log('❌ Messages table test failed:', error.message);
    }

    // Test 6: Check news table
    console.log('\n📋 6. TESTING NEWS TABLE');
    console.log('=' .repeat(50));
    
    try {
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select('*')
        .limit(1);

      if (newsError) {
        console.log('❌ News table error:', newsError.message);
      } else {
        console.log('✅ News table exists');
        if (newsData && newsData.length > 0) {
          const columns = Object.keys(newsData[0]);
          console.log('   Columns:', columns.join(', '));
        } else {
          console.log('   Table is empty (expected for new setup)');
        }
      }
    } catch (error) {
      console.log('❌ News table test failed:', error.message);
    }

    // Test 7: Test authentication with demo credentials
    console.log('\n📋 7. TESTING AUTHENTICATION');
    console.log('=' .repeat(50));
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@financehub.com',
        password: 'urL!fKNZ8GSn'
      });

      if (authError) {
        console.log('❌ Authentication failed:', authError.message);
      } else {
        console.log('✅ Authentication successful');
        
        // Try to get profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.log('❌ Profile retrieval failed:', profileError.message);
        } else {
          console.log('✅ Profile retrieved:', profileData.full_name, `(${profileData.role})`);
        }

        await supabase.auth.signOut();
      }
    } catch (error) {
      console.log('❌ Authentication test failed:', error.message);
    }

    console.log('\n🎯 DATABASE STRUCTURE TEST COMPLETE');
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDatabaseStructure();