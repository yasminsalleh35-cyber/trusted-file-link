import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { validateSession, debugAuthState } from '@/lib/auth-utils';
import { JWTAuthService, type JWTPayload } from '@/services/jwtAuth';

/**
 * Enhanced useAuth Hook with JWT + Supabase Integration
 * 
 * Purpose: Manage authentication state with JWT tokens and Supabase backend
 * Features:
 * - JWT token-based authentication
 * - Supabase backend integration for data access
 * - Profile management with database integration
 * - Role-based access control
 * - Automatic profile creation for new users
 * - Token persistence and refresh
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

  // Load user profile from database
  const loadUserProfile = useCallback(async (supabaseUser: SupabaseUser, retryCount = 0) => {
    try {
      console.log('Loading user profile for:', supabaseUser.id, 'attempt:', retryCount + 1);
      
      // Only set loading state on first attempt to avoid flickering
      if (retryCount === 0) {
        setAuthState(prev => ({ ...prev, isLoading: true }));
      }

      // Simplified profile query without timeout for better reliability
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          clients:client_id (
            company_name
          )
        `)
        .eq('id', supabaseUser.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, creating new profile');
          await createUserProfile(supabaseUser);
          return;
        }
        
        // Retry on network errors with exponential backoff
        if (retryCount < 1 && (
          profileError.message?.includes('timeout') ||
          profileError.message?.includes('network') ||
          profileError.message?.includes('fetch') ||
          profileError.code === 'PGRST301' // Connection error
        )) {
          console.log('Retrying profile load due to network error...');
          const delay = Math.min(1000 * Math.pow(2, retryCount), 3000); // Max 3 seconds
          setTimeout(() => loadUserProfile(supabaseUser, retryCount + 1), delay);
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
        client_name: (profileData.clients as { company_name?: string } | null)?.company_name || undefined,
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
      if (retryCount >= 1) {
        console.log('Max retries reached, setting unauthenticated state');
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      } else {
        // Keep loading state for retries but don't show "Verifying access..." indefinitely
        console.log('Will retry profile load...');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create user profile for new users
  const createUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
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
  }, [loadUserProfile]);

  // Initialize authentication state
  useEffect(() => {
    let isMounted = true;
    let initializationTimeout: ReturnType<typeof setTimeout> | undefined;
    
    // Initialize authentication with JWT tokens
    const initializeAuth = async (retryCount = 0) => {
      try {
        console.log('🔐 JWT Auth: Initializing auth, attempt:', retryCount + 1);
        
        if (!isMounted) return; // Prevent state updates if component unmounted
        
        // First, check for JWT token
        const jwtUser = await JWTAuthService.getCurrentUser();
        
        if (jwtUser && !JWTAuthService.isTokenExpired()) {
          console.log('✅ JWT token found and valid, user:', jwtUser.email);
          
          if (isMounted) {
            setAuthState({
              user: {
                id: jwtUser.userId,
                email: jwtUser.email,
                role: jwtUser.role,
                full_name: jwtUser.full_name,
                client_id: jwtUser.client_id,
                client_name: jwtUser.client_name
              },
              isLoading: false,
              isAuthenticated: true
            });
          }
          return; // Exit early if JWT is valid
        }
        
        // If JWT token exists but is expired, try to refresh
        if (jwtUser && JWTAuthService.isTokenExpired()) {
          console.log('🔄 JWT token expired, attempting refresh...');
          
          const refreshResult = await JWTAuthService.refreshTokens();
          if (refreshResult.success && refreshResult.user && isMounted) {
            console.log('✅ JWT token refreshed successfully');
            setAuthState({
              user: {
                id: refreshResult.user.userId,
                email: refreshResult.user.email,
                role: refreshResult.user.role,
                full_name: refreshResult.user.full_name,
                client_id: refreshResult.user.client_id,
                client_name: refreshResult.user.client_name
              },
              isLoading: false,
              isAuthenticated: true
            });
            return;
          } else {
            console.log('❌ JWT token refresh failed, clearing tokens');
            JWTAuthService.clearTokens();
          }
        }
        
        console.log('❌ No valid JWT token found, checking Supabase session...');
        
        // Fallback: check Supabase session for backward compatibility
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (retryCount < 1 && isMounted) {
            initializationTimeout = setTimeout(() => initializeAuth(retryCount + 1), 2000);
            return;
          }
        }

        if (session?.user && isMounted) {
          console.log('📝 Supabase session found, migrating to JWT...');
          await loadUserProfile(session.user);
        } else {
          console.log('❌ No session found, setting unauthenticated state');
          if (isMounted) {
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false
            });
          }
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
            initializationTimeout = setTimeout(() => initializeAuth(retryCount + 1), 1000);
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
        
        console.log('🔔 Auth state change event:', event, session ? 'with session' : 'no session');
        
        // ALWAYS defer to JWT authentication if JWT tokens are present and valid
        try {
          const currentJWTUser = await JWTAuthService.getCurrentUser();
          if (currentJWTUser && !JWTAuthService.isTokenExpired()) {
            console.log('⏭️ JWT tokens are valid - completely ignoring Supabase auth event');
            
            // Ensure auth state is correct if JWT is valid but state is not set
            if (!authState.isAuthenticated && isMounted) {
              console.log('🔧 JWT valid but auth state not set - fixing auth state');
              setAuthState({
                user: {
                  id: currentJWTUser.userId,
                  email: currentJWTUser.email,
                  role: currentJWTUser.role,
                  full_name: currentJWTUser.full_name,
                  client_id: currentJWTUser.client_id,
                  client_name: currentJWTUser.client_name
                },
                isLoading: false,
                isAuthenticated: true
              });
            }
            return; // ALWAYS skip Supabase processing if JWT is valid
          }
        } catch (jwtError) {
          console.warn('JWT check failed in auth state change:', jwtError);
        }
        
        // Only process Supabase events if NO valid JWT tokens exist
        console.log('🔄 No valid JWT found - processing Supabase auth event');
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('🔄 Processing SIGNED_IN event (no JWT)');
            await loadUserProfile(session.user);
          } else if (event === 'SIGNED_OUT') {
            console.log('🔄 Processing SIGNED_OUT event');
            JWTAuthService.clearTokens();
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false
            });
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 Processing TOKEN_REFRESHED event (no JWT)');
            // Don't reload profile on token refresh, just ensure we're still authenticated
            if (!authState.isAuthenticated) {
              await loadUserProfile(session.user);
            }
          }
        } catch (error) {
          console.error('❌ Error handling auth state change:', error);
          // Don't set error state here, let the user stay logged in if possible
        }
      }
    );

    // Handle browser visibility changes to refresh JWT tokens when user returns
    const handleVisibilityChange = async () => {
      if (!document.hidden && isMounted) {
        try {
          console.log('🔍 Browser became visible, checking JWT tokens...');
          
          // Check JWT token first
          const jwtUser = await JWTAuthService.getCurrentUser();
          
          if (jwtUser && !JWTAuthService.isTokenExpired()) {
            console.log('✅ JWT token still valid on visibility change');
            
            // Ensure auth state is correct if JWT is valid
            if (!authState.isAuthenticated && isMounted) {
              console.log('🔧 JWT valid but auth state incorrect - fixing it');
              setAuthState({
                user: {
                  id: jwtUser.userId,
                  email: jwtUser.email,
                  role: jwtUser.role,
                  full_name: jwtUser.full_name,
                  client_id: jwtUser.client_id,
                  client_name: jwtUser.client_name
                },
                isLoading: false,
                isAuthenticated: true
              });
            }
            return; // JWT token is valid, no need to check Supabase
          }
          
          // If JWT token is expired or invalid, try to refresh
          if (JWTAuthService.isTokenExpired()) {
            console.log('🔄 JWT token expired on visibility change, attempting refresh...');
            
            const refreshResult = await JWTAuthService.refreshTokens();
            if (refreshResult.success && refreshResult.user && isMounted) {
              console.log('✅ JWT token refreshed successfully on visibility change');
              setAuthState({
                user: {
                  id: refreshResult.user.userId,
                  email: refreshResult.user.email,
                  role: refreshResult.user.role,
                  full_name: refreshResult.user.full_name,
                  client_id: refreshResult.user.client_id,
                  client_name: refreshResult.user.client_name
                },
                isLoading: false,
                isAuthenticated: true
              });
              return;
            }
          }
          
          // If JWT refresh failed, check Supabase session as fallback
          console.log('JWT refresh failed, checking Supabase session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session) {
            console.log('No valid session found on visibility change, signing out');
            JWTAuthService.clearTokens();
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false
            });
          }
        } catch (error) {
          console.error('Error checking tokens on visibility change:', error);
          // Don't sign out on error, just log it
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            client_name: (freshProfile.clients as { company_name?: string } | null)?.company_name || undefined,
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

  // Sign in user with JWT tokens
  const signIn = async (credentials: {
    email: string;
    password: string;
    selectedDemoLogin?: 'admin' | 'client' | 'user';
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      console.log('🔐 JWT Auth: Starting sign in process...');

      // Use JWT authentication service
      const jwtResult = await JWTAuthService.signInWithJWT(credentials);

      if (!jwtResult.success) {
        throw new Error(jwtResult.error || 'JWT authentication failed');
      }

      if (jwtResult.user) {
        console.log('✅ JWT Auth: Sign in successful for user:', jwtResult.user.email);
        
        // Update auth state with JWT user data
        setAuthState({
          user: {
            id: jwtResult.user.userId,
            email: jwtResult.user.email,
            role: jwtResult.user.role,
            full_name: jwtResult.user.full_name,
            client_id: jwtResult.user.client_id,
            client_name: jwtResult.user.client_name
          },
          isLoading: false,
          isAuthenticated: true
        });

        console.log('✅ JWT Auth: Auth state updated successfully');
      }

      return { 
        success: true, 
        data: jwtResult,
        user: jwtResult.user ? {
          id: jwtResult.user.userId,
          email: jwtResult.user.email,
          role: jwtResult.user.role,
          full_name: jwtResult.user.full_name,
          client_id: jwtResult.user.client_id,
          client_name: jwtResult.user.client_name
        } : undefined
      };
    } catch (error) {
      console.error('❌ JWT Auth: Sign in failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  };

  // Sign out user with JWT cleanup
  const signOut = async () => {
    try {
      console.log('🔐 JWT Auth: Starting sign out process...');

      // Use JWT authentication service to sign out
      const jwtResult = await JWTAuthService.signOut();

      if (!jwtResult.success) {
        console.warn('JWT sign out warning:', jwtResult.error);
      }

      // Update auth state
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });

      console.log('✅ JWT Auth: Sign out successful');

      return { success: true };
    } catch (error) {
      console.error('❌ JWT Auth: Sign out error:', error);
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