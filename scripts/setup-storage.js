#!/usr/bin/env node

/**
 * Storage Setup Script
 * 
 * This script sets up the storage bucket for file uploads
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupStorage() {
  console.log('🪣 Setting up storage bucket...');

  try {
    // First, sign in as admin to have permissions
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    if (signInError) {
      console.error('❌ Failed to sign in as admin:', signInError.message);
      return;
    }

    console.log('✅ Signed in as admin');

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      console.log('\n💡 Manual Setup Required:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to Storage');
      console.log('   3. Create a new bucket named "files"');
      console.log('   4. Set it to private (not public)');
      console.log('   5. Configure RLS policies for file access');
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'files');
    
    if (!bucketExists) {
      console.log('📁 Creating files bucket...');
      
      const { error: createError } = await supabase.storage.createBucket('files', {
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain'
        ],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        console.log('\n💡 Manual Setup Required:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to Storage');
        console.log('   3. Create a new bucket named "files"');
        console.log('   4. Set it to private (not public)');
      } else {
        console.log('✅ Storage bucket created successfully');
      }
    } else {
      console.log('✅ Storage bucket already exists');
    }

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Storage setup error:', error.message);
  }
}

async function main() {
  console.log('🎯 Setting up storage for Trusted File Link...\n');
  await setupStorage();
  console.log('\n✅ Storage setup complete!');
}

main().catch(console.error);