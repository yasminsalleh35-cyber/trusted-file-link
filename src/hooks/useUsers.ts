import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type UserRole = Database['public']['Enums']['user_role'];

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  client_id?: string | null;
  client_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status: 'active' | 'inactive';
}

export interface UpdateUserData {
  id: string;
  email?: string;
  full_name?: string;
  role?: UserRole;
  client_id?: string | null;
}

export interface CreateUserData {
  id: string; // profiles.id equals auth user id in our schema
  email: string;
  full_name: string;
  role?: UserRole;
  client_id?: string | null;
}

export const useUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          client_id,
          created_at,
          updated_at,
          clients:client_id ( company_name )
        `)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: AdminUser[] = (data || []).map((row: any) => ({
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
        client_id: row.client_id,
        client_name: row.clients?.company_name ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        status: row.client_id ? 'active' : 'inactive' as 'active' | 'inactive',
      }));

      setUsers(mapped);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: UpdateUserData) => {
    try {
      setError(null);
      const { id, ...updateData } = userData;

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Refresh client_name by refetching list; keeps logic simple for now
      await fetchUsers();
      return { success: true, data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== id));
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const createUser = async (payload: CreateUserData) => {
    try {
      setError(null);
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: payload.id,
          email: payload.email,
          full_name: payload.full_name,
          role: payload.role ?? 'user',
          client_id: payload.client_id ?? null,
          created_at: new Date().toISOString(),
        });
      if (error) throw error;
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, isLoading, error, fetchUsers, updateUser, deleteUser, createUser };
};