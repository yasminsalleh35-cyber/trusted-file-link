#!/usr/bin/env node

/**
 * Check Table Structure
 * 
 * Inspects the actual database table structures
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableStructure() {
  console.log('🔍 Checking Table Structures...\n');

  try {
    // Sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'urL!fKNZ8GSn'
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful\n');

    // Check file_assignments table structure
    console.log('📋 FILE_ASSIGNMENTS TABLE STRUCTURE');
    console.log('=' .repeat(50));

    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('file_assignments')
        .select('*')
        .limit(1);

      if (assignmentsError) {
        console.log('❌ Error accessing file_assignments:', assignmentsError.message);
      } else {
        if (assignments && assignments.length > 0) {
          console.log('✅ Columns found:', Object.keys(assignments[0]).join(', '));
        } else {
          console.log('✅ Table exists but is empty');
          
          // Try to insert a test record to see what columns are expected
          const { data: testInsert, error: insertError } = await supabase
            .from('file_assignments')
            .insert({
              file_id: '00000000-0000-0000-0000-000000000000',
              assigned_by: authData.user.id,
              assigned_to_client: 'bacb2c3b-7714-494f-ad13-158d6a008b09'
            })
            .select()
            .single();

          if (insertError) {
            console.log('❌ Test insert failed:', insertError.message);
            console.log('   Details:', insertError.details);
            console.log('   Hint:', insertError.hint);
          } else {
            console.log('✅ Test insert successful, columns:', Object.keys(testInsert).join(', '));
            // Clean up
            await supabase.from('file_assignments').delete().eq('id', testInsert.id);
          }
        }
      }
    } catch (error) {
      console.log('❌ File assignments check failed:', error.message);
    }

    // Check clients table structure
    console.log('\n📋 CLIENTS TABLE STRUCTURE');
    console.log('=' .repeat(50));

    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

      if (clientsError) {
        console.log('❌ Error accessing clients:', clientsError.message);
      } else {
        if (clients && clients.length > 0) {
          console.log('✅ Columns found:', Object.keys(clients[0]).join(', '));
        } else {
          console.log('✅ Table exists but is empty');
        }
      }
    } catch (error) {
      console.log('❌ Clients check failed:', error.message);
    }

    // Check profiles table structure
    console.log('\n📋 PROFILES TABLE STRUCTURE');
    console.log('=' .repeat(50));

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (profilesError) {
        console.log('❌ Error accessing profiles:', profilesError.message);
      } else {
        if (profiles && profiles.length > 0) {
          console.log('✅ Columns found:', Object.keys(profiles[0]).join(', '));
        } else {
          console.log('✅ Table exists but is empty');
        }
      }
    } catch (error) {
      console.log('❌ Profiles check failed:', error.message);
    }

    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Structure check failed:', error.message);
  }
}

checkTableStructure();