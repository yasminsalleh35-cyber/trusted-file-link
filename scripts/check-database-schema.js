#!/usr/bin/env node

/**
 * Database Schema Checker
 * 
 * This script checks the actual database schema to see what columns exist
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema...\n');

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

    console.log('✅ Authenticated successfully\n');

    // Check files table structure
    console.log('📋 FILES TABLE STRUCTURE:');
    console.log('=' .repeat(50));
    
    try {
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .limit(1);

      if (filesError) {
        console.log('❌ Error querying files table:', filesError.message);
      } else {
        if (filesData && filesData.length > 0) {
          const columns = Object.keys(filesData[0]);
          console.log('✅ Files table columns:');
          columns.forEach(col => console.log(`  - ${col}`));
        } else {
          console.log('⚠️  Files table exists but is empty');
          // Try to get schema info differently
          const { data: schemaData } = await supabase
            .from('files')
            .select('*')
            .limit(0);
          console.log('📊 Schema info available:', !!schemaData);
        }
      }
    } catch (error) {
      console.log('❌ Files table check failed:', error.message);
    }

    console.log('\n📋 FILE_ASSIGNMENTS TABLE STRUCTURE:');
    console.log('=' .repeat(50));
    
    try {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('file_assignments')
        .select('*')
        .limit(1);

      if (assignmentsError) {
        console.log('❌ Error querying file_assignments table:', assignmentsError.message);
      } else {
        if (assignmentsData && assignmentsData.length > 0) {
          const columns = Object.keys(assignmentsData[0]);
          console.log('✅ File_assignments table columns:');
          columns.forEach(col => console.log(`  - ${col}`));
        } else {
          console.log('⚠️  File_assignments table exists but is empty');
        }
      }
    } catch (error) {
      console.log('❌ File_assignments table check failed:', error.message);
    }

    // Check what tables exist
    console.log('\n📋 CHECKING TABLE EXISTENCE:');
    console.log('=' .repeat(50));
    
    const tablesToCheck = ['files', 'file_assignments', 'profiles', 'clients'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists and accessible`);
        }
      } catch (error) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }

    // Try to get actual schema information using a different approach
    console.log('\n📋 ATTEMPTING SCHEMA INTROSPECTION:');
    console.log('=' .repeat(50));
    
    try {
      // This might work to get column information
      const { data: schemaInfo, error: schemaError } = await supabase.rpc('get_table_schema', {
        table_name: 'file_assignments'
      });
      
      if (schemaError) {
        console.log('❌ Schema introspection not available:', schemaError.message);
      } else {
        console.log('✅ Schema info:', schemaInfo);
      }
    } catch (error) {
      console.log('❌ Schema introspection failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  } finally {
    await supabase.auth.signOut();
  }
}

async function main() {
  await checkDatabaseSchema();
}

main().catch(console.error);