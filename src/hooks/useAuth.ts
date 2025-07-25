import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

/**
 * useAuth Hook
 * 
 * Purpose: Manage authentication state across the application using Supabase
 * Features:
 * - Track current user authentication status with Supabase Auth
 * - Store user role and permissions from profiles table
 * - Handle login/logout/signup operations with Supabase Auth
 * - Persist authentication state with Supabase session management
 */

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'client' | 'user';
  clientId?: string;
  clientName?: string;
  fullName?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false
  });

  // Fetch user profile data from our profiles table
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          client_id,
          clients:client_id (
            company_name
          )
        `)
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        clientId: profile.client_id || undefined,
        clientName: profile.clients?.company_name || undefined,
        fullName: profile.full_name || undefined
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Initialize authentication state and set up listener
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({ ...prev, session }));

        if (session?.user) {
          // Defer profile fetching to prevent deadlocks
          setTimeout(async () => {
            const userProfile = await fetchUserProfile(session.user.id);
            setAuthState(prev => ({
              ...prev,
              user: userProfile,
              isLoading: false,
              isAuthenticated: !!userProfile
            }));
          }, 0);
        } else {
          setAuthState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthState(prev => ({ ...prev, session }));
        fetchUserProfile(session.user.id).then(userProfile => {
          setAuthState(prev => ({
            ...prev,
            user: userProfile,
            isLoading: false,
            isAuthenticated: !!userProfile
          }));
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Clean up auth state
  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-') || key === 'client-portal-user') {
        localStorage.removeItem(key);
      }
    });
  };

  // Login function
  const login = async (credentials: { email: string; password: string }) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Clean up any existing state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.user) {
        // The onAuthStateChange will handle setting the user profile
        return { success: true };
      }

      throw new Error('Login failed');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false
      }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  // Signup function
  const signup = async (credentials: { email: string; password: string; fullName?: string }) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      cleanupAuthState();

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: credentials.fullName || credentials.email.split('@')[0]
          }
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false
      }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Signup failed' 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      cleanupAuthState();
      
      await supabase.auth.signOut({ scope: 'global' });
      
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false
      });

      // Force page refresh for clean state
      window.location.href = '/';
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      };
    }
  };

  // Update user function (for profile updates)
  const updateUser = async (updatedUser: Partial<User>) => {
    if (!authState.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedUser.fullName,
          // Add other updatable fields as needed
        })
        .eq('id', authState.user.id);

      if (error) throw error;

      // Refresh user profile
      const updatedProfile = await fetchUserProfile(authState.user.id);
      if (updatedProfile) {
        setAuthState(prev => ({
          ...prev,
          user: updatedProfile
        }));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!authState.user) return false;

    const permissions = {
      admin: [
        'manage_clients',
        'manage_users', 
        'manage_files',
        'send_messages',
        'view_system_stats',
        'upload_files'
      ],
      client: [
        'manage_own_users',
        'view_assigned_files',
        'send_messages_to_users',
        'send_messages_to_admin'
      ],
      user: [
        'view_assigned_files',
        'send_messages_to_admin',
        'send_messages_to_client'
      ]
    };

    return permissions[authState.user.role]?.includes(permission) || false;
  };

  return {
    ...authState,
    login,
    signup,
    logout,
    updateUser,
    hasPermission
  };
};