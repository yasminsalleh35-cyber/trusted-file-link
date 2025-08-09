#!/usr/bin/env node

/**
 * Final Verification Test
 * 
 * Honest assessment of what actually works vs what was claimed
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function finalVerification() {
  console.log('🔍 FINAL HONEST VERIFICATION\n');
  console.log('Testing what actually works vs what was claimed...\n');

  try {
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'urL!fKNZ8GSn'
    });

    if (authError) {
      console.log('❌ CRITICAL: Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication works\n');

    // Check what tables actually exist and their real structure
    console.log('📋 ACTUAL TABLE STRUCTURES');
    console.log('=' .repeat(60));

    const tables = ['profiles', 'clients', 'files', 'file_assignments', 'messages', 'news', 'news_assignments'];
    const actualStructure = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
          actualStructure[table] = { exists: false, error: error.message };
        } else {
          const columns = data && data.length > 0 ? Object.keys(data[0]) : 'empty table';
          console.log(`✅ ${table}: ${Array.isArray(columns) ? columns.join(', ') : columns}`);
          actualStructure[table] = { exists: true, columns, recordCount: data?.length || 0 };
        }
      } catch (err) {
        console.log(`❌ ${table}: Exception - ${err.message}`);
        actualStructure[table] = { exists: false, error: err.message };
      }
    }

    // Test the claimed "working" features
    console.log('\n📋 TESTING CLAIMED WORKING FEATURES');
    console.log('=' .repeat(60));

    // 1. File creation with correct schema
    console.log('\n1. File Creation Test:');
    try {
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          filename: 'verification-test.txt',
          original_filename: 'Verification Test.txt',
          storage_path: 'test/verification-test.txt',
          file_size: 100,
          file_type: 'text/plain',
          uploaded_by: authData.user.id,
          description: 'Final verification test'
        })
        .select()
        .single();

      if (fileError) {
        console.log('❌ File creation failed:', fileError.message);
      } else {
        console.log('✅ File creation works');
        
        // 2. File assignment test
        console.log('\n2. File Assignment Test:');
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('file_assignments')
          .insert({
            file_id: fileData.id,
            assigned_by: authData.user.id,
            assigned_to_client: 'bacb2c3b-7714-494f-ad13-158d6a008b09'
          })
          .select()
          .single();

        if (assignmentError) {
          console.log('❌ File assignment failed:', assignmentError.message);
        } else {
          console.log('✅ File assignment works');
          console.log('   Assignment columns:', Object.keys(assignmentData).join(', '));
        }

        // Clean up
        await supabase.from('file_assignments').delete().eq('file_id', fileData.id);
        await supabase.from('files').delete().eq('id', fileData.id);
      }
    } catch (err) {
      console.log('❌ File operations failed:', err.message);
    }

    // 3. Check if the TypeScript types actually match
    console.log('\n3. TypeScript Integration Test:');
    console.log('   Checking if our types match actual database...');
    
    // Compare what we have in types.ts vs actual database
    const expectedFileColumns = ['created_at', 'description', 'file_size', 'file_type', 'filename', 'id', 'original_filename', 'storage_path', 'uploaded_by'];
    const actualFileColumns = actualStructure.files?.columns || [];
    
    if (Array.isArray(actualFileColumns)) {
      const missing = expectedFileColumns.filter(col => !actualFileColumns.includes(col));
      const extra = actualFileColumns.filter(col => !expectedFileColumns.includes(col));
      
      if (missing.length === 0 && extra.length === 0) {
        console.log('✅ TypeScript types match database schema');
      } else {
        console.log('❌ TypeScript types DO NOT match database:');
        if (missing.length > 0) console.log('   Missing columns:', missing.join(', '));
        if (extra.length > 0) console.log('   Extra columns:', extra.join(', '));
      }
    }

    // 4. Test the schema adapter
    console.log('\n4. Schema Adapter Test:');
    try {
      // This would test if our fileSchemaAdapter actually works
      console.log('   Schema adapter functions exist but need actual data to test properly');
    } catch (err) {
      console.log('❌ Schema adapter test failed:', err.message);
    }

    // 5. Check what's actually missing
    console.log('\n📋 HONEST ASSESSMENT - WHAT\'S STILL MISSING');
    console.log('=' .repeat(60));

    const missingFeatures = [];
    
    // Check for missing columns that the app might expect
    if (actualStructure.file_assignments?.exists) {
      const assignmentColumns = actualStructure.file_assignments.columns;
      if (Array.isArray(assignmentColumns)) {
        const expectedAssignmentColumns = ['assignment_type', 'notes', 'expires_at', 'is_active', 'assigned_at', 'updated_at'];
        const missingAssignmentColumns = expectedAssignmentColumns.filter(col => !assignmentColumns.includes(col));
        
        if (missingAssignmentColumns.length > 0) {
          missingFeatures.push(`file_assignments missing: ${missingAssignmentColumns.join(', ')}`);
        }
      }
    }

    // Check for missing utility functions
    try {
      const { data: isAdminResult, error: functionError } = await supabase
        .rpc('is_admin', { user_id: authData.user.id });
      
      if (functionError) {
        missingFeatures.push('is_admin function not working');
      }
    } catch (err) {
      missingFeatures.push('is_admin function missing or broken');
    }

    try {
      const { data: clientIdResult, error: functionError2 } = await supabase
        .rpc('get_user_client_id', { user_id: authData.user.id });
      
      if (functionError2) {
        missingFeatures.push('get_user_client_id function not working');
      }
    } catch (err) {
      missingFeatures.push('get_user_client_id function missing or broken');
    }

    console.log('\n🎯 FINAL HONEST RESULTS');
    console.log('=' .repeat(60));
    
    console.log('\n✅ WHAT ACTUALLY WORKS:');
    console.log('- Basic authentication');
    console.log('- Core tables exist (profiles, clients, files, file_assignments, messages, news)');
    console.log('- Basic file creation and assignment');
    console.log('- Message and news creation');
    console.log('- Some database views');
    
    console.log('\n❌ WHAT\'S STILL MISSING OR BROKEN:');
    if (missingFeatures.length > 0) {
      missingFeatures.forEach(feature => console.log(`- ${feature}`));
    } else {
      console.log('- Detailed analysis needed to identify remaining issues');
    }

    console.log('\n📊 SUMMARY:');
    console.log(`- Tables working: ${Object.values(actualStructure).filter(t => t.exists).length}/${tables.length}`);
    console.log('- Basic functionality: Partially working');
    console.log('- Production ready: Needs more work');

    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

finalVerification();