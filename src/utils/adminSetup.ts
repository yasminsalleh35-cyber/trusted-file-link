import { supabase } from '@/integrations/supabase/client';

/**
 * Admin Setup Utilities
 * 
 * Purpose: Helper functions to set up initial admin users and test data
 * Use these functions in the browser console or create a setup page
 */

export const createAdminUser = async (credentials: {
  email: string;
  password: string;
  full_name: string;
}) => {
  try {
    console.log('Creating admin user...');

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.full_name
        }
      }
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    console.log('Auth user created:', authData.user.id);

    // 2. Create profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: credentials.email,
        full_name: credentials.full_name,
        role: 'admin'
      });

    if (profileError) throw profileError;

    console.log('Admin profile created successfully!');
    return { success: true, user: authData.user };

  } catch (error) {
    console.error('Error creating admin user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create admin user'
    };
  }
};

export const createTestClient = async (clientData: {
  company_name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  admin_email: string;
  admin_password: string;
  admin_full_name: string;
}) => {
  try {
    console.log('Creating test client...');

    // 1. Create client admin auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: clientData.admin_email,
      password: clientData.admin_password,
      options: {
        data: {
          full_name: clientData.admin_full_name
        }
      }
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('Client admin user creation failed');
    }

    console.log('Client admin auth user created:', authData.user.id);

    // 2. Create client company
    const { data: clientRecord, error: clientError } = await supabase
      .from('clients')
      .insert({
        company_name: clientData.company_name,
        contact_email: clientData.contact_email,
        contact_phone: clientData.contact_phone,
        address: clientData.address
      })
      .select()
      .single();

    if (clientError) throw clientError;

    console.log('Client company created:', clientRecord.id);

    // 3. Create client admin profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: clientData.admin_email,
        full_name: clientData.admin_full_name,
        role: 'client',
        client_id: clientRecord.id
      });

    if (profileError) throw profileError;

    // 4. Update client with admin reference
    const { error: updateError } = await supabase
      .from('clients')
      .update({ client_admin_id: authData.user.id })
      .eq('id', clientRecord.id);

    if (updateError) throw updateError;

    console.log('Test client created successfully!');
    return { 
      success: true, 
      client: clientRecord, 
      admin: authData.user 
    };

  } catch (error) {
    console.error('Error creating test client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create test client'
    };
  }
};

export const createTestUser = async (userData: {
  email: string;
  password: string;
  full_name: string;
  client_id: string;
}) => {
  try {
    console.log('Creating test user...');

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name
        }
      }
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    console.log('User auth created:', authData.user.id);

    // 2. Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: 'user',
        client_id: userData.client_id
      });

    if (profileError) throw profileError;

    console.log('Test user created successfully!');
    return { success: true, user: authData.user };

  } catch (error) {
    console.error('Error creating test user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create test user'
    };
  }
};

// Quick setup function to create all test data
export const setupTestData = async () => {
  console.log('🚀 Setting up test data...');

  // 1. Create admin user
  const adminResult = await createAdminUser({
    email: 'admin@financehub.com',
    password: 'admin123456',
    full_name: 'System Administrator'
  });

  if (!adminResult.success) {
    console.error('❌ Failed to create admin user:', adminResult.error);
    return;
  }

  // 2. Create test client
  const clientResult = await createTestClient({
    company_name: 'Acme Corporation',
    contact_email: 'contact@acme.com',
    contact_phone: '+1-555-0123',
    address: '123 Business St, City, State 12345',
    admin_email: 'client@acme.com',
    admin_password: 'client123456',
    admin_full_name: 'John Client Manager'
  });

  if (!clientResult.success) {
    console.error('❌ Failed to create test client:', clientResult.error);
    return;
  }

  // 3. Create test user
  const userResult = await createTestUser({
    email: 'user@acme.com',
    password: 'user123456',
    full_name: 'Jane User',
    client_id: clientResult.client!.id
  });

  if (!userResult.success) {
    console.error('❌ Failed to create test user:', userResult.error);
    return;
  }

  console.log('✅ Test data setup complete!');
  console.log('📧 Admin: admin@financehub.com / admin123456');
  console.log('📧 Client: client@acme.com / client123456');
  console.log('📧 User: user@acme.com / user123456');
};

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).adminSetup = {
    createAdminUser,
    createTestClient,
    createTestUser,
    setupTestData
  };
}