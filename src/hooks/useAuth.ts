import { useState, useEffect } from 'react';

/**
 * useAuth Hook
 * 
 * Purpose: Manage authentication state across the application
 * Features:
 * - Track current user authentication status
 * - Store user role and permissions
 * - Handle login/logout operations
 * - Persist authentication state
 * 
 * This hook will be enhanced with Supabase authentication once connected
 * Currently uses localStorage for demo purposes
 */

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'client' | 'user';
  clientId?: string;
  clientName?: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  // Initialize authentication state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('client-portal-user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('client-portal-user');
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    } else {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  }, []);

  // Login function
  const login = async (credentials: { 
    email: string; 
    role: 'admin' | 'client' | 'user';
    clientId?: string;
  }) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // TODO: Replace with actual Supabase authentication
      // For now, create a mock user based on credentials
      const mockUser: User = {
        id: `mock-${Date.now()}`,
        email: credentials.email,
        role: credentials.role,
        clientId: credentials.clientId,
        // Mock data based on role
        clientName: credentials.role !== 'admin' ? 'Sample Company Inc.' : undefined,
        name: credentials.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim()
      };

      // Store in localStorage (will be replaced with Supabase session)
      localStorage.setItem('client-portal-user', JSON.stringify(mockUser));

      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true
      });

      return { success: true };
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // TODO: Add Supabase logout logic
      localStorage.removeItem('client-portal-user');
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });

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
  const updateUser = (updatedUser: Partial<User>) => {
    if (authState.user) {
      const newUser = { ...authState.user, ...updatedUser };
      localStorage.setItem('client-portal-user', JSON.stringify(newUser));
      setAuthState(prev => ({
        ...prev,
        user: newUser
      }));
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
    logout,
    updateUser,
    hasPermission
  };
};