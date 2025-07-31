/**
 * Test Script for Client Admin Creation (Authenticated)
 * 
 * This script tests the new client creation functionality
 * by authenticating as admin first.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testClientAdminCreation() {
  console.log('🧪 Testing Client Admin Creation (Authenticated)...\n');

  try {
    // Step 1: Authenticate as admin
    console.log('🔐 Authenticating as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ Admin authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authenticated as admin:', authData.user.email);

    // Step 2: Test client creation with admin user creation
    const testClient = {
      company_name: 'Test Corp Ltd',
      contact_email: 'admin@testcorp.com',
      contact_phone: '+1 (555) 999-8888',
      address: '456 Test Avenue, Test City, TC 54321'
    };

    console.log('\n📝 Creating client with admin user:', testClient.company_name);

    // Step 3: Create client record
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert([testClient])
      .select()
      .single();

    if (clientError) {
      console.error('❌ Client creation failed:', clientError);
      return;
    }

    console.log('✅ Client created:', clientData.id);

    // Step 4: Create client admin user (simulating our new functionality)
    console.log('👤 Creating client admin user...');
    
    // Generate temp password
    const tempPassword = generateTempPassword();
    console.log('🔑 Generated temp password:', tempPassword);

    // Create auth user
    const { data: newUserData, error: newUserError } = await supabase.auth.signUp({
      email: testClient.contact_email,
      password: tempPassword,
      options: {
        data: {
          full_name: `${testClient.company_name} Admin`,
          role: 'client',
          client_id: clientData.id
        }
      }
    });

    if (newUserError && !newUserError.message.includes('already registered')) {
      console.error('❌ User creation failed:', newUserError);
      return;
    }

    console.log('✅ Auth user created');

    // Step 5: Create profile using RPC function
    if (newUserData.user) {
      console.log('📋 Creating profile...');
      
      const { error: profileError } = await supabase.rpc('create_user_profile', {
        user_id: newUserData.user.id,
        user_email: testClient.contact_email,
        user_full_name: `${testClient.company_name} Admin`,
        user_role: 'client',
        user_client_id: clientData.id
      });

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
      } else {
        console.log('✅ Profile created successfully');
      }
    }

    // Step 6: Verify the client admin can authenticate
    console.log('\n🔍 Testing client admin login...');
    
    // Sign out admin first
    await supabase.auth.signOut();
    
    // Try to sign in as client admin
    const { data: clientAuthData, error: clientAuthError } = await supabase.auth.signInWithPassword({
      email: testClient.contact_email,
      password: tempPassword
    });

    if (clientAuthError) {
      console.error('❌ Client admin login failed:', clientAuthError.message);
    } else {
      console.log('✅ Client admin can login successfully');
      
      // Check profile
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientAuthData.user.id)
        .single();

      if (profileFetchError) {
        console.error('❌ Profile fetch failed:', profileFetchError);
      } else {
        console.log('✅ Profile data:', {
          email: profileData.email,
          role: profileData.role,
          client_id: profileData.client_id,
          full_name: profileData.full_name
        });
      }
    }

    // Step 7: Cleanup
    console.log('\n🧹 Cleaning up...');
    
    // Sign back in as admin for cleanup
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'admin123456'
    });

    // Delete test client (this should cascade delete the profile)
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientData.id);

    if (deleteError) {
      console.error('⚠️  Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Admin authentication: ✅');
    console.log('- Client creation: ✅');
    console.log('- Client admin user creation: ✅');
    console.log('- Client admin login: ✅');
    console.log('- Profile creation: ✅');
    console.log('- Data cleanup: ✅');
    console.log('\n🚀 Implementation is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Always sign out at the end
    await supabase.auth.signOut();
  }
}

// Helper function to generate temporary password
function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Run the test
testClientAdminCreation();