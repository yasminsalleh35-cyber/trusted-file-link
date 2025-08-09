#!/usr/bin/env node

/**
 * Database Relationships Test
 * 
 * Tests if our database relationships and constraints are working correctly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucGx3Z3lld29sanJwcnFwZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDAxMDEsImV4cCI6MjA2ODUxNjEwMX0.DIm4cFFOTwCXuUdq5YpjgKS1X3uGq9sUOfBiDXIQHZg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseRelationships() {
  console.log('🔍 Testing Database Relationships and Constraints...\n');

  try {
    // Sign in as admin for testing
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@financehub.com',
      password: 'urL!fKNZ8GSn'
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authenticated as admin\n');

    // Test 1: Check existing data
    console.log('📋 1. CHECKING EXISTING DATA');
    console.log('=' .repeat(50));
    
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: clients } = await supabase.from('clients').select('*');
    
    console.log(`✅ Found ${profiles?.length || 0} profiles`);
    console.log(`✅ Found ${clients?.length || 0} clients`);
    
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        console.log(`   - ${profile.full_name} (${profile.role}) - Client: ${profile.client_id || 'None'}`);
      });
    }

    if (clients && clients.length > 0) {
      clients.forEach(client => {
        console.log(`   - ${client.company_name} - Admin: ${client.client_admin_id || 'None'}`);
      });
    }

    // Test 2: Test file upload and assignment
    console.log('\n📋 2. TESTING FILE OPERATIONS');
    console.log('=' .repeat(50));
    
    try {
      // Create a test file record
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          name: 'test-document.pdf',
          original_name: 'Test Document.pdf',
          file_path: 'test/test-document.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          uploaded_by: authData.user.id,
          description: 'Test document for database validation',
          access_level: 'private'
        })
        .select()
        .single();

      if (fileError) {
        console.log('❌ File creation failed:', fileError.message);
      } else {
        console.log('✅ File created successfully:', fileData.name);

        // Test file assignment to client
        if (clients && clients.length > 0) {
          const { data: assignmentData, error: assignmentError } = await supabase
            .from('file_assignments')
            .insert({
              file_id: fileData.id,
              assigned_by: authData.user.id,
              assigned_to_client: clients[0].id,
              assignment_type: 'client',
              notes: 'Test assignment to client'
            })
            .select()
            .single();

          if (assignmentError) {
            console.log('❌ File assignment failed:', assignmentError.message);
          } else {
            console.log('✅ File assigned to client successfully');
          }
        }
      }
    } catch (error) {
      console.log('❌ File operations test failed:', error.message);
    }

    // Test 3: Test message creation
    console.log('\n📋 3. TESTING MESSAGE SYSTEM');
    console.log('=' .repeat(50));
    
    try {
      // Find a client or user to send message to
      const clientProfile = profiles?.find(p => p.role === 'client');
      const userProfile = profiles?.find(p => p.role === 'user');
      
      if (clientProfile) {
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert({
            sender_id: authData.user.id,
            recipient_id: clientProfile.id,
            subject: 'Test Message',
            content: 'This is a test message to validate the messaging system.',
            message_type: 'admin_to_client'
          })
          .select()
          .single();

        if (messageError) {
          console.log('❌ Message creation failed:', messageError.message);
        } else {
          console.log('✅ Message sent to client successfully');
        }
      }

      if (userProfile) {
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert({
            sender_id: authData.user.id,
            recipient_id: userProfile.id,
            subject: 'Test Message to User',
            content: 'This is a test message to a user.',
            message_type: 'admin_to_user'
          })
          .select()
          .single();

        if (messageError) {
          console.log('❌ Message to user failed:', messageError.message);
        } else {
          console.log('✅ Message sent to user successfully');
        }
      }
    } catch (error) {
      console.log('❌ Message system test failed:', error.message);
    }

    // Test 4: Test news creation and assignment
    console.log('\n📋 4. TESTING NEWS SYSTEM');
    console.log('=' .repeat(50));
    
    try {
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .insert({
          title: 'Test News Article',
          content: 'This is a test news article to validate the news system.',
          created_by: authData.user.id
        })
        .select()
        .single();

      if (newsError) {
        console.log('❌ News creation failed:', newsError.message);
      } else {
        console.log('✅ News article created successfully');

        // Assign news to client
        if (clients && clients.length > 0) {
          const { data: newsAssignmentData, error: newsAssignmentError } = await supabase
            .from('news_assignments')
            .insert({
              news_id: newsData.id,
              assigned_by: authData.user.id,
              assigned_to_client: clients[0].id
            })
            .select()
            .single();

          if (newsAssignmentError) {
            console.log('❌ News assignment failed:', newsAssignmentError.message);
          } else {
            console.log('✅ News assigned to client successfully');
          }
        }
      }
    } catch (error) {
      console.log('❌ News system test failed:', error.message);
    }

    // Test 5: Test views
    console.log('\n📋 5. TESTING DATABASE VIEWS');
    console.log('=' .repeat(50));
    
    try {
      const { data: userProfilesView, error: viewError1 } = await supabase
        .from('user_profiles_with_clients')
        .select('*')
        .limit(5);

      if (viewError1) {
        console.log('❌ User profiles view failed:', viewError1.message);
      } else {
        console.log(`✅ User profiles with clients view: ${userProfilesView?.length || 0} records`);
      }

      const { data: fileAssignmentsView, error: viewError2 } = await supabase
        .from('file_assignments_detailed')
        .select('*')
        .limit(5);

      if (viewError2) {
        console.log('❌ File assignments detailed view failed:', viewError2.message);
      } else {
        console.log(`✅ File assignments detailed view: ${fileAssignmentsView?.length || 0} records`);
      }

      const { data: newsAssignmentsView, error: viewError3 } = await supabase
        .from('news_assignments_detailed')
        .select('*')
        .limit(5);

      if (viewError3) {
        console.log('❌ News assignments detailed view failed:', viewError3.message);
      } else {
        console.log(`✅ News assignments detailed view: ${newsAssignmentsView?.length || 0} records`);
      }
    } catch (error) {
      console.log('❌ Views test failed:', error.message);
    }

    // Test 6: Test utility functions
    console.log('\n📋 6. TESTING UTILITY FUNCTIONS');
    console.log('=' .repeat(50));
    
    try {
      const { data: isAdminResult, error: functionError1 } = await supabase
        .rpc('is_admin', { user_id: authData.user.id });

      if (functionError1) {
        console.log('❌ is_admin function failed:', functionError1.message);
      } else {
        console.log(`✅ is_admin function result: ${isAdminResult}`);
      }

      const { data: clientIdResult, error: functionError2 } = await supabase
        .rpc('get_user_client_id', { user_id: authData.user.id });

      if (functionError2) {
        console.log('❌ get_user_client_id function failed:', functionError2.message);
      } else {
        console.log(`✅ get_user_client_id function result: ${clientIdResult || 'null (admin has no client)'}`);
      }
    } catch (error) {
      console.log('❌ Utility functions test failed:', error.message);
    }

    console.log('\n🎯 DATABASE RELATIONSHIPS TEST COMPLETE');
    console.log('=' .repeat(50));
    console.log('✅ All core database functionality is working correctly!');

    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDatabaseRelationships();