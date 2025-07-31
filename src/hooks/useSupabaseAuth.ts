import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { validateSession, debugAuthState } from '@/lib/auth-utils';

/**
 * Enhanced useAuth Hook with Supabase Integration
 * 
 * Purpose: Manage authentication state with real Supabase backend
 * Features:
 * - Real Supabase authentication
 * - Profile management with database integration
 * - Role-based access control
 * - Automatic profile creation for new users
 * - Session persistence
 */

type UserRole = Database['public']['Enums']['user_role'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  client_id?: string;
  client_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  // Initialize authentication state
  useEffect(() => {
    let isMounted = true;
    let initializationTimeout: NodeJS.Timeout;
    
    // Get initial session with timeout and retry logic
    const initializeAuth = async (retryCount = 0) => {
      try {
        console.log('Initializing auth, attempt:', retryCount + 1);
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          initializationTimeout = setTimeout(() => reject(new Error('Session check timeout')), 10000);
        });
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
        }
        
        if (!isMounted) return; // Prevent state updates if component unmounted
        
        console.log('Session check result:', session ? 'Session found' : 'No session');
        
        if (session?.user) {
          console.log('Loading user profile for session user:', session.user.id);
          await loadUserProfile(session.user);
        } else {
          console.log('No session found, setting unauthenticated state');
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
        }
        
        if (isMounted) {
          // Retry once if it's a network/timeout error
          if (retryCount < 1 && (error instanceof Error && 
              (error.message.includes('timeout') || error.message.includes('network')))) {
            console.log('Retrying auth initialization...');
            setTimeout(() => initializeAuth(retryCount + 1), 1000);
            return;
          }
          
          console.log('Setting unauthenticated state due to error');
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          });
        }
      }
    };

    initializeAuth();

    // Listen for auth changes with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state change event:', event, session ? 'with session' : 'no session');
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('Processing SIGNED_IN event');
            await loadUserProfile(session.user);
          } else if (event === 'SIGNED_OUT') {
            console.log('Processing SIGNED_OUT event');
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false
            });
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('Processing TOKEN_REFRESHED event');
            // Don't reload profile on token refresh, just ensure we're still authenticated
            if (!authState.isAuthenticated) {
              await loadUserProfile(session.user);
            }
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          // Don't set error state here, let the user stay logged in if possible
        }
      }
    );

    // Handle browser visibility changes to refresh session when user returns
    const handleVisibilityChange = async () => {
      if (!document.hidden && isMounted && authState.isAuthenticated) {
        try {
          console.log('Browser became visible, checking session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error on visibility change:', error);
            return;
          }
          
          if (!session) {
            console.log('No session found on visibility change, signing out');
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false
            });
          }
        } catch (error) {
          console.error('Error checking session on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load user profile from database
  const loadUserProfile = async (supabaseUser: SupabaseUser, retryCount = 0) => {
    try {
      console.log('Loading user profile for:', supabaseUser.id, 'attempt:', retryCount + 1);
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Add timeout to profile loading
      const profilePromise = supabase
        .from('profiles')
        .select(`
          *,
          clients:client_id (
            company_name
          )
        `)
        .eq('id', supabaseUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile load timeout')), 8000);
      });

      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (profileError) {
        console.error('Error loading profile:', profileError);
        
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, creating new profile');
          await createUserProfile(supabaseUser);
          return;
        }
        
        // Retry on network errors
        if (retryCount < 2 && (
          profileError.message?.includes('timeout') ||
          profileError.message?.includes('network') ||
          profileError.message?.includes('fetch')
        )) {
          console.log('Retrying profile load due to network error...');
          setTimeout(() => loadUserProfile(supabaseUser, retryCount + 1), 1000);
          return;
        }
        
        throw profileError;
      }

      if (!profileData) {
        throw new Error('Profile data is null');
      }

      console.log('Profile loaded successfully:', profileData.email, profileData.role);

      const user: User = {
        id: profileData.id,
        email: profileData.email,
        role: profileData.role,
        full_name: profileData.full_name,
        client_id: profileData.client_id || undefined,
        client_name: profileData.clients?.company_name || undefined,
        created_at: profileData.created_at || undefined,
        updated_at: profileData.updated_at || undefined
      };

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true
      });
      
      console.log('Auth state updated successfully');
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Only set unauthenticated state if we've exhausted retries
      if (retryCount >= 2) {
        console.log('Max retries reached, setting unauthenticated state');
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      } else {
        // Keep loading state for retries
        console.log('Keeping loading state for retry');
      }
    }
  };

  // Create user profile for new users
  const createUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          full_name: supabaseUser.user_metadata?.full_name || 
                    supabaseUser.email?.split('@')[0] || 'User',
          role: 'user' // Default role
        });

      if (error) throw error;

      // Reload profile after creation
      await loadUserProfile(supabaseUser);
    } catch (error) {
      console.error('Error creating user profile:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  // Sign up new user
  const signUp = async (credentials: {
    email: string;
    password: string;
    full_name: string;
    role?: UserRole;
    client_id?: string;
    company_name?: string;
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name,
            role: credentials.role || 'user',
            client_id: credentials.client_id
          }
        }
      });

      if (error) throw error;

      // Create profile but don't auto-login - user should go to sign-in page
      if (data.user) {
        let finalClientId = credentials.client_id;
        let finalRole = credentials.role || 'user';
        
        // Check if this email is a client contact (admin created the client first)
        const { data: existingClient, error: clientCheckError } = await supabase
          .from('clients')
          .select('id, company_name')
          .eq('contact_email', credentials.email)
          .single();

        if (!clientCheckError && existingClient) {
          console.log('User is registering as client contact for:', existingClient.company_name);
          finalClientId = existingClient.id;
          finalRole = 'client'; // Override role to client
        } else if (credentials.role === 'client' && credentials.company_name) {
          // If this is a client registration, create the client first
          console.log('Creating client for company:', credentials.company_name);
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .insert({
              company_name: credentials.company_name,
              contact_email: credentials.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (clientError) {
            console.error('Client creation error:', clientError);
            throw new Error(`Client creation failed: ${clientError.message}`);
          }
          
          finalClientId = clientData.id;
          console.log('Client created with ID:', finalClientId);
        }
        
        // Create profile with detected/specified role
        console.log('Creating profile for user:', data.user.id, 'with role:', finalRole);
        const profileData = {
          id: data.user.id,
          email: credentials.email,
          full_name: credentials.full_name,
          role: finalRole,
          client_id: finalClientId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Profile data:', profileData);
        
        // Use upsert to handle potential conflicts and bypass RLS issues
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
        
        console.log('Profile created successfully');
        
        // Directly load the profile we just created to ensure we have the latest data
        const { data: freshProfile, error: freshProfileError } = await supabase
          .from('profiles')
          .select(`
            *,
            clients!profiles_client_id_fkey (
              id,
              company_name
            )
          `)
          .eq('id', data.user.id)
          .single();

        if (freshProfileError) {
          console.error('Error loading fresh profile:', freshProfileError);
          // Fallback to the standard method
          await loadUserProfile(data.user);
        } else {
          // Create user object with fresh data
          const user: User = {
            id: freshProfile.id,
            email: freshProfile.email,
            role: freshProfile.role,
            full_name: freshProfile.full_name,
            client_id: freshProfile.client_id || undefined,
            client_name: freshProfile.clients?.company_name || undefined,
            created_at: freshProfile.created_at || undefined,
            updated_at: freshProfile.updated_at || undefined
          };

          // Update auth state with fresh profile data
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true
          });
          
        }
        
        // Sign out the user immediately after registration
        // They should go to sign-in page, not auto-login
        await supabase.auth.signOut();
        
        console.log('User registered successfully, signed out for manual login');
      }

      return { success: true, data };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      };
    }
  };

  // Sign in user
  const signIn = async (credentials: {
    email: string;
    password: string;
    selectedDemoLogin?: 'admin' | 'client' | 'user';
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // No credential validation here - just authenticate with Supabase
      // Role validation happens after authentication

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;

      if (data.user) {
        console.log('Login successful, user ID:', data.user.id);
        
        // Get user profile for role validation and redirect
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        console.log('Profile query result:', { profileData, profileError });

        if (profileError) {
          console.error('Error loading profile for login:', profileError);
          throw new Error('User profile not found. Please contact administrator.');
        }

        const actualRole = profileData.role;
        console.log('User role:', actualRole, 'Selected demo:', credentials.selectedDemoLogin);

        // Role-based demo validation: check if user's actual role matches selected demo type
        if (credentials.selectedDemoLogin) {
          if (actualRole !== credentials.selectedDemoLogin) {
            // Sign out the user since role doesn't match
            await supabase.auth.signOut();
            throw new Error(`Access denied: You selected ${credentials.selectedDemoLogin} login but your account has ${actualRole} role. Please select the correct demo type for your role.`);
          }
        }

        // Load the full user profile (this will update authState)
        await loadUserProfile(data.user);
        
        console.log('Profile loaded successfully, auth state should be updated');
      }

      return { success: true, data };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  };

  // Sign out user
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  };

  // Update user profile
  const updateProfile = async (updates: {
    full_name?: string;
    role?: UserRole;
    client_id?: string;
  }) => {
    try {
      if (!authState.user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id);

      if (error) throw error;

      // Reload profile to get updated data
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        await loadUserProfile(supabaseUser);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed'
      };
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
        'upload_files',
        'create_news',
        'assign_files',
        'assign_news'
      ],
      client: [
        'manage_own_users',
        'view_assigned_files',
        'view_assigned_news',
        'send_messages_to_users',
        'send_messages_to_admin',
        'view_client_stats'
      ],
      user: [
        'view_assigned_files',
        'view_assigned_news',
        'send_messages_to_admin',
        'send_messages_to_client',
        'update_own_profile'
      ]
    };

    return permissions[authState.user.role]?.includes(permission) || false;
  };

  // Get users that current user can message (based on Logic 1 rules)
  const getMessageableUsers = async () => {
    try {
      if (!authState.user) return [];

      // Get all profiles with client information
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          clients:client_id (
            id,
            company_name
          )
        `);

      if (error) throw error;

      // Filter based on messaging rules
      const currentUser = authState.user;
      const messageableUsers = profiles?.filter(profile => {
        // Don't include self
        if (profile.id === currentUser.id) return false;

        // Admin can message everyone
        if (currentUser.role === 'admin') return true;

        // Client can message their own users and admin
        if (currentUser.role === 'client') {
          return profile.role === 'admin' || 
                 (profile.role === 'user' && profile.client_id === currentUser.client_id);
        }

        // User can message admin and their client
        if (currentUser.role === 'user') {
          return profile.role === 'admin' || 
                 (profile.role === 'client' && profile.client_id === currentUser.client_id);
        }

        return false;
      }) || [];

      return messageableUsers;
    } catch (error) {
      console.error('Error getting messageable users:', error);
      return [];
    }
  };

  // Legacy login method for backward compatibility
  const login = async (credentials: {
    email: string;
    role: UserRole;
    clientId?: string;
  }) => {
    // For demo purposes, create a temporary password
    const tempPassword = 'demo123456';
    
    // Try to sign in first
    const signInResult = await signIn({
      email: credentials.email,
      password: tempPassword
    });

    if (signInResult.success) {
      return signInResult;
    }

    // If sign in fails, try to sign up
    return await signUp({
      email: credentials.email,
      password: tempPassword,
      full_name: credentials.email.split('@')[0],
      role: credentials.role,
      client_id: credentials.clientId
    });
  };

  // Legacy logout method
  const logout = signOut;

  // Legacy updateUser method
  const updateUser = (updatedUser: Partial<User>) => {
    return updateProfile({
      full_name: updatedUser.full_name,
      role: updatedUser.role,
      client_id: updatedUser.client_id
    });
  };

  // Recovery function for when auth state gets stuck
  const recoverAuthState = async () => {
    try {
      console.log('🔄 Attempting auth state recovery...');
      await debugAuthState();
      
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Check if session is valid
      const isValid = await validateSession();
      
      if (!isValid) {
        console.log('❌ Session invalid, signing out');
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
        return { success: false, error: 'Session invalid' };
      }
      
      // Try to get fresh session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        console.log('❌ Could not get session, signing out');
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
        return { success: false, error: 'Could not get session' };
      }
      
      // Reload profile
      await loadUserProfile(session.user);
      console.log('✅ Auth state recovered successfully');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Auth recovery failed:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Recovery failed' 
      };
    }
  };

  return {
    ...authState,
    // New Supabase methods
    signUp,
    signIn,
    signOut,
    updateProfile,
    getMessageableUsers,
    recoverAuthState,
    // Legacy methods for backward compatibility
    login,
    logout,
    updateUser,
    hasPermission
  };
};