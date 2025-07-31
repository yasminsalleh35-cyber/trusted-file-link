import { supabase } from '@/integrations/supabase/client';

/**
 * Simple Setup Utilities (No Admin Required)
 * 
 * Purpose: Create test users without requiring admin privileges
 * These functions work with the public API
 */

export const createTestUser = async (credentials: {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'client' | 'user';
  client_id?: string;
}) => {
  try {
    console.log(`Creating ${credentials.role}: ${credentials.email}`);

    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.full_name
        }
      }
    });

    if (authError) {
      if (authError.message.includes('User already registered')) {
        console.log(`✅ User ${credentials.email} already exists`);
        return { success: true, message: 'User already exists' };
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    console.log(`✅ Auth user created: ${authData.user.id}`);

    // 2. Create profile (this will happen automatically via trigger or manual insert)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: credentials.email,
        full_name: credentials.full_name,
        role: credentials.role,
        client_id: credentials.client_id || null
      });

    if (profileError) {
      console.log('Profile creation error (might be normal):', profileError.message);
    } else {
      console.log('✅ Profile created');
    }

    return { success: true, user: authData.user };

  } catch (error) {
    console.error(`Error creating ${credentials.role} user:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    };
  }
};

export const createTestClient = async () => {
  try {
    console.log('Creating test client company...');

    // Create client company first
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        company_name: 'Acme Corporation',
        contact_email: 'contact@acme.com',
        contact_phone: '+1-555-0123',
        address: '123 Business St, City, State 12345'
      })
      .select()
      .single();

    if (clientError) {
      if (clientError.message.includes('duplicate')) {
        console.log('✅ Client company already exists');
        // Get existing client
        const { data: existing } = await supabase
          .from('clients')
          .select('*')
          .eq('contact_email', 'contact@acme.com')
          .single();
        return { success: true, client: existing };
      }
      throw clientError;
    }

    console.log('✅ Client company created:', clientData.id);
    return { success: true, client: clientData };

  } catch (error) {
    console.error('Error creating client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create client'
    };
  }
};

export const setupBasicTestData = async () => {
  console.log('🚀 Setting up basic test data...');
  console.log('⚠️  Make sure you have cleaned the database first!');

  // 1. Create admin user
  const adminResult = await createTestUser({
    email: 'admin@financehub.com',
    password: 'admin123456',
    full_name: 'System Administrator',
    role: 'admin'
  });

  // 2. Create client company
  const clientResult = await createTestClient();
  
  if (!clientResult.success) {
    console.error('❌ Failed to create client company');
    return;
  }

  // 3. Create client admin user
  const clientAdminResult = await createTestUser({
    email: 'client@acme.com',
    password: 'client123456',
    full_name: 'John Client Manager',
    role: 'client',
    client_id: clientResult.client!.id
  });

  // 4. Create regular user
  const userResult = await createTestUser({
    email: 'user@acme.com',
    password: 'user123456',
    full_name: 'Jane User',
    role: 'user',
    client_id: clientResult.client!.id
  });

  console.log('✅ Basic test data setup complete!');
  console.log('📧 Try logging in with:');
  console.log('   Admin: admin@financehub.com / admin123456');
  console.log('   Client: client@acme.com / client123456');
  console.log('   User: user@acme.com / user123456');
};

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).simpleSetup = {
    createTestUser,
    createTestClient,
    setupBasicTestData
  };
}