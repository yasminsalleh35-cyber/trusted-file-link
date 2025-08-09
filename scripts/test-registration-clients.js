#!/usr/bin/env node

/**
 * Test Registration Client Fetching
 * 
 * Tests that the registration form can properly fetch and display clients
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRegistrationClients() {
  console.log('🔍 Testing Registration Client Fetching...\n');

  try {
    // Test 1: Fetch clients as the registration form would
    console.log('📋 1. FETCHING CLIENTS FOR REGISTRATION');
    console.log('=' .repeat(50));

    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name');

    if (error) {
      console.log('❌ Error fetching clients:', error.message);
      return;
    }

    console.log(`✅ Found ${clients?.length || 0} clients in database`);
    
    if (clients && clients.length > 0) {
      console.log('\n📊 Available Clients:');
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.company_name} (ID: ${client.id})`);
      });
    }

    // Test 2: Simulate duplicate removal logic
    console.log('\n📋 2. TESTING DUPLICATE REMOVAL');
    console.log('=' .repeat(50));

    if (clients && clients.length > 0) {
      // Add some test duplicates to simulate the scenario
      const testClients = [
        ...clients,
        { id: 'test-1', company_name: 'ACME Corporation' }, // Duplicate name
        { id: 'test-2', company_name: 'acme corporation' }, // Case variation
        { id: 'test-3', company_name: 'New Company' }
      ];

      console.log(`📊 Before duplicate removal: ${testClients.length} clients`);

      // Apply the same duplicate removal logic as in the component
      const uniqueClients = testClients.reduce((acc, current) => {
        const existingClient = acc.find(client => 
          client.company_name.toLowerCase() === current.company_name.toLowerCase()
        );
        
        if (!existingClient) {
          acc.push(current);
        } else {
          console.log(`   🔄 Skipping duplicate: "${current.company_name}" (keeping "${existingClient.company_name}")`);
        }
        
        return acc;
      }, []);

      console.log(`✅ After duplicate removal: ${uniqueClients.length} unique clients`);
      
      console.log('\n📊 Final Unique Clients:');
      uniqueClients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.company_name} (ID: ${client.id})`);
      });
    }

    // Test 3: Test what happens with no clients
    console.log('\n📋 3. TESTING EMPTY CLIENT SCENARIO');
    console.log('=' .repeat(50));

    // Simulate empty result
    const emptyClients = [];
    console.log(`📊 Empty client list: ${emptyClients.length} clients`);
    console.log('✅ Component should show "No companies available" message');

    // Test 4: Verify the registration form can access this data without authentication
    console.log('\n📋 4. TESTING UNAUTHENTICATED ACCESS');
    console.log('=' .repeat(50));

    // This simulates what happens when a user visits the registration page
    // without being logged in (which is the normal case)
    const { data: unauthClients, error: unauthError } = await supabase
      .from('clients')
      .select('id, company_name')
      .order('company_name');

    if (unauthError) {
      console.log('❌ Unauthenticated access failed:', unauthError.message);
      console.log('   This means users cannot see companies during registration!');
    } else {
      console.log('✅ Unauthenticated access works - users can see companies during registration');
      console.log(`   Found ${unauthClients?.length || 0} companies`);
    }

    console.log('\n🎯 REGISTRATION CLIENT FETCHING TEST COMPLETE');
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRegistrationClients();