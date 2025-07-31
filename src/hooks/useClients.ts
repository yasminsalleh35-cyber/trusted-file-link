import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';


export interface Client {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  user_count?: number;
  file_count?: number;
}

export interface UpdateClientData {
  id: string;
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status?: 'active' | 'inactive';
}

/**
 * useClients Hook
 * 
 * Purpose: Manage client data operations
 * Features:
 * - Fetch all clients with statistics
 * - Create new clients
 * - Update existing clients
 * - Delete/deactivate clients
 * - Real-time updates
 * - Loading and error states
 */
export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all clients with user and file counts
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, get all clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Then get user counts for each client (more efficiently)
      const clientsWithCounts: Client[] = [];
      
      // Get all user counts in one query
      const { data: userCounts, error: countError } = await supabase
        .from('profiles')
        .select('client_id')
        .not('client_id', 'is', null);

      if (countError) {
        console.warn('Error getting user counts:', countError);
      }

      // Count users per client
      const userCountMap = new Map<string, number>();
      (userCounts || []).forEach(profile => {
        if (profile.client_id) {
          userCountMap.set(profile.client_id, (userCountMap.get(profile.client_id) || 0) + 1);
        }
      });

      // Build final client list
      for (const client of clientsData || []) {
        clientsWithCounts.push({
          id: client.id,
          company_name: client.company_name,
          contact_email: client.contact_email,
          contact_phone: client.contact_phone || null,
          address: client.address || null,
          status: client.status || 'active', // Default to active if missing
          created_at: client.created_at,
          updated_at: client.updated_at,
          user_count: userCountMap.get(client.id) || 0,
          file_count: 0 // TODO: Add file count when file system is implemented
        });
      }

      setClients(clientsWithCounts);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  };



  // Update an existing client
  const updateClient = async (clientData: UpdateClientData) => {
    try {
      setError(null);
      console.log('Updating client with data:', clientData);

      const { id, ...updateData } = clientData;
      
      // Remove status field since it doesn't exist in database yet
      const { status, ...cleanUpdateData } = updateData;
      
      const finalUpdateData = {
        ...cleanUpdateData,
        updated_at: new Date().toISOString()
      };

      console.log('Final update data:', finalUpdateData);
      
      const { data, error } = await supabase
        .from('clients')
        .update(finalUpdateData)
        .eq('id', id)
        .select()
        .single();

      console.log('Update response:', { data, error });

      if (error) throw error;

      // Update local state with the returned data plus default status
      const updatedClient = {
        ...data,
        status: 'active', // Default status since column doesn't exist yet
        user_count: clients.find(c => c.id === id)?.user_count || 0,
        file_count: 0
      };

      setClients(prev => prev.map(client => 
        client.id === id 
          ? updatedClient
          : client
      ));

      return { success: true, data: updatedClient };
    } catch (err) {
      console.error('Error updating client:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Delete a client (hard delete for now, will be soft delete after status column is added)
  const deleteClient = async (clientId: string) => {
    try {
      setError(null);

      // For now, do hard delete since status column doesn't exist yet
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      // Remove from local state
      setClients(prev => prev.filter(client => client.id !== clientId));

      return { success: true };
    } catch (err) {
      console.error('Error deleting client:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Hard delete a client (permanent removal)
  const permanentDeleteClient = async (clientId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      // Remove from local state
      setClients(prev => prev.filter(client => client.id !== clientId));

      return { success: true };
    } catch (err) {
      console.error('Error permanently deleting client:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to permanently delete client';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reactivate a client
  const reactivateClient = async (clientId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('clients')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      // Update local state
      setClients(prev => prev.map(client => 
        client.id === clientId 
          ? { ...client, status: 'active' as const }
          : client
      ));

      return { success: true };
    } catch (err) {
      console.error('Error reactivating client:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reactivate client';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Load clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    isLoading,
    error,
    fetchClients,
    updateClient,
    deleteClient,
    permanentDeleteClient,
    reactivateClient
  };
};