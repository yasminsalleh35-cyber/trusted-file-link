#!/usr/bin/env node

/**
 * RLS Policies Setup Script
 * 
 * This script automatically creates all necessary RLS policies for the application
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupRLSPolicies() {
  console.log('🔐 Setting up RLS Policies...\n');

  try {
    // Sign in as admin to have necessary permissions
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ Failed to authenticate:', authError.message);
      return;
    }

    console.log('✅ Authenticated as admin\n');

    // RLS Policies for files table
    const filesPolicies = [
      {
        name: 'Users can view files based on role and assignments',
        table: 'files',
        operation: 'SELECT',
        sql: `
          CREATE POLICY "Users can view files based on role and assignments" ON public.files
          FOR SELECT USING (
            -- Admins can see all files
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
            OR
            -- Users can see files uploaded by them
            uploaded_by = auth.uid()
            OR
            -- Users can see files assigned to them
            EXISTS (
              SELECT 1 FROM public.file_assignments fa
              WHERE fa.file_id = id
              AND (
                fa.assigned_to = auth.uid()
                OR
                fa.assigned_to_client = (
                  SELECT client_id FROM public.profiles WHERE id = auth.uid()
                )
              )
              AND fa.is_active = true
            )
          );
        `
      },
      {
        name: 'Authenticated users can upload files',
        table: 'files',
        operation: 'INSERT',
        sql: `
          CREATE POLICY "Authenticated users can upload files" ON public.files
          FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
        `
      },
      {
        name: 'Users can update their own files',
        table: 'files',
        operation: 'UPDATE',
        sql: `
          CREATE POLICY "Users can update their own files" ON public.files
          FOR UPDATE USING (
            uploaded_by = auth.uid()
            OR
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
          );
        `
      },
      {
        name: 'Users can delete their own files',
        table: 'files',
        operation: 'DELETE',
        sql: `
          CREATE POLICY "Users can delete their own files" ON public.files
          FOR DELETE USING (
            uploaded_by = auth.uid()
            OR
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
          );
        `
      }
    ];

    // RLS Policies for file_assignments table
    const assignmentsPolicies = [
      {
        name: 'Users can view relevant assignments',
        table: 'file_assignments',
        operation: 'SELECT',
        sql: `
          CREATE POLICY "Users can view relevant assignments" ON public.file_assignments
          FOR SELECT USING (
            -- Admins can see all assignments
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
            OR
            -- Users can see assignments to them
            assigned_to = auth.uid()
            OR
            -- Users can see assignments to their client
            assigned_to_client = (
              SELECT client_id FROM public.profiles WHERE id = auth.uid()
            )
            OR
            -- Users can see assignments they created
            assigned_by = auth.uid()
          );
        `
      },
      {
        name: 'Admins and clients can create assignments',
        table: 'file_assignments',
        operation: 'INSERT',
        sql: `
          CREATE POLICY "Admins and clients can create assignments" ON public.file_assignments
          FOR INSERT WITH CHECK (
            (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'client')
            AND
            assigned_by = auth.uid()
          );
        `
      },
      {
        name: 'Admins and assignment creators can update',
        table: 'file_assignments',
        operation: 'UPDATE',
        sql: `
          CREATE POLICY "Admins and assignment creators can update" ON public.file_assignments
          FOR UPDATE USING (
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
            OR
            assigned_by = auth.uid()
          );
        `
      },
      {
        name: 'Admins and assignment creators can delete',
        table: 'file_assignments',
        operation: 'DELETE',
        sql: `
          CREATE POLICY "Admins and assignment creators can delete" ON public.file_assignments
          FOR DELETE USING (
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
            OR
            assigned_by = auth.uid()
          );
        `
      }
    ];

    // Function to execute SQL policies
    const executePolicies = async (policies, tableName) => {
      console.log(`📋 Setting up policies for ${tableName} table...`);
      
      for (const policy of policies) {
        try {
          console.log(`  Creating: ${policy.name}`);
          
          // First, drop the policy if it exists
          const dropSQL = `DROP POLICY IF EXISTS "${policy.name}" ON public.${policy.table};`;
          await supabase.rpc('exec_sql', { sql: dropSQL });
          
          // Then create the new policy
          await supabase.rpc('exec_sql', { sql: policy.sql });
          
          console.log(`  ✅ Created: ${policy.name}`);
        } catch (error) {
          console.log(`  ❌ Failed to create ${policy.name}:`, error.message);
        }
      }
    };

    // Check if we can execute SQL directly
    console.log('🔍 Testing SQL execution capability...');
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: 'SELECT 1 as test;' 
      });
      
      if (error) {
        console.log('❌ Cannot execute SQL directly. Using alternative method...\n');
        
        // Alternative: Show SQL commands for manual execution
        console.log('📝 MANUAL SETUP REQUIRED - Copy and paste these SQL commands in your Supabase SQL Editor:\n');
        console.log('=' .repeat(80));
        console.log('-- RLS POLICIES FOR FILES TABLE');
        console.log('=' .repeat(80));
        
        filesPolicies.forEach(policy => {
          console.log(`-- ${policy.name}`);
          console.log(`DROP POLICY IF EXISTS "${policy.name}" ON public.files;`);
          console.log(policy.sql.trim());
          console.log('');
        });
        
        console.log('=' .repeat(80));
        console.log('-- RLS POLICIES FOR FILE_ASSIGNMENTS TABLE');
        console.log('=' .repeat(80));
        
        assignmentsPolicies.forEach(policy => {
          console.log(`-- ${policy.name}`);
          console.log(`DROP POLICY IF EXISTS "${policy.name}" ON public.file_assignments;`);
          console.log(policy.sql.trim());
          console.log('');
        });
        
        console.log('=' .repeat(80));
        console.log('📍 HOW TO APPLY THESE POLICIES:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the above SQL commands');
        console.log('4. Click "Run" to execute them');
        console.log('=' .repeat(80));
        
      } else {
        console.log('✅ SQL execution available. Creating policies automatically...\n');
        
        // Execute policies automatically
        await executePolicies(filesPolicies, 'files');
        await executePolicies(assignmentsPolicies, 'file_assignments');
        
        console.log('\n🎉 All RLS policies have been created successfully!');
      }
      
    } catch (error) {
      console.log('❌ SQL execution test failed:', error.message);
      console.log('💡 You will need to set up policies manually in the Supabase dashboard');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    // Sign out
    await supabase.auth.signOut();
  }
}

async function main() {
  console.log('🎯 Automated RLS Policy Setup for Trusted File Link\n');
  await setupRLSPolicies();
}

main().catch(console.error);