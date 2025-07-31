#!/usr/bin/env node

/**
 * Functionality Test Script
 * 
 * This script tests the core functionality of the application
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthentication() {
  console.log('🔐 Testing Authentication...');

  const testAccounts = [
    { email: 'admin@financehub.com', password: 'admin123456', role: 'admin' },
    { email: 'client@acme.com', password: 'client123456', role: 'client' },
    { email: 'user@acme.com', password: 'user123456', role: 'user' }
  ];

  for (const account of testAccounts) {
    try {
      console.log(`Testing login for ${account.role}: ${account.email}`);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });

      if (error) {
        console.log(`❌ ${account.role} login failed: ${error.message}`);
      } else {
        console.log(`✅ ${account.role} login successful`);
        
        // Test profile loading
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.log(`❌ ${account.role} profile loading failed: ${profileError.message}`);
        } else {
          console.log(`✅ ${account.role} profile loaded: ${profile.full_name} (${profile.role})`);
        }

        // Sign out
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.log(`❌ ${account.role} test failed: ${error.message}`);
    }
  }
}

async function testDatabase() {
  console.log('\n📊 Testing Database...');

  try {
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email, role, full_name')
      .limit(5);

    if (profilesError) {
      console.log('❌ Profiles query failed:', profilesError.message);
    } else {
      console.log(`✅ Profiles table accessible (${profiles.length} records)`);
      profiles.forEach(profile => {
        console.log(`   - ${profile.full_name} (${profile.email}) - ${profile.role}`);
      });
    }

    // Test clients table
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('company_name, contact_email')
      .limit(5);

    if (clientsError) {
      console.log('❌ Clients query failed:', clientsError.message);
    } else {
      console.log(`✅ Clients table accessible (${clients.length} records)`);
      clients.forEach(client => {
        console.log(`   - ${client.company_name} (${client.contact_email})`);
      });
    }

    // Test files table
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('filename, file_type, file_size')
      .limit(5);

    if (filesError) {
      console.log('❌ Files query failed:', filesError.message);
    } else {
      console.log(`✅ Files table accessible (${files.length} records)`);
      files.forEach(file => {
        console.log(`   - ${file.filename} (${file.file_type}) - ${Math.round(file.file_size / 1024)}KB`);
      });
    }

  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }
}

async function testStorage() {
  console.log('\n🪣 Testing Storage...');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log('❌ Storage access failed:', error.message);
    } else {
      console.log(`✅ Storage accessible (${buckets.length} buckets)`);
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });

      // Test files bucket specifically
      const filesBucket = buckets.find(b => b.name === 'files');
      if (filesBucket) {
        console.log('✅ Files bucket exists and is configured');
      } else {
        console.log('❌ Files bucket not found');
      }
    }
  } catch (error) {
    console.log('❌ Storage test failed:', error.message);
  }
}

async function main() {
  console.log('🧪 Testing Trusted File Link Functionality\n');

  await testAuthentication();
  await testDatabase();
  await testStorage();

  console.log('\n📋 Test Summary:');
  console.log('   - Authentication: Check individual results above');
  console.log('   - Database: Check table access results above');
  console.log('   - Storage: Check bucket access results above');
  console.log('\n💡 If any tests failed, run the setup-demo-data.js script first');
}

main().catch(console.error);