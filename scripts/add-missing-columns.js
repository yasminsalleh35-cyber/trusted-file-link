#!/usr/bin/env node

/**
 * Add Missing Columns
 * 
 * Adds missing columns to existing tables using direct SQL execution
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addMissingColumns() {
  console.log('🔧 Adding Missing Columns...\n');

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

    // Add missing columns to file_assignments table
    console.log('📋 ADDING MISSING COLUMNS TO FILE_ASSIGNMENTS');
    console.log('=' .repeat(60));

    const sqlCommands = [
      // Add assignment_type column
      `ALTER TABLE public.file_assignments 
       ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'user' 
       CHECK (assignment_type IN ('user', 'client', 'all_users_in_client'));`,
      
      // Add notes column
      `ALTER TABLE public.file_assignments 
       ADD COLUMN IF NOT EXISTS notes TEXT;`,
      
      // Add expires_at column
      `ALTER TABLE public.file_assignments 
       ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;`,
      
      // Add is_active column
      `ALTER TABLE public.file_assignments 
       ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`,
      
      // Add assigned_at column (rename from created_at if needed)
      `ALTER TABLE public.file_assignments 
       ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW();`,
      
      // Add updated_at column
      `ALTER TABLE public.file_assignments 
       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
      
      // Rename assigned_to to assigned_to_user if it exists
      `DO $$ 
       BEGIN
         IF EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name = 'file_assignments' 
           AND column_name = 'assigned_to'
         ) AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name = 'file_assignments' 
           AND column_name = 'assigned_to_user'
         ) THEN
           ALTER TABLE public.file_assignments 
           RENAME COLUMN assigned_to TO assigned_to_user;
         END IF;
       END $$;`,
      
      // Add assigned_to_user column if it doesn't exist
      `ALTER TABLE public.file_assignments 
       ADD COLUMN IF NOT EXISTS assigned_to_user UUID 
       REFERENCES public.profiles(id) ON DELETE CASCADE;`,
      
      // Update assignment_type based on existing data
      `UPDATE public.file_assignments 
       SET assignment_type = CASE 
         WHEN assigned_to_user IS NOT NULL THEN 'user'
         WHEN assigned_to_client IS NOT NULL THEN 'client'
         ELSE 'user'
       END 
       WHERE assignment_type IS NULL OR assignment_type = 'user';`
    ];

    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(`⚡ Executing command ${i + 1}/${sqlCommands.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          console.log(`❌ Command ${i + 1} failed:`, error.message);
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`❌ Command ${i + 1} exception:`, err.message);
      }
    }

    // Test the updated structure
    console.log('\n📋 TESTING UPDATED STRUCTURE');
    console.log('=' .repeat(50));

    // Create a test file first
    const { data: testFile, error: fileError } = await supabase
      .from('files')
      .insert({
        filename: 'structure-test.txt',
        original_filename: 'Structure Test.txt',
        storage_path: 'test/structure-test.txt',
        file_size: 50,
        file_type: 'text/plain',
        uploaded_by: authData.user.id,
        description: 'Test file for structure validation'
      })
      .select()
      .single();

    if (fileError) {
      console.log('❌ Test file creation failed:', fileError.message);
    } else {
      console.log('✅ Test file created');

      // Now test file assignment with all columns
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('file_assignments')
        .insert({
          file_id: testFile.id,
          assigned_by: authData.user.id,
          assigned_to_client: 'bacb2c3b-7714-494f-ad13-158d6a008b09',
          assignment_type: 'client',
          notes: 'Test assignment with all columns',
          is_active: true
        })
        .select()
        .single();

      if (assignmentError) {
        console.log('❌ Test assignment failed:', assignmentError.message);
        console.log('   Details:', assignmentError.details);
      } else {
        console.log('✅ Test assignment successful');
        console.log('   Columns:', Object.keys(assignmentData).join(', '));
        
        // Clean up
        await supabase.from('file_assignments').delete().eq('id', assignmentData.id);
      }
      
      // Clean up test file
      await supabase.from('files').delete().eq('id', testFile.id);
    }

    console.log('\n🎯 COLUMN ADDITION COMPLETE');
    console.log('=' .repeat(50));

    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Column addition failed:', error.message);
  }
}

addMissingColumns();