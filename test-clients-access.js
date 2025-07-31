// Simple test to check if we can access the clients table
// Run this in browser console to test database access

import { supabase } from './src/integrations/supabase/client.js';

// Test basic clients table access
async function testClientsAccess() {
  console.log('Testing clients table access...');
  
  try {
    // Test 1: Can we read from clients table?
    console.log('1. Testing SELECT from clients...');
    const { data: clients, error: selectError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);
    
    console.log('SELECT result:', { clients, selectError });
    
    // Test 2: Can we insert into clients table?
    console.log('2. Testing INSERT into clients...');
    const { data: insertData, error: insertError } = await supabase
      .from('clients')
      .insert([{
        company_name: 'Test Company',
        contact_email: 'test@example.com',
        contact_phone: '123-456-7890',
        address: '123 Test St',
        status: 'active'
      }])
      .select()
      .single();
    
    console.log('INSERT result:', { insertData, insertError });
    
    // Test 3: Check current user
    console.log('3. Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', { user: user?.id, email: user?.email, userError });
    
    // Test 4: Check user profile
    if (user) {
      console.log('4. Checking user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('User profile:', { profile, profileError });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Export for manual testing
window.testClientsAccess = testClientsAccess;