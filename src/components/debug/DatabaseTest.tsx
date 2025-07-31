import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * DatabaseTest Component
 * 
 * Purpose: Test database connectivity and permissions
 * This is a debug component to help identify database issues
 */
export const DatabaseTest: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, success: boolean, data: any, error?: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    }]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      // Test 1: Check current user
      console.log('Testing current user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      addResult('Get Current User', !userError, user, userError);

      if (user) {
        // Test 2: Check user profile
        console.log('Testing user profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        addResult('Get User Profile', !profileError, profile, profileError);

        // Test 3: Check clients table structure
        console.log('Testing clients table access...');
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        addResult('Select from Clients', !clientsError, clients, clientsError);

        // Test 3.5: Check profiles table and their client assignments
        console.log('Testing profiles with client assignments...');
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, client_id')
          .limit(10);
        addResult('Select Profiles with Client IDs', !profilesError, profiles, profilesError);

        // Test 4: Try to insert a test client (without status field)
        console.log('Testing client insert...');
        const testClient = {
          company_name: 'Test Company ' + Date.now(),
          contact_email: 'test' + Date.now() + '@example.com',
          contact_phone: '123-456-7890',
          address: '123 Test Street'
        };

        const { data: insertData, error: insertError } = await supabase
          .from('clients')
          .insert([testClient])
          .select()
          .single();
        addResult('Insert Test Client', !insertError, insertData, insertError);

        // Test 5: If insert worked, try to update it (without status field)
        if (insertData && !insertError) {
          console.log('Testing client update...');
          const { data: updateData, error: updateError } = await supabase
            .from('clients')
            .update({ 
              company_name: 'Updated Test Company',
              updated_at: new Date().toISOString()
            })
            .eq('id', insertData.id)
            .select()
            .single();
          addResult('Update Test Client', !updateError, updateData, updateError);

          // Test 6: Try to delete the test client
          console.log('Testing client delete...');
          const { error: deleteError } = await supabase
            .from('clients')
            .delete()
            .eq('id', insertData.id);
          addResult('Delete Test Client', !deleteError, 'Deleted successfully', deleteError);
        }
      }

    } catch (error) {
      addResult('General Error', false, null, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
        <Button onClick={runTests} disabled={isLoading}>
          {isLoading ? 'Running Tests...' : 'Run Database Tests'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.test}
                </h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  result.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              
              {result.data && (
                <div className="mb-2">
                  <strong>Data:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.error && (
                <div>
                  <strong className="text-red-600">Error:</strong>
                  <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};