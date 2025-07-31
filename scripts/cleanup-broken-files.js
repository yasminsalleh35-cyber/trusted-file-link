#!/usr/bin/env node

/**
 * Cleanup Broken Files Script
 * 
 * This script identifies and optionally removes broken file records
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanupBrokenFiles() {
  console.log('🧪 Checking for Broken File Records...\n');

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

    // Get all file records
    console.log('📋 Getting all file records...');
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*');

    if (filesError) {
      console.log('❌ Failed to get files:', filesError.message);
      return;
    }

    console.log(`📄 Found ${files.length} file records\n`);

    const brokenFiles = [];
    const workingFiles = [];

    // Check each file
    for (const file of files) {
      console.log(`🔍 Checking file: ${file.original_filename}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Storage path: ${file.storage_path}`);

      // Try to create signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from('files')
        .createSignedUrl(file.storage_path, 60);

      if (signedError) {
        console.log(`   ❌ BROKEN: ${signedError.message}`);
        brokenFiles.push(file);
      } else {
        console.log(`   ✅ Working`);
        workingFiles.push(file);
      }
      console.log('');
    }

    console.log('📊 SUMMARY:');
    console.log(`   ✅ Working files: ${workingFiles.length}`);
    console.log(`   ❌ Broken files: ${brokenFiles.length}\n`);

    if (brokenFiles.length > 0) {
      console.log('🚨 BROKEN FILES:');
      brokenFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.original_filename} (ID: ${file.id})`);
        console.log(`      Path: ${file.storage_path}`);
        console.log(`      Created: ${file.created_at}`);
      });

      console.log('\n💡 RECOMMENDATION:');
      console.log('   These files have database records but no actual files in storage.');
      console.log('   You should:');
      console.log('   1. Delete these broken records from the database');
      console.log('   2. Re-upload the files using the fixed upload system');
      console.log('');
      console.log('🗑️  To delete broken records, run this SQL in Supabase:');
      console.log('   DELETE FROM files WHERE id IN (');
      brokenFiles.forEach((file, index) => {
        const comma = index < brokenFiles.length - 1 ? ',' : '';
        console.log(`     '${file.id}'${comma}`);
      });
      console.log('   );');
    } else {
      console.log('🎉 All files are working correctly!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await supabase.auth.signOut();
  }
}

async function main() {
  await cleanupBrokenFiles();
}

main().catch(console.error);