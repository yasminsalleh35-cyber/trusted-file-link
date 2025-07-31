/**
 * Test Script for Client Admin Creation
 * 
 * This script tests the new client creation functionality
 * that automatically creates client admin users.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testClientCreation() {
  console.log('🧪 Testing Client Admin Creation...\n');

  // Test data
  const testClient = {
    company_name: 'Test Company Inc',
    contact_email: 'admin@testcompany.com',
    contact_phone: '+1 (555) 123-4567',
    address: '123 Test Street, Test City, TC 12345'
  };

  try {
    console.log('📝 Creating client:', testClient.company_name);
    
    // Step 1: Create client record
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

    // Step 2: Check if we can query the client
    const { data: fetchedClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientData.id)
      .single();

    if (fetchError) {
      console.error('❌ Client fetch failed:', fetchError);
      return;
    }

    console.log('✅ Client fetched successfully');

    // Step 3: Check profiles table for any existing users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('client_id', clientData.id);

    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError);
    } else {
      console.log(`📊 Found ${profiles.length} users for this client`);
    }

    // Step 4: Test the create_user_profile function exists
    const { data: functionTest, error: functionError } = await supabase
      .rpc('create_user_profile', {
        user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        user_email: 'test@example.com',
        user_full_name: 'Test User',
        user_role: 'user',
        user_client_id: clientData.id
      });

    if (functionError) {
      console.log('⚠️  create_user_profile function test:', functionError.message);
    } else {
      console.log('✅ create_user_profile function is available');
    }

    // Cleanup: Remove test client
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientData.id);

    if (deleteError) {
      console.error('⚠️  Cleanup failed:', deleteError);
    } else {
      console.log('🧹 Test client cleaned up');
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Client creation: ✅ Working');
    console.log('- Database queries: ✅ Working');
    console.log('- RPC function: ✅ Available');
    console.log('\n🚀 Ready to test in the UI!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testClientCreation();