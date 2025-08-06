/**
 * Test JWT Database Query Fix
 * 
 * Purpose: Verify that the database queries work correctly after fixing the relationship issue
 */

import { supabase } from '@/integrations/supabase/client';

export const testProfileQuery = async (userId: string) => {
  try {
    console.log('🧪 Testing profile query for user:', userId);

    // Test the fixed query
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Profile query failed:', profileError);
      return { success: false, error: profileError };
    }

    console.log('✅ Profile query successful:', profileData);

    // Test client query if user has client_id
    let clientData = null;
    if (profileData.client_id) {
      console.log('🔍 Fetching client data for client_id:', profileData.client_id);
      
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', profileData.client_id)
        .single();

      if (clientError) {
        console.warn('⚠️ Client query failed:', clientError);
      } else {
        console.log('✅ Client query successful:', client);
        clientData = client;
      }
    }

    return {
      success: true,
      profile: profileData,
      client: clientData
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
};

export const testJWTPayloadCreation = (profileData: any, clientData: any) => {
  try {
    console.log('🧪 Testing JWT payload creation...');

    const jwtPayload = {
      userId: profileData.id,
      email: profileData.email,
      role: profileData.role,
      full_name: profileData.full_name,
      client_id: profileData.client_id || undefined,
      client_name: clientData?.company_name || undefined
    };

    console.log('✅ JWT payload created successfully:', jwtPayload);
    return { success: true, payload: jwtPayload };

  } catch (error) {
    console.error('❌ JWT payload creation failed:', error);
    return { success: false, error };
  }
};