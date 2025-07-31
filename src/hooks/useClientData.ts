import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

/**
 * useClientData Hook
 * 
 * Purpose: Fetch and manage client-specific data
 * Features:
 * - Client profile information
 * - Team member statistics
 * - File assignments
 * - Message counts
 * - Real-time updates
 */

type Profile = Database['public']['Tables']['profiles']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

export interface ClientStats {
  teamMemberCount: number;
  assignedFilesCount: number;
  unreadMessagesCount: number;
  storageUsed: string;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_active?: string;
  status: 'online' | 'offline';
}

export interface ClientData {
  client: Client | null;
  stats: ClientStats;
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;
}

export const useClientData = () => {
  const { user } = useAuth();
  const [clientData, setClientData] = useState<ClientData>({
    client: null,
    stats: {
      teamMemberCount: 0,
      assignedFilesCount: 0,
      unreadMessagesCount: 0,
      storageUsed: '0 MB'
    },
    teamMembers: [],
    isLoading: true,
    error: null
  });

  // Fetch client information
  const fetchClientData = async () => {
    if (!user || user.role !== 'client' || !user.client_id) {
      setClientData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Invalid client user or missing client ID'
      }));
      return;
    }

    try {
      setClientData(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch client information
      const { data: clientInfo, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', user.client_id)
        .single();

      if (clientError) throw clientError;

      // Fetch team members (users with same client_id)
      const { data: teamMembers, error: teamError } = await supabase
        .from('profiles')
        .select('*')
        .eq('client_id', user.client_id)
        .eq('role', 'user');

      if (teamError) throw teamError;

      // Fetch file assignments count (placeholder - will implement when files table is ready)
      const assignedFilesCount = 0; // TODO: Implement when files table is available

      // Fetch unread messages count (placeholder - will implement when messages table is ready)
      const unreadMessagesCount = 0; // TODO: Implement when messages table is available

      // Calculate storage used (placeholder)
      const storageUsed = '0 MB'; // TODO: Implement when file storage is available

      // Transform team members data
      const transformedTeamMembers: TeamMember[] = teamMembers?.map(member => ({
        id: member.id,
        email: member.email,
        full_name: member.full_name,
        role: member.role,
        created_at: member.created_at || '',
        last_active: undefined, // TODO: Implement activity tracking
        status: 'offline' as const // TODO: Implement real-time status
      })) || [];

      setClientData({
        client: clientInfo,
        stats: {
          teamMemberCount: teamMembers?.length || 0,
          assignedFilesCount,
          unreadMessagesCount,
          storageUsed
        },
        teamMembers: transformedTeamMembers,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching client data:', error);
      setClientData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch client data'
      }));
    }
  };

  // Refresh data
  const refreshData = () => {
    fetchClientData();
  };

  // Add team member
  const addTeamMember = async (memberData: {
    email: string;
    full_name: string;
    password: string;
  }) => {
    if (!user || !user.client_id) {
      throw new Error('Invalid client user');
    }

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: memberData.email,
        password: memberData.password,
        options: {
          data: {
            full_name: memberData.full_name,
            role: 'user',
            client_id: user.client_id
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: memberData.email,
            full_name: memberData.full_name,
            role: 'user',
            client_id: user.client_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) throw profileError;

        // Refresh data to show new member
        await refreshData();
        
        return { success: true, data: authData };
      }

      throw new Error('User creation failed');
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  };

  // Remove team member
  const removeTeamMember = async (memberId: string) => {
    try {
      // Note: In a real app, you might want to deactivate rather than delete
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId)
        .eq('client_id', user?.client_id); // Ensure client can only remove their own users

      if (error) throw error;

      // Refresh data
      await refreshData();
      
      return { success: true };
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  };

  // Update team member
  const updateTeamMember = async (memberId: string, updates: {
    full_name?: string;
    email?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .eq('client_id', user?.client_id); // Ensure client can only update their own users

      if (error) throw error;

      // Refresh data
      await refreshData();
      
      return { success: true };
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  };

  // Initialize data fetching
  useEffect(() => {
    if (user && user.role === 'client') {
      fetchClientData();
    }
  }, [user]);

  return {
    ...clientData,
    refreshData,
    addTeamMember,
    removeTeamMember,
    updateTeamMember
  };
};